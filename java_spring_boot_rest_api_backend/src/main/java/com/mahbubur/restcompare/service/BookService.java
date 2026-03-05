package com.mahbubur.restcompare.service;

import com.mahbubur.restcompare.dto.BookRequest;
import com.mahbubur.restcompare.dto.BookResponse;
import com.mahbubur.restcompare.dto.PageResult;
import com.mahbubur.restcompare.entity.Book;
import com.mahbubur.restcompare.exception.ApiException;
import com.mahbubur.restcompare.exception.DuplicateResourceException;
import com.mahbubur.restcompare.exception.ResourceNotFoundException;
import com.mahbubur.restcompare.repository.BookRepository;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public PageResult<BookResponse> list(int page, int size) {
        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<BookResponse> mapped = bookRepository.findAll(pageable).map(this::toResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<BookResponse> listAvailable(int page, int size) {
        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<BookResponse> mapped = bookRepository.findByAvailableCopiesGreaterThan(0, pageable).map(this::toResponse);
        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public PageResult<BookResponse> search(String q, int page, int size) {
        String safeQ = (q == null) ? "" : q.trim();
        Pageable pageable = pageRequest(page, size);
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);

        Page<BookResponse> mapped = bookRepository
                .findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(safeQ, safeQ, pageable)
                .map(this::toResponse);

        return PageResult.fromPage(mapped, safePage, safeSize);
    }

    public BookResponse get(Long id) {
        return toResponse(findEntity(id));
    }

    public BookResponse getByIsbn(String isbn) {
        return toResponse(bookRepository.findByIsbn(isbn)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found for ISBN: " + isbn)));
    }

    public BookResponse create(BookRequest req) {
        bookRepository.findByIsbn(req.getIsbn()).ifPresent(existing -> {
            throw new DuplicateResourceException("Book ISBN already exists");
        });

        Book entity = new Book();
        apply(entity, req);
        return toResponse(bookRepository.save(entity));
    }

    /**
     * Bulk create convenience endpoint (useful for seeding / admin UI).
     * Validates duplicate ISBNs inside the request body and against the database.
     */
    public List<BookResponse> bulkCreate(List<BookRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return List.of();
        }

        // Detect duplicates inside the submitted list.
        Set<String> seen = new HashSet<>();
        for (BookRequest r : requests) {
            if (r == null || r.getIsbn() == null) {
                continue;
            }
            String isbn = r.getIsbn().trim();
            if (!seen.add(isbn)) {
                throw new DuplicateResourceException("Duplicate ISBN in bulk request: " + isbn);
            }
        }

        List<BookResponse> out = new ArrayList<>(requests.size());
        for (BookRequest r : requests) {
            out.add(create(r));
        }
        return out;
    }

    public BookResponse update(Long id, BookRequest req) {
        Book entity = findEntity(id);
        bookRepository.findByIsbn(req.getIsbn()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Book ISBN already exists");
            }
        });
        apply(entity, req);
        return toResponse(bookRepository.save(entity));
    }

    /**
     * Set available copies to an absolute number.
     * Uses a pessimistic lock to avoid race conditions with checkout/return.
     */
    public BookResponse updateStock(Long id, Integer availableCopies) {
        if (availableCopies == null || availableCopies < 0) {
            throw new ApiException("available_copies must be >= 0");
        }

        Book entity = bookRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + id));

        entity.setAvailableCopies(availableCopies);
        return toResponse(bookRepository.save(entity));
    }

    public void delete(Long id) {
        Book entity = findEntity(id);
        bookRepository.delete(entity);
    }

    private Book findEntity(Long id) {
        return bookRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Book not found: " + id));
    }

    private void apply(Book entity, BookRequest req) {
        entity.setIsbn(req.getIsbn());
        entity.setTitle(req.getTitle());
        entity.setAuthor(req.getAuthor());
        entity.setPublishedYear(req.getPublishedYear());
        entity.setAvailableCopies(req.getAvailableCopies());
    }

    private BookResponse toResponse(Book entity) {
        BookResponse dto = new BookResponse();
        dto.setId(entity.getId());
        dto.setIsbn(entity.getIsbn());
        dto.setTitle(entity.getTitle());
        dto.setAuthor(entity.getAuthor());
        dto.setPublishedYear(entity.getPublishedYear());
        dto.setAvailableCopies(entity.getAvailableCopies());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    private Pageable pageRequest(int page, int size) {
        int safePage = Math.max(page, 1);
        int safeSize = Math.min(Math.max(size, 1), 200);
        return PageRequest.of(safePage - 1, safeSize, Sort.by("id").descending());
    }
}
