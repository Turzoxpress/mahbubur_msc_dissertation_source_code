package com.mahbubur.restcompare.service;

import com.mahbubur.restcompare.dto.MemberRequest;
import com.mahbubur.restcompare.dto.MemberResponse;
import com.mahbubur.restcompare.dto.PageResult;
import com.mahbubur.restcompare.entity.Member;
import com.mahbubur.restcompare.exception.DuplicateResourceException;
import com.mahbubur.restcompare.exception.ResourceNotFoundException;
import com.mahbubur.restcompare.repository.MemberRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public PageResult<MemberResponse> list(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by("id").descending());
        Page<MemberResponse> mapped = memberRepository.findAll(pageable).map(this::toResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<MemberResponse> search(String q, int page, int size) {
        String safeQ = (q == null) ? "" : q.trim();
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);
        Pageable pageable = PageRequest.of(safePage - 1, safeSize, Sort.by("id").descending());

        Page<MemberResponse> mapped = memberRepository
                .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(safeQ, safeQ, pageable)
                .map(this::toResponse);

        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public MemberResponse get(Long id) {
        return toResponse(findEntity(id));
    }

    public MemberResponse getByMembershipNo(String membershipNo) {
        Member m = memberRepository.findByMembershipNo(membershipNo)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found for membership_no: " + membershipNo));
        return toResponse(m);
    }

    public MemberResponse create(MemberRequest req) {
        memberRepository.findByMembershipNo(req.getMembershipNo()).ifPresent(existing -> {
            throw new DuplicateResourceException("Membership number already exists");
        });
        memberRepository.findByEmail(req.getEmail()).ifPresent(existing -> {
            throw new DuplicateResourceException("Email already exists");
        });

        Member entity = new Member();
        apply(entity, req);
        return toResponse(memberRepository.save(entity));
    }

    public MemberResponse update(Long id, MemberRequest req) {
        Member entity = findEntity(id);
        memberRepository.findByMembershipNo(req.getMembershipNo()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Membership number already exists");
            }
        });
        memberRepository.findByEmail(req.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Email already exists");
            }
        });

        apply(entity, req);
        return toResponse(memberRepository.save(entity));
    }

    public void delete(Long id) {
        Member entity = findEntity(id);
        memberRepository.delete(entity);
    }

    private Member findEntity(Long id) {
        return memberRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));
    }

    private void apply(Member entity, MemberRequest req) {
        entity.setMembershipNo(req.getMembershipNo());
        entity.setFullName(req.getFullName());
        entity.setEmail(req.getEmail());
        entity.setJoinedAt(req.getJoinedAt() == null ? LocalDate.now() : req.getJoinedAt());
    }

    private MemberResponse toResponse(Member entity) {
        MemberResponse dto = new MemberResponse();
        dto.setId(entity.getId());
        dto.setMembershipNo(entity.getMembershipNo());
        dto.setFullName(entity.getFullName());
        dto.setEmail(entity.getEmail());
        dto.setJoinedAt(entity.getJoinedAt());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
