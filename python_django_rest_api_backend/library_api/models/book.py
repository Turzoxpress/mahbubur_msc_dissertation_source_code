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
