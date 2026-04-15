from __future__ import annotations

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from library_api.exceptions import DuplicateResourceException
from library_api.models import Book


class BookService:
    @staticmethod
    def list_queryset():
        return Book.objects.all().order_by("-id")

    @staticmethod
    def available_queryset():
        return Book.objects.filter(available_copies__gt=0).order_by("-id")

    @staticmethod
    def search_queryset(q: str):
        q = (q or "").strip()
        if not q:
            return BookService.list_queryset()
        return Book.objects.filter(Q(title__icontains=q) | Q(author__icontains=q)).order_by("-id")

    @staticmethod
    def get(book_id: int) -> Book:
        return get_object_or_404(Book, pk=book_id)

    @staticmethod
    def get_by_isbn(isbn: str) -> Book:
        return get_object_or_404(Book, isbn=isbn)

    @staticmethod
    @transaction.atomic
    def create(validated_data: dict) -> Book:
        if Book.objects.filter(isbn=validated_data["isbn"]).exists():
            raise DuplicateResourceException("Book ISBN already exists")
        try:
            return Book.objects.create(**validated_data)
        except IntegrityError as exc:
            raise DuplicateResourceException("Book ISBN already exists") from exc

    @staticmethod
    @transaction.atomic
    def bulk_create(validated_list: list[dict]) -> list[Book]:
        created: list[Book] = []
        seen: set[str] = set()
        for data in validated_list:
            isbn = (data.get("isbn") or "").strip()
            if isbn in seen:
                raise DuplicateResourceException(f"Duplicate ISBN in bulk request: {isbn}")
            seen.add(isbn)
            if Book.objects.filter(isbn=isbn).exists():
                raise DuplicateResourceException("Book ISBN already exists")

        for data in validated_list:
            created.append(Book.objects.create(**data))
        return created

    @staticmethod
    @transaction.atomic
    def update(instance: Book, validated_data: dict) -> Book:
        isbn = validated_data.get("isbn", instance.isbn)
        if Book.objects.filter(isbn=isbn).exclude(pk=instance.pk).exists():
            raise DuplicateResourceException("Book ISBN already exists")
        for field, value in validated_data.items():
            setattr(instance, field, value)
        try:
            instance.save()
        except IntegrityError as exc:
            raise DuplicateResourceException("Book ISBN already exists") from exc
        return instance

    @staticmethod
    @transaction.atomic
    def update_stock(book_id: int, available_copies: int) -> Book:
        book = Book.objects.select_for_update().get(pk=book_id)
        book.available_copies = int(available_copies)
        book.save(update_fields=["available_copies"])
        return book

    @staticmethod
    @transaction.atomic
    def delete(instance: Book):
        instance.delete()
