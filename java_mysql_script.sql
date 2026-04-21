USE rest_compare_spring;

SELECT COUNT(*) AS total_books FROM books;
SELECT COUNT(*) AS total_members FROM members;
SELECT COUNT(*) AS total_loans FROM loans;

SELECT status, COUNT(*) AS total_by_status
FROM loans
GROUP BY status;

SHOW INDEX FROM books;
SHOW INDEX FROM members;
SHOW INDEX FROM loans;