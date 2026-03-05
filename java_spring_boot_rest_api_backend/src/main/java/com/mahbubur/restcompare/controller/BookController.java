package com.mahbubur.restcompare.controller;

import com.mahbubur.restcompare.dto.BookRequest;
import com.mahbubur.restcompare.dto.BookResponse;
import com.mahbubur.restcompare.dto.PageResult;
import com.mahbubur.restcompare.dto.StockUpdateRequest;
import com.mahbubur.restcompare.service.BookService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService service;

    public BookController(BookService service) {
        this.service = service;
    }

    @GetMapping
    public PageResult<BookResponse> list(@RequestParam(defaultValue = "1") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @GetMapping("/available")
    public PageResult<BookResponse> listAvailable(@RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return service.listAvailable(page, size);
    }

    @GetMapping("/search")
    public PageResult<BookResponse> search(@RequestParam(defaultValue = "") String q,
                                           @RequestParam(defaultValue = "1") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return service.search(q, page, size);
    }

    @GetMapping("/isbn/{isbn}")
    public BookResponse getByIsbn(@PathVariable String isbn) {
        return service.getByIsbn(isbn);
    }

    @GetMapping("/{id}")
    public BookResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse create(@Valid @RequestBody BookRequest request) {
        return service.create(request);
    }

    @PostMapping("/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    public List<BookResponse> bulkCreate(@Valid @RequestBody List<BookRequest> requests) {
        return service.bulkCreate(requests);
    }

    @PutMapping("/{id}")
    public BookResponse update(@PathVariable Long id, @Valid @RequestBody BookRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/stock")
    public BookResponse updateStock(@PathVariable Long id, @Valid @RequestBody StockUpdateRequest request) {
        return service.updateStock(id, request.getAvailableCopies());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
