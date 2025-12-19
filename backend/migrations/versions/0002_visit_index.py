"""新增本地就诊索引表 mz_mfp_visit_index

Revision ID: 0002_visit_index
Revises: 0001_core_tables
Create Date: 2025-12-17
"""

from __future__ import annotations

from alembic import op

revision = "0002_visit_index"
down_revision = "0001_core_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
CREATE TABLE IF NOT EXISTS `mz_mfp_visit_index` (
  `patient_no` varchar(50) NOT NULL COMMENT '病历号/就诊标识（=blh）',
  `visit_time` datetime NOT NULL COMMENT '就诊时间（JZSJ）',
  `dept_code` varchar(50) DEFAULT NULL COMMENT '就诊科室代码（来自外部视图）',
  `doc_code` varchar(50) DEFAULT NULL COMMENT '接诊医生代码（来自外部视图）',
  `xm` varchar(100) DEFAULT NULL COMMENT '姓名（XM）',
  `jzks` varchar(100) DEFAULT NULL COMMENT '就诊科室名称（JZKS）',
  `jzys` varchar(40) DEFAULT NULL COMMENT '接诊医生（JZYS）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_no`),
  KEY `idx_visit_time` (`visit_time`),
  KEY `idx_dept_visit` (`dept_code`, `visit_time`),
  KEY `idx_doc_visit` (`doc_code`, `visit_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
"""
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS `mz_mfp_visit_index`")

