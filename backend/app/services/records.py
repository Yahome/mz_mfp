from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional

from fastapi import status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.core.errors import AppError
from app.models.base_info import BaseInfo
from app.models.diagnosis import Diagnosis
from app.models.fee_summary import FeeSummary
from app.models.field_audit import FieldAudit
from app.models.herb_detail import HerbDetail
from app.models.medication_summary import MedicationSummary
from app.models.org import Org
from app.models.record import Record
from app.models.export_log import ExportLog
from app.models.surgery import Surgery
from app.models.tcm_operation import TcmOperation
from app.schemas.auth import SessionPayload
from app.schemas.records import (
    BaseInfoPayload,
    DiagnosisItem,
    FeeSummaryReadOnly,
    HerbDetailItem,
    MedicationSummaryReadOnly,
    RecordMeta,
    RecordPayload,
    RecordResponse,
    RecordSaveRequest,
    SurgeryItem,
    TcmOperationItem,
)
from app.services.auth import VisitAccessContext, validate_patient_access
from app.services.external import ExternalDataAdapter
from app.services.utils import as_str, clean_value, first_value
from app.services.validation import ValidationService


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(value: Any) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return str(value)


def _jsonable(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, Mapping):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_jsonable(v) for v in value]
    return value

BASE_INFO_FIELDS = (
    "username",
    "jzkh",
    "xm",
    "xb",
    "csrq",
    "hy",
    "gj",
    "mz",
    "zjlb",
    "zjhm",
    "xzz",
    "lxdh",
    "ywgms",
    "gmyw",
    "qtgms",
    "qtgmy",
    "ghsj",
    "bdsj",
    "jzsj",
    "jzks",
    "jzksdm",
    "jzys",
    "jzyszc",
    "jzlx",
    "fz",
    "sy",
    "mzmtbhz",
    "jzhzfj",
    "jzhzqx",
    "zyzkjsj",
    "hzzs",
)

FEE_FIELDS = (
    "zfy",
    "zfje",
    "ylfwf",
    "zlczf",
    "hlf",
    "qtfy",
    "blzdf",
    "zdf",
    "yxxzdf",
    "lczdxmf",
    "fsszlxmf",
    "zlf",
    "sszlf",
    "mzf",
    "ssf",
    "kff",
    "zyl_zyzd",
    "zyzl",
    "zywz",
    "zygs",
    "zcyjf",
    "zytnzl",
    "zygczl",
    "zytszl",
    "zyqt",
    "zytstpjg",
    "bzss",
    "xyf",
    "kjywf",
    "zcyf",
    "zyzjf",
    "zcyf1",
    "pfklf",
    "xf",
    "bdbblzpf",
    "qdbblzpf",
    "nxyzlzpf",
    "xbyzlzpf",
    "jcyyclf",
    "yyclf",
    "ssycxclf",
    "qtf",
)


def _normalize_seq(items: list[dict[str, Any]], key: str = "seq_no") -> list[dict[str, Any]]:
    if not items:
        return []
    sortable = all(isinstance(item.get(key), int) for item in items)
    if sortable:
        items = sorted(items, key=lambda item: int(item[key]))
    for idx, item in enumerate(items, start=1):
        item[key] = idx
    return items


