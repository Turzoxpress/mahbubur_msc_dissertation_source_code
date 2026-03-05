from __future__ import annotations

from datetime import date as dt_date

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .pagination import StandardPagination
from .serializers import (
    BookSerializer,
    MemberSerializer,
    LoanSerializer,
    CheckoutSerializer,
    RenewSerializer,
    StockUpdateSerializer,
    LoanExpandedSerializer,
)
from .services import BookService, MemberService, LoanService, StatsService


class BasePaginatedListCreateView(APIView):
    serializer_class = None
    service_class = None

    def get(self, request):
        queryset = self.service_class.list_queryset()
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = self.serializer_class(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = self.service_class.create(serializer.validated_data)
        return Response(self.serializer_class(obj).data, status=status.HTTP_201_CREATED)


class BaseDetailView(APIView):
    serializer_class = None
    service_class = None
    lookup_kwarg = "pk"

    def get_object(self, kwargs):
        return self.service_class.get(kwargs[self.lookup_kwarg])

    def get(self, request, **kwargs):
        obj = self.get_object(kwargs)
        return Response(self.serializer_class(obj).data)

    def put(self, request, **kwargs):
        obj = self.get_object(kwargs)
        serializer = self.serializer_class(obj, data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = self.service_class.update(obj, serializer.validated_data)
        return Response(self.serializer_class(updated).data)

    def delete(self, request, **kwargs):
        obj = self.get_object(kwargs)
        self.service_class.delete(obj)
        return Response(status=status.HTTP_204_NO_CONTENT)


# -------------------------
# Core CRUD (existing)
# -------------------------
class BookListCreateAPIView(BasePaginatedListCreateView):
    serializer_class = BookSerializer
    service_class = BookService


class BookDetailAPIView(BaseDetailView):
    serializer_class = BookSerializer
    service_class = BookService
    lookup_kwarg = "book_id"


class MemberListCreateAPIView(BasePaginatedListCreateView):
    serializer_class = MemberSerializer
    service_class = MemberService


class MemberDetailAPIView(BaseDetailView):
    serializer_class = MemberSerializer
    service_class = MemberService
    lookup_kwarg = "member_id"


class LoanListCreateAPIView(BasePaginatedListCreateView):
    serializer_class = LoanSerializer
    service_class = LoanService


class LoanDetailAPIView(BaseDetailView):
    serializer_class = LoanSerializer
    service_class = LoanService
    lookup_kwarg = "loan_id"


# -------------------------
# Utility APIs
# -------------------------
class PingAPIView(APIView):
    def get(self, request):
        return Response({"status": "ok", "timestamp": timezone.now().isoformat()})


class StatsAPIView(APIView):
    def get(self, request):
        return Response(StatsService.get_stats())


# -------------------------
# Book extra APIs
# -------------------------
class BookSearchAPIView(APIView):
    def get(self, request):
        q = request.query_params.get("q", "")
        queryset = BookService.search_queryset(q)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = BookSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class BookByIsbnAPIView(APIView):
    def get(self, request, isbn: str):
        book = BookService.get_by_isbn(isbn)
        return Response(BookSerializer(book).data)


class BookAvailableAPIView(APIView):
    def get(self, request):
        queryset = BookService.available_queryset()
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = BookSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class BookBulkCreateAPIView(APIView):
    def post(self, request):
        serializer = BookSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        created = BookService.bulk_create(serializer.validated_data)
        return Response(BookSerializer(created, many=True).data, status=status.HTTP_201_CREATED)


class BookStockUpdateAPIView(APIView):
    def patch(self, request, book_id: int):
        serializer = StockUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        book = BookService.update_stock(book_id, serializer.validated_data["available_copies"])
        return Response(BookSerializer(book).data)


# -------------------------
# Member extra APIs
# -------------------------
class MemberSearchAPIView(APIView):
    def get(self, request):
        q = request.query_params.get("q", "")
        queryset = MemberService.search_queryset(q)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = MemberSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class MemberByMembershipAPIView(APIView):
    def get(self, request, membership_no: str):
        member = MemberService.get_by_membership_no(membership_no)
        return Response(MemberSerializer(member).data)


# -------------------------
# Loan operation APIs
# -------------------------
class LoanCheckoutAPIView(APIView):
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan = LoanService.checkout(serializer.validated_data)
        return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)


class LoanReturnAPIView(APIView):
    def post(self, request, loan_id: int):
        loan = LoanService.return_loan(loan_id)
        return Response(LoanSerializer(loan).data)


class LoanRenewAPIView(APIView):
    def post(self, request, loan_id: int):
        serializer = RenewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan = LoanService.renew_loan(loan_id, serializer.validated_data["due_date"])
        return Response(LoanSerializer(loan).data)


class LoanActiveAPIView(APIView):
    def get(self, request):
        member_id = request.query_params.get("memberId")
        member_id_int = int(member_id) if member_id is not None else None

        queryset = LoanService.active_queryset(member_id_int)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LoanSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class LoanOverdueAPIView(APIView):
    def get(self, request):
        as_of_raw = request.query_params.get("asOf")
        if as_of_raw:
            try:
                as_of = dt_date.fromisoformat(as_of_raw)
            except ValueError:
                return Response(
                    {"status": 400, "error": "BAD_REQUEST", "message": "Invalid asOf date. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            as_of = dt_date.today()

        queryset = LoanService.overdue_queryset(as_of)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LoanSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


# -------------------------
# Serialization-heavy (expanded) APIs
# -------------------------
class LoanExpandedListAPIView(APIView):
    def get(self, request):
        queryset = LoanService.list_queryset()
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LoanExpandedSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class LoanExpandedDetailAPIView(APIView):
    def get(self, request, loan_id: int):
        loan = LoanService.get(loan_id)
        return Response(LoanExpandedSerializer(loan).data)
