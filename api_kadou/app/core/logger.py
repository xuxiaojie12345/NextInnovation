"""日志模块：控制台 + 滚动文件双输出，trace_id 通过 contextvars 在请求周期内传递。"""
import logging
import sys
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path

# 日志格式：时间 | 级别 | trace_id | logger名 | 消息
LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(trace_id)s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# 请求级 trace_id（由中间件设置，默认 no-trace）
trace_id_var: ContextVar[str] = ContextVar("trace_id", default="no-trace")


class TraceIdFilter(logging.Filter):
    """从 contextvars 读取 trace_id，注入到每条日志记录。"""

    def filter(self, record: logging.LogRecord) -> bool:
        record.trace_id = trace_id_var.get()
        return True


_configured = False


def setup_logging(log_level: str = "INFO", log_dir: str = "logs") -> None:
    """初始化日志（幂等，应用启动时调用一次即可）。

    - 控制台：全部级别
    - logs/app.log：全部级别（滚动，单文件 10MB，保留 10 个）
    - logs/error.log：仅 ERROR 及以上（滚动）
    """
    global _configured
    if _configured:
        return
    _configured = True

    log_dir_path = Path(log_dir)
    log_dir_path.mkdir(parents=True, exist_ok=True)

    level = getattr(logging, str(log_level).upper(), logging.INFO)

    root = logging.getLogger()
    root.setLevel(level)
    # 清空可能残留的 handler，避免重复输出
    for handler in root.handlers[:]:
        root.removeHandler(handler)

    # Windows 控制台默认编码可能是 cp932/gbk，遇到无法编码的字符会抛
    # UnicodeEncodeError 导致日志输出中断。统一改为 UTF-8（无法编码时替换）。
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
    trace_filter = TraceIdFilter()

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    console_handler.addFilter(trace_filter)

    file_handler = RotatingFileHandler(
        log_dir_path / "app.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding="utf-8",
    )
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    file_handler.addFilter(trace_filter)

    error_handler = RotatingFileHandler(
        log_dir_path / "error.log",
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    error_handler.addFilter(trace_filter)

    root.addHandler(console_handler)
    root.addHandler(file_handler)
    root.addHandler(error_handler)


def get_logger(name: str) -> logging.Logger:
    """获取 logger（trace_id 由 handler 上的 filter 自动注入）。

    业务层统一使用：
        from app.core.logger import get_logger
        logger = get_logger(__name__)
        logger.info("...")
    """
    return logging.getLogger(name)


# 日志中需要掩码的敏感字段关键字（包含匹配）
SENSITIVE_KEYWORDS = (
    "password",
    "passwd",
    "pwd",
    "secret",
    "token",
    "authorization",
    "cookie",
    "session",
)

MASK = "***"


def mask_sensitive(data):
    """返回掩码后的副本，用于安全地输出请求体 / SQL 参数等。

    - dict：命中敏感关键字的键值替换为 ***（递归处理嵌套结构）
    - list / tuple：逐个元素递归处理
    - 其他类型：原样返回
    """
    if isinstance(data, dict):
        masked = {}
        for key, value in data.items():
            if any(word in str(key).lower() for word in SENSITIVE_KEYWORDS):
                masked[key] = MASK
            else:
                masked[key] = mask_sensitive(value)
        return masked
    if isinstance(data, (list, tuple)):
        return [mask_sensitive(item) for item in data]
    return data
