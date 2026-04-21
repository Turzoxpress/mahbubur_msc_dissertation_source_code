package com.mahbubur.restcompare.model.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class RenewRequest {

    @NotNull
    @JsonAlias({"new_due_date"})
    private LocalDate dueDate;

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
}
