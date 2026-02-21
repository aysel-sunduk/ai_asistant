package com.aiasistan.model;

import java.util.List;
import java.util.Map;

import org.hibernate.annotations.Type;

import com.aiasistan.common.UserOwnedEntity;

import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "blog_posts")
public class BlogPost extends UserOwnedEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "raw_content", nullable = false, columnDefinition = "text")
    private String rawContent;

    @Column(name = "clean_content", columnDefinition = "text")
    private String cleanContent;

    @Column(name = "visibility", length = 32)
    private String visibility = "private";

    @Column(name = "status")
    private String status = "draft";

    @Column(name = "tags", columnDefinition = "text[]")
    @Type(StringArrayType.class)
    private String[] tags;

    @Column(name = "like_count")
    private Integer likeCount = 0;

    @Type(JsonBinaryType.class)
    @Column(name = "comments", columnDefinition = "jsonb")
    private List<Map<String, Object>> comments;


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

}
