-- Library seed data for restcompare (Spring Boot + Django) using MySQL
-- Creates a clean dataset in tables: books, members, loans
-- Safe to re-run: it truncates tables first.

SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE loans;
TRUNCATE TABLE books;
TRUNCATE TABLE members;
SET FOREIGN_KEY_CHECKS=1;

-- Books
INSERT INTO books (id, isbn, title, author, published_year, available_copies, created_at) VALUES
(1, 'ISBN000001', 'Sample Book 1 - Library Science', 'Author 1', 2011, 6, NOW()),
(2, 'ISBN000002', 'Sample Book 2 - Library Science', 'Author 2', 2012, 7, NOW()),
(3, 'ISBN000003', 'Sample Book 3 - Library Science', 'Author 3', 2013, 8, NOW()),
(4, 'ISBN000004', 'Sample Book 4 - Library Science', 'Author 4', 2014, 9, NOW()),
(5, 'ISBN000005', 'Sample Book 5 - Data Structures', 'Author 5', 2015, 10, NOW()),
(6, 'ISBN000006', 'Sample Book 6 - Library Science', 'Author 6', 2016, 11, NOW()),
(7, 'ISBN000007', 'Sample Book 7 - Distributed Systems', 'Author 7', 2017, 5, NOW()),
(8, 'ISBN000008', 'Sample Book 8 - Library Science', 'Author 8', 2018, 6, NOW()),
(9, 'ISBN000009', 'Sample Book 9 - Library Science', 'Author 9', 2019, 7, NOW()),
(10, 'ISBN000010', 'Sample Book 10 - Data Structures', 'Author 0', 2020, 8, NOW()),
(11, 'ISBN000011', 'Sample Book 11 - Library Science', 'Author 1', 2021, 9, NOW()),
(12, 'ISBN000012', 'Sample Book 12 - Library Science', 'Author 2', 2022, 10, NOW()),
(13, 'ISBN000013', 'Sample Book 13 - Library Science', 'Author 3', 2023, 11, NOW()),
(14, 'ISBN000014', 'Sample Book 14 - Distributed Systems', 'Author 4', 2024, 5, NOW()),
(15, 'ISBN000015', 'Sample Book 15 - Data Structures', 'Author 5', 2010, 6, NOW()),
(16, 'ISBN000016', 'Sample Book 16 - Library Science', 'Author 6', 2011, 7, NOW()),
(17, 'ISBN000017', 'Sample Book 17 - Library Science', 'Author 7', 2012, 8, NOW()),
(18, 'ISBN000018', 'Sample Book 18 - Library Science', 'Author 8', 2013, 9, NOW()),
(19, 'ISBN000019', 'Sample Book 19 - Library Science', 'Author 9', 2014, 10, NOW()),
(20, 'ISBN000020', 'Sample Book 20 - Data Structures', 'Author 0', 2015, 11, NOW()),
(21, 'ISBN000021', 'Sample Book 21 - Distributed Systems', 'Author 1', 2016, 5, NOW()),
(22, 'ISBN000022', 'Sample Book 22 - Library Science', 'Author 2', 2017, 6, NOW()),
(23, 'ISBN000023', 'Sample Book 23 - Library Science', 'Author 3', 2018, 7, NOW()),
(24, 'ISBN000024', 'Sample Book 24 - Library Science', 'Author 4', 2019, 8, NOW()),
(25, 'ISBN000025', 'Sample Book 25 - Data Structures', 'Author 5', 2020, 9, NOW()),
(26, 'ISBN000026', 'Sample Book 26 - Library Science', 'Author 6', 2021, 10, NOW()),
(27, 'ISBN000027', 'Sample Book 27 - Library Science', 'Author 7', 2022, 11, NOW()),
(28, 'ISBN000028', 'Sample Book 28 - Distributed Systems', 'Author 8', 2023, 5, NOW()),
(29, 'ISBN000029', 'Sample Book 29 - Library Science', 'Author 9', 2024, 6, NOW()),
(30, 'ISBN000030', 'Sample Book 30 - Data Structures', 'Author 0', 2010, 7, NOW());

-- Members
INSERT INTO members (id, membership_no, full_name, email, joined_at, created_at) VALUES
(1, 'M000001', 'Member 1', 'member1@example.com', '2025-01-04', NOW()),
(2, 'M000002', 'Member 2', 'member2@example.com', '2025-01-07', NOW()),
(3, 'M000003', 'Member 3', 'member3@example.com', '2025-01-10', NOW()),
(4, 'M000004', 'Member 4', 'member4@example.com', '2025-01-13', NOW()),
(5, 'M000005', 'Member 5', 'member5@example.com', '2025-01-16', NOW()),
(6, 'M000006', 'Member 6', 'member6@example.com', '2025-01-19', NOW()),
(7, 'M000007', 'Member 7', 'member7@example.com', '2025-01-22', NOW()),
(8, 'M000008', 'Member 8', 'member8@example.com', '2025-01-25', NOW()),
(9, 'M000009', 'Member 9', 'member9@example.com', '2025-01-28', NOW()),
(10, 'M000010', 'Member 10', 'member10@example.com', '2025-01-31', NOW()),
(11, 'M000011', 'Member 11', 'member11@example.com', '2025-02-03', NOW()),
(12, 'M000012', 'Member 12', 'member12@example.com', '2025-02-06', NOW()),
(13, 'M000013', 'Member 13', 'member13@example.com', '2025-02-09', NOW()),
(14, 'M000014', 'Member 14', 'member14@example.com', '2025-02-12', NOW()),
(15, 'M000015', 'Member 15', 'member15@example.com', '2025-02-15', NOW()),
(16, 'M000016', 'Member 16', 'member16@example.com', '2025-02-18', NOW()),
(17, 'M000017', 'Member 17', 'member17@example.com', '2025-02-21', NOW()),
(18, 'M000018', 'Member 18', 'member18@example.com', '2025-02-24', NOW()),
(19, 'M000019', 'Member 19', 'member19@example.com', '2025-02-27', NOW()),
(20, 'M000020', 'Member 20', 'member20@example.com', '2025-03-02', NOW());

