from __future__ import annotations

import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path


def configure_logging() -> None:
    log_level_name = os.getenv(
        "LOG_LEVEL",
        "INFO",
    ).upper()

    log_level = getattr(
        logging,
        log_level_name,
        logging.INFO,
    )

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    root_logger = logging.getLogger()

    root_logger.setLevel(log_level)

    if root_logger.handlers:
        return

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)

    root_logger.addHandler(console_handler)

    log_directory = Path(
        os.getenv(
            "LOG_DIRECTORY",
            "logs",
        )
    )

    try:
        log_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        file_handler = RotatingFileHandler(
            log_directory / "stressintel.log",
            maxBytes=5 * 1024 * 1024,
            backupCount=3,
            encoding="utf-8",
        )

        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)

        root_logger.addHandler(file_handler)

    except OSError:
        root_logger.warning(
            "File logging could not be initialized."
        )


def get_logger(
    name: str,
) -> logging.Logger:
    return logging.getLogger(name)