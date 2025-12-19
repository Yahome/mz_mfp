"""调整导出/打印日志表 mz_mfp_export_log（支持批次导出）

Revision ID: 0005_export_log_alter
Revises: 0004_export_log_batch
Create Date: 2025-12-19

说明：
- 将 record_id 调整为可空：批量导出不绑定单条 record。
- 增加 detail JSON：用于记录 from/to、统计信息与失败原因上下文（注意脱敏）。
- 增加按类型/状态的时间索引：便于后台审计与问题排查。
"""

from __future__ import annotations

from alembic import op

revision = "0005_export_log_alter"
down_revision = "0004_export_log_batch"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # MySQL 8.0+ 支持 ADD COLUMN/ADD INDEX IF NOT EXISTS，用于避免重复执行报错
    op.execute(
        """
ALTER TABLE `mz_mfp_export_log`
  MODIFY COLUMN `record_id` bigint unsigned DEFAULT NULL COMMENT '关联mz_mfp_record.id（打印/单条导出时使用；批量导出可为空）',
  ADD COLUMN IF NOT EXISTS `detail` json DEFAULT NULL COMMENT '附加信息（JSON，需脱敏）' AFTER `error_message`,
  ADD INDEX IF NOT EXISTS `idx_type_time` (`export_type`, `created_at`),
  ADD INDEX IF NOT EXISTS `idx_status_time` (`status`, `created_at`);
"""
    )


def downgrade() -> None:
    op.execute(
        """
ALTER TABLE `mz_mfp_export_log`
  DROP INDEX IF EXISTS `idx_status_time`,
  DROP INDEX IF EXISTS `idx_type_time`,
  DROP COLUMN IF EXISTS `detail`,
  MODIFY COLUMN `record_id` bigint unsigned NOT NULL COMMENT '关联mz_mfp_record.id';
"""
    )

