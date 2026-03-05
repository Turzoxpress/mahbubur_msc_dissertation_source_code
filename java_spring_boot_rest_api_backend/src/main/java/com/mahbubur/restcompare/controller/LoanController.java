package com.mahbubur.restcompare.controller;

import com.mahbubur.restcompare.dto.*;
import com.mahbubur.restcompare.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/loans")
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

    @GetMapping("/active")
    public PageResult<LoanResponse> listActiveByMember(@RequestParam Long memberId,
                                                       @RequestParam(defaultValue = "1") int page,
                                                       @RequestParam(defaultValue = "20") int size) {
        return service.listActiveByMember(memberId, page, size);
    }

    @GetMapping("/overdue")
    public PageResult<LoanResponse> listOverdue(@RequestParam(required = false)
                                                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                LocalDate asOf,
                                                @RequestParam(defaultValue = "1") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        return service.listOverdue(asOf, page, size);
    }

    @GetMapping("/expanded")
    public PageResult<LoanExpandedResponse> listExpanded(@RequestParam(defaultValue = "1") int page,
                                                         @RequestParam(defaultValue = "20") int size) {
        return service.listExpanded(page, size);
    }

    @GetMapping("/expanded/{id}")
    public LoanExpandedResponse getExpanded(@PathVariable Long id) {
        return service.getExpanded(id);
    }

    @GetMapping("/{id}")
    public LoanResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse create(@Valid @RequestBody LoanRequest request) {
        return service.create(request);
    }

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public LoanResponse checkout(@Valid @RequestBody CheckoutRequest request) {
        return service.checkout(request);
    }

    @PostMapping("/{id}/return")
    public LoanResponse returnLoan(@PathVariable Long id) {
        return service.returnLoan(id);
    }

    @PostMapping("/{id}/renew")
    public LoanResponse renew(@PathVariable Long id, @Valid @RequestBody RenewRequest request) {
        return service.renew(id, request);
    }

    @PutMapping("/{id}")
    public LoanResponse update(@PathVariable Long id, @Valid @RequestBody LoanRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
