CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> aa4924ce1349

CREATE TABLE mz_mfp_org (
    id INTEGER NOT NULL, 
    jgmc VARCHAR(80) NOT NULL, 
    zzjgdm VARCHAR(22) NOT NULL, 
    is_active BOOLEAN NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    UNIQUE (zzjgdm)
);

CREATE INDEX ix_mz_mfp_org_id ON mz_mfp_org (id);

CREATE TABLE mz_mfp_record (
    id INTEGER NOT NULL, 
    org_id INTEGER NOT NULL, 
    patient_no VARCHAR(50) NOT NULL, 
    visit_time DATETIME NOT NULL, 
    status VARCHAR(20) NOT NULL, 
    dept_code VARCHAR(50) NOT NULL, 
    doc_code VARCHAR(50) NOT NULL, 
    version INTEGER NOT NULL, 
    prefill_snapshot JSON, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    submitted_at DATETIME, 
    PRIMARY KEY (id), 
    FOREIGN KEY(org_id) REFERENCES mz_mfp_org (id)
);

CREATE INDEX ix_mz_mfp_record_id ON mz_mfp_record (id);

CREATE TABLE mz_mfp_base_info (
    record_id INTEGER NOT NULL, 
    username VARCHAR(50) NOT NULL, 
    jzkh VARCHAR(50) NOT NULL, 
    xm VARCHAR(100) NOT NULL, 
    xb VARCHAR(1) NOT NULL, 
    csrq DATE NOT NULL, 
    hy VARCHAR(1) NOT NULL, 
    gj VARCHAR(40) NOT NULL, 
    mz VARCHAR(2) NOT NULL, 
    zjlb VARCHAR(1) NOT NULL, 
    zjhm VARCHAR(18) NOT NULL, 
    xzz VARCHAR(200) NOT NULL, 
    lxdh VARCHAR(40) NOT NULL, 
    ywgms VARCHAR(1) NOT NULL, 
    gmyw VARCHAR(500), 
    qtgms VARCHAR(1), 
    qtgmy VARCHAR(200), 
    ghsj DATETIME, 
    bdsj DATETIME, 
    jzsj DATETIME NOT NULL, 
    jzks VARCHAR(100), 
    jzksdm VARCHAR(50) NOT NULL, 
    jzys VARCHAR(40) NOT NULL, 
    jzyszc VARCHAR(40) NOT NULL, 
    jzlx VARCHAR(1) NOT NULL, 
    fz VARCHAR(1) NOT NULL, 
    sy VARCHAR(1) NOT NULL, 
    mzmtbhz VARCHAR(1) NOT NULL, 
    jzhzfj VARCHAR(1), 
    jzhzqx VARCHAR(1), 
    zyzkjsj DATETIME, 
    hzzs VARCHAR(1500), 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (record_id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE TABLE mz_mfp_diagnosis (
    id INTEGER NOT NULL, 
    record_id INTEGER NOT NULL, 
    diag_type VARCHAR(30) NOT NULL, 
    seq_no INTEGER NOT NULL, 
    diag_name VARCHAR(100) NOT NULL, 
    diag_code VARCHAR(50), 
    source VARCHAR(20) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE INDEX ix_mz_mfp_diagnosis_diag_type ON mz_mfp_diagnosis (diag_type);

CREATE INDEX ix_mz_mfp_diagnosis_id ON mz_mfp_diagnosis (id);

CREATE TABLE mz_mfp_export_log (
    id INTEGER NOT NULL, 
    record_id INTEGER NOT NULL, 
    export_type VARCHAR(20) NOT NULL, 
    file_name VARCHAR(200), 
    file_path VARCHAR(500), 
    status VARCHAR(20) NOT NULL, 
    error_message TEXT, 
    created_by VARCHAR(50) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE INDEX ix_mz_mfp_export_log_id ON mz_mfp_export_log (id);

CREATE TABLE mz_mfp_fee_summary (
    record_id INTEGER NOT NULL, 
    zfy NUMERIC(11, 2) NOT NULL, 
    zfje NUMERIC(10, 2) NOT NULL, 
    ylfwf NUMERIC(10, 2), 
    zlczf NUMERIC(10, 2), 
    hlf NUMERIC(10, 2), 
    qtfy NUMERIC(10, 2), 
    blzdf NUMERIC(10, 2), 
    zdf NUMERIC(10, 2), 
    yxxzdf NUMERIC(10, 2), 
    lczdxmf NUMERIC(10, 2), 
    fsszlxmf NUMERIC(10, 2), 
    zlf NUMERIC(10, 2), 
    sszlf NUMERIC(10, 2), 
    mzf NUMERIC(10, 2), 
    ssf NUMERIC(10, 2), 
    kff NUMERIC(10, 2), 
    zyl_zyzd NUMERIC(10, 2), 
    zyzl NUMERIC(10, 2), 
    zywz NUMERIC(10, 2), 
    zygs NUMERIC(10, 2), 
    zcyjf NUMERIC(10, 2), 
    zytnzl NUMERIC(10, 2), 
    zygczl NUMERIC(10, 2), 
    zytszl NUMERIC(10, 2), 
    zyqt NUMERIC(10, 2), 
    zytstpjg NUMERIC(10, 2), 
    bzss NUMERIC(10, 2), 
    xyf NUMERIC(10, 2), 
    kjywf NUMERIC(10, 2), 
    zcyf NUMERIC(10, 2), 
    zyzjf NUMERIC(10, 2), 
    zcyf1 NUMERIC(10, 2), 
    pfklf NUMERIC(10, 2), 
    xf NUMERIC(10, 2), 
    bdbblzpf NUMERIC(10, 2), 
    qdbblzpf NUMERIC(10, 2), 
    nxyzlzpf NUMERIC(10, 2), 
    xbyzlzpf NUMERIC(10, 2), 
    jcyyclf NUMERIC(10, 2), 
    yyclf NUMERIC(10, 2), 
    ssycxclf NUMERIC(10, 2), 
    qtf NUMERIC(10, 2), 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (record_id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE TABLE mz_mfp_field_audit (
    id INTEGER NOT NULL, 
    record_id INTEGER NOT NULL, 
    field_key VARCHAR(100) NOT NULL, 
    old_value TEXT, 
    new_value TEXT, 
    change_source VARCHAR(20) NOT NULL, 
    operator_code VARCHAR(50) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE INDEX ix_mz_mfp_field_audit_id ON mz_mfp_field_audit (id);

CREATE TABLE mz_mfp_herb_detail (
    id INTEGER NOT NULL, 
    record_id INTEGER NOT NULL, 
    seq_no INTEGER NOT NULL, 
    herb_type VARCHAR(1) NOT NULL, 
    route_code VARCHAR(30) NOT NULL, 
    route_name VARCHAR(100) NOT NULL, 
    dose_count INTEGER NOT NULL, 
    source VARCHAR(20) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE INDEX ix_mz_mfp_herb_detail_id ON mz_mfp_herb_detail (id);

CREATE TABLE mz_mfp_medication_summary (
    record_id INTEGER NOT NULL, 
    xysy VARCHAR(1) NOT NULL, 
    zcysy VARCHAR(1) NOT NULL, 
    zyzjsy VARCHAR(1) NOT NULL, 
    ctypsy VARCHAR(1) NOT NULL, 
    pfklsy VARCHAR(1) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (record_id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE TABLE mz_mfp_surgery (
    id INTEGER NOT NULL, 
    record_id INTEGER NOT NULL, 
    seq_no INTEGER NOT NULL, 
    op_name VARCHAR(100) NOT NULL, 
    op_code VARCHAR(20) NOT NULL, 
    op_time DATETIME NOT NULL, 
    operator_name VARCHAR(40) NOT NULL, 
    anesthesia_method VARCHAR(6) NOT NULL, 
    anesthesia_doctor VARCHAR(40) NOT NULL, 
    surgery_level INTEGER NOT NULL, 
    source VARCHAR(20) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE INDEX ix_mz_mfp_surgery_id ON mz_mfp_surgery (id);

CREATE TABLE mz_mfp_tcm_operation (
    id INTEGER NOT NULL, 
    record_id INTEGER NOT NULL, 
    seq_no INTEGER NOT NULL, 
    op_name VARCHAR(100) NOT NULL, 
    op_code VARCHAR(20) NOT NULL, 
    op_times INTEGER NOT NULL, 
    op_days INTEGER, 
    source VARCHAR(20) NOT NULL, 
    created_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP) NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(record_id) REFERENCES mz_mfp_record (id) ON DELETE CASCADE
);

CREATE INDEX ix_mz_mfp_tcm_operation_id ON mz_mfp_tcm_operation (id);

INSERT INTO alembic_version (version_num) VALUES ('aa4924ce1349') RETURNING version_num;

