from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "size"
    max_page_size = 200

    def get_paginated_response(self, data):
        return Response({
            "items": data,
            "page": self.page.number,
            "size": self.get_page_size(self.request),
            "total_items": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
        })
