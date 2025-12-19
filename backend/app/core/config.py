from functools import lru_cache
from typing import Literal, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "mz_mfp"
    app_env: str = "dev"
    log_level: str = "INFO"

    mysql_dsn: str = Field(
        default="mysql+pymysql://user:pass@localhost:3306/mz_mfp?charset=utf8mb4",
        description="业务库连接串，使用 InnoDB/utf8mb4",
    )
    external_sqlserver_dsn: Optional[str] = Field(
        default=None, description="HIS 视图 SQL Server 只读 DSN（可选）"
    )
    external_oracle_dsn: Optional[str] = Field(
        default=None, description="HIS 视图 Oracle 只读 DSN（可选）"
    )

    signature_secret: str = Field(default="change-me", description="HIS 直跳验签密钥")
    signature_algo: Literal["hmac_sha256", "sha256_concat"] = "hmac_sha256"
    signature_window_seconds: int = 300
    allow_unsigned_his_jump: bool = False
    session_ttl_minutes: int = 60
    timezone: str = "Asia/Shanghai"

    request_timeout_seconds: int = 15


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
