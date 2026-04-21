package com.mahbubur.restcompare.service;

import com.mahbubur.restcompare.model.dto.StatsResponse;
import com.mahbubur.restcompare.model.entity.Loan;
import com.mahbubur.restcompare.repository.BookRepository;
import com.mahbubur.restcompare.repository.LoanRepository;
import com.mahbubur.restcompare.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;

@Service
@Transactional(readOnly = true)
public class StatsService {

    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;
    private final LoanRepository loanRepository;

    public StatsService(BookRepository bookRepository, MemberRepository memberRepository, LoanRepository loanRepository) {
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
        this.loanRepository = loanRepository;
    }

    public StatsResponse getStats() {
        StatsResponse r = new StatsResponse();
        r.setTotalBooks(bookRepository.count());
        r.setAvailableBooks(bookRepository.countByAvailableCopiesGreaterThan(0));
        r.setTotalMembers(memberRepository.count());
        r.setTotalLoans(loanRepository.count());

        r.setActiveLoans(loanRepository.countByStatus(Loan.LoanStatus.ACTIVE));
        r.setReturnedLoans(loanRepository.countByStatus(Loan.LoanStatus.RETURNED));
        r.setOverdueLoans(loanRepository.countOverdue(LocalDate.now(), Loan.LoanStatus.RETURNED));

        r.setTimestamp(Instant.now());
        return r;
    }
}
