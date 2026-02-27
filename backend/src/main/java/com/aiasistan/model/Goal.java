/**
 * Kisa aciklama: Veritabani varligini temsil eder.
 */

package com.aiasistan.model;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import com.aiasistan.common.UserOwnedEntity;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "goals")
@Where(clause = "deleted_at IS NULL")
public class Goal extends UserOwnedEntity {

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "category")
    private String category;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(name = "progress_pct")
    private Integer progressPct = 0;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @Type(JsonBinaryType.class)
    @Column(name = "milestones", columnDefinition = "jsonb")
    private List<Map<String, Object>> milestones;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getTargetDate() {
        return targetDate;
    }

    public void setTargetDate(LocalDate targetDate) {
        this.targetDate = targetDate;
    }

    public Integer getProgressPct() {
        return progressPct;
    }

    public void setProgressPct(Integer progressPct) {
        this.progressPct = progressPct;
    }

    public Boolean getIsCompleted() {
        return isCompleted;
    }

    public void setIsCompleted(Boolean isCompleted) {
        this.isCompleted = isCompleted;
    }

    public List<Map<String, Object>> getMilestones() {
        return milestones;
    }

    public void setMilestones(List<Map<String, Object>> milestones) {
        this.milestones = milestones;
    }
}
