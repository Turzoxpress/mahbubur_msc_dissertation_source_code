from rest_framework.response import Response
from rest_framework.views import APIView

from library_api.controllers.base import BaseDetailController, BasePaginatedListCreateController
from library_api.pagination import StandardPagination
from library_api.serializers import MemberSerializer
from library_api.services import MemberService


class MemberListCreateController(BasePaginatedListCreateController):
    serializer_class = MemberSerializer
    service_class = MemberService


class MemberDetailController(BaseDetailController):
    serializer_class = MemberSerializer
    service_class = MemberService
    lookup_kwarg = "member_id"


class MemberSearchController(APIView):
    def get(self, request):
        queryset = MemberService.search_queryset(request.query_params.get("q", ""))
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = MemberSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class MemberByMembershipController(APIView):
    def get(self, request, membership_no: str):
        member = MemberService.get_by_membership_no(membership_no)
        return Response(MemberSerializer(member).data)
