WITH CTE_ICD_XY AS (
    -- 预处理西药/手术映射表，确保每个yb_bm只取一条
    SELECT yb_bm, icd_mc, icd_bm,
           ROW_NUMBER() OVER(PARTITION BY yb_bm ORDER BY (SELECT NULL)) as rn
    FROM T_YB_ICD_PP_XYHSS
),
CTE_ICD_ZY AS (
    -- 预处理中医药映射表
    SELECT yb_bm, icd_mc, icd_bm,
           ROW_NUMBER() OVER(PARTITION BY yb_bm ORDER BY (SELECT NULL)) as rn
    FROM T_YB_ICD_PP_ZY
)
SELECT 
    a.BRXXID AS patient_id, 
    d.BLH AS inp_no, 
    a.jzid, 
    '1' AS visit_id, 
    '1' AS diagnosis_type, 
    ROW_NUMBER() OVER (PARTITION BY b.jzid ORDER BY b.cjsj ASC) AS diagnosis_no, 
    '0' AS diagnosis_sub_no,  
    
    -- 使用 COALESCE 简化逻辑，优先取映射后的名称，取不到取原名
    COALESCE(
        CASE 
            WHEN b.sort = 'D' THEN xy.icd_mc 
            WHEN b.sort IN ('B', 'Z') THEN zy.icd_mc 
        END, 
        b.name
    ) AS diagnosis_desc,
    
    b.cjsj AS diagnosis_date,
    c.code AS DIAGNOSTICIAN_ID,
    b.cjsj AS LAST_MODIFY_DATE,
    NULL AS MODIFIER_ID,
    NULL AS SUPER_SIGN_DATE,
    NULL AS SUPER_ID,
    '0' AS flag,
    '门诊诊断' AS DIAGNOSIS_TYPE_NAME,
    
    -- 诊断编码映射
    COALESCE(
        CASE 
            WHEN b.sort = 'D' THEN xy.icd_bm 
            WHEN b.sort IN ('B', 'Z') THEN zy.icd_bm 
        END, 
        b.coding
    ) AS DIAGNOSIS_CODE,
    
    '00' AS DIAGNOSIS_CLASS,
    NULL AS HOUSEMAN,
    '1' AS CONFIRMED_INDICATOR,
    '1' AS ID,
    '0' AS PARENTID,
    dept.emr_id AS dept_code,
    '0' AS CONTAGIOUS,
    '4307011600' AS HOSPITAL_NO,
    CASE WHEN b.sort = 'D' THEN '1' else '0' END AS DIAGNOSIS_FLAG,
    NULL AS DIAGNOSIS_NOTE,
    NULL AS DIAGNOSIS_DESC_XML,
    
    -- 这里的 diagnosis_name 与 diagnosis_desc 逻辑复用
    COALESCE(
        CASE 
            WHEN b.sort = 'D' THEN xy.icd_mc 
            WHEN b.sort IN ('B', 'Z') THEN zy.icd_mc 
        END, 
        b.name
    ) AS diagnosis_name,
    
    NULL AS DIAGNOSIS_NAME_BEFORE,
    NULL AS DIAGNOSIS_NAME_AFTER,
    '2' AS FILE_VISIT_TYPE,
    NULL AS OPER_TREAT_INDICATOR1,
    NULL AS OPER_TREAT_INDICATOR1_ID,
    NULL AS DISCHARGE_CONDITIONS,
    '0' AS INFECTION,
    NULL AS PARENT_ID,
    NULL AS PARENT_SIGN_DATE,
    NULL AS PARENT_USER_ID,
    NULL AS DIAGNOSIS_LEFTS_DESC,
    NULL AS DIAGNOSIS_MS_DESC,
    NULL AS DIAGNOSIS_REPEAT_FLAG,
    NULL AS DIAGNOSIS_ONLY_ID,
    NULL AS REVISE_DIAGNOSIS_CODE,
    '0' AS IS_RELATION,
    NULL AS DIAGNOSIS_GROUP,
    NULL AS DIAGNOSIS_STATE,
    NULL AS ACCIDENT_DATE,
    NULL AS DIAGNOSIS_BASIS,
    b.sort AS DIAGNOSIS_HIS_SORT
		
FROM vi_MZYS_JZJL a 
INNER JOIN MZYS_DISEASE b ON a.jzid = b.jzid 
LEFT JOIN pub_user c ON b.djys = c.employee_id
LEFT JOIN VI_MZ_GHXX d ON a.GHXXID = d.GHXXID
-- 关联映射表
LEFT JOIN CTE_ICD_XY xy ON b.coding = xy.yb_bm AND xy.rn = 1
LEFT JOIN CTE_ICD_ZY zy ON b.coding = zy.yb_bm AND zy.rn = 1
-- 关联部门
LEFT JOIN T_dept_match dept ON b.djys = dept.his_id

WHERE a.djsj >= '2025-12-01'  
  AND b.bscbz = '0' 
  AND ISNULL(b.coding, '') <> '';