-- Loans (book_id + member_id must exist)
INSERT INTO loans (id, book_id, member_id, loan_date, due_date, returned_date, status, created_at) VALUES
(1, 2, 2, '2026-02-02', '2026-02-16', NULL, 'ACTIVE', NOW()),
(2, 3, 3, '2026-02-03', '2026-02-17', NULL, 'ACTIVE', NOW()),
(3, 4, 4, '2026-02-04', '2026-02-18', NULL, 'ACTIVE', NOW()),
(4, 5, 5, '2026-02-05', '2026-02-19', NULL, 'ACTIVE', NOW()),
(5, 6, 6, '2026-02-06', '2026-02-11', NULL, 'OVERDUE', NOW()),
(6, 7, 7, '2026-02-07', '2026-02-21', '2026-02-14', 'RETURNED', NOW()),
(7, 8, 8, '2026-02-08', '2026-02-22', NULL, 'ACTIVE', NOW()),
(8, 9, 9, '2026-02-09', '2026-02-23', NULL, 'ACTIVE', NOW()),
(9, 10, 10, '2026-02-10', '2026-02-24', NULL, 'ACTIVE', NOW()),
(10, 11, 11, '2026-02-11', '2026-02-16', NULL, 'OVERDUE', NOW()),
(11, 12, 12, '2026-02-12', '2026-02-26', NULL, 'ACTIVE', NOW()),
(12, 13, 13, '2026-02-13', '2026-02-27', '2026-02-20', 'RETURNED', NOW()),
(13, 14, 14, '2026-02-14', '2026-02-28', NULL, 'ACTIVE', NOW()),
(14, 15, 15, '2026-02-15', '2026-03-01', NULL, 'ACTIVE', NOW()),
(15, 16, 16, '2026-02-16', '2026-02-21', NULL, 'OVERDUE', NOW()),
(16, 17, 17, '2026-02-17', '2026-03-03', NULL, 'ACTIVE', NOW()),
(17, 18, 18, '2026-02-18', '2026-03-04', NULL, 'ACTIVE', NOW()),
(18, 19, 19, '2026-02-19', '2026-03-05', '2026-02-26', 'RETURNED', NOW()),
(19, 20, 20, '2026-02-20', '2026-03-06', NULL, 'ACTIVE', NOW()),
(20, 21, 1, '2026-02-01', '2026-02-06', NULL, 'OVERDUE', NOW()),
(21, 22, 2, '2026-02-02', '2026-02-16', NULL, 'ACTIVE', NOW()),
(22, 23, 3, '2026-02-03', '2026-02-17', NULL, 'ACTIVE', NOW()),
(23, 24, 4, '2026-02-04', '2026-02-18', NULL, 'ACTIVE', NOW()),
(24, 25, 5, '2026-02-05', '2026-02-19', '2026-02-12', 'RETURNED', NOW()),
(25, 26, 6, '2026-02-06', '2026-02-11', NULL, 'OVERDUE', NOW()),
(26, 27, 7, '2026-02-07', '2026-02-21', NULL, 'ACTIVE', NOW()),
(27, 28, 8, '2026-02-08', '2026-02-22', NULL, 'ACTIVE', NOW()),
(28, 29, 9, '2026-02-09', '2026-02-23', NULL, 'ACTIVE', NOW()),
(29, 30, 10, '2026-02-10', '2026-02-24', NULL, 'ACTIVE', NOW()),
(30, 1, 11, '2026-02-11', '2026-02-25', '2026-02-18', 'RETURNED', NOW()),
(31, 2, 12, '2026-02-12', '2026-02-26', NULL, 'ACTIVE', NOW()),
(32, 3, 13, '2026-02-13', '2026-02-27', NULL, 'ACTIVE', NOW()),
(33, 4, 14, '2026-02-14', '2026-02-28', NULL, 'ACTIVE', NOW()),
(34, 5, 15, '2026-02-15', '2026-03-01', NULL, 'ACTIVE', NOW()),
(35, 6, 16, '2026-02-16', '2026-02-21', NULL, 'OVERDUE', NOW()),
(36, 7, 17, '2026-02-17', '2026-03-03', '2026-02-24', 'RETURNED', NOW()),
(37, 8, 18, '2026-02-18', '2026-03-04', NULL, 'ACTIVE', NOW()),
(38, 9, 19, '2026-02-19', '2026-03-05', NULL, 'ACTIVE', NOW()),
(39, 10, 20, '2026-02-20', '2026-03-06', NULL, 'ACTIVE', NOW()),
(40, 11, 1, '2026-02-01', '2026-02-06', NULL, 'OVERDUE', NOW());

-- Done