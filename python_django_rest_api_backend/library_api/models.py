from django.db import models


class Book(models.Model):
    isbn = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=255, db_index=True)
    author = models.CharField(max_length=255)
    published_year = models.IntegerField(null=True, blank=True)
    available_copies = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "books"
        ordering = ["-id"]

    def __str__(self):
        return f"{self.title} ({self.isbn})"


class Member(models.Model):
    membership_no = models.CharField(max_length=30, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    joined_at = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "members"
        ordering = ["-id"]

    def __str__(self):
        return self.full_name


class Loan(models.Model):
    class LoanStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "ACTIVE"
        RETURNED = "RETURNED", "RETURNED"
        OVERDUE = "OVERDUE", "OVERDUE"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="loans")
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="loans")
    loan_date = models.DateField()
    due_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=LoanStatus.choices, default=LoanStatus.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "loans"
        ordering = ["-id"]
        indexes = [
            models.Index(fields=["book"]),
            models.Index(fields=["member"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Loan #{self.id}"
