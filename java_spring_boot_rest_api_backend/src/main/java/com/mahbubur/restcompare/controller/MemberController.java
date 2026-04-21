package com.mahbubur.restcompare.controller;

import com.mahbubur.restcompare.model.dto.MemberRequest;
import com.mahbubur.restcompare.model.dto.MemberResponse;
import com.mahbubur.restcompare.model.dto.PageResult;
import com.mahbubur.restcompare.api.ApiEndpoints;
import com.mahbubur.restcompare.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiEndpoints.MEMBERS)
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<MemberResponse> list(@RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping(ApiEndpoints.MEMBERS_SEARCH)
    public PageResult<MemberResponse> search(@RequestParam(defaultValue = "") String q,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return service.search(q, page, size);
    }

    @GetMapping(ApiEndpoints.MEMBER_BY_MEMBERSHIP)
    public MemberResponse getByMembershipNo(@PathVariable String membershipNo) {
        return service.getByMembershipNo(membershipNo);
    }

    @GetMapping(ApiEndpoints.MEMBER_BY_ID)
    public MemberResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse create(@Valid @RequestBody MemberRequest request) {
        return service.create(request);
    }

    @PutMapping(ApiEndpoints.MEMBER_BY_ID)
    public MemberResponse update(@PathVariable Long id, @Valid @RequestBody MemberRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping(ApiEndpoints.MEMBER_BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
