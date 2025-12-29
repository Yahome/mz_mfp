from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, Optional

from fastapi import status

from app.core.errors import AppError
from app.schemas.prefill import FieldValue, PrefillResponse
from app.schemas.auth import SessionPayload
from app.services.auth import VisitAccessContext, validate_patient_access
from app.services.external import ExternalDataAdapter
from app.services.utils import clean_value, first_value


class PrefillService:
    def __init__(self, adapter: ExternalDataAdapter) -> None:
        self.adapter = adapter

    def prefill(self, patient_no: str, session: SessionPayload) -> PrefillResponse:
        # 先拿基础信息做访问校验，后续耗时查询并行
        try:
            base_info = self.adapter.fetch_base_info(patient_no)
        except AppError:
            raise
        except Exception as exc:
            raise AppError(
                code="external_error",
                message="外部数据暂不可用，请稍后重试",
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            ) from exc

        if not base_info:
            raise AppError(
                code="not_found",
                message="未找到就诊记录",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        base_map = dict(base_info)
        visit_context = VisitAccessContext(
            dept_code=first_value(base_map, ["JZKSDMHIS", "jzksdmhis", "JZKSDM", "jzksdm", "DEPT_CODE", "dept_code"]),
            doc_code=first_value(base_map, ["JZYS_DM", "JZYSBM", "JZYSBM_CODE", "jzysdm", "DOC_CODE"]),
        )
        validate_patient_access(patient_no, session, visit_context)

        fee_info = None
        diagnoses: list[dict[str, Any]] = []
        chief_complaint = None
        herb_rows: list[dict[str, Any]] = []

        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                "fee": executor.submit(self.adapter.fetch_patient_fee, patient_no),
                "diag": executor.submit(self.adapter.fetch_diagnoses, patient_no),
                "chief": executor.submit(self.adapter.fetch_chief_complaint_sqlserver, patient_no),
                "herb": executor.submit(self.adapter.fetch_herb_details, patient_no),
            }
            for name, future in futures.items():
                try:
                    result = future.result()
                    if name == "fee":
                        fee_info = result
                    elif name == "diag":
                        diagnoses = result or []
                    elif name == "chief":
                        chief_complaint = result
                    elif name == "herb":
                        herb_rows = result or []
                except AppError:
                    raise
                except Exception as exc:
                    raise AppError(
                        code="external_error",
                        message="外部数据暂不可用，请稍后重试",
                        http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    ) from exc

        fields = self._build_fields(base_map, dict(fee_info) if fee_info else None, chief_complaint)
        visit_time = first_value(base_map, ["JZSJ", "jzsj"])

        return PrefillResponse(
            patient_no=patient_no,
            visit_time=visit_time,
            record=None,
            fields=fields,
            lists={
                "diagnoses": self._build_diagnosis_lists(diagnoses),
                "herbs": self._build_herb_list(herb_rows),
            },
            hints=[],
        )

    def _build_fields(self, base_map: Dict[str, Any], fee_map: Optional[Dict[str, Any]], chief_complaint: Optional[str]) -> Dict[str, FieldValue]:
        fields: Dict[str, FieldValue] = {}
        base_fields = [
            "USERNAME",
            "JZKH",
            "XM",
            "XB",
            "CSRQ",
            "HY",
            "GJ",
            "MZ",
            "ZJLB",
            "ZJHM",
            "XZZ",
            "LXDH",
            "GHSJ",
            "BDSJ",
            "JZSJ",
            "JZKS",
            "JZKSDM",
            "JZYS",
            "JZYSZC",
            "HZZS",
        ]
        for name in base_fields:
            value = first_value(base_map, [name, name.lower()])
            fields[name] = FieldValue(value=clean_value(value), source="prefill", readonly=False)

        zyzkjsj_raw = first_value(base_map, ["ZYZKJSJ", "zyzkjsj", "ZYZDJSJ", "zyzdjsj"])
        zyzkjsj_value = clean_value(zyzkjsj_raw)
        fields["ZYZKJSJ"] = FieldValue(value=zyzkjsj_value, source="prefill", readonly=zyzkjsj_value is not None)

        # 主诉：优先 OPENQUERY 获取的内容，再回退基础视图字段
        chief_value = clean_value(chief_complaint) or clean_value(first_value(base_map, ["HZZS", "hzzs"]))
        fields["HZZS"] = FieldValue(value=chief_value, source="prefill", readonly=False)

        if fee_map:
            fee_mapping = {
                "ZFY": ["ZFY", "总费用"],
                "ZFJE": ["ZFJE", "自付金额", "zffy", "ZFFY"],
                "YLFWF": ["YLFWF", "一般医疗服务费"],
                "ZLCZF": ["ZLCZF", "一般治疗操作费"],
                "HLF": ["HLF", "护理费"],
                "QTFY": ["QTFY", "其他费用", "其他费用合计"],
                "BLZDF": ["BLZDF", "病理诊断费"],
                "ZDF": ["ZDF", "实验室诊断费"],
                "YXXZDF": ["YXXZDF", "影像学诊断费"],
                "LCZDXMF": ["LCZDXMF", "临床诊断项目费"],
                "FSSZLXMF": ["FSSZLXMF", "非手术治疗项目费"],
                "ZLF": ["ZLF", "临床物理治疗费"],
                "SSZLF": ["SSZLF", "手术治疗费"],
                "MZF": ["MZF", "麻醉费"],
                "SSF": ["SSF", "手术费"],
                "KFF": ["KFF", "康复费"],
                "ZYL_ZYZD": ["ZYL_ZYZD", "中医辨证论治费", "中医诊断费", "中医诊断"],
                "ZYZL": ["ZYZL", "中医治疗", "中医治疗费用"],
                "ZYWZ": ["ZYWZ", "中医外治"],
                "ZYGS": ["ZYGS", "中医骨伤"],
                "ZCYJF": ["ZCYJF", "针刺与灸法"],
                "ZYTNZL": ["ZYTNZL", "中医推拿治疗"],
                "ZYGCZL": ["ZYGCZL", "中医肛肠治疗"],
                "ZYTSZL": ["ZYTSZL", "中医特殊治疗"],
                "ZYQT": ["ZYQT", "中医其他", "中医_其他"],
                "ZYTSTPJG": ["ZYTSTPJG", "中医特殊调配加工", "中药特殊调配加工"],
                "BZSS": ["BZSS", "辨证施膳"],
                "XYF": ["XYF", "西药费"],
                "KJYWF": ["KJYWF", "抗菌药物费用"],
                "ZCYF": ["ZCYF", "中成药费"],
                "ZYZJF": ["ZYZJF", "医疗机构中药制剂费"],
                "ZCYF1": ["ZCYF1", "中草药费"],
                "PFKLF": ["PFKLF", "配方颗粒费"],
                "XF": ["XF", "血费"],
                "BDBBLZPF": ["BDBBLZPF", "白蛋白类制品费"],
                "QDBBLZPF": ["QDBBLZPF", "球蛋白类制品费"],
                "NXYZLZPF": ["NXYZLZPF", "凝血因子类制品费"],
                "XBYZLZPF": ["XBYZLZPF", "细胞因子类制品费"],
                "JCYYCLF": ["JCYYCLF", "检查用一次性医用材料费"],
                "YYCLF": ["YYCLF", "治疗用一次性医用材料费"],
                "SSYCXCLF": ["SSYCXCLF", "手术用一次性医用材料费"],
                "QTF": ["QTF", "其他费"],
            }
            for out_key, candidates in fee_mapping.items():
                value = first_value(fee_map, candidates)
                fields[out_key] = FieldValue(value=clean_value(value), source="prefill", readonly=True)

            med_flags = {
                "XYSY": ["XYSY", "是否使用西药"],
                "ZCYSY": ["ZCYSY", "是否使用中成药"],
                "ZYZJSY": ["ZYZJSY", "是否使用中药制剂"],
                "CTYPSY": ["CTYPSY", "是否使用传统饮片"],
                "PFKLSY": ["PFKLSY", "是否使用配方颗粒"],
            }
            for out_key, candidates in med_flags.items():
                value = first_value(fee_map, candidates)
                fields[out_key] = FieldValue(value=clean_value(value), source="prefill", readonly=True)

        return fields

    def _build_diagnosis_lists(self, rows: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
        # HIS 标识：sort D=西医，B=中医主病，Z=中医证候
        # 诊断序号：西医诊断 diagnosis_no=1 为主诊断，其余为其他
        if not rows:
            return {}

        def _get(row: dict[str, Any], keys: list[str]) -> str:
            return clean_value(first_value(row, keys)) or ""

        parsed = []
        for row in rows:
            parsed.append(
                {
                    "sort": _get(row, ["DIAGNOSIS_HIS_SORT", "sort"]),
                    "diagnosis_no": first_value(row, ["diagnosis_no", "DIAGNOSIS_NO"]),
                    "name": _get(row, ["diagnosis_name", "DIAGNOSIS_NAME", "diagnosis_desc"]),
                    "code": _get(row, ["diagnosis_code", "DIAGNOSIS_CODE"]),
                }
            )

        wm_all = [r for r in parsed if r["sort"] == "D" and r["name"]]
        wm_main = [r for r in wm_all if str(r.get("diagnosis_no")) == "1"]
        wm_other = [r for r in wm_all if str(r.get("diagnosis_no")) != "1"]

        tcm_disease_all = [r for r in parsed if r["sort"] == "B" and r["name"]]
        tcm_disease = sorted(tcm_disease_all, key=lambda r: int(r.get("diagnosis_no") or 1))[:1]

        tcm_syn_all = [r for r in parsed if r["sort"] == "Z" and r["name"]]
        tcm_syn = sorted(tcm_syn_all, key=lambda r: int(r.get("diagnosis_no") or 1))[:2]

        def _to_row(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
            return [
                {
                    "seq_no": idx + 1,
                    "diag_name": r["name"],
                    "diag_code": r["code"],
                }
                for idx, r in enumerate(rows)
            ]

        return {
            "tcm_disease_main": _to_row(tcm_disease),
            "tcm_syndrome": _to_row(tcm_syn),
            "wm_main": _to_row(wm_main[:1]),
            "wm_other": _to_row(wm_other),
        }

    def _build_herb_list(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        sorted_rows = sorted(rows, key=lambda r: int(first_value(r, ["xh"]) or 0))
        result = []
        for idx, r in enumerate(sorted_rows[:40], start=1):
            result.append(
                {
                    "seq_no": idx,
                    "herb_type": clean_value(first_value(r, ["ZCYLB", "zcylb"])) or "",
                    "route_code": clean_value(first_value(r, ["YYTJDM", "yytjdm"])) or "",
                    "route_name": clean_value(first_value(r, ["YYTJMC", "yytjmc"])) or "",
                    "dose_count": int(first_value(r, ["YYJS", "yyjs"]) or 0),
                }
            )
        return result
