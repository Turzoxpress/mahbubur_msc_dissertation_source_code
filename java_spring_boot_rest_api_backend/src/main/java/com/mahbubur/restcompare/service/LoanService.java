package com.mahbubur.restcompare.service;

import com.mahbubur.restcompare.dto.*;
import com.mahbubur.restcompare.entity.Book;
import com.mahbubur.restcompare.entity.Loan;
import com.mahbubur.restcompare.entity.Member;
import com.mahbubur.restcompare.exception.ApiException;
import com.mahbubur.restcompare.exception.ResourceNotFoundException;
import com.mahbubur.restcompare.repository.BookRepository;
import com.mahbubur.restcompare.repository.LoanRepository;
import com.mahbubur.restcompare.repository.MemberRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class LoanService {

    private final LoanRepository loanRepository;
    private final BookRepository bookRepository;
    private final MemberRepository memberRepository;

    public LoanService(LoanRepository loanRepository, BookRepository bookRepository, MemberRepository memberRepository) {
        this.loanRepository = loanRepository;
        this.bookRepository = bookRepository;
        this.memberRepository = memberRepository;
    }

    public PageResult<LoanResponse> list(int page, int size) {
        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<LoanResponse> mapped = loanRepository.findAll(pageable).map(this::toResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<LoanResponse> listActiveByMember(Long memberId, int page, int size) {
        memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));

        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<LoanResponse> mapped = loanRepository
                .findByMember_IdAndStatus(memberId, Loan.LoanStatus.ACTIVE, pageable)
                .map(this::toResponse);

        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<LoanExpandedResponse> listExpanded(int page, int size) {
        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<LoanExpandedResponse> mapped = loanRepository.findAllWithDetails(pageable).map(this::toExpandedResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<LoanExpandedResponse> listExpandedByMember(Long memberId, int page, int size) {
        memberRepository.findById(memberId).orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));

        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<LoanExpandedResponse> mapped = loanRepository.findByMember_Id(memberId, pageable).map(this::toExpandedResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<LoanExpandedResponse> listExpandedByBook(Long bookId, int page, int size) {
        bookRepository.findById(bookId).orElseThrow(() -> new ResourceNotFoundException("Book not found: " + bookId));

        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<LoanExpandedResponse> mapped = loanRepository.findByBook_Id(bookId, pageable).map(this::toExpandedResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<LoanResponse> listOverdue(LocalDate asOf, int page, int size) {
        LocalDate safeAsOf = (asOf == null) ? LocalDate.now() : asOf;

        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<LoanResponse> mapped = loanRepository
                .findOverdue(safeAsOf, Loan.LoanStatus.RETURNED, pageable)
                .map(this::toResponse);

        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public LoanResponse get(Long id) {
        return toResponse(findEntity(id));
    }

    public LoanExpandedResponse getExpanded(Long id) {
        Loan entity = loanRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + id));
        return toExpandedResponse(entity);
    }

    public LoanResponse create(LoanRequest req) {
        Loan entity = new Loan();
        apply(entity, req);
        return toResponse(loanRepository.save(entity));
    }

    public LoanResponse update(Long id, LoanRequest req) {
        Loan entity = findEntity(id);
        apply(entity, req);
        return toResponse(loanRepository.save(entity));
    }

    /**
     * Transactional checkout:
     * - locks book row
     * - decrements available_copies
     * - creates ACTIVE loan
     */
    public LoanResponse checkout(CheckoutRequest req) {
        Book book = bookRepository.findByIdForUpdate(req.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + req.getBookId()));
        Member member = memberRepository.findById(req.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + req.getMemberId()));

        if (req.getDueDate().isBefore(req.getLoanDate())) {
            throw new ApiException("due_date cannot be earlier than loan_date");
        }

        int copies = (book.getAvailableCopies() == null) ? 0 : book.getAvailableCopies();
        if (copies <= 0) {
            throw new ApiException("No available copies for book: " + book.getId());
        }

        book.setAvailableCopies(copies - 1);
        bookRepository.save(book);

        Loan loan = new Loan();
        loan.setBook(book);
        loan.setMember(member);
        loan.setLoanDate(req.getLoanDate());
        loan.setDueDate(req.getDueDate());
        loan.setReturnedDate(null);
        loan.setStatus(Loan.LoanStatus.ACTIVE);

        return toResponse(loanRepository.save(loan));
    }

    /**
     * Mark returned and increment available_copies.
     */
    public LoanResponse returnLoan(Long loanId) {
        Loan loan = loanRepository.findWithDetailsById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        if (loan.getStatus() == Loan.LoanStatus.RETURNED) {
            throw new ApiException("Loan already returned");
        }

        Book book = bookRepository.findByIdForUpdate(loan.getBook().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + loan.getBook().getId()));

        int copies = (book.getAvailableCopies() == null) ? 0 : book.getAvailableCopies();
        book.setAvailableCopies(copies + 1);
        bookRepository.save(book);

        loan.setReturnedDate(LocalDate.now());
        loan.setStatus(Loan.LoanStatus.RETURNED);
        loanRepository.save(loan);

        return toResponse(loan);
    }

    /**
     * Extend due_date for an ACTIVE/OVERDUE loan.
     */
    public LoanResponse renew(Long loanId, RenewRequest req) {
        Loan loan = loanRepository.findWithDetailsById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + loanId));

        if (loan.getStatus() == Loan.LoanStatus.RETURNED) {
            throw new ApiException("Cannot renew a returned loan");
        }

        LocalDate newDue = req.getNewDueDate();
        if (newDue.isBefore(loan.getLoanDate())) {
            throw new ApiException("new_due_date cannot be earlier than loan_date");
        }

        loan.setDueDate(newDue);

        // If it was OVERDUE but the new due date is now in the future, mark ACTIVE again.
        if (loan.getStatus() == Loan.LoanStatus.OVERDUE && !newDue.isBefore(LocalDate.now())) {
            loan.setStatus(Loan.LoanStatus.ACTIVE);
        }

        loanRepository.save(loan);
        return toResponse(loan);
    }

    public void delete(Long id) {
        Loan entity = findEntity(id);
        loanRepository.delete(entity);
    }

    private Loan findEntity(Long id) {
        return loanRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Loan not found: " + id));
    }

    private void apply(Loan entity, LoanRequest req) {
        Book book = bookRepository.findById(req.getBookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + req.getBookId()));
        Member member = memberRepository.findById(req.getMemberId())
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + req.getMemberId()));

        if (req.getDueDate().isBefore(req.getLoanDate())) {
            throw new ApiException("due_date cannot be earlier than loan_date");
        }
        if (req.getReturnedDate() != null && req.getReturnedDate().isBefore(req.getLoanDate())) {
            throw new ApiException("returned_date cannot be earlier than loan_date");
        }

        Loan.LoanStatus status;
        try {
            status = Loan.LoanStatus.valueOf(req.getStatus().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ApiException("Invalid status. Use ACTIVE, RETURNED, or OVERDUE");
        }

        entity.setBook(book);
        entity.setMember(member);
        entity.setLoanDate(req.getLoanDate());
        entity.setDueDate(req.getDueDate());
        entity.setReturnedDate(req.getReturnedDate());
        entity.setStatus(status);
    }

    private LoanResponse toResponse(Loan entity) {
        LoanResponse dto = new LoanResponse();
        dto.setId(entity.getId());
        dto.setBookId(entity.getBook().getId());
        dto.setMemberId(entity.getMember().getId());
        dto.setLoanDate(entity.getLoanDate());
        dto.setDueDate(entity.getDueDate());
        dto.setReturnedDate(entity.getReturnedDate());
        dto.setStatus(entity.getStatus().name());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private LoanExpandedResponse toExpandedResponse(Loan entity) {
        LoanExpandedResponse dto = new LoanExpandedResponse();
        dto.setId(entity.getId());

        dto.setBookId(entity.getBook().getId());
        dto.setBook(toBookResponse(entity.getBook()));

        dto.setMemberId(entity.getMember().getId());
        dto.setMember(toMemberResponse(entity.getMember()));

        dto.setLoanDate(entity.getLoanDate());
        dto.setDueDate(entity.getDueDate());
        dto.setReturnedDate(entity.getReturnedDate());
        dto.setStatus(entity.getStatus().name());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private BookResponse toBookResponse(Book b) {
        BookResponse r = new BookResponse();
        r.setId(b.getId());
        r.setIsbn(b.getIsbn());
        r.setTitle(b.getTitle());
        r.setAuthor(b.getAuthor());
        r.setPublishedYear(b.getPublishedYear());
        r.setAvailableCopies(b.getAvailableCopies());
        r.setCreatedAt(b.getCreatedAt());
        return r;
    }

    private MemberResponse toMemberResponse(Member m) {
        MemberResponse r = new MemberResponse();
        r.setId(m.getId());
        r.setMembershipNo(m.getMembershipNo());
        r.setFullName(m.getFullName());
        r.setEmail(m.getEmail());
        r.setJoinedAt(m.getJoinedAt());
        r.setCreatedAt(m.getCreatedAt());
        return r;
    }

    private Pageable pageRequest(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);
        return PageRequest.of(safePage - 1, safeSize, Sort.by("id").descending());
    }
}
