package com.mahbubur.restcompare.model.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public class PageResult<T> {
    private List<T> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;

    public static <T> PageResult<T> fromPage(Page<T> pageData, int requestedPage, int requestedSize) {
        PageResult<T> out = new PageResult<>();
        out.setItems(pageData.getContent());
        out.setPage(requestedPage);
        out.setSize(requestedSize);
        out.setTotalItems(pageData.getTotalElements());
        out.setTotalPages(pageData.getTotalPages());
        return out;
    }

    public List<T> getItems() {
        return items;
    }

    public void setItems(List<T> items) {
        this.items = items;
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

    public long getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(long totalItems) {
        this.totalItems = totalItems;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
