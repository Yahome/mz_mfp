SELECT 
    '益阳市第一中医医院' AS JGMC,     -- 医疗机构名称
    '736798027' AS ZZJGDM,            -- 组织机构代码
    '益阳市第一中医医院' AS USERNAME, -- 用户名
    b.blh AS JZKH,                    -- 就诊卡号
    c.BRXM AS XM,                     -- 姓名
    ISNULL(NULLIF(c.XB, ''), '0') AS XB, -- 性别 (空值默认为0)

    -- 修正婚姻逻辑
    CASE c.hyzk 
        WHEN '1' THEN '1' -- 未婚
        WHEN '2' THEN '2' -- 已婚
        WHEN '3' THEN '3' -- 丧偶
        WHEN '4' THEN '4' -- 离婚
        ELSE '9' 
    END AS HY,

    CAST(c.CSRQ AS DATE) AS csrq,      -- 出生日期

    -- 国籍优化：改用关联表
    CASE 
        WHEN ISNULL(c.gj, '') = '' THEN 'CHN'
        ELSE country.ThreeLetters 
    END AS gj,

    -- 民族优化：改用关联表
    CASE 
        WHEN ISNULL(c.gj, '') = '' OR c.gj = '156' THEN 
            ISNULL(CAST(nationco.code2 AS INT), 1) -- 默认汉族
        ELSE 99 -- 外国籍
    END AS mz,

    -- 证件类别与号码优化：使用 COALESCE 简化优先级判断
    CASE 
        WHEN NULLIF(c.sfzh, '') IS NOT NULL THEN '1'
        WHEN NULLIF(d.qtzjlx, '') IS NOT NULL THEN zjlx.code2
        ELSE '-' 
    END AS ZJLB,

    COALESCE(NULLIF(c.sfzh, ''), NULLIF(d.qtzjhm, ''), '-') AS ZJHM,

    -- 地址与电话优先级排序
    COALESCE(NULLIF(c.jtdz, ''), NULLIF(c.csdz, ''), NULLIF(c.GZDWDZ, ''), '-') AS XZZ,
    COALESCE(NULLIF(c.brlxfs, ''), NULLIF(d.lxrdh, ''), NULLIF(c.GZDWDH, ''), '-') AS LXDH,

    b.GHSJ, -- 挂号时间
    b.JZSJ AS BDSJ, -- 报到时间
    b.JZSJ AS JZSJ, -- 就诊时间

    e.name AS jzks,
    e.dept_hqms_code AS jzksdm,
    a.JSKSDM AS jzksdmhis,

    f.name AS JZYS,
    g.YS_TYPEID AS jzyszc,
    f.EMPLOYEE_ID AS jzysdm,
    h.djsj AS zyzdjsj,
    
    zs.content as hzzs

FROM vi_MZYS_JZJL a
LEFT JOIN VI_MZ_GHXX b ON a.ghxxid = b.ghxxid
LEFT JOIN yy_brxx c ON b.BRXXID = c.BRXXID
LEFT JOIN yy_brxx_bc d ON d.BRXXID = c.brxxid
LEFT JOIN JC_DEPT_PROPERTY e ON e.dept_id = a.jsksdm
LEFT JOIN JC_EMPLOYEE_PROPERTY f ON f.EMPLOYEE_ID = a.jsysdm
LEFT JOIN JC_ROLE_DOCTOR g ON g.employee_id = f.EMPLOYEE_ID
-- 民族与国籍改为连接方式
LEFT JOIN JC_COUNTRYC country ON c.gj = country.code
LEFT JOIN JC_NATIONCO nationco ON c.mz = nationco.code
-- 证件类型映射
LEFT JOIN jc_qtzjlx zjlx ON zjlx.name = d.qtzjlx
-- 住院证时间取最大值
LEFT JOIN (
    SELECT brxxid, mzh, MAX(djsj) AS djsj 
    FROM MZYS_ZYZDJ
    WHERE bscbz = '0' 
    GROUP BY brxxid, MZH
) h ON h.brxxid = b.BRXXID AND h.mzh = b.BLH
LEFT JOIN  (select  * from openquery([10.10.8.50], 'select * from JHEMR.MZ_EMR_NODE where node = ''主诉'' AND last_modify_date_time >= 
TO_DATE(''2025-12-01 00:00:00'', ''YYYY-MM-DD HH24:MI:SS'')')) zs on zs.patient_id = b.blh 

WHERE a.jssj >= '2025-12-01'