"""用户字典偏好：最近使用 + 收藏常用

Revision ID: 0006_dict_user_prefs
Revises: 0005_export_log_alter
Create Date: 2025-12-25

说明：
- dict_user_recent：记录用户最近选择过的字典项（按 updated_at 倒序作为最近使用时间）。
- dict_user_favorite：记录用户收藏的常用字典项（按 updated_at 倒序作为收藏更新时间）。
- user_code 使用会话中的 doc_code（HIS 直跳与账号登录均稳定存在）。
"""

from __future__ import annotations

from alembic import op

revision = "0006_dict_user_prefs"
down_revision = "0005_export_log_alter"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
CREATE TABLE IF NOT EXISTS `dict_user_recent` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_code` varchar(50) NOT NULL COMMENT '会话 doc_code',
  `set_code` varchar(50) NOT NULL COMMENT '字典集编码',
  `code` varchar(50) NOT NULL COMMENT '字典项编码',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_set_code_recent` (`user_code`, `set_code`, `code`),
  KEY `idx_user_set_time_recent` (`user_code`, `set_code`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
"""
    )

    op.execute(
        """
CREATE TABLE IF NOT EXISTS `dict_user_favorite` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_code` varchar(50) NOT NULL COMMENT '会话 doc_code',
  `set_code` varchar(50) NOT NULL COMMENT '字典集编码',
  `code` varchar(50) NOT NULL COMMENT '字典项编码',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_set_code_favorite` (`user_code`, `set_code`, `code`),
  KEY `idx_user_set_time_favorite` (`user_code`, `set_code`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
"""
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS `dict_user_favorite`")
    op.execute("DROP TABLE IF EXISTS `dict_user_recent`")

