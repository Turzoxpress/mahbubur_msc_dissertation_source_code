package com.mahbubur.restcompare.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class RenewRequest {

    @NotNull
    private LocalDate newDueDate;

    public LocalDate getNewDueDate() { return newDueDate; }
    public void setNewDueDate(LocalDate newDueDate) { this.newDueDate = newDueDate; }
}
