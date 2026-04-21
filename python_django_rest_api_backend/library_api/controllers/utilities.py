from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from library_api.services import StatsService


class PingController(APIView):
    def get(self, request):
        return Response({"status": "ok", "timestamp": timezone.now().isoformat()})


class StatsController(APIView):
    def get(self, request):
        return Response(StatsService.get_stats())
