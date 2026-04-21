from django.db import models


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