class RecordService:
    def __init__(self, db: Session, external: ExternalDataAdapter) -> None:
        self.db = db
        self.external = external

    def get_record(self, patient_no: str, session: SessionPayload) -> RecordResponse:
        record = self._load_record(patient_no)
        if record is None:
            raise AppError(code="not_found", message="记录不存在", http_status=status.HTTP_404_NOT_FOUND)
        self._ensure_access(patient_no, session)
        return self._to_response(record)

    def save_draft(self, patient_no: str, session: SessionPayload, request: RecordSaveRequest) -> RecordResponse:
        base_row = self._ensure_access(patient_no, session)
        fee_row = self.external.fetch_patient_fee(patient_no)

        record = self._load_record(patient_no)
        old_snapshot = self._flatten_record(record) if record else {}

        is_new = record is None
        if record is None:
            record = self._create_record(patient_no, session, base_row, fee_row)
        else:
            self._check_version(record, request.version)

        if record.status == "submitted":
            record.status = "draft"
            record.submitted_at = None

        self._apply_payload(record, request.payload)
        self._apply_readonly_from_external(record, fee_row)
        record.prefill_snapshot = {"base_info": _jsonable(base_row), "patient_fee": _jsonable(fee_row)}
        if not is_new:
            record.version = int(record.version) + 1

        self.db.flush()
        self._write_audits(record, old_snapshot, self._flatten_record(record), operator=session)
        self.db.commit()
        self.db.refresh(record)
        return self._to_response(record)

    def submit(self, patient_no: str, session: SessionPayload, request: RecordSaveRequest) -> RecordResponse:
        base_row = self._ensure_access(patient_no, session)
        fee_row = self.external.fetch_patient_fee(patient_no)

        record = self._load_record(patient_no)
        old_snapshot = self._flatten_record(record) if record else {}

        is_new = record is None
        if record is None:
            record = self._create_record(patient_no, session, base_row, fee_row)
        else:
            self._check_version(record, request.version)

        self._apply_payload(record, request.payload)
        self._apply_readonly_from_external(record, fee_row)
        record.prefill_snapshot = {"base_info": _jsonable(base_row), "patient_fee": _jsonable(fee_row)}

        errors = ValidationService(self.db).validate_for_submit(record)
        if errors:
            raise AppError(
                code="validation_failed",
                message="校验失败",
                http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"errors": [error.model_dump() for error in errors]},
            )

        record.status = "submitted"
        record.submitted_at = _now()
        if not is_new:
            record.version = int(record.version) + 1

        self.db.flush()
        self._write_audits(record, old_snapshot, self._flatten_record(record), operator=session)
        self.db.commit()
        self.db.refresh(record)
        return self._to_response(record)

    def _load_record(self, patient_no: str) -> Optional[Record]:
        stmt = (
            select(Record)
            .where(Record.patient_no == patient_no)
            .options(
                joinedload(Record.base_info),
                joinedload(Record.diagnoses),
                joinedload(Record.tcm_operations),
                joinedload(Record.surgeries),
                joinedload(Record.herb_details),
                joinedload(Record.medication_summary),
                joinedload(Record.fee_summary),
            )
        )
        return self.db.execute(stmt).scalars().first()

    def reset_patient(self, patient_no: str, session: SessionPayload) -> dict[str, Any]:
        login = (session.login_name or "").lower()
        roles = {str(r).lower() for r in (session.roles or [])}
        if login != "admin" and "admin" not in roles:
            raise AppError(code="forbidden", message="仅 admin 可执行清理", http_status=status.HTTP_403_FORBIDDEN)

        patient_no = (patient_no or "").strip()
        if not patient_no:
            raise AppError(code="validation_failed", message="patient_no 不能为空", http_status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        record = self._load_record(patient_no)
        deleted_id: Optional[int] = None
        if record:
            deleted_id = record.id
            # 先删导出日志，再删主记录（子表靠级联）
            self.db.execute(delete(ExportLog).where(ExportLog.record_id == record.id))
            self.db.delete(record)
            self.db.flush()

        self.db.commit()
        return {
            "status": "ok",
            "patient_no": patient_no,
            "deleted_record_id": deleted_id,
        }

    def _check_version(self, record: Record, provided: Optional[int]) -> None:
        if provided is None:
            raise AppError(
                code="version_conflict",
                message="缺少 version 参数",
                http_status=status.HTTP_409_CONFLICT,
            )
        if int(record.version) != int(provided):
            raise AppError(
                code="version_conflict",
                message="版本冲突，请刷新后重试",
                http_status=status.HTTP_409_CONFLICT,
                detail={"current_version": int(record.version)},
            )

    def _ensure_access(self, patient_no: str, session: SessionPayload) -> Dict[str, Any]:
        base_row = self.external.fetch_base_info(patient_no)
        if not base_row:
            raise AppError(code="not_found", message="未找到就诊记录", http_status=status.HTTP_404_NOT_FOUND)
        base_map = dict(base_row)
        visit_context = VisitAccessContext(
            dept_code=first_value(base_map, ["JZKSDM", "jzksdm", "DEPT_CODE", "dept_code", "JZKSDMHIS", "jzksdmhis"]),
            doc_code=first_value(base_map, ["JZYS_DM", "JZYSBM", "JZYSBM_CODE", "jzysdm", "DOC_CODE"]),
        )
        validate_patient_access(patient_no, session, visit_context)
        return base_map

    def _ensure_org(self, base_row: Dict[str, Any]) -> Org:
        zzjgdm = as_str(first_value(base_row, ["ZZJGDM", "zzjgdm"]))
        jgmc = as_str(first_value(base_row, ["JGMC", "jgmc"])) or ""
        if not zzjgdm:
            raise AppError(code="external_error", message="外部数据缺少组织机构代码", http_status=500)

        org = self.db.execute(select(Org).where(Org.zzjgdm == zzjgdm)).scalars().first()
        if org:
            if jgmc and org.jgmc != jgmc:
                org.jgmc = jgmc
            return org

        org = Org(jgmc=jgmc or zzjgdm, zzjgdm=zzjgdm, is_active=True)
        self.db.add(org)
        self.db.flush()
        return org

    def _create_record(
        self,
        patient_no: str,
        session: SessionPayload,
        base_row: Dict[str, Any],
        fee_row: Optional[Dict[str, Any]],
    ) -> Record:
        org = self._ensure_org(base_row)
        visit_time = first_value(base_row, ["JZSJ", "jzsj"])
        if not isinstance(visit_time, datetime):
            raise AppError(code="external_error", message="外部数据缺少就诊时间", http_status=500)

        record = Record(
            org_id=org.id,
            patient_no=patient_no,
            visit_time=visit_time,
            status="draft",
            dept_code=session.dept_code,
            doc_code=session.doc_code,
            version=1,
            prefill_snapshot={"base_info": _jsonable(base_row), "patient_fee": _jsonable(fee_row)},
        )
        self.db.add(record)
        self.db.flush()
        return record

    def _apply_payload(self, record: Record, payload: RecordPayload) -> None:
        if record.base_info is None:
            record.base_info = BaseInfo(record_id=record.id, **payload.base_info.model_dump())
        else:
            for key, value in payload.base_info.model_dump().items():
                setattr(record.base_info, key, value)

        self._replace_diagnoses(record, payload.diagnoses)
        self._replace_tcm_ops(record, payload.tcm_operations)
        self._replace_surgeries(record, payload.surgeries)
        self._replace_herbs(record, payload.herb_details)

    def _replace_diagnoses(self, record: Record, items: Iterable[DiagnosisItem]) -> None:
        # 清理旧数据先落库，避免唯一约束(record_id, diag_type, seq_no)与新增冲突
        self.db.execute(delete(Diagnosis).where(Diagnosis.record_id == record.id))
        self.db.flush()
        record.diagnoses.clear()
        grouped: dict[str, list[dict[str, Any]]] = {}
        for item in items:
            grouped.setdefault(item.diag_type, []).append(item.model_dump())

        for diag_type, group_items in grouped.items():
            normalized = _normalize_seq(group_items, key="seq_no")
            for item in normalized:
                record.diagnoses.append(
                    Diagnosis(
                        record_id=record.id,
                        diag_type=diag_type,
                        seq_no=item["seq_no"],
                        diag_name=item["diag_name"],
                        diag_code=item.get("diag_code"),
                        source="manual",
                    )
                )

    def _replace_tcm_ops(self, record: Record, items: Iterable[TcmOperationItem]) -> None:
        self.db.execute(delete(TcmOperation).where(TcmOperation.record_id == record.id))
        self.db.flush()
        record.tcm_operations.clear()
        normalized = _normalize_seq([item.model_dump() for item in items], key="seq_no")
        for item in normalized:
            record.tcm_operations.append(
                TcmOperation(
                    record_id=record.id,
                    seq_no=item["seq_no"],
                    op_name=item["op_name"],
                    op_code=item["op_code"],
                    op_times=item["op_times"],
                    op_days=item.get("op_days"),
                    source="manual",
                )
            )

    def _replace_surgeries(self, record: Record, items: Iterable[SurgeryItem]) -> None:
        self.db.execute(delete(Surgery).where(Surgery.record_id == record.id))
        self.db.flush()
        record.surgeries.clear()
        normalized = _normalize_seq([item.model_dump() for item in items], key="seq_no")
        for item in normalized:
            record.surgeries.append(
                Surgery(
                    record_id=record.id,
                    seq_no=item["seq_no"],
                    op_name=item["op_name"],
                    op_code=item["op_code"],
                    op_time=item["op_time"],
                    operator_name=item["operator_name"],
                    anesthesia_method=item["anesthesia_method"],
                    anesthesia_doctor=item["anesthesia_doctor"],
                    surgery_level=item["surgery_level"],
                    source="manual",
                )
            )

    def _replace_herbs(self, record: Record, items: Iterable[HerbDetailItem]) -> None:
        self.db.execute(delete(HerbDetail).where(HerbDetail.record_id == record.id))
        self.db.flush()
        record.herb_details.clear()
        normalized = _normalize_seq([item.model_dump() for item in items], key="seq_no")
        for item in normalized:
            record.herb_details.append(
                HerbDetail(
                    record_id=record.id,
                    seq_no=item["seq_no"],
                    herb_type=item["herb_type"],
                    route_code=item["route_code"],
                    route_name=item["route_name"],
                    dose_count=item["dose_count"],
                    source="manual",
                )
            )

    def _apply_readonly_from_external(self, record: Record, fee_row: Optional[Dict[str, Any]]) -> None:
        if not fee_row:
            return

        fee_map = dict(fee_row)
        def _get_decimal(keys: list[str]) -> Optional[Decimal]:
            raw = clean_value(first_value(fee_map, keys))
            if raw is None:
                return None
            return Decimal(str(raw))

        zfy = _get_decimal(["ZFY", "总费用"])
        zfje = _get_decimal(["ZFJE", "自付金额", "zffy", "ZFFY"])
        if zfy is None or zfje is None:
            raise AppError(code="external_error", message="外部费用数据缺失", http_status=500)

        fee_values = {
            "zfy": zfy,
            "zfje": zfje,
            "ylfwf": _get_decimal(["YLFWF", "一般医疗服务费"]),
            "zlczf": _get_decimal(["ZLCZF", "一般治疗操作费"]),
            "hlf": _get_decimal(["HLF", "护理费"]),
            "qtfy": _get_decimal(["QTFY", "其他费用", "其他费用合计"]),
            "blzdf": _get_decimal(["BLZDF", "病理诊断费"]),
            "zdf": _get_decimal(["ZDF", "实验室诊断费"]),
            "yxxzdf": _get_decimal(["YXXZDF", "影像学诊断费"]),
            "lczdxmf": _get_decimal(["LCZDXMF", "临床诊断项目费"]),
            "fsszlxmf": _get_decimal(["FSSZLXMF", "非手术治疗项目费"]),
            "zlf": _get_decimal(["ZLF", "临床物理治疗费"]),
            "sszlf": _get_decimal(["SSZLF", "手术治疗费"]),
            "mzf": _get_decimal(["MZF", "麻醉费"]),
            "ssf": _get_decimal(["SSF", "手术费"]),
            "kff": _get_decimal(["KFF", "康复费"]),
            "zyl_zyzd": _get_decimal(["ZYL_ZYZD", "中医辨证论治费", "中医诊断费", "中医诊断"]),
            "zyzl": _get_decimal(["ZYZL", "中医治疗", "中医治疗费用"]),
            "zywz": _get_decimal(["ZYWZ", "中医外治"]),
            "zygs": _get_decimal(["ZYGS", "中医骨伤"]),
            "zcyjf": _get_decimal(["ZCYJF", "针刺与灸法"]),
            "zytnzl": _get_decimal(["ZYTNZL", "中医推拿治疗"]),
            "zygczl": _get_decimal(["ZYGCZL", "中医肛肠治疗"]),
            "zytszl": _get_decimal(["ZYTSZL", "中医特殊治疗"]),
            "zyqt": _get_decimal(["ZYQT", "中医其他", "中医_其他"]),
            "zytstpjg": _get_decimal(["ZYTSTPJG", "中医特殊调配加工", "中药特殊调配加工"]),
            "bzss": _get_decimal(["BZSS", "辨证施膳"]),
            "xyf": _get_decimal(["XYF", "西药费"]),
            "kjywf": _get_decimal(["KJYWF", "抗菌药物费用"]),
            "zcyf": _get_decimal(["ZCYF", "中成药费"]),
            "zyzjf": _get_decimal(["ZYZJF", "医疗机构中药制剂费"]),
            "zcyf1": _get_decimal(["ZCYF1", "中草药费"]),
            "pfklf": _get_decimal(["PFKLF", "配方颗粒费"]),
            "xf": _get_decimal(["XF", "血费"]),
            "bdbblzpf": _get_decimal(["BDBBLZPF", "白蛋白类制品费"]),
            "qdbblzpf": _get_decimal(["QDBBLZPF", "球蛋白类制品费"]),
            "nxyzlzpf": _get_decimal(["NXYZLZPF", "凝血因子类制品费"]),
            "xbyzlzpf": _get_decimal(["XBYZLZPF", "细胞因子类制品费"]),
            "jcyyclf": _get_decimal(["JCYYCLF", "检查用一次性医用材料费"]),
            "yyclf": _get_decimal(["YYCLF", "治疗用一次性医用材料费"]),
            "ssycxclf": _get_decimal(["SSYCXCLF", "手术用一次性医用材料费"]),
            "qtf": _get_decimal(["QTF", "其他费"]),
        }
        if record.fee_summary is None:
            record.fee_summary = FeeSummary(record_id=record.id, **fee_values)
        else:
            for key, value in fee_values.items():
                setattr(record.fee_summary, key, value)

        med_values = {
            "xysy": as_str(clean_value(first_value(fee_map, ["XYSY", "是否使用西药"]))) or "2",
            "zcysy": as_str(clean_value(first_value(fee_map, ["ZCYSY", "是否使用中成药"]))) or "2",
            "zyzjsy": as_str(clean_value(first_value(fee_map, ["ZYZJSY", "是否使用中药制剂"]))) or "2",
            "ctypsy": as_str(clean_value(first_value(fee_map, ["CTYPSY", "是否使用传统饮片"]))) or "2",
            "pfklsy": as_str(clean_value(first_value(fee_map, ["PFKLSY", "是否使用配方颗粒"]))) or "2",
        }
        if record.medication_summary is None:
            record.medication_summary = MedicationSummary(record_id=record.id, **med_values)
        else:
            for key, value in med_values.items():
                setattr(record.medication_summary, key, value)

    def _flatten_record(self, record: Optional[Record]) -> dict[str, Optional[str]]:
        if record is None:
            return {}

        data: dict[str, Optional[str]] = {
            "record.status": _serialize(record.status),
            "record.dept_code": _serialize(record.dept_code),
            "record.doc_code": _serialize(record.doc_code),
            "record.visit_time": _serialize(record.visit_time),
            "record.submitted_at": _serialize(record.submitted_at),
        }

        if record.base_info is not None:
            for field in BASE_INFO_FIELDS:
                data[f"base_info.{field}"] = _serialize(getattr(record.base_info, field))

        for diag in sorted(record.diagnoses or [], key=lambda d: (d.diag_type, d.seq_no)):
            prefix = f"diagnosis.{diag.diag_type}.{diag.seq_no}"
            data[f"{prefix}.diag_name"] = _serialize(diag.diag_name)
            data[f"{prefix}.diag_code"] = _serialize(diag.diag_code)

        for op in sorted(record.tcm_operations or [], key=lambda o: o.seq_no):
            prefix = f"tcm_operation.{op.seq_no}"
            data[f"{prefix}.op_name"] = _serialize(op.op_name)
            data[f"{prefix}.op_code"] = _serialize(op.op_code)
            data[f"{prefix}.op_times"] = _serialize(op.op_times)
            data[f"{prefix}.op_days"] = _serialize(op.op_days)

        for surgery in sorted(record.surgeries or [], key=lambda s: s.seq_no):
            prefix = f"surgery.{surgery.seq_no}"
            data[f"{prefix}.op_name"] = _serialize(surgery.op_name)
            data[f"{prefix}.op_code"] = _serialize(surgery.op_code)
            data[f"{prefix}.op_time"] = _serialize(surgery.op_time)
            data[f"{prefix}.operator_name"] = _serialize(surgery.operator_name)
            data[f"{prefix}.anesthesia_method"] = _serialize(surgery.anesthesia_method)
            data[f"{prefix}.anesthesia_doctor"] = _serialize(surgery.anesthesia_doctor)
            data[f"{prefix}.surgery_level"] = _serialize(surgery.surgery_level)

        for herb in sorted(record.herb_details or [], key=lambda h: h.seq_no):
            prefix = f"herb_detail.{herb.seq_no}"
            data[f"{prefix}.herb_type"] = _serialize(herb.herb_type)
            data[f"{prefix}.route_code"] = _serialize(herb.route_code)
            data[f"{prefix}.route_name"] = _serialize(herb.route_name)
            data[f"{prefix}.dose_count"] = _serialize(herb.dose_count)

        if record.medication_summary is not None:
            data["medication_summary.xysy"] = _serialize(record.medication_summary.xysy)
            data["medication_summary.zcysy"] = _serialize(record.medication_summary.zcysy)
            data["medication_summary.zyzjsy"] = _serialize(record.medication_summary.zyzjsy)
            data["medication_summary.ctypsy"] = _serialize(record.medication_summary.ctypsy)
            data["medication_summary.pfklsy"] = _serialize(record.medication_summary.pfklsy)

        if record.fee_summary is not None:
            for field in FEE_FIELDS:
                data[f"fee_summary.{field}"] = _serialize(getattr(record.fee_summary, field))

        return data

    def _write_audits(
        self,
        record: Record,
        old: dict[str, Optional[str]],
        new: dict[str, Optional[str]],
        operator: SessionPayload,
    ) -> None:
        operator_code = operator.doc_code or operator.login_name
        changes: list[FieldAudit] = []
        for key in sorted(set(old.keys()) | set(new.keys())):
            old_val = old.get(key)
            new_val = new.get(key)
            if old_val == new_val:
                continue
            change_source = "prefill" if key.startswith(("fee_summary.", "medication_summary.")) else "manual"
            changes.append(
                FieldAudit(
                    record_id=record.id,
                    field_key=key,
                    old_value=old_val,
                    new_value=new_val,
                    change_source=change_source,
                    operator_code=operator_code,
                )
            )
        if changes:
            self.db.add_all(changes)

    def _to_response(self, record: Record) -> RecordResponse:
        if record.base_info is None:
            raise AppError(code="internal_error", message="记录缺少基础信息", http_status=500)

        payload = RecordPayload(
            base_info=BaseInfoPayload(**{field: getattr(record.base_info, field) for field in BASE_INFO_FIELDS})
        )

        payload.diagnoses = [
            DiagnosisItem(diag_type=d.diag_type, seq_no=d.seq_no, diag_name=d.diag_name, diag_code=d.diag_code)
            for d in sorted(record.diagnoses or [], key=lambda d: (d.diag_type, d.seq_no))
        ]
        payload.tcm_operations = [
            TcmOperationItem(
                seq_no=o.seq_no, op_name=o.op_name, op_code=o.op_code, op_times=o.op_times, op_days=o.op_days
            )
            for o in sorted(record.tcm_operations or [], key=lambda o: o.seq_no)
        ]
        payload.surgeries = [
            SurgeryItem(
                seq_no=s.seq_no,
                op_name=s.op_name,
                op_code=s.op_code,
                op_time=s.op_time,
                operator_name=s.operator_name,
                anesthesia_method=s.anesthesia_method,
                anesthesia_doctor=s.anesthesia_doctor,
                surgery_level=s.surgery_level,
            )
            for s in sorted(record.surgeries or [], key=lambda s: s.seq_no)
        ]
        payload.herb_details = [
            HerbDetailItem(
                seq_no=h.seq_no,
                herb_type=h.herb_type,
                route_code=h.route_code,
                route_name=h.route_name,
                dose_count=h.dose_count,
            )
            for h in sorted(record.herb_details or [], key=lambda h: h.seq_no)
        ]

        med = None
        if record.medication_summary is not None:
            med = MedicationSummaryReadOnly(
                xysy=record.medication_summary.xysy,
                zcysy=record.medication_summary.zcysy,
                zyzjsy=record.medication_summary.zyzjsy,
                ctypsy=record.medication_summary.ctypsy,
                pfklsy=record.medication_summary.pfklsy,
            )

        fee = None
        if record.fee_summary is not None:
            fee = FeeSummaryReadOnly(**{field: getattr(record.fee_summary, field) for field in FEE_FIELDS})

        return RecordResponse(
            record=RecordMeta(
                record_id=record.id,
                patient_no=record.patient_no,
                status=record.status,
                version=int(record.version),
                visit_time=record.visit_time,
                submitted_at=record.submitted_at,
            ),
            payload=payload,
            medication_summary=med,
            fee_summary=fee,
            prefill_snapshot=record.prefill_snapshot,
        )
