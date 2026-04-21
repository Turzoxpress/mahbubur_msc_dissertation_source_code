package com.mahbubur.restcompare.repository;

import com.mahbubur.restcompare.model.entity.Loan;
import com.mahbubur.restcompare.model.entity.Loan.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    @EntityGraph(attributePaths = {"book", "member"})
    @Query("select l from Loan l")
    Page<Loan> findAllWithDetails(Pageable pageable);

    @EntityGraph(attributePaths = {"book", "member"})
    @Query("select l from Loan l where l.id = :id")
    Optional<Loan> findWithDetailsById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"book", "member"})
    Page<Loan> findByMember_Id(Long memberId, Pageable pageable);

    @EntityGraph(attributePaths = {"book", "member"})
    Page<Loan> findByMember_IdAndStatus(Long memberId, LoanStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"book", "member"})
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"book", "member"})
    Page<Loan> findByBook_Id(Long bookId, Pageable pageable);

    @EntityGraph(attributePaths = {"book", "member"})
    @Query("select l from Loan l where l.status <> :returned and l.dueDate < :asOf")
    Page<Loan> findOverdue(@Param("asOf") LocalDate asOf, @Param("returned") LoanStatus returned, Pageable pageable);

    long countByStatus(LoanStatus status);

    @Query("select count(l) from Loan l where l.status <> :returned and l.dueDate < :asOf")
    long countOverdue(@Param("asOf") LocalDate asOf, @Param("returned") LoanStatus returned);
}
