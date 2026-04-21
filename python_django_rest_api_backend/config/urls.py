from django.urls import include, path

urlpatterns = [
    path("api/", include("library_api.api.urls")),
]
