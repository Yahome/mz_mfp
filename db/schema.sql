-- 门诊病案首页业务库初始化脚本
-- 依赖：MySQL 8+，字符集 utf8mb4

SET NAMES utf8mb4;
SET time_zone = 'Asia/Shanghai';

CREATE TABLE `mz_mfp_org` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `jgmc` varchar(80) NOT NULL COMMENT '医疗机构名称（JGMC）',
  `zzjgdm` varchar(22) NOT NULL COMMENT '组织机构代码（ZZJGDM）',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_zzjgdm` (`zzjgdm`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_record` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `org_id` bigint unsigned NOT NULL COMMENT '医院ID',
  `patient_no` varchar(50) NOT NULL COMMENT '病历号/就诊标识（=blh）',
  `visit_time` datetime NOT NULL COMMENT '就诊时间（JZSJ）',
  `status` varchar(20) NOT NULL DEFAULT 'draft' COMMENT 'draft/submitted',
  `dept_code` varchar(50) NOT NULL COMMENT '科室代码（上下文）',
  `doc_code` varchar(50) NOT NULL COMMENT '医生代码（上下文）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `submitted_at` datetime DEFAULT NULL COMMENT '提交时间',
  `version` int unsigned NOT NULL DEFAULT 1 COMMENT '乐观锁版本号',
  `prefill_snapshot` json DEFAULT NULL COMMENT '外部视图原始快照（base-info/patient_fee/其他视图）',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_patient_no` (`patient_no`),
  KEY `idx_status_updated` (`status`, `updated_at`),
  KEY `idx_dept_updated` (`dept_code`, `updated_at`),
  KEY `idx_doc_updated` (`doc_code`, `updated_at`),
  KEY `idx_org_visit` (`org_id`, `visit_time`),
  CONSTRAINT `fk_record_org` FOREIGN KEY (`org_id`) REFERENCES `mz_mfp_org` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_base_info` (
  `record_id` bigint unsigned NOT NULL COMMENT '关联mz_mfp_record.id（1:1）',
  `username` varchar(50) NOT NULL COMMENT '对应的系统登录用户名（USERNAME）',

  `jzkh` varchar(50) NOT NULL COMMENT '就诊卡号或病案号（JZKH）',
  `xm` varchar(100) NOT NULL COMMENT '姓名（XM）',
  `xb` char(1) NOT NULL COMMENT '性别（XB，RC001）',
  `csrq` date NOT NULL COMMENT '出生日期（CSRQ）',
  `hy` char(1) NOT NULL COMMENT '婚姻（HY，RC002）',
  `gj` varchar(40) NOT NULL COMMENT '国籍（GJ）',
  `mz` varchar(2) NOT NULL COMMENT '民族（MZ，RC035）',
  `zjlb` char(1) NOT NULL COMMENT '证件类别（ZJLB，RC038）',
  `zjhm` varchar(18) NOT NULL COMMENT '证件号码（ZJHM）',
  `xzz` varchar(200) NOT NULL COMMENT '现住址（XZZ）',
  `lxdh` varchar(40) NOT NULL COMMENT '联系电话（LXDH）',

  `ywgms` char(1) NOT NULL COMMENT '药物过敏史（YWGMS，RC037）',
  `gmyw` varchar(500) DEFAULT NULL COMMENT '过敏药物（GMYW）',
  `qtgms` char(1) DEFAULT NULL COMMENT '其他过敏史（QTGMS，RC037）',
  `qtgmy` varchar(200) DEFAULT NULL COMMENT '其他过敏原（QTGMY）',

  `ghsj` datetime DEFAULT NULL COMMENT '挂号时间（GHSJ）',
  `bdsj` datetime DEFAULT NULL COMMENT '报到时间（BDSJ）',
  `jzsj` datetime NOT NULL COMMENT '就诊时间（JZSJ）',

  `jzks` varchar(100) DEFAULT NULL COMMENT '就诊科室（JZKS）',
  `jzksdm` varchar(50) NOT NULL COMMENT '就诊科室代码（JZKSDM，RC023）',
  `jzys` varchar(40) NOT NULL COMMENT '接诊医师（JZYS）',
  `jzyszc` varchar(40) NOT NULL COMMENT '接诊医师职称（JZYSZC，RC044）',
  `jzlx` char(1) NOT NULL COMMENT '就诊类型（JZLX，RC041）',
  `fz` char(1) NOT NULL COMMENT '是否复诊（FZ，RC016）',
  `sy` char(1) NOT NULL COMMENT '是否输液（SY，RC016）',
  `mzmtbhz` char(1) NOT NULL COMMENT '是否为门诊慢特病患者（MZMTBHZ，RC016）',
  `jzhzfj` char(1) DEFAULT NULL COMMENT '急诊患者分级（JZHZFJ，RC042）',
  `jzhzqx` char(1) DEFAULT NULL COMMENT '急诊患者去向（JZHZQX，RC045）',
  `zyzkjsj` datetime DEFAULT NULL COMMENT '住院证开具时间（ZYZKJSJ）',

  `hzzs` varchar(1500) DEFAULT NULL COMMENT '患者主诉（HZZS）',

  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  CONSTRAINT `fk_base_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_diagnosis` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `record_id` bigint unsigned NOT NULL,
  `diag_type` varchar(30) NOT NULL COMMENT 'tcm_disease_main/tcm_syndrome/wm_main/wm_other',
  `seq_no` int unsigned NOT NULL COMMENT '序号，从1开始',
  `diag_name` varchar(100) NOT NULL COMMENT '诊断名称',
  `diag_code` varchar(50) DEFAULT NULL COMMENT '诊断编码（允许为空的范围按标准执行）',
  `source` varchar(20) NOT NULL DEFAULT 'prefill' COMMENT 'prefill/manual/dict/system',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_type_seq` (`record_id`, `diag_type`, `seq_no`),
  KEY `idx_record_type` (`record_id`, `diag_type`),
  KEY `idx_diag_type_code` (`diag_type`, `diag_code`),
  CONSTRAINT `fk_diag_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_tcm_operation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `record_id` bigint unsigned NOT NULL,
  `seq_no` int unsigned NOT NULL COMMENT '序号，从1开始',
  `op_name` varchar(100) NOT NULL COMMENT '操作名称（ZYZLCZMC）',
  `op_code` varchar(20) NOT NULL COMMENT '操作编码（ZYZLCZBM）',
  `op_times` int unsigned NOT NULL COMMENT '操作次数（ZYZLCZCS，非负整数）',
  `op_days` int unsigned DEFAULT NULL COMMENT '操作天数（ZYZLCZTS，非负整数）',
  `source` varchar(20) NOT NULL DEFAULT 'prefill' COMMENT 'prefill/manual/dict/system',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_seq` (`record_id`, `seq_no`),
  CONSTRAINT `fk_tcm_op_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_surgery` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `record_id` bigint unsigned NOT NULL,
  `seq_no` int unsigned NOT NULL COMMENT '序号，从1开始',
  `op_name` varchar(100) NOT NULL COMMENT '手术/操作名称（SSCZMC）',
  `op_code` varchar(20) NOT NULL COMMENT '手术/操作编码（SSCZBM）',
  `op_time` datetime NOT NULL COMMENT '手术/操作日期（SSCZRQ）',
  `operator_name` varchar(40) NOT NULL COMMENT '手术操作者（SSCZZ）',
  `anesthesia_method` varchar(6) NOT NULL COMMENT '麻醉方式（MZFS，RC013）',
  `anesthesia_doctor` varchar(40) NOT NULL COMMENT '麻醉医师（MZYS）',
  `surgery_level` tinyint unsigned NOT NULL COMMENT '手术分级（SHJB，RC029）',
  `source` varchar(20) NOT NULL DEFAULT 'prefill' COMMENT 'prefill/manual/dict/system',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_seq` (`record_id`, `seq_no`),
  CONSTRAINT `fk_surgery_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_medication_summary` (
  `record_id` bigint unsigned NOT NULL,
  `xysy` char(1) NOT NULL COMMENT '是否使用西药（XYSY，RC016）',
  `zcysy` char(1) NOT NULL COMMENT '是否使用中成药（ZCYSY，RC016）',
  `zyzjsy` char(1) NOT NULL COMMENT '是否使用中药制剂（ZYZJSY，RC016）',
  `ctypsy` char(1) NOT NULL COMMENT '是否使用传统饮片（CTYPSY，RC016）',
  `pfklsy` char(1) NOT NULL COMMENT '是否使用配方颗粒（PFKLSY，RC016）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  CONSTRAINT `fk_med_sum_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_herb_detail` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `record_id` bigint unsigned NOT NULL,
  `seq_no` int unsigned NOT NULL COMMENT '序号，从1开始',
  `herb_type` char(1) NOT NULL COMMENT '中草药类别（ZCYLB，中草药类型）',
  `route_code` varchar(30) NOT NULL COMMENT '用药途径代码（YYTJDM）',
  `route_name` varchar(100) NOT NULL COMMENT '用药途径名称（YYTJMC）',
  `dose_count` int unsigned NOT NULL COMMENT '用药剂数（YYJS，非负整数）',
  `source` varchar(20) NOT NULL DEFAULT 'prefill' COMMENT 'prefill/manual/dict/system',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_record_seq` (`record_id`, `seq_no`),
  CONSTRAINT `fk_herb_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_fee_summary` (
  `record_id` bigint unsigned NOT NULL,
  `zfy` decimal(11,2) NOT NULL COMMENT '总费用（ZFY）',
  `zfje` decimal(10,2) NOT NULL COMMENT '自付金额（ZFJE）',

  `ylfwf` decimal(10,2) DEFAULT NULL,
  `zlczf` decimal(10,2) DEFAULT NULL,
  `hlf` decimal(10,2) DEFAULT NULL,
  `qtfy` decimal(10,2) DEFAULT NULL,
  `blzdf` decimal(10,2) DEFAULT NULL,
  `zdf` decimal(10,2) DEFAULT NULL,
  `yxxzdf` decimal(10,2) DEFAULT NULL,
  `lczdxmf` decimal(10,2) DEFAULT NULL,
  `fsszlxmf` decimal(10,2) DEFAULT NULL,
  `zlf` decimal(10,2) DEFAULT NULL,
  `sszlf` decimal(10,2) DEFAULT NULL,
  `mzf` decimal(10,2) DEFAULT NULL,
  `ssf` decimal(10,2) DEFAULT NULL,
  `kff` decimal(10,2) DEFAULT NULL,
  `zyl_zyzd` decimal(10,2) DEFAULT NULL,
  `zyzl` decimal(10,2) DEFAULT NULL,
  `zywz` decimal(10,2) DEFAULT NULL,
  `zygs` decimal(10,2) DEFAULT NULL,
  `zcyjf` decimal(10,2) DEFAULT NULL,
  `zytnzl` decimal(10,2) DEFAULT NULL,
  `zygczl` decimal(10,2) DEFAULT NULL,
  `zytszl` decimal(10,2) DEFAULT NULL,
  `zyqt` decimal(10,2) DEFAULT NULL,
  `zytstpjg` decimal(10,2) DEFAULT NULL,
  `bzss` decimal(10,2) DEFAULT NULL,
  `xyf` decimal(10,2) DEFAULT NULL,
  `kjywf` decimal(10,2) DEFAULT NULL,
  `zcyf` decimal(10,2) DEFAULT NULL,
  `zyzjf` decimal(10,2) DEFAULT NULL,
  `zcyf1` decimal(10,2) DEFAULT NULL,
  `pfklf` decimal(10,2) DEFAULT NULL,
  `xf` decimal(10,2) DEFAULT NULL,
  `bdbblzpf` decimal(10,2) DEFAULT NULL,
  `qdbblzpf` decimal(10,2) DEFAULT NULL,
  `nxyzlzpf` decimal(10,2) DEFAULT NULL,
  `xbyzlzpf` decimal(10,2) DEFAULT NULL,
  `jcyyclf` decimal(10,2) DEFAULT NULL,
  `yyclf` decimal(10,2) DEFAULT NULL,
  `ssycxclf` decimal(10,2) DEFAULT NULL,
  `qtf` decimal(10,2) DEFAULT NULL,

  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  CONSTRAINT `fk_fee_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_field_audit` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `record_id` bigint unsigned NOT NULL COMMENT '关联mz_mfp_record.id',
  `field_key` varchar(100) NOT NULL COMMENT '字段名（如 XM / MZZD_QTZD3）',
  `old_value` text COMMENT '旧值（脱敏策略在日志层；库内按权限访问）',
  `new_value` text COMMENT '新值（脱敏策略在日志层；库内按权限访问）',
  `change_source` varchar(20) NOT NULL COMMENT 'prefill/manual/dict/system',
  `operator_code` varchar(50) NOT NULL COMMENT '操作者（doc_code/用户名）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审计时间',
  PRIMARY KEY (`id`),
  KEY `idx_record_time` (`record_id`, `created_at`),
  CONSTRAINT `fk_audit_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mz_mfp_export_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `record_id` bigint unsigned NOT NULL COMMENT '关联mz_mfp_record.id',
  `export_type` varchar(20) NOT NULL COMMENT 'xlsx/print',
  `file_name` varchar(200) DEFAULT NULL COMMENT '文件名（如为xlsx）',
  `file_path` varchar(500) DEFAULT NULL COMMENT '文件路径/对象存储key（如有）',
  `status` varchar(20) NOT NULL COMMENT 'success/failed',
  `error_message` text COMMENT '失败原因（需脱敏）',
  `created_by` varchar(50) NOT NULL COMMENT '操作人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_record_time` (`record_id`, `created_at`),
  CONSTRAINT `fk_export_record` FOREIGN KEY (`record_id`) REFERENCES `mz_mfp_record` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_config` (
  `config_key` varchar(100) NOT NULL COMMENT '配置键（如 frontend.session_keepalive）',
  `config_value` json NOT NULL COMMENT '配置值（JSON）',
  `updated_by` varchar(50) NOT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `login_name` varchar(50) DEFAULT NULL COMMENT '登录账号',
  `password` varchar(200) DEFAULT NULL COMMENT '明文密码（临时）',
  `doc_code` varchar(50) NOT NULL COMMENT '医生/员工代码',
  `dept_code` varchar(50) DEFAULT NULL COMMENT '默认科室代码',
  `display_name` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_doc_code` (`doc_code`),
  UNIQUE KEY `uk_login_name` (`login_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_role` (
  `role_code` varchar(50) NOT NULL COMMENT 'doctor/qc/admin',
  `role_name` varchar(100) NOT NULL,
  PRIMARY KEY (`role_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_user_role` (
  `user_id` bigint unsigned NOT NULL,
  `role_code` varchar(50) NOT NULL,
  PRIMARY KEY (`user_id`, `role_code`),
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_code`) REFERENCES `app_role` (`role_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `app_user_dept` (
  `user_id` bigint unsigned NOT NULL,
  `dept_code` varchar(50) NOT NULL,
  PRIMARY KEY (`user_id`, `dept_code`),
  KEY `idx_dept_code` (`dept_code`),
  CONSTRAINT `fk_user_dept_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `dict_set` (
  `set_code` varchar(50) NOT NULL COMMENT '字典集标识（如 RC001 / ICD10 / ICD9CM3 / TCM_DISEASE / TCM_SYNDROME / COUNTRY）',
  `set_name` varchar(100) NOT NULL,
  `version` varchar(50) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`set_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `dict_item` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `set_code` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `extra_code` varchar(50) DEFAULT NULL,
  `merged_code` varchar(50) DEFAULT NULL,
  `pinyin` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1启用/0停用',
  `sort_no` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_set_code_code` (`set_code`, `code`),
  KEY `idx_set_code_merged` (`set_code`, `merged_code`),
  KEY `idx_set_code_name` (`set_code`, `name`),
  CONSTRAINT `fk_dict_item_set` FOREIGN KEY (`set_code`) REFERENCES `dict_set` (`set_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 就诊索引（列表查询时从外部视图同步）
CREATE TABLE `mz_mfp_visit_index` (
  `patient_no` varchar(50) NOT NULL COMMENT '病历号/就诊标识（=blh）',
  `visit_time` datetime NOT NULL COMMENT '就诊时间（JZSJ）',
  `dept_code` varchar(50) DEFAULT NULL COMMENT '就诊科室代码（来自外部视图）',
  `dept_his_code` varchar(50) DEFAULT NULL COMMENT 'HIS 科室代码（JZKSDMHIS）',
  `doc_code` varchar(50) DEFAULT NULL COMMENT '接诊医生代码（来自外部视图）',
  `xm` varchar(100) DEFAULT NULL COMMENT '姓名（XM）',
  `jzks` varchar(100) DEFAULT NULL COMMENT '就诊科室名称（JZKS）',
  `jzys` varchar(40) DEFAULT NULL COMMENT '接诊医生（JZYS）',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_no`),
  KEY `idx_visit_time` (`visit_time`),
  KEY `idx_dept_visit` (`dept_code`, `visit_time`),
  KEY `idx_dept_his_visit` (`dept_his_code`, `visit_time`),
  KEY `idx_doc_visit` (`doc_code`, `visit_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
