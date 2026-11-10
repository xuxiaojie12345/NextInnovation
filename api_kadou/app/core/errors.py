"""统一业务错误码（单一真源：所有错误信息由后端唯一提供）"""

from numbers import Number
from re import match
from typing import Mapping

from fastapi import HTTPException

# HTTP 状态码 → 业务错误码 的映射（前端通过 code 精确区分错误）
STATUS_TO_CODE: Mapping[int, str] = {
    400: "KADOU_BAD_REQUEST",
    401: "AUTH_REQUIRED",
    403: "AUTH_FORBIDDEN",
    404: "KADOU_NOT_FOUND",
    409: "KADOU_CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMITED",
    500: "SYSTEM_ERROR",
    503: "MAINTENANCE",
}


def code_from_status(status: int) -> str:
    """HTTP 状态码 → 业务错误码（未知状态按 500 系归类）"""
    code = STATUS_TO_CODE.get(status)
    if code:
        return code
    return "SYSTEM_ERROR" if status >= 500 else "KADOU_BAD_REQUEST"


def BusinessException(code: Number, message: str, params: list[str] | None = None):
    match code:
        case 400:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={
                        "code": "KADOU_BAD_REQUEST",
                        "message": message,
                        "detail": "	business",
                        "params": params,
                    },
                )
            return HTTPException(
                status_code=code, detail={"code": "KADOU_BAD_REQUEST", "message": message, "detail": "business"}
            )
        case 401:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={"code": "AUTH_REQUIRED", "message": message, "detail": "auth", "params": params},
                )
            return HTTPException(
                status_code=code, detail={"code": "KADOU_BAD_REQUEST", "message": message, "detail": "auth"}
            )
        case 403:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={"code": "AUTH_FORBIDDEN", "message": message, "detail": "	forbidden", "params": params},
                )
            return HTTPException(
                status_code=code, detail={"code": "AUTH_FORBIDDEN", "message": message, "detail": "	forbidden"}
            )
        case 404:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={"code": "KADOU_NOT_FOUND", "message": message, "detail": "notFound", "params": params},
                )
            return HTTPException(
                status_code=code, detail={"code": "KADOU_NOT_FOUND", "message": message, "detail": "notFound"}
            )
        case 409:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={
                        "code": "KADOU_REFERENCE_IN_USE",
                        "message": message,
                        "detail": "business",
                        "params": params,
                    },
                )
            return HTTPException(
                status_code=code, detail={"code": "KADOU_REFERENCE_IN_USE", "message": message, "detail": "business"}
            )
        case 422:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={"code": "VALIDATION_ERROR", "message": message, "detail": "validation", "params": params},
                )
            return HTTPException(
                status_code=code, detail={"code": "VALIDATION_ERROR", "message": message, "detail": "validation"}
            )
        case 500:
            if params is not None:
                return HTTPException(
                    status_code=code,
                    detail={"code": "KADOU_BAD_REQUEST", "message": message, "detail": "auth", "params": params},
                )
            return HTTPException(
                status_code=code, detail={"code": "SYSTEM_ERROR", "message": message, "detail": "server"}
            )
