import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logger import get_logger, setup_logging, trace_id_var
from app.core.settings import BaseSettings
from app.api.login import router as api_v1_router
from app.api.yearSelect import router as year_router
from app.api.department import router as kadou_router
from app.api.personnel import router as personnel_router
from app.api.project import router as project_router
from app.api.holiday import router as holiday_router
from app.core.settings import settings


# 启动时初始化日志（幂等：控制台 + logs/app.log + logs/error.log）
setup_logging(settings.LOG_LEVEL, settings.LOG_DIR)
logger = get_logger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("アプリケーション起動：DB 初期化が完了しました")
    yield
    logger.info("アプリケーション終了")


app = FastAPI(title="React-FastAPI-MySQL バックエンド", lifespan=lifespan)

# 跨域配置（允许React前端访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def trace_log_middleware(request: Request, call_next):
    """给每个请求分配 trace_id，记录请求开始/结束与耗时，响应头返回 X-Trace-Id。"""
    trace_id = str(uuid.uuid4())
    token = trace_id_var.set(trace_id)
    request.state.trace_id = trace_id
    start = time.perf_counter()
    logger.info(
        "リクエスト受付: method=%s path=%s client=%s",
        request.method, request.url.path, request.client,
    )
    try:
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Trace-Id"] = trace_id
        logger.info(
            "リクエスト終了: method=%s path=%s status=%s elapsed=%.1fms",
            request.method, request.url.path, response.status_code, elapsed_ms,
        )
        return response
    finally:
        trace_id_var.reset(token)


# ---- 全局异常处理（记录日志并返回统一 JSON，携带 trace_id） ----

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(
        "HTTPエラー: method=%s path=%s status=%s detail=%s",
        request.method, request.url.path, exc.status_code, exc.detail,
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": str(exc.detail),
            "trace_id": getattr(request.state, "trace_id", "no-trace"),
        },
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(
        "リクエスト検証エラー: method=%s path=%s errors=%s",
        request.method, request.url.path, exc.errors(),
    )
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "trace_id": getattr(request.state, "trace_id", "no-trace"),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # 该 handler 由 ServerErrorMiddleware 在请求上下文之外调用，
    # contextvars 中的 trace_id 已被中间件重置，这里根据 request.state 重新设置。
    trace_id = getattr(request.state, "trace_id", "no-trace")
    token = trace_id_var.set(trace_id)
    try:
        logger.error(
            "未処理例外: method=%s path=%s error=%s",
            request.method, request.url.path, exc,
            exc_info=True,
        )
    finally:
        trace_id_var.reset(token)
    return JSONResponse(
        status_code=500,
        content={"code": 500, "msg": "サーバー内部エラー", "trace_id": trace_id},
        headers={"X-Trace-Id": trace_id},
    )
    

# ---- 前端日志上报接口：前端报错通过此接口传给后端落日志 ----

class FrontLogItem(BaseModel):
    level: str = "info"  # error / warn / info
    message: str
    stack: str = ""
    url: str = ""
    user_agent: str = ""
    trace_id: str = ""


@app.post("/api/front-log")
async def receive_front_log(item: FrontLogItem, request: Request):
    front_logger = get_logger("front")
    backend_trace_id = getattr(request.state, "trace_id", "no-trace")
    if item.level == "error":
        front_logger.error(
            "【前端报错】msg=%s stack=%s pageUrl=%s ua=%s front_trace_id=%s backend_trace_id=%s",
            item.message, item.stack, item.url, item.user_agent, item.trace_id, backend_trace_id,
        )
    elif item.level == "warn":
        front_logger.warning(
            "【前端警告】msg=%s pageUrl=%s front_trace_id=%s",
            item.message, item.url, item.trace_id,
        )
    else:
        front_logger.info(
            "【前端日志】msg=%s pageUrl=%s front_trace_id=%s",
            item.message, item.url, item.trace_id,
        )
    return {"code": 200, "msg": "ok"}


# 注册路由
app.include_router(api_v1_router)
app.include_router(year_router)
app.include_router(kadou_router)
app.include_router(personnel_router)
app.include_router(project_router)
app.include_router(holiday_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "env": settings.APP_ENV}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.SERVER_HOST,
        port=settings.SERVER_PORT,
        reload=True,
    )
