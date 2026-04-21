package com.mahbubur.restcompare.model.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CheckoutRequest {

    @NotNull
    private Long bookId;

    @NotNull
    private Long memberId;

    @NotNull
    private LocalDate loanDate;

    @NotNull
    private LocalDate dueDate;

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }

    public Long getMemberId() { return memberId; }
    public void setMemberId(Long memberId) { this.memberId = memberId; }

    public LocalDate getLoanDate() { return loanDate; }
    public void setLoanDate(LocalDate loanDate) { this.loanDate = loanDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}
