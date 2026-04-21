from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from library_api.pagination import StandardPagination


class BasePaginatedListCreateController(APIView):
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
        created = self.service_class.create(serializer.validated_data)
        return Response(self.serializer_class(created).data, status=status.HTTP_201_CREATED)


class BaseDetailController(APIView):
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
