package com.mahbubur.restcompare.repository;

import com.mahbubur.restcompare.model.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByMembershipNo(String membershipNo);

    Optional<Member> findByEmail(String email);

    Page<Member> findByFullNameContainingIgnoreCaseOrMembershipNoContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String nameQ,
            String membershipNoQ,
            String emailQ,
            Pageable pageable
    );
}
