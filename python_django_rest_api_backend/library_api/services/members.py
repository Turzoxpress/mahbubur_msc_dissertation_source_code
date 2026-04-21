from __future__ import annotations

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from library_api.exceptions import DuplicateResourceException
from library_api.models import Member


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
        if Member.objects.filter(membership_no=validated_data["membership_no"]).exists():
            raise DuplicateResourceException("Membership number already exists")
        if Member.objects.filter(email=validated_data["email"]).exists():
            raise DuplicateResourceException("Email already exists")
        try:
            return Member.objects.create(**validated_data)
        except IntegrityError as exc:
            raise DuplicateResourceException("Membership number already exists") from exc

    @staticmethod
    @transaction.atomic
    def update(instance: Member, validated_data: dict) -> Member:
        membership_no = validated_data.get("membership_no", instance.membership_no)
        email = validated_data.get("email", instance.email)
        if Member.objects.filter(membership_no=membership_no).exclude(pk=instance.pk).exists():
            raise DuplicateResourceException("Membership number already exists")
        if Member.objects.filter(email=email).exclude(pk=instance.pk).exists():
            raise DuplicateResourceException("Email already exists")
        for field, value in validated_data.items():
            setattr(instance, field, value)
        try:
            instance.save()
        except IntegrityError as exc:
            raise DuplicateResourceException("Membership number already exists") from exc
        return instance

    @staticmethod
    @transaction.atomic
    def delete(instance: Member):
        instance.delete()
