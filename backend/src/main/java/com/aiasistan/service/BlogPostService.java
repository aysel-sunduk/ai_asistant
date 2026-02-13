package com.aiasistan.service;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

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

@Service
public class BlogPostService {

    private static final Set<String> ALLOWED_VISIBILITY = Set.of("private", "followers", "public");
    private static final Set<String> ALLOWED_STATUS = Set.of("draft", "published", "archived");

    private final BlogPostRepository blogPostRepository;
    private final UserService userService;

    public BlogPostService(BlogPostRepository blogPostRepository, UserService userService) {
        this.blogPostRepository = blogPostRepository;
        this.userService = userService;
    }

    @Transactional
    public BlogPostDto.Response createPost(String userEmail, BlogPostDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);

        BlogPost post = new BlogPost();
        post.setUserId(userId);
        applyRequest(post, request);
        if (post.getCleanContent() == null || post.getCleanContent().isBlank()) {
            post.setCleanContent(cleanLanguage(post.getRawContent()));
        }

        return BlogPostDto.Response.from(blogPostRepository.save(post));
    }

    @Transactional(readOnly = true)
    public BlogPostDto.Response getPostById(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);
        return BlogPostDto.Response.from(post);
    }

    @Transactional(readOnly = true)
    public PageResponse<BlogPostDto.Response> getPosts(String userEmail, Pageable pageable) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        Page<BlogPostDto.Response> page = blogPostRepository.findByUserId(userId, pageable).map(BlogPostDto.Response::from);
        return PageResponse.of(page);
    }

    @Transactional
    public BlogPostDto.Response updatePost(String userEmail, UUID id, BlogPostDto.Request request) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);

        applyRequest(post, request);
        post.setCleanContent(cleanLanguage(post.getRawContent()));

        return BlogPostDto.Response.from(blogPostRepository.save(post));
    }

    @Transactional
    public BlogPostDto.Response cleanPostContent(String userEmail, UUID id) {
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);

        post.setCleanContent(cleanLanguage(post.getRawContent()));
        return BlogPostDto.Response.from(blogPostRepository.save(post));
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
        UUID userId = userService.getUserIdByEmail(userEmail);
        BlogPost post = findOwnedPost(id, userId);
        blogPostRepository.delete(post);
    }

    private BlogPost findOwnedPost(UUID id, UUID userId) {
        return blogPostRepository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("Blog yazisi bulunamadi"));
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

    private String cleanLanguage(String content) {
        if (content == null || content.isBlank()) {
            return content;
        }

        List<String> blockedWords = List.of(
            "salak", "aptal", "gerizekali", "mal", "lan", "ulan", "sacma", "kotu"
        );

        String cleaned = content;
        for (String word : blockedWords) {
            String replacement = maskWord(word);
            cleaned = cleaned.replaceAll("(?i)\\b" + java.util.regex.Pattern.quote(word) + "\\b", replacement);
        }
        return cleaned;
    }

    private String maskWord(String word) {
        if (word.length() <= 2) {
            return "**";
        }
        return word.charAt(0) + "*".repeat(word.length() - 2) + word.charAt(word.length() - 1);
    }
}
