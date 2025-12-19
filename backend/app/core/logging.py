import logging
import logging.config
from typing import Any, Dict

from .config import get_settings


def _base_config(level: str) -> Dict[str, Any]:
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "level": level,
            }
        },
        "loggers": {
            "uvicorn": {"handlers": ["console"], "level": level, "propagate": False},
            "uvicorn.access": {
                "handlers": ["console"],
                "level": "INFO",
                "propagate": False,
            },
        },
        "root": {"handlers": ["console"], "level": level},
    }


def setup_logging() -> None:
    level = get_settings().log_level.upper()
    logging.config.dictConfig(_base_config(level))
