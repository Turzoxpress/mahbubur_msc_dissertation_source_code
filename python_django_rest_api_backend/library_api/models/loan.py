from django.db import models

from .book import Book
from .member import Member


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
