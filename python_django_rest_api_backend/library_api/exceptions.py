from datetime import datetime, timezone
from http import HTTPStatus

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


class DuplicateResourceException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Duplicate resource"
    default_code = "conflict"


class BadRequestException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Bad request"
    default_code = "bad_request"


class ApiNotFoundException(APIException):
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = "Resource not found"
    default_code = "not_found"


def _status_name(code: int) -> str:
    try:
        return HTTPStatus(code).name
    except ValueError:
        return "SERVER_ERROR" if code >= 500 else "BAD_REQUEST"


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    body = {
        "timestamp": _timestamp(),
        "status": response.status_code,
        "error": _status_name(response.status_code),
        "message": "Request failed",
    }

    data = response.data
    if isinstance(data, dict):
        if response.status_code == 400 and "detail" not in data:
            body["message"] = "Validation failed"
            body["validation_errors"] = data
        elif "detail" in data:
            body["message"] = str(data["detail"])
            extra = {k: v for k, v in data.items() if k != "detail"}
            if extra:
                body["validation_errors"] = extra
        else:
            body["message"] = "Validation failed" if response.status_code == 400 else body["message"]
            body["validation_errors"] = data
    else:
        body["message"] = str(data)

    response.data = body
    return response
