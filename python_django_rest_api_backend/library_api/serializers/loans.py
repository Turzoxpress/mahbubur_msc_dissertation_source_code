from rest_framework import serializers

from library_api.models import Book, Loan, Member
from .books import BookNestedSerializer
from .members import MemberNestedSerializer


class LoanSerializer(serializers.ModelSerializer):
    book_id = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all(), source="book")
    member_id = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all(), source="member")

    class Meta:
        model = Loan
        fields = [
            "id",
            "book_id",
            "member_id",
            "loan_date",
            "due_date",
            "returned_date",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        loan_date = attrs.get("loan_date", getattr(self.instance, "loan_date", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        returned_date = attrs.get("returned_date", getattr(self.instance, "returned_date", None))

        if loan_date and due_date and due_date < loan_date:
            raise serializers.ValidationError({"due_date": "due_date cannot be earlier than loan_date"})
        if returned_date and loan_date and returned_date < loan_date:
            raise serializers.ValidationError({"returned_date": "returned_date cannot be earlier than loan_date"})
        return attrs


class CheckoutSerializer(serializers.Serializer):
    book_id = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all(), source="book")
    member_id = serializers.PrimaryKeyRelatedField(queryset=Member.objects.all(), source="member")
    loan_date = serializers.DateField()
    due_date = serializers.DateField()

    def validate(self, attrs):
        if attrs["due_date"] < attrs["loan_date"]:
            raise serializers.ValidationError({"due_date": "due_date cannot be earlier than loan_date"})
        return attrs


class RenewSerializer(serializers.Serializer):
    due_date = serializers.DateField(required=False)
    new_due_date = serializers.DateField(required=False, write_only=True)

    def validate(self, attrs):
        due_date = attrs.get("due_date") or attrs.get("new_due_date")
        if due_date is None:
            raise serializers.ValidationError({"due_date": "This field is required."})
        attrs["due_date"] = due_date
        attrs.pop("new_due_date", None)
        return attrs


class LoanExpandedSerializer(serializers.ModelSerializer):
    book_id = serializers.IntegerField(source="book.id", read_only=True)
    member_id = serializers.IntegerField(source="member.id", read_only=True)
    book = BookNestedSerializer(read_only=True)
    member = MemberNestedSerializer(read_only=True)

    class Meta:
        model = Loan
        fields = [
            "id",
            "book_id",
            "book",
            "member_id",
            "member",
            "loan_date",
            "due_date",
            "returned_date",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
