from __future__ import annotations

from datetime import date as dt_date
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError

from .models import Book, Member, Loan


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
        return Book.objects.filter(title__icontains=q).order_by("-id")

    @staticmethod
    def get(book_id: int) -> Book:
        return get_object_or_404(Book, pk=book_id)

    @staticmethod
    def get_by_isbn(isbn: str) -> Book:
        return get_object_or_404(Book, isbn=isbn)

    @staticmethod
    @transaction.atomic
    def create(validated_data: dict) -> Book:
        try:
            return Book.objects.create(**validated_data)
        except IntegrityError as e:
            raise ValidationError({"isbn": "Book with this ISBN already exists"}) from e

    @staticmethod
    @transaction.atomic
    def bulk_create(validated_list: list[dict]) -> list[Book]:
        created: list[Book] = []
        try:
            for data in validated_list:
                created.append(Book.objects.create(**data))
        except IntegrityError as e:
            raise ValidationError({"detail": "Bulk create failed due to duplicate/invalid data"}) from e
        return created

    @staticmethod
    @transaction.atomic
    def update(instance: Book, validated_data: dict) -> Book:
        for field, value in validated_data.items():
            setattr(instance, field, value)
        try:
            instance.save()
        except IntegrityError as e:
            raise ValidationError({"isbn": "Book with this ISBN already exists"}) from e
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


class MemberService:
    @staticmethod
    def list_queryset():
        return Member.objects.all().order_by("-id")

    @staticmethod
    def search_queryset(q: str):
        q = (q or "").strip()
        if not q:
            return MemberService.list_queryset()
        return Member.objects.filter(
            Q(full_name__icontains=q) | Q(membership_no__icontains=q) | Q(email__icontains=q)
        ).order_by("-id")

    @staticmethod
    def get(member_id: int) -> Member:
        return get_object_or_404(Member, pk=member_id)

    @staticmethod
    def get_by_membership_no(membership_no: str) -> Member:
        return get_object_or_404(Member, membership_no=membership_no)

    @staticmethod
    @transaction.atomic
    def create(validated_data: dict) -> Member:
        try:
            return Member.objects.create(**validated_data)
        except IntegrityError as e:
            raise ValidationError({"detail": "Duplicate membership_no or email"}) from e

    @staticmethod
    @transaction.atomic
    def update(instance: Member, validated_data: dict) -> Member:
        for field, value in validated_data.items():
            setattr(instance, field, value)
        try:
            instance.save()
        except IntegrityError as e:
            raise ValidationError({"detail": "Duplicate membership_no or email"}) from e
        return instance

    @staticmethod
    @transaction.atomic
    def delete(instance: Member):
        instance.delete()


class LoanService:
    @staticmethod
    def list_queryset():
        return Loan.objects.select_related("book", "member").all().order_by("-id")

    @staticmethod
    def get(loan_id: int) -> Loan:
        return get_object_or_404(Loan.objects.select_related("book", "member"), pk=loan_id)

    @staticmethod
    def active_queryset(member_id: int | None = None):
        qs = Loan.objects.select_related("book", "member").filter(
            returned_date__isnull=True,
            status=Loan.LoanStatus.ACTIVE,
        )
        if member_id is not None:
            qs = qs.filter(member_id=member_id)
        return qs.order_by("-id")

    @staticmethod
    @transaction.atomic
    def overdue_queryset(as_of: dt_date):
        # Mark ACTIVE loans as OVERDUE if past due
        Loan.objects.filter(
            returned_date__isnull=True,
            status=Loan.LoanStatus.ACTIVE,
            due_date__lt=as_of,
        ).update(status=Loan.LoanStatus.OVERDUE)

        return Loan.objects.select_related("book", "member").filter(
            returned_date__isnull=True,
            status=Loan.LoanStatus.OVERDUE,
            due_date__lt=as_of,
        ).order_by("-id")

    @staticmethod
    @transaction.atomic
    def create(validated_data: dict) -> Loan:
        return Loan.objects.create(**validated_data)

    @staticmethod
    @transaction.atomic
    def update(instance: Loan, validated_data: dict) -> Loan:
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance

    @staticmethod
    @transaction.atomic
    def delete(instance: Loan):
        instance.delete()

    @staticmethod
    @transaction.atomic
    def checkout(validated_data: dict) -> Loan:
        book: Book = validated_data["book"]
        member: Member = validated_data["member"]
        loan_date = validated_data["loan_date"]
        due_date = validated_data["due_date"]

        # lock book row to prevent race conditions in stock
        book_locked = Book.objects.select_for_update().get(pk=book.pk)
        if book_locked.available_copies <= 0:
            raise ValidationError({"available_copies": "No available copies for this book"})

        if due_date < loan_date:
            raise ValidationError({"due_date": "due_date cannot be earlier than loan_date"})

        book_locked.available_copies = book_locked.available_copies - 1
        book_locked.save(update_fields=["available_copies"])

        return Loan.objects.create(
            book=book_locked,
            member=member,
            loan_date=loan_date,
            due_date=due_date,
            returned_date=None,
            status=Loan.LoanStatus.ACTIVE,
        )

    @staticmethod
    @transaction.atomic
    def return_loan(loan_id: int) -> Loan:
        loan = Loan.objects.select_related("book", "member").select_for_update().get(pk=loan_id)

        if loan.status == Loan.LoanStatus.RETURNED:
            raise ValidationError({"status": "Loan already returned"})

        book_locked = Book.objects.select_for_update().get(pk=loan.book_id)
        book_locked.available_copies = book_locked.available_copies + 1
        book_locked.save(update_fields=["available_copies"])

        loan.status = Loan.LoanStatus.RETURNED
        loan.returned_date = dt_date.today()
        loan.save(update_fields=["status", "returned_date"])
        return loan

    @staticmethod
    @transaction.atomic
    def renew_loan(loan_id: int, new_due_date: dt_date) -> Loan:
        loan = Loan.objects.select_related("book", "member").select_for_update().get(pk=loan_id)

        if loan.status == Loan.LoanStatus.RETURNED:
            raise ValidationError({"status": "Cannot renew a returned loan"})

        if new_due_date < loan.loan_date:
            raise ValidationError({"due_date": "due_date cannot be earlier than loan_date"})

        loan.due_date = new_due_date

        # if previously overdue but renewed to future, flip back to ACTIVE
        if loan.status == Loan.LoanStatus.OVERDUE and new_due_date >= dt_date.today():
            loan.status = Loan.LoanStatus.ACTIVE

        loan.save(update_fields=["due_date", "status"])
        return loan


class StatsService:
    @staticmethod
    def get_stats():
        total_books = Book.objects.count()
        available_books = Book.objects.filter(available_copies__gt=0).count()
        total_members = Member.objects.count()
        total_loans = Loan.objects.count()
        active_loans = Loan.objects.filter(status=Loan.LoanStatus.ACTIVE, returned_date__isnull=True).count()
        overdue_loans = Loan.objects.filter(status=Loan.LoanStatus.OVERDUE, returned_date__isnull=True).count()

        return {
            "total_books": total_books,
            "available_books": available_books,
            "total_members": total_members,
            "total_loans": total_loans,
            "active_loans": active_loans,
            "overdue_loans": overdue_loans,
        }
