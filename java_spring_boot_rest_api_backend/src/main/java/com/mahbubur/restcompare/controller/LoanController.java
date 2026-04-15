package com.mahbubur.restcompare.controller;

import com.mahbubur.restcompare.model.dto.*;
import com.mahbubur.restcompare.api.ApiEndpoints;
import com.mahbubur.restcompare.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping(ApiEndpoints.LOANS)
public class LoanController {

    private final LoanService service;

    public LoanController(LoanService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<LoanResponse> list(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping(ApiEndpoints.LOANS_ACTIVE)
    public PageResult<LoanResponse> listActive(@RequestParam(required = false) Long memberId,
                                               @RequestParam(defaultValue = "1") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return service.listActive(memberId, page, size);
    }

    @GetMapping(ApiEndpoints.LOANS_OVERDUE)
    public PageResult<LoanResponse> listOverdue(@RequestParam(required = false)
                                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                LocalDate asOf,
                                                @RequestParam(defaultValue = "1") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return service.listOverdue(asOf, page, size);
    }

    @GetMapping(ApiEndpoints.LOANS_EXPANDED)
    public PageResult<LoanExpandedResponse> listExpanded(@RequestParam(defaultValue = "1") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        return service.listExpanded(page, size);
    }

    @GetMapping(ApiEndpoints.LOAN_EXPANDED_BY_ID)
    public LoanExpandedResponse getExpanded(@PathVariable Long id) {
        return service.getExpanded(id);
    }

    @GetMapping(ApiEndpoints.LOAN_BY_ID)
    public LoanResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse create(@Valid @RequestBody LoanRequest request) {
        return service.create(request);
    }

    @PostMapping(ApiEndpoints.LOAN_CHECKOUT)
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse checkout(@Valid @RequestBody CheckoutRequest request) {
        return service.checkout(request);
    }

    @PostMapping(ApiEndpoints.LOAN_RETURN)
    public LoanResponse returnLoan(@PathVariable Long id) {
        return service.returnLoan(id);
    }

    @PostMapping(ApiEndpoints.LOAN_RENEW)
    public LoanResponse renew(@PathVariable Long id, @Valid @RequestBody RenewRequest request) {
        return service.renew(id, request);
    }

    @PutMapping(ApiEndpoints.LOAN_BY_ID)
    public LoanResponse update(@PathVariable Long id, @Valid @RequestBody LoanRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping(ApiEndpoints.LOAN_BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
