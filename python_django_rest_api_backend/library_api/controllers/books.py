from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from library_api.controllers.base import BaseDetailController, BasePaginatedListCreateController
from library_api.pagination import StandardPagination
from library_api.serializers import BookSerializer, StockUpdateSerializer
from library_api.services import BookService


class BookListCreateController(BasePaginatedListCreateController):
    serializer_class = BookSerializer
    service_class = BookService


class BookDetailController(BaseDetailController):
    serializer_class = BookSerializer
    service_class = BookService
    lookup_kwarg = "book_id"


class BookSearchController(APIView):
    def get(self, request):
        queryset = BookService.search_queryset(request.query_params.get("q", ""))
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = BookSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class BookByIsbnController(APIView):
    def get(self, request, isbn: str):
        book = BookService.get_by_isbn(isbn)
        return Response(BookSerializer(book).data)


class BookAvailableController(APIView):
    def get(self, request):
        queryset = BookService.available_queryset()
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = BookSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class BookBulkCreateController(APIView):
    def post(self, request):
        serializer = BookSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        created = BookService.bulk_create(serializer.validated_data)
        return Response(BookSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class BookStockUpdateController(APIView):
    def patch(self, request, book_id: int):
        serializer = StockUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        book = BookService.update_stock(book_id, serializer.validated_data["available_copies"])
        return Response(BookSerializer(book).data)
