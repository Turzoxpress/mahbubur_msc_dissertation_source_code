# MSc Dissertation Project -- REST API Performance Comparison

This repository contains the **source code used for performance
comparison of REST APIs** implemented using:

-   **Spring Boot (Java)**
-   **Django REST Framework (Python)**
-   **Vite + React + TypeScript + Tailwind (Frontend)**

Both backends use **MySQL** as the shared relational database to ensure
**fair benchmarking conditions**.

------------------------------------------------------------------------

# 1. Version Set Used in the Comparison

  -----------------------------------------------------------------------
  Component         Technology        Version           Notes
  ----------------- ----------------- ----------------- -----------------
  Java runtime /    JDK               25                Spring Boot
  compiler                                              runtime

  Java framework    Spring Boot       4.0.3             REST API
                                                        implementation

  Python runtime    Python            3.13              Django 5.2
                                      (macOS/Windows) • requires Python
                                      3.12 (Ubuntu)     ≥3.12

  Python framework  Django            5.2.11            Backend
                                                        implementation

  API framework     Django REST       3.16.1            Serializers,
                    Framework                           pagination, APIs

  Database          MySQL Community   8.4.x (LTS)       Shared database
                    Server                              

  IDE               Visual Studio     1.108.2           Same IDE for both
                    Code                                projects

  Load testing      k6                Installed version Used for
                                                        benchmarking
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 2. Project Structure

    project-root
    │
    ├── spring-backend/
    ├── django-backend/
    ├── frontend/
    └── README.md

Ports used:

  Service       Port
  ------------- ------
  Spring Boot   8080
  Django        8000
  Frontend      5173

------------------------------------------------------------------------

# 3. MySQL Database Setup (All OS)

Open MySQL shell:

    mysql -u root -p

Create databases and user:

    CREATE DATABASE IF NOT EXISTS rest_compare_spring
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

    CREATE DATABASE IF NOT EXISTS rest_compare_django
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

    CREATE USER IF NOT EXISTS 'restuser'@'localhost'
    IDENTIFIED BY 'StrongPass123!';

    GRANT ALL PRIVILEGES ON rest_compare_spring.* TO 'restuser'@'localhost';
    GRANT ALL PRIVILEGES ON rest_compare_django.* TO 'restuser'@'localhost';

    FLUSH PRIVILEGES;
    EXIT;

Verify:

    mysql -u restuser -p -e "SHOW DATABASES;"

------------------------------------------------------------------------

# 4. Configure Database

## Spring Boot

File:

    spring-backend/src/main/resources/application.yml

    spring:
      datasource:
        url: jdbc:mysql://localhost:3306/rest_compare_spring?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
        username: restuser
        password: StrongPass123!

## Django

File:

    django-backend/config/settings.py

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "NAME": "rest_compare_django",
            "USER": "restuser",
            "PASSWORD": "StrongPass123!",
            "HOST": "127.0.0.1",
            "PORT": "3306",
            "OPTIONS": {"charset": "utf8mb4"},
        }
    }

------------------------------------------------------------------------

# 5. Ubuntu Linux Setup

Install packages:

    sudo apt update

    sudo apt install -y build-essential pkg-config python3 python3-venv python3-pip python3-dev python-is-python3 default-libmysqlclient-dev libssl-dev zlib1g-dev

Install Java and Maven:

    sudo apt install -y openjdk-21-jdk maven

Verify:

    java -version
    mvn -version
    python3 --version

Start MySQL:

    sudo systemctl enable --now mysql

Run Django:

    cd django-backend
    python3.12 -m venv .venv
    source .venv/bin/activate

    pip install --upgrade pip
    pip install -r requirements.txt

    python manage.py migrate
    python manage.py runserver 0.0.0.0:8000

Run Spring Boot:

    cd spring-backend
    mvn clean spring-boot:run

Run Frontend:

    cd frontend
    npm install
    npm run dev

------------------------------------------------------------------------

# 6. macOS Setup

Install with Homebrew:

    brew update

    brew install mysql@8.4 mysql-client pkgconf zstd openssl@3 maven python
    brew install --cask temurin

Start MySQL:

    brew services start mysql@8.4

Run Django:

    cd django-backend

    python3 -m venv .venv
    source .venv/bin/activate

    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver

Run Spring Boot:

    cd spring-backend
    mvn clean spring-boot:run

Run Frontend:

    cd frontend
    npm install
    npm run dev

------------------------------------------------------------------------

# 7. Windows Setup

Install tools:

    winget install EclipseAdoptium.Temurin.25.JDK
    winget install Apache.Maven
    winget install Python.Python.3.13

Verify:

    java -version
    mvn -version
    py --version
    mysql --version

Run Django:

    cd C:\path\to\django-backend

    py -3.13 -m venv .venv
    .\.venv\Scripts\Activate.ps1

    pip install -r requirements.txt

    python manage.py migrate
    python manage.py runserver

Run Spring Boot:

    cd C:\path\to\spring-backend
    mvn clean spring-boot:run

Run Frontend:

    cd C:\path\to\frontend
    npm install
    npm run dev

------------------------------------------------------------------------

# 8. API Smoke Tests

Django:

    curl http://localhost:8000/api/books

Spring Boot:

    curl http://localhost:8080/api/books

Create a book:

    curl -X POST http://localhost:8080/api/books -H "Content-Type: application/json" -d '{"isbn":"9780132350884","title":"Clean Code","author":"Robert C. Martin","publishedYear":2008,"availableCopies":3}'

------------------------------------------------------------------------

# 9. Record Environment Versions

    mysql --version
    java -version
    mvn -version
    python --version
    pip --version

Ubuntu hardware snapshot:

    lscpu
    free -h
    lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL

------------------------------------------------------------------------

# 10. Notes

This repository is part of an **MSc Dissertation project at the
University of Hertfordshire** comparing **REST API performance between
Spring Boot and Django REST Framework** under identical database
conditions.
