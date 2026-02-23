/**
 * Kisa aciklama: Endpoint alir, servise yonlendirir.
 */

package com.aiasistan.controller;

import java.util.UUID;
import java.util.Set;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

import com.aiasistan.common.ApiQueryUtils;
import com.aiasistan.common.ApiResponse;
import com.aiasistan.common.dto.PageResponse;
import com.aiasistan.dto.BlogPostDto;
import com.aiasistan.service.BlogPostService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import io.swagger.v3.oas.annotations.Operation;

@Validated
@RestController
@RequestMapping("/v1/blog/posts")
public class BlogPostController {
  private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("updatedAt", "createdAt", "title", "status", "visibility");

  private final BlogPostService blogPostService;

  public BlogPostController(BlogPostService blogPostService) {
    this.blogPostService = blogPostService;
  }

  @PostMapping
  @Operation(summary = "Gonderi olustur")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> createPost(
    Authentication authentication,
    @Valid @RequestBody BlogPostDto.Request request
  ) {
    BlogPostDto.Response response = blogPostService.createPost(authentication.getName(), request);
    return ResponseEntity.status(HttpStatus.CREATED)
      .body(ApiResponse.ok(response, "Blog yazisi olusturuldu"));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Gonderi detayini getir")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> getPostById(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    BlogPostDto.Response response = blogPostService.getPostById(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping
  @Operation(summary = "Gonderileri listele")
  public ResponseEntity<ApiResponse<PageResponse<BlogPostDto.Response>>> getPosts(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
    @RequestParam(defaultValue = "updatedAt") String sortBy,
    @RequestParam(defaultValue = "DESC") String sortDirection
  ) {
    var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "updatedAt");
    PageResponse<BlogPostDto.Response> response = blogPostService.getPosts(
      authentication.getName(),
      PageRequest.of(page, size, sort)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/users/{targetUserId}")
  @Operation(summary = "Kullanicinin gorunur gonderilerini getir")
  public ResponseEntity<ApiResponse<PageResponse<BlogPostDto.Response>>> getUserVisiblePosts(
    Authentication authentication,
    @PathVariable UUID targetUserId,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
    @RequestParam(defaultValue = "updatedAt") String sortBy,
    @RequestParam(defaultValue = "DESC") String sortDirection
  ) {
    var sort = ApiQueryUtils.resolveSort(sortBy, sortDirection, ALLOWED_SORT_FIELDS, "updatedAt");
    PageResponse<BlogPostDto.Response> response = blogPostService.getVisiblePostsByUser(
      authentication.getName(),
      targetUserId,
      PageRequest.of(page, size, sort)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @GetMapping("/feed/following")
  @Operation(summary = "Takip edilenlerin akisindaki gonderileri getir")
  public ResponseEntity<ApiResponse<PageResponse<BlogPostDto.Response>>> getFollowingFeed(
    Authentication authentication,
    @RequestParam(defaultValue = "0") @Min(0) int page,
    @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
  ) {
    PageResponse<BlogPostDto.Response> response = blogPostService.getFollowingFeed(
      authentication.getName(),
      PageRequest.of(page, size)
    );
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @PutMapping("/{id}")
  @Operation(summary = "Gonderi guncelle")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> updatePost(
    Authentication authentication,
    @PathVariable UUID id,
    @Valid @RequestBody BlogPostDto.Request request
  ) {
    BlogPostDto.Response response = blogPostService.updatePost(authentication.getName(), id, request);
    return ResponseEntity.ok(ApiResponse.ok(response, "Blog yazisi guncellendi"));
  }

  @PatchMapping("/{id}/clean")
  @Operation(summary = "Gonderi icerigini temizle")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> cleanPostContent(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    BlogPostDto.Response response = blogPostService.cleanPostContent(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response, "Icerik temizlendi"));
  }

  @PostMapping("/{id}/likes/toggle")
  @Operation(summary = "Begeni durumunu degistir")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> toggleLike(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    BlogPostDto.Response response = blogPostService.toggleLike(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(response, "Begeni durumu guncellendi"));
  }

  @PostMapping("/{id}/comments")
  @Operation(summary = "Yorum ekle")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> addComment(
    Authentication authentication,
    @PathVariable UUID id,
    @Valid @RequestBody BlogPostDto.CommentRequest request
  ) {
    BlogPostDto.Response response = blogPostService.addComment(authentication.getName(), id, request.getContent());
    return ResponseEntity.ok(ApiResponse.ok(response, "Yorum eklendi"));
  }

  @DeleteMapping("/{id}/comments/{commentId}")
  @Operation(summary = "Yorum sil")
  public ResponseEntity<ApiResponse<BlogPostDto.Response>> deleteComment(
    Authentication authentication,
    @PathVariable UUID id,
    @PathVariable UUID commentId
  ) {
    BlogPostDto.Response response = blogPostService.deleteComment(authentication.getName(), id, commentId);
    return ResponseEntity.ok(ApiResponse.ok(response, "Yorum silindi"));
  }

  @PostMapping("/clean-preview")
  @Operation(summary = "Onizleme temizle")
  public ResponseEntity<ApiResponse<BlogPostDto.CleanResponse>> cleanPreview(
    @Valid @RequestBody BlogPostDto.CleanRequest request
  ) {
    BlogPostDto.CleanResponse response = blogPostService.cleanTextPreview(request.getContent());
    return ResponseEntity.ok(ApiResponse.ok(response));
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Gonderi sil")
  public ResponseEntity<ApiResponse<Void>> deletePost(
    Authentication authentication,
    @PathVariable UUID id
  ) {
    blogPostService.deletePost(authentication.getName(), id);
    return ResponseEntity.ok(ApiResponse.ok(null, "Blog yazisi silindi"));
  }
}
