package com.mahbubur.restcompare.repository;

import com.mahbubur.restcompare.model.entity.Book;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByIsbn(String isbn);

    Page<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(String titleQ, String authorQ, Pageable pageable);

    Page<Book> findByAvailableCopiesGreaterThan(Integer min, Pageable pageable);

    long countByAvailableCopiesGreaterThan(Integer min);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.id = :id")
    Optional<Book> findByIdForUpdate(@Param("id") Long id);
}
