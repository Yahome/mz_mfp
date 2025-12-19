"""新增导出/打印日志表（支持批次导出）

Revision ID: 0004_export_log_batch
Revises: 0003_user_login_and_depts
Create Date: 2025-12-19

说明：
- 允许 record_id 为空：用于记录“批量导出”这种与单条 record 不强绑定的操作尝试。
- detail 字段用于记录 from/to、统计信息与失败原因上下文（注意脱敏）。
"""

from __future__ import annotations

from alembic import op

revision = "0004_export_log_batch"
down_revision = "0003_user_login_and_depts"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
CREATE TABLE IF NOT EXISTS `mz_mfp_export_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `record_id` bigint unsigned DEFAULT NULL COMMENT '关联mz_mfp_record.id（打印/单条导出时使用；批量导出可为空）',
  `export_type` varchar(20) NOT NULL COMMENT 'xlsx/print',
  `file_name` varchar(200) DEFAULT NULL COMMENT '文件名（如为xlsx）',
  `file_path` varchar(500) DEFAULT NULL COMMENT '文件路径/对象存储key（如有）',
  `status` varchar(20) NOT NULL COMMENT 'success/failed',
  `error_message` text COMMENT '失败原因（需脱敏）',
  `detail` json DEFAULT NULL COMMENT '附加信息（JSON，需脱敏）',
  `created_by` varchar(50) NOT NULL COMMENT '操作人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_record_time` (`record_id`, `created_at`),
  KEY `idx_type_time` (`export_type`, `created_at`),
  KEY `idx_status_time` (`status`, `created_at`),
  CONSTRAINT `fk_export_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
"""
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS `mz_mfp_export_log`")

