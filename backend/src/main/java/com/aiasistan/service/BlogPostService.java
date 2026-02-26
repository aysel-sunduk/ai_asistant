/**
 * Kisa aciklama: Is kurallarini uygular.
 */

package com.aiasistan.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.BlogPostDto;
import com.aiasistan.exception.BadRequestException;
import com.aiasistan.exception.NotFoundException;
import com.aiasistan.model.BlogPost;
import com.aiasistan.repository.BlogPostRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class BlogPostService {
    private static final Logger logger = LoggerFactory.getLogger(BlogPostService.class);
    private static final boolean ENABLE_SCHEMA_ENSURE = Boolean
            .parseBoolean(System.getProperty("BLOG_SCHEMA_ENSURE", "false"));

    private static final Set<String> ALLOWED_VISIBILITY = Set.of("private", "followers", "public");
    private static final Set<String> ALLOWED_STATUS = Set.of("draft", "published", "archived");
    private static final String ARCHIVED_STATUS = "archived";

    private final BlogPostRepository blogPostRepository;
    private final UserService userService;
    private final SocialFollowService socialFollowService;
    private final ContentFilterService contentFilterService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile boolean blogSchemaEnsured;
    private volatile Boolean likedUserIdsColumnAvailable;
    @PersistenceContext
    private EntityManager entityManager;

    public BlogPostService(BlogPostRepository blogPostRepository, UserService userService,
            SocialFollowService socialFollowService, ContentFilterService contentFilterService) {
        this.blogPostRepository = blogPostRepository;
        this.userService = userService;
        this.socialFollowService = socialFollowService;
        this.contentFilterService = contentFilterService;
    }

    @Transactional
    public BlogPostDto.Response createPost(String userEmail, BlogPostDto.Request request) {
        ensureBlogSchemaForReactions();
        UUID userId = userService.getUserIdByEmail(userEmail);

        BlogPost post = new BlogPost();
        post.setUserId(userId);
        applyRequest(post, request);
        ensureNoProfanity(post.getTitle(), "Blog basligi");
        ensureNoProfanity(post.getRawContent(), "Blog icerigi");
        post.setCleanContent(post.getRawContent());

        return BlogPostDto.Response.from(blogPostRepository.save(post));
    }

    @Transactional(readOnly = true)
    public BlogPostDto.Response getPostById(String userEmail, UUID id) {
        ensureBlogSchemaForReactions();
        UUID viewerId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findAccessiblePost(id, viewerId);
        return toResponseForViewer(post, viewerId);
    }

    @Transactional(readOnly = true)
    public PageResponse<BlogPostDto.Response> getPosts(String userEmail, Pageable pageable) {
        ensureBlogSchemaForReactions();
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<BlogPostDto.Response> page = blogPostRepository.findByUserIdAndStatusNot(userId, ARCHIVED_STATUS, pageable)
                .map(post -> toResponseForViewer(post, userId));
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<BlogPostDto.Response> getVisiblePostsByUser(String userEmail, UUID targetUserId,
            Pageable pageable) {
        ensureBlogSchemaForReactions();
        UUID viewerId = userService.getUserIdByEmail(userEmail);
        if (viewerId.equals(targetUserId)) {
            return getPosts(userEmail, pageable);
        }

        List<String> allowedVisibility = socialFollowService.isFollowing(viewerId, targetUserId)
                ? List.of("public", "followers")
                : List.of("public");

        Page<BlogPostDto.Response> page = blogPostRepository
                .findByUserIdAndStatusAndVisibilityIn(targetUserId, "published", allowedVisibility, pageable)
                .map(post -> toResponseForViewer(post, viewerId));
        return PageResponse.of(page);
    }

    @Transactional(readOnly = true)
    public PageResponse<BlogPostDto.Response> getFollowingFeed(String userEmail, Pageable pageable) {
        ensureBlogSchemaForReactions();
        UUID viewerId = userService.getUserIdByEmail(userEmail);
        List<UUID> followingIds = socialFollowService.getFollowingUserIds(viewerId);
        if (followingIds.isEmpty()) {
            return PageResponse.of(Page.empty(pageable));
        }

        Page<BlogPostDto.Response> page = blogPostRepository
                .findByUserIdInAndStatusAndVisibilityIn(followingIds, "published", List.of("public", "followers"),
                        pageable)
                .map(post -> toResponseForViewer(post, viewerId));
        return PageResponse.of(page);
    }

    @Transactional
    public BlogPostDto.Response updatePost(String userEmail, UUID id, BlogPostDto.Request request) {
        ensureBlogSchemaForReactions();
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);

        applyRequest(post, request);
        ensureNoProfanity(post.getTitle(), "Blog basligi");
        ensureNoProfanity(post.getRawContent(), "Blog icerigi");
        post.setCleanContent(post.getRawContent());

        return toResponseForViewer(blogPostRepository.save(post), userId);
    }

    @Transactional
    public BlogPostDto.Response cleanPostContent(String userEmail, UUID id) {
        ensureBlogSchemaForReactions();
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);

        post.setCleanContent(cleanLanguage(post.getRawContent()));
        return toResponseForViewer(blogPostRepository.save(post), userId);
    }

    @Transactional
    public BlogPostDto.Response toggleLike(String userEmail, UUID id) {
        ensureBlogSchemaForReactions();
        UUID viewerId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findAccessiblePost(id, viewerId);

        if (!hasLikedUserIdsColumn()) {
            throw new BadRequestException("Begeni ozelligi hazirlanirken kolon eksik. Backend'i yeniden baslatin.");
        }
        try {
            Object raw = entityManager.createNativeQuery(
                    "SELECT COALESCE(liked_user_ids, '[]'::jsonb)::text FROM public.blog_posts WHERE id = CAST(:id AS uuid)")
                    .setParameter("id", id.toString()).getSingleResult();
            List<String> likedUserIds = objectMapper.readValue(String.valueOf(raw), new TypeReference<>() {
            });
            String viewerIdText = viewerId.toString();
            if (likedUserIds.contains(viewerIdText)) {
                likedUserIds.remove(viewerIdText);
            } else {
                likedUserIds.add(viewerIdText);
            }
            entityManager.createNativeQuery(
                    "UPDATE public.blog_posts SET liked_user_ids = CAST(:liked AS jsonb), like_count = :cnt WHERE id = CAST(:id AS uuid)")
                    .setParameter("liked", objectMapper.writeValueAsString(likedUserIds))
                    .setParameter("cnt", likedUserIds.size())
                    .setParameter("id", id.toString())
                    .executeUpdate();
            BlogPost updated = blogPostRepository.findById(id)
                    .orElseThrow(() -> new NotFoundException("Blog yazisi bulunamadi"));
            return toResponseForViewer(updated, viewerId);
        } catch (Exception e) {
            throw new BadRequestException("Begeni islemi sirasinda hata olustu");
        }
    }

    @Transactional
    public BlogPostDto.Response addComment(String userEmail, UUID id, String content) {
        ensureBlogSchemaForReactions();
        UUID viewerId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findAccessiblePost(id, viewerId);

        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isBlank()) {
            throw new BadRequestException("Yorum icerigi bos olamaz");
        }
        if (normalizedContent.length() > 1000) {
            throw new BadRequestException("Yorum 1000 karakteri gecemez");
        }

        ensureNoProfanity(normalizedContent, "Yorum icerigi");

        List<Map<String, Object>> comments = post.getComments() == null ? new ArrayList<>()
                : new ArrayList<>(post.getComments());
        Map<String, Object> comment = new HashMap<>();
        comment.put("id", UUID.randomUUID().toString());
        comment.put("userId", viewerId.toString());
        comment.put("authorEmail", userEmail);
        comment.put("content", normalizedContent);
        comment.put("createdAt", java.time.OffsetDateTime.now().toString());
        comments.add(comment);
        post.setComments(comments);

        return toResponseForViewer(blogPostRepository.save(post), viewerId);
    }

    @Transactional
    public BlogPostDto.Response deleteComment(String userEmail, UUID id, UUID commentId) {
        ensureBlogSchemaForReactions();
        UUID viewerId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findAccessiblePost(id, viewerId);

        List<Map<String, Object>> comments = post.getComments() == null ? new ArrayList<>()
                : new ArrayList<>(post.getComments());
        boolean removed = false;
        for (int i = 0; i < comments.size(); i++) {
            Map<String, Object> c = comments.get(i);
            if (!commentId.toString().equals(String.valueOf(c.get("id")))) {
                continue;
            }
            String commentUserId = String.valueOf(c.get("userId"));
            boolean canDelete = viewerId.toString().equals(commentUserId) || viewerId.equals(post.getUserId());
            if (!canDelete) {
                throw new BadRequestException("Bu yorumu silme yetkiniz yok");
            }
            comments.remove(i);
            removed = true;
            break;
        }
        if (!removed) {
            throw new NotFoundException("Yorum bulunamadi");
        }
        post.setComments(comments);
        return toResponseForViewer(blogPostRepository.save(post), viewerId);
    }

    @Transactional(readOnly = true)
    public BlogPostDto.CleanResponse cleanTextPreview(String content) {
        BlogPostDto.CleanResponse response = new BlogPostDto.CleanResponse();
        response.setOriginalContent(content);
        response.setCleanContent(cleanLanguage(content));
        return response;
    }

    @Transactional
    public void deletePost(String userEmail, UUID id) {
        ensureBlogSchemaForReactions();
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);
        post.setStatus(ARCHIVED_STATUS);
        post.setVisibility("private");
        blogPostRepository.save(post);
    }

    private void ensureBlogSchemaForReactions() {
        if (!ENABLE_SCHEMA_ENSURE) {
            return;
        }
        if (blogSchemaEnsured) {
            return;
        }
        synchronized (this) {
            if (blogSchemaEnsured) {
                return;
            }
            try {
                entityManager.createNativeQuery(
                        "ALTER TABLE IF EXISTS public.blog_posts " +
                                "ADD COLUMN IF NOT EXISTS liked_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb")
                        .executeUpdate();
                entityManager.createNativeQuery(
                        "UPDATE public.blog_posts SET liked_user_ids = '[]'::jsonb WHERE liked_user_ids IS NULL")
                        .executeUpdate();
                likedUserIdsColumnAvailable = true;
            } catch (Exception ex) {
                logger.warn("liked_user_ids column ensure skipped: {}", ex.getMessage());
                try {
                    likedUserIdsColumnAvailable = hasLikedUserIdsColumn();
                } catch (Exception innerEx) {
                    logger.warn("liked_user_ids column check failed: {}", innerEx.getMessage());
                    likedUserIdsColumnAvailable = false;
                }
            }
            blogSchemaEnsured = true;
        }
    }

    private boolean hasLikedUserIdsColumn() {
        if (likedUserIdsColumnAvailable != null) {
            return likedUserIdsColumnAvailable;
        }
        try {
            Object count = entityManager.createNativeQuery(
                    "SELECT COUNT(*) FROM information_schema.columns " +
                            "WHERE table_schema = 'public' AND table_name = 'blog_posts' AND column_name = 'liked_user_ids'")
                    .getSingleResult();
            boolean exists = count != null && Integer.parseInt(String.valueOf(count)) > 0;
            likedUserIdsColumnAvailable = exists;
            return exists;
        } catch (Exception ex) {
            logger.warn("liked_user_ids column lookup failed: {}", ex.getMessage());
            likedUserIdsColumnAvailable = false;
            return false;
        }
    }

    private BlogPost findOwnedPost(UUID id, UUID userId) {
        BlogPost post = blogPostRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Blog yazisi bulunamadi"));
        if (ARCHIVED_STATUS.equalsIgnoreCase(post.getStatus())) {
            throw new NotFoundException("Blog yazisi bulunamadi");
        }
        return post;
    }

    private BlogPost findAccessiblePost(UUID id, UUID viewerId) {
        BlogPost post = blogPostRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Blog yazisi bulunamadi"));
        if (ARCHIVED_STATUS.equalsIgnoreCase(post.getStatus())) {
            throw new NotFoundException("Blog yazisi bulunamadi");
        }

        if (viewerId.equals(post.getUserId())) {
            return post;
        }
        if (!"published".equalsIgnoreCase(post.getStatus())) {
            throw new NotFoundException("Blog yazisi bulunamadi");
        }
        String visibility = post.getVisibility() == null ? "private" : post.getVisibility().toLowerCase(Locale.ROOT);
        if ("public".equals(visibility)) {
            return post;
        }
        if ("followers".equals(visibility) && socialFollowService.isFollowing(viewerId, post.getUserId())) {
            return post;
        }
        throw new NotFoundException("Blog yazisi bulunamadi");
    }

    private BlogPostDto.Response toResponseForViewer(BlogPost post, UUID viewerId) {
        BlogPostDto.Response response = BlogPostDto.Response.from(post);
        boolean likedByMe = false;
        if (hasLikedUserIdsColumn()) {
            try {
                Object raw = entityManager.createNativeQuery(
                        "SELECT COALESCE(liked_user_ids, '[]'::jsonb)::text FROM public.blog_posts WHERE id = CAST(:id AS uuid)")
                        .setParameter("id", post.getId().toString()).getSingleResult();
                List<String> likedUserIds = objectMapper.readValue(String.valueOf(raw), new TypeReference<>() {
                });
                likedByMe = likedUserIds.contains(viewerId.toString());
                if (post.getLikeCount() == null) {
                    response.setLikeCount(likedUserIds.size());
                }
            } catch (Exception ignored) {
                likedByMe = false;
            }
        }
        response.setLikedByMe(likedByMe);
        response.setLikeCount(post.getLikeCount() != null ? post.getLikeCount() : 0);
        response.setCommentCount(post.getComments() != null ? post.getComments().size() : 0);
        return response;
    }

    private void applyRequest(BlogPost post, BlogPostDto.Request request) {
        String title = request.getTitle().trim();
        String rawContent = request.getRawContent().trim();
        if (title.length() < 3 || title.length() > 150) {
            throw new BadRequestException("Blog basligi 3-150 karakter arasinda olmali");
        }
        if (rawContent.length() < 10 || rawContent.length() > 10000) {
            throw new BadRequestException("Blog icerigi 10-10000 karakter arasinda olmali");
        }
        post.setTitle(title);
        post.setRawContent(rawContent);
        post.setVisibility(normalizeVisibility(request.getVisibility()));
        post.setStatus(normalizeStatus(request.getStatus()));
        post.setTags(normalizeTags(request.getTags()));
    }

    private String normalizeVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return "private";
        }
        String normalized = visibility.trim().toLowerCase(Locale.ROOT);
        return ALLOWED_VISIBILITY.contains(normalized) ? normalized : "private";
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return "draft";
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        return ALLOWED_STATUS.contains(normalized) ? normalized : "draft";
    }

    private String[] normalizeTags(String[] tags) {
        if (tags == null || tags.length == 0) {
            return null;
        }

        return Arrays.stream(tags)
                .filter(t -> t != null && !t.isBlank())
                .map(t -> t.trim().toLowerCase(Locale.ROOT))
                .filter(t -> t.length() <= 30)
                .distinct()
                .limit(20)
                .toArray(String[]::new);
    }

    private void ensureNoProfanity(String text, String fieldName) {
        if (text == null || text.isBlank()) {
            return;
        }
        ContentFilterService.FilterResult result = contentFilterService.filterText(text);
        if (result.isSafe()) {
            return;
        }
        logger.info("{} argo nedeniyle engellendi. ML: {}, skor: {}",
                fieldName, result.isMlUsed(), result.getProfanityScore());
        throw new BadRequestException("Argo kelime kullandiniz. Lutfen duzeltip tekrar deneyin.");
    }

    private String cleanLanguage(String content) {
        if (content == null || content.isBlank()) {
            return content;
        }

        // ContentFilterService kullan (ML + kara liste)
        ContentFilterService.FilterResult result = contentFilterService.filterText(content);
        if (!result.isSafe()) {
            logger.info("Icerik filtrelendi — ML kullanildi: {}, skor: {}",
                    result.isMlUsed(), result.getProfanityScore());
        }
        return result.getCleanedText();
    }
}
