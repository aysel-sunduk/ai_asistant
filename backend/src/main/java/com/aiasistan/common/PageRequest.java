package com.aiasistan.common;

public class PageRequest {

    private int page = 0;
    private int size = 10;
    private String sortBy;
    private String sortDirection = "DESC";

    public PageRequest() {
    }

    public PageRequest(int page, int size, String sortBy, String sortDirection) {
        this.page = page;
        this.size = size;
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getSortDirection() {
        return sortDirection;
    }

    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }

    public org.springframework.data.domain.PageRequest toPageable() {
        org.springframework.data.domain.Sort sort = null;

        if (sortBy != null && !sortBy.isEmpty()) {
            sort = sortDirection.equalsIgnoreCase("ASC")
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        }

        return sort != null
            ? org.springframework.data.domain.PageRequest.of(page, size, sort)
            : org.springframework.data.domain.PageRequest.of(page, size);
    }
}
