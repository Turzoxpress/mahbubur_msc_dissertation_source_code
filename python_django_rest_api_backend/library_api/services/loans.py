from __future__ import annotations

from datetime import date as dt_date

from django.db import transaction
from django.shortcuts import get_object_or_404

from library_api.exceptions import BadRequestException
from library_api.models import Book, Loan, Member


class LoanService:
    @staticmethod
    def list_queryset():
        return Loan.objects.select_related("book", "member").all().order_by("-id")

    @staticmethod
    def get(loan_id: int) -> Loan:
        return get_object_or_404(Loan.objects.select_related("book", "member"), pk=loan_id)

    @staticmethod
    def active_queryset(member_id: int | None = None):
        queryset = Loan.objects.select_related("book", "member").filter(
            returned_date__isnull=True,
            status=Loan.LoanStatus.ACTIVE,
        )
        if member_id is not None:
            queryset = queryset.filter(member_id=member_id)
        return queryset.order_by("-id")

    @staticmethod
    @transaction.atomic
    def overdue_queryset(as_of: dt_date):
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

        book_locked = Book.objects.select_for_update().get(pk=book.pk)
        if book_locked.available_copies <= 0:
            raise BadRequestException(f"No available copies for book: {book_locked.pk}")

        if due_date < loan_date:
            raise BadRequestException("due_date cannot be earlier than loan_date")

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
            raise BadRequestException("Loan already returned")

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
            raise BadRequestException("Cannot renew a returned loan")

        if new_due_date < loan.loan_date:
            raise BadRequestException("due_date cannot be earlier than loan_date")

        loan.due_date = new_due_date

        if loan.status == Loan.LoanStatus.OVERDUE and new_due_date >= dt_date.today():
            loan.status = Loan.LoanStatus.ACTIVE

        loan.save(update_fields=["due_date", "status"])
        return loan
