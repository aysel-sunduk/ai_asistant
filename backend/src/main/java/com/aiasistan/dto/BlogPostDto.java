/**
 * Kisa aciklama: Ortak uygulama parcasidir.
 */

package com.aiasistan.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.aiasistan.model.BlogPost;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO: Blog gönderisi verilerini taşır.
 */
public class BlogPostDto {

    public static class Request {
        @NotBlank(message = "Baslik bos olamaz")
        @Size(min = 3, max = 150, message = "Baslik 3-150 karakter arasinda olmali")
        private String title;

        @NotBlank(message = "Icerik bos olamaz")
        @Size(min = 10, max = 10000, message = "Icerik 10-10000 karakter arasinda olmali")
        private String rawContent;

        private String visibility;
        private String status;
        private String[] tags;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getRawContent() {
            return rawContent;
        }

        public void setRawContent(String rawContent) {
            this.rawContent = rawContent;
        }

        public String getVisibility() {
            return visibility;
        }

        public void setVisibility(String visibility) {
            this.visibility = visibility;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String[] getTags() {
            return tags;
        }

        public void setTags(String[] tags) {
            this.tags = tags;
        }
    }

    public static class CleanRequest {
        @NotBlank(message = "Icerik bos olamaz")
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    public static class CommentRequest {
        @NotBlank(message = "Yorum icerigi bos olamaz")
        @Size(min = 1, max = 1000, message = "Yorum 1-1000 karakter arasinda olmali")
        private String content;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }

    /** AI Başlık önerisi isteği. */
    public static class TitleSuggestionRequest {
        @NotBlank(message = "Icerik bos olamaz")
        @Size(min = 20, max = 10000, message = "Icerik en az 20 karakter olmali")
        private String content;

        private String category = "genel";
        private int numSuggestions = 3;

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public int getNumSuggestions() {
            return numSuggestions;
        }

        public void setNumSuggestions(int numSuggestions) {
            this.numSuggestions = numSuggestions;
        }
    }

    public static class CleanResponse {
        private String originalContent;
        private String cleanContent;

        public String getOriginalContent() {
            return originalContent;
        }

        public void setOriginalContent(String originalContent) {
            this.originalContent = originalContent;
        }

        public String getCleanContent() {
            return cleanContent;
        }

        public void setCleanContent(String cleanContent) {
            this.cleanContent = cleanContent;
        }
    }

    public static class Response {
        private UUID id;
        private UUID userId;
        private String title;
        private String rawContent;
        private String cleanContent;
        private String visibility;
        private String status;
        private String[] tags;
        private Integer likeCount;
        private List<Map<String, Object>> comments;
        private List<Map<String, Object>> likedUsers;
        private Integer commentCount;
        private Boolean likedByMe;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public static Response from(BlogPost post) {
            Response response = new Response();
            response.id = post.getId();
            response.userId = post.getUserId();
            response.title = post.getTitle();
            response.rawContent = post.getRawContent();
            response.cleanContent = post.getCleanContent();
            response.visibility = post.getVisibility();
            response.status = post.getStatus();
            response.tags = post.getTags();
            response.likeCount = post.getLikeCount();
            response.comments = post.getComments();
            response.likedUsers = List.of();
            response.commentCount = post.getComments() != null ? post.getComments().size() : 0;
            response.likedByMe = false;
            response.createdAt = post.getCreatedAt();
            response.updatedAt = post.getUpdatedAt();
            return response;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getRawContent() {
            return rawContent;
        }

        public void setRawContent(String rawContent) {
            this.rawContent = rawContent;
        }

        public String getCleanContent() {
            return cleanContent;
        }

        public void setCleanContent(String cleanContent) {
            this.cleanContent = cleanContent;
        }

        public String getVisibility() {
            return visibility;
        }

        public void setVisibility(String visibility) {
            this.visibility = visibility;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String[] getTags() {
            return tags;
        }

        public void setTags(String[] tags) {
            this.tags = tags;
        }

        public Integer getLikeCount() {
            return likeCount;
        }

        public void setLikeCount(Integer likeCount) {
            this.likeCount = likeCount;
        }

        public List<Map<String, Object>> getComments() {
            return comments;
        }

        public void setComments(List<Map<String, Object>> comments) {
            this.comments = comments;
        }

        public Integer getCommentCount() {
            return commentCount;
        }

        public void setCommentCount(Integer commentCount) {
            this.commentCount = commentCount;
        }

        public List<Map<String, Object>> getLikedUsers() {
            return likedUsers;
        }

        public void setLikedUsers(List<Map<String, Object>> likedUsers) {
            this.likedUsers = likedUsers;
        }

        public Boolean getLikedByMe() {
            return likedByMe;
        }

        public void setLikedByMe(Boolean likedByMe) {
            this.likedByMe = likedByMe;
        }

        public OffsetDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(OffsetDateTime createdAt) {
            this.createdAt = createdAt;
        }

        public OffsetDateTime getUpdatedAt() {
            return updatedAt;
        }

        public void setUpdatedAt(OffsetDateTime updatedAt) {
            this.updatedAt = updatedAt;
        }
    }

    public static class PostLikesResponse {
        private UUID postId;
        private Integer likeCount;
        private Boolean likedByMe;
        private List<Map<String, Object>> likedUsers;

        public UUID getPostId() {
            return postId;
        }

        public void setPostId(UUID postId) {
            this.postId = postId;
        }

        public Integer getLikeCount() {
            return likeCount;
        }

        public void setLikeCount(Integer likeCount) {
            this.likeCount = likeCount;
        }

        public Boolean getLikedByMe() {
            return likedByMe;
        }

        public void setLikedByMe(Boolean likedByMe) {
            this.likedByMe = likedByMe;
        }

        public List<Map<String, Object>> getLikedUsers() {
            return likedUsers;
        }

        public void setLikedUsers(List<Map<String, Object>> likedUsers) {
            this.likedUsers = likedUsers;
        }
    }
}
