"""统一业务错误码（单一真源：所有错误信息由后端唯一提供）"""
from typing import Mapping

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