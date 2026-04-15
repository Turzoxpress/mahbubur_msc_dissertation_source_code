from rest_framework import serializers

from library_api.models import Book


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            "id",
            "isbn",
            "title",
            "author",
            "published_year",
            "available_copies",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BookNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = ["id", "isbn", "title", "author", "published_year", "available_copies", "created_at"]


class StockUpdateSerializer(serializers.Serializer):
    available_copies = serializers.IntegerField(min_value=0)
