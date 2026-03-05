from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    body = {
        "status": response.status_code,
        "error": "BAD_REQUEST" if response.status_code < 500 else "SERVER_ERROR",
        "message": "Request failed",
    }

    # Preserve useful validation details if present
    if isinstance(response.data, dict):
        if "detail" in response.data:
            body["message"] = str(response.data["detail"])
        else:
            body["message"] = "Validation failed" if response.status_code == 400 else body["message"]
            body["validation_errors"] = response.data
    else:
        body["message"] = str(response.data)

    response.data = body
    return response
