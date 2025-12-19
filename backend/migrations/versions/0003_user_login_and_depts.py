"""本地账号登录字段与多科室映射

Revision ID: 0003_user_login_and_depts
Revises: 0002_visit_index
Create Date: 2025-12-18
"""

from __future__ import annotations

from alembic import op

revision = "0003_user_login_and_depts"
down_revision = "0002_visit_index"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # MySQL 8.0+ 支持 ADD COLUMN/ADD INDEX IF NOT EXISTS，用于避免重复执行报错
    op.execute(
        """
ALTER TABLE `app_user`
  ADD COLUMN IF NOT EXISTS `login_name` varchar(50) DEFAULT NULL COMMENT '登录账号' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `password` varchar(200) DEFAULT NULL COMMENT '明文密码（临时）' AFTER `login_name`,
  ADD UNIQUE INDEX IF NOT EXISTS `uk_login_name` (`login_name`);
"""
    )

    op.execute(
        """
CREATE TABLE IF NOT EXISTS `app_user_dept` (
  `user_id` bigint unsigned NOT NULL,
  `dept_code` varchar(50) NOT NULL,
  PRIMARY KEY (`user_id`, `dept_code`),
  KEY `idx_dept_code` (`dept_code`),
  CONSTRAINT `fk_user_dept_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
"""
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS `app_user_dept`")
    op.execute(
        """
ALTER TABLE `app_user`
  DROP INDEX IF EXISTS `uk_login_name`,
  DROP COLUMN IF EXISTS `password`,
  DROP COLUMN IF EXISTS `login_name`;
"""
    )

