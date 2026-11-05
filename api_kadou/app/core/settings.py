from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseSettings):
    APP_ENV: str = os.getenv("APP_ENV", "dev")
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", 8000))

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_DIR: str = os.getenv("LOG_DIR", "logs")
    # true 时输出 SQLAlchemy 执行的 SQL（建议仅开发环境开启）
    LOG_SQL: bool = os.getenv("LOG_SQL", "false").lower() in (
        "1",
        "true",
        "yes",
        "on",
    )

    DB_HOST: str = os.getenv("DB_HOST", "172.17.0.63")
    DB_PORT: int = int(os.getenv("DB_PORT", 3306))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASS: str = os.getenv("DB_PASS", "1234")
    DB_NAME: str = os.getenv("DB_NAME", "kadou_t3")


settings = Settings()
