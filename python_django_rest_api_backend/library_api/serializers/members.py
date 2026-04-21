from rest_framework import serializers

from library_api.models import Member


class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = [
            "id",
            "membership_no",
            "full_name",
            "email",
            "joined_at",
            "created_at",
        ]
        read_only_fields = ["id", "joined_at", "created_at"]


class MemberNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = ["id", "membership_no", "full_name", "email", "joined_at", "created_at"]
