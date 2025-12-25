WITH 
-- =================================================================
-- CTE 1: 费用明细统计 
-- =================================================================
T_Fee AS (
    SELECT 
        b.blh,
        SUM(a.JE) AS 总费用,
        
        -- ★★★ 新增：用药情况判断 ★★★
        CASE 
            WHEN SUM(CASE WHEN a.TJDXMDM = '1' THEN 1 ELSE 0 END) > 0 
            THEN '1' ELSE '2' 
        END AS 是否使用西药,
        
        CASE 
            WHEN SUM(CASE WHEN a.TJDXMDM = '2' THEN 1 ELSE 0 END) > 0 
            THEN '1' ELSE '2' 
        END AS 是否使用中成药,
        
        CASE 
            WHEN SUM(CASE WHEN ypcd.n_ypzlx = '4' THEN 1 ELSE 0 END) > 0 
            THEN '1' ELSE '2' 
        END AS 是否使用中药制剂,
        
        CASE 
            WHEN SUM(CASE 
                        WHEN a.TJDXMDM = '3' AND ISNULL(ypcd.s_ypjx, '') <> '配方颗粒' 
                        THEN 1 ELSE 0 
                     END) > 0 
            THEN '1' ELSE '2' 
        END AS 是否使用传统饮片,
        
        CASE 
            WHEN SUM(CASE WHEN a.TJDXMDM = '3' and ypcd.s_ypjx = '配方颗粒' THEN 1 ELSE 0 END) > 0 
            THEN '1' ELSE '2' 
        END AS 是否使用配方颗粒,
        -- ★★★ 结束 ★★★
        
        -- === DYLX1 逻辑 ===
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '一般医疗服务费' THEN a.JE ELSE 0 END) AS 一般医疗服务费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '一般治疗操作费' THEN a.JE ELSE 0 END) AS 一般治疗操作费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '护理费' THEN a.JE ELSE 0 END) AS 护理费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '其他费用' THEN a.JE ELSE 0 END) AS 其他费用,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '病理诊断费' THEN a.JE ELSE 0 END) AS 病理诊断费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '实验室诊断费' THEN a.JE ELSE 0 END) AS 实验室诊断费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '影像学诊断费' THEN a.JE ELSE 0 END) AS 影像学诊断费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '临床诊断项目费' THEN a.JE ELSE 0 END) AS 临床诊断项目费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '非手术治疗项目费' THEN a.JE ELSE 0 END) AS 非手术治疗项目费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '临床物理治疗费' THEN a.JE ELSE 0 END) AS 临床物理治疗费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '手术费' THEN a.JE ELSE 0 END) AS 手术费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '麻醉费' THEN a.JE ELSE 0 END) AS 麻醉费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '康复费' THEN a.JE ELSE 0 END) AS 康复费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中医外治' THEN a.JE ELSE 0 END) AS 中医外治,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中医骨伤' THEN a.JE ELSE 0 END) AS 中医骨伤,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '针刺与灸法' THEN a.JE ELSE 0 END) AS 针刺与灸法,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中医推拿治疗' THEN a.JE ELSE 0 END) AS 中医推拿治疗,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中医肛肠治疗' THEN a.JE ELSE 0 END) AS 中医肛肠治疗,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中医特殊治疗' THEN a.JE ELSE 0 END) AS 中医特殊治疗,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '其他费' THEN a.JE ELSE 0 END) AS 其他费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中成药费' THEN a.JE ELSE 0 END) AS 中成药费,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '中草药费' THEN a.JE ELSE 0 END) AS 中草药费,
        
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '西药费' THEN a.JE ELSE 0 END) AS 西药费_原始,
        SUM(CASE WHEN d1.dylx = '1' AND e1.name = '血费' THEN a.JE ELSE 0 END) AS 血费_原始,

        -- === DYLX2 逻辑 ===
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '中医辨证论治费' THEN a.JE ELSE 0 END) AS 中医辨证论治费,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '中药特殊调配加工' THEN a.JE ELSE 0 END) AS 中药特殊调配加工,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '辨证施膳' THEN a.JE ELSE 0 END) AS 辨证施膳,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '检查用一次性医用材料费' THEN a.JE ELSE 0 END) AS 检查用一次性医用材料费,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '治疗用一次性医用材料费' THEN a.JE ELSE 0 END) AS 治疗用一次性医用材料费,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '手术用一次性医用材料费' THEN a.JE ELSE 0 END) AS 手术用一次性医用材料费,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '凝血因子类制品费' THEN a.JE ELSE 0 END) AS 凝血因子类制品费,
        SUM(CASE WHEN d2.dylx = '2' AND b.xmly = '2' AND e2.name = '细胞因子类制品费' THEN a.JE ELSE 0 END) AS 细胞因子类制品费,

        -- === DYLX3 & KJYW 逻辑 ===
        SUM(CASE WHEN b.XMLY = 1 AND y_sx.flid = '15' THEN a.JE ELSE 0 END) AS 白蛋白类制品费,
        SUM(CASE WHEN b.XMLY = 1 AND y_sx.flid = '16' THEN a.JE ELSE 0 END) AS 球蛋白类制品费,
        SUM(CASE WHEN b.XMLY = 1 AND ypcd.kssdjid > 0 THEN a.JE ELSE 0 END) AS 抗菌药物费用,
        SUM(CASE WHEN b.XMLY = 1 AND ypcd.n_ypzlx = '4' THEN a.JE ELSE 0 END) AS 医疗机构中药制剂费,
        SUM(CASE WHEN b.XMLY = 1 AND ypcd.s_ypjx = '配方颗粒' THEN a.JE ELSE 0 END) AS 配方颗粒费

    FROM dbo.VI_MZ_CFB_mx a    
    INNER JOIN dbo.VI_MZ_CFB B on a.cfid = b.cfid
    
    LEFT JOIN dbo.BA_XM_DY d1 ON a.TJDXMDM = d1.DY_CODE
    LEFT JOIN dbo.JC_BA_XM_NEW e1 ON d1.BAXM_CODE = e1.CODE
    
    LEFT JOIN dbo.BA_XM_DY d2 ON a.XMID = d2.DY_CODE
    LEFT JOIN dbo.JC_BA_XM_NEW e2 ON d2.BAXM_CODE = e2.CODE
    
    LEFT JOIN dbo.VI_YP_YPCD ypcd ON a.XMID = ypcd.cjid AND b.XMLY = 1
    LEFT JOIN dbo.YP_YPSX y_sx ON ypcd.cjid = y_sx.cjid AND y_sx.flid IN ('15','16')

    WHERE b.BSFBZ='1' and b.BSCBZ='0' and b.sfrq >= '2025-12-01' 
    GROUP BY b.blh
),

