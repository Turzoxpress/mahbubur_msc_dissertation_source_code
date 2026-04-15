# Library Management System - MSc Research Project Pack

This package contains three aligned projects for your dissertation experiment:

1. Java Spring Boot backend
2. Python Django REST backend
3. React + Vite frontend for manual comparison

Both backends expose the same Library Management API domain:
- books
- members
- loans
- stats and ping

Both backends now follow a clearer MVC-style structure with:
- model
- controller
- service
- repository / data access
- API endpoint references
- settings / config
- manual testing files
- k6 automated performance scripts

Shared file:
- `library_seed.sql` at the root
- duplicated inside both backend `database/` folders for convenience

Use each project's `instructions.txt` file for setup and testing steps.
