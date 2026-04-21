from __future__ import annotations

from datetime import date as dt_date

from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from library_api.controllers.base import BaseDetailController, BasePaginatedListCreateController
from library_api.pagination import StandardPagination
from library_api.serializers import CheckoutSerializer, LoanExpandedSerializer, LoanSerializer, RenewSerializer
from library_api.services import LoanService


class LoanListCreateController(BasePaginatedListCreateController):
    serializer_class = LoanSerializer
    service_class = LoanService


class LoanDetailController(BaseDetailController):
    serializer_class = LoanSerializer
    service_class = LoanService
    lookup_kwarg = "loan_id"


class LoanCheckoutController(APIView):
    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan = LoanService.checkout(serializer.validated_data)
        return Response(LoanSerializer(loan).data, status=status.HTTP_201_CREATED)


class LoanReturnController(APIView):
    def post(self, request, loan_id: int):
        loan = LoanService.return_loan(loan_id)
        return Response(LoanSerializer(loan).data)


class LoanRenewController(APIView):
    def post(self, request, loan_id: int):
        serializer = RenewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan = LoanService.renew_loan(loan_id, serializer.validated_data["due_date"])
        return Response(LoanSerializer(loan).data)


class LoanActiveController(APIView):
    def get(self, request):
        member_id = request.query_params.get("memberId")
        if member_id is not None:
            try:
                member_id_int = int(member_id)
            except ValueError as exc:
                raise ValidationError({"memberId": "memberId must be an integer"}) from exc
        else:
            member_id_int = None

        queryset = LoanService.active_queryset(member_id_int)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LoanSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class LoanOverdueController(APIView):
    def get(self, request):
        as_of_raw = request.query_params.get("asOf")
        if as_of_raw:
            try:
                as_of = dt_date.fromisoformat(as_of_raw)
            except ValueError as exc:
                raise ValidationError({"asOf": "Invalid asOf date. Use YYYY-MM-DD"}) from exc
        else:
            as_of = dt_date.today()

        queryset = LoanService.overdue_queryset(as_of)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LoanSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class LoanExpandedListController(APIView):
    def get(self, request):
        queryset = LoanService.list_queryset()
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = LoanExpandedSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class LoanExpandedDetailController(APIView):
    def get(self, request, loan_id: int):
        loan = LoanService.get(loan_id)
        return Response(LoanExpandedSerializer(loan).data)