-- =================================================================
-- CTE 2: 医保支付统计 (独立计算，避免笛卡尔积/扇陷阱)
-- =================================================================
T_Pay AS (
    SELECT 
        InnerT.blh,
        SUM(InnerT.ybjjzf) AS 医保基金支付
    FROM (
        -- 核心步骤：先获取满足条件的不重复发票 (Distinct Invoices)
        SELECT DISTINCT 
            b.blh, 
            fp.FPID, 
            fp.ybjjzf
        FROM dbo.VI_MZ_CFB b
        INNER JOIN dbo.vi_mz_fpb fp ON b.fpid = fp.FPID
        WHERE b.BSFBZ='1' AND b.BSCBZ='0' AND b.sfrq >= '2025-12-01'
    ) InnerT
    GROUP BY InnerT.blh
)

-- =================================================================
-- Final Select: 组合两个结果集
-- =================================================================
SELECT 
    T.blh,
    T.总费用,
    
    -- 计算自费：总费用 - 医保支付 (如果医保支付为NULL则算0)
    (T.总费用 - ISNULL(P.医保基金支付, 0)) AS zffy, 
    
    T.一般医疗服务费,
    T.中医辨证论治费,
    '0.00' AS 中医辨证论治会诊费,
    T.一般治疗操作费,
    T.护理费,
    T.其他费用,
    T.病理诊断费,
    T.实验室诊断费,
    T.影像学诊断费,
    T.临床诊断项目费,
    (T.非手术治疗项目费 + T.临床物理治疗费) AS 非手术治疗项目费,
    T.临床物理治疗费,
    (T.手术费 + T.麻醉费) AS 手术治疗费,
    T.手术费,
    T.麻醉费,
    T.康复费,
    '0.00' AS 中医诊断,
    (T.中医外治 + T.中医骨伤 + T.针刺与灸法 + T.中医推拿治疗 + T.中医肛肠治疗 + T.中医特殊治疗) AS 中医治疗费用,
    T.中医外治,
    T.中医骨伤,
    T.针刺与灸法,
    T.中医推拿治疗,
    T.中医肛肠治疗,
    T.中医特殊治疗,
    
    (T.中药特殊调配加工 + T.辨证施膳) AS 中医_其他,
    T.中药特殊调配加工,
    T.辨证施膳,
    
    (T.西药费_原始 - T.白蛋白类制品费 - T.球蛋白类制品费) AS 西药费,
    T.抗菌药物费用,
    T.中成药费,
    T.医疗机构中药制剂费,
    T.中草药费,
    
    (T.血费_原始 - T.凝血因子类制品费) AS 血费,
    T.白蛋白类制品费,
    T.球蛋白类制品费,
    T.凝血因子类制品费,
    T.细胞因子类制品费,
    
    T.检查用一次性医用材料费,
    T.治疗用一次性医用材料费,
    T.手术用一次性医用材料费,
    
    T.其他费,
    T.配方颗粒费,
    是否使用西药,
    是否使用中成药,
    是否使用中药制剂,
    是否使用传统饮片,
    是否使用配方颗粒

FROM T_Fee T
LEFT JOIN T_Pay P ON T.blh = P.blh;