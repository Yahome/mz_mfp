from __future__ import annotations

import re
from collections import defaultdict
from decimal import Decimal
from typing import Any, Iterable, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dict import DictItem
from app.models.record import Record
from app.schemas.validation import FieldError


def _is_missing(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        trimmed = value.strip()
        return trimmed == "" or trimmed == "-"
    return False


def _to_decimal(value: object) -> Optional[Decimal]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _as_int(value: object) -> Optional[int]:
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


_ID18_RE = re.compile(r"^\d{17}[\dXx]$")
_ID15_RE = re.compile(r"^\d{15}$")


def _validate_cn_id(value: str) -> bool:
    value = value.strip()
    if _ID18_RE.match(value):
        factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
        checks = "10X98765432"
        total = sum(int(num) * factor for num, factor in zip(value[:17], factors))
        return checks[total % 11] == value[-1].upper()
    if _ID15_RE.match(value):
        return True
    return False


def _add_error(
    errors: list[FieldError],
    *,
    field: str,
    message: str,
    section: str,
    rule: str = "invalid",
    seq_no: Optional[int] = None,
) -> None:
    errors.append(FieldError(field=field, message=message, section=section, rule=rule, seq_no=seq_no))


def _max_len(value: object) -> int:
    if value is None:
        return 0
    return len(str(value))


def _validate_seq_no_continuous(
    errors: list[FieldError],
    *,
    items: list[Any],
    field_prefix: str,
    section: str,
) -> list[Any]:
    if not items:
        return []

    seqs: list[int] = []
    for item in items:
        seq = _as_int(getattr(item, "seq_no", None))
        if seq is None:
            _add_error(errors, field=field_prefix, message="序号不合法", section=section, rule="seq_no")
            return items
        seqs.append(seq)

    if any(seq <= 0 for seq in seqs):
        _add_error(errors, field=field_prefix, message="序号必须从 1 开始", section=section, rule="seq_no")

    if len(set(seqs)) != len(seqs):
        _add_error(errors, field=field_prefix, message="序号重复", section=section, rule="seq_no")

    expected = list(range(1, len(items) + 1))
    if sorted(seqs) != expected:
        _add_error(errors, field=field_prefix, message="序号不连续（禁止跳号空洞）", section=section, rule="seq_no")

    return items


class ValidationService:
    """后端最终准入校验（提交/导出/打印共用）。"""

    def __init__(self, db: Session) -> None:
        self.db = db

    def validate_for_submit(self, record: Record) -> list[FieldError]:
        errors: list[FieldError] = []

        if record.base_info is None:
            _add_error(errors, field="base_info", message="缺少基础信息", section="基础信息", rule="required")
            return errors

        self._validate_base_info(record, errors)
        self._validate_diagnoses(record, errors)
        self._validate_tcm_operations(record, errors)
        self._validate_surgeries(record, errors)
        self._validate_medication_and_herbs(record, errors)
        self._validate_fee_summary(record, errors)

        self._validate_dict_codes(record, errors)
        return errors

    def _validate_base_info(self, record: Record, errors: list[FieldError]) -> None:
        base = record.base_info
        if base is None:
            return

        required_fields = [
            "username",  # USERNAME
            "jzkh",  # JZKH
            "xm",  # XM
            "xb",  # XB
            "csrq",  # CSRQ
            "hy",  # HY
            "gj",  # GJ
            "mz",  # MZ
            "zjlb",  # ZJLB
            "zjhm",  # ZJHM
            "xzz",  # XZZ
            "lxdh",  # LXDH
            "ywgms",  # YWGMS
            "jzsj",  # JZSJ
            "jzksdm",  # JZKSDM
            "jzys",  # JZYS
            "jzyszc",  # JZYSZC
            "jzlx",  # JZLX
            "fz",  # FZ
            "sy",  # SY
            "mzmtbhz",  # MZMTBHZ
        ]
        for field in required_fields:
            value = getattr(base, field)
            if _is_missing(value):
                _add_error(errors, field=f"base_info.{field}", message="必填项缺失", section="基础信息", rule="required")

        # 长度约束（来自“2...采集接口标准.xlsx”）
        max_len_map = {
            "username": 10,
            "jzkh": 50,
            "xm": 100,
            "xb": 1,
            "hy": 1,
            "gj": 40,
            "mz": 2,
            "zjlb": 1,
            "zjhm": 18,
            "xzz": 200,
            "lxdh": 40,
            "ywgms": 1,
            "gmyw": 500,
            "qtgms": 1,
            "qtgmy": 200,
            "jzks": 100,
            "jzksdm": 50,
            "jzys": 40,
            "jzyszc": 40,
            "jzlx": 1,
            "fz": 1,
            "sy": 1,
            "mzmtbhz": 1,
            "jzhzfj": 1,
            "jzhzqx": 1,
            "hzzs": 1500,
        }
        for field, max_len in max_len_map.items():
            value = getattr(base, field, None)
            if _is_missing(value):
                continue
            if _max_len(value) > max_len:
                _add_error(
                    errors,
                    field=f"base_info.{field}",
                    message=f"长度超限（最大 {max_len}）",
                    section="基础信息",
                    rule="max_length",
                )

        # 时间顺序：JZSJ ≥ BDSJ ≥ GHSJ（存在时校验）
        if base.ghsj and base.bdsj and base.bdsj < base.ghsj:
            _add_error(errors, field="base_info.bdsj", message="报到时间不得早于挂号时间", section="基础信息", rule="time_order")
        if base.bdsj and base.jzsj and base.jzsj < base.bdsj:
            _add_error(errors, field="base_info.jzsj", message="就诊时间不得早于报到时间", section="基础信息", rule="time_order")
        if base.ghsj and base.jzsj and base.jzsj < base.ghsj:
            _add_error(errors, field="base_info.jzsj", message="就诊时间不得早于挂号时间", section="基础信息", rule="time_order")

        # 身份证校验（ZJLB=1）
        if base.zjlb == "1" and not _is_missing(base.zjhm):
            if not _validate_cn_id(str(base.zjhm)):
                _add_error(errors, field="base_info.zjhm", message="身份证号格式或校验位不正确", section="基础信息", rule="idcard")

        # 条件必填：药物过敏史为“有”(RC037=2) => GMYW 必填
        if str(base.ywgms).strip() == "2" and _is_missing(base.gmyw):
            _add_error(
                errors,
                field="base_info.gmyw",
                message="药物过敏史为“有”时，过敏药物必填",
                section="基础信息",
                rule="conditional_required",
            )

        # 条件必填：其他过敏史为“有”(RC037=2) => QTGMY 必填
        if not _is_missing(base.qtgms) and str(base.qtgms).strip() == "2" and _is_missing(base.qtgmy):
            _add_error(
                errors,
                field="base_info.qtgmy",
                message="其他过敏史为“有”时，其他过敏原必填",
                section="基础信息",
                rule="conditional_required",
            )

        # 条件必填：急诊（JZLX=1）=> JZHZFJ/JZHZQX 必填
        if str(base.jzlx).strip() == "1":
            if _is_missing(base.jzhzfj):
                _add_error(
                    errors,
                    field="base_info.jzhzfj",
                    message="急诊就诊类型下，急诊患者分级必填",
                    section="基础信息",
                    rule="conditional_required",
                )
            if _is_missing(base.jzhzqx):
                _add_error(
                    errors,
                    field="base_info.jzhzqx",
                    message="急诊就诊类型下，急诊患者去向必填",
                    section="基础信息",
                    rule="conditional_required",
                )

        # 条件必填：急诊转入院（JZHZQX=7）=> ZYZKJSJ 必填
        if not _is_missing(base.jzhzqx) and str(base.jzhzqx).strip() == "7" and base.zyzkjsj is None:
            _add_error(
                errors,
                field="base_info.zyzkjsj",
                message="急诊患者去向为“急诊转入院”时，住院证开具时间必填",
                section="基础信息",
                rule="conditional_required",
            )

    def _validate_diagnoses(self, record: Record, errors: list[FieldError]) -> None:
        allowed_types = {"tcm_disease_main", "tcm_syndrome", "wm_main", "wm_other"}
        diag_spec = {
            "tcm_disease_main": {"min": 1, "max": 1, "name_max": 100, "code_max": 30, "code_required": True},
            "tcm_syndrome": {"min": 1, "max": 2, "name_max": 100, "code_max": 30, "code_required": True},
            "wm_main": {"min": 1, "max": 1, "name_max": 100, "code_max": 50, "code_required": False},
            "wm_other": {"min": 0, "max": 10, "name_max": 100, "code_max": 50, "code_required": False},
        }

        grouped: dict[str, list[Any]] = defaultdict(list)
        for diag in record.diagnoses or []:
            grouped[str(diag.diag_type)].append(diag)

        for diag_type in sorted(grouped.keys()):
            if diag_type not in allowed_types:
                _add_error(errors, field=f"diagnosis.{diag_type}", message="不支持的诊断类型", section="诊断", rule="invalid_type")

        for diag_type, spec in diag_spec.items():
            rows = sorted(grouped.get(diag_type) or [], key=lambda d: int(d.seq_no))
            if len(rows) < spec["min"]:
                _add_error(
                    errors,
                    field=f"diagnosis.{diag_type}.1.diag_name",
                    message="必填项缺失",
                    section="诊断",
                    rule="required",
                    seq_no=1,
                )
                continue

            if len(rows) > spec["max"]:
                _add_error(
                    errors,
                    field=f"diagnosis.{diag_type}",
                    message=f"条数超限（最多 {spec['max']} 条）",
                    section="诊断",
                    rule="max_count",
                )

            _validate_seq_no_continuous(errors, items=rows, field_prefix=f"diagnosis.{diag_type}", section="诊断")

            for diag in rows:
                seq_no = int(diag.seq_no)
                if _is_missing(diag.diag_name):
                    _add_error(
                        errors,
                        field=f"diagnosis.{diag_type}.{seq_no}.diag_name",
                        message="必填项缺失",
                        section="诊断",
                        rule="required",
                        seq_no=seq_no,
                    )
                elif _max_len(diag.diag_name) > spec["name_max"]:
                    _add_error(
                        errors,
                        field=f"diagnosis.{diag_type}.{seq_no}.diag_name",
                        message=f"长度超限（最大 {spec['name_max']}）",
                        section="诊断",
                        rule="max_length",
                        seq_no=seq_no,
                    )

                if spec["code_required"] and _is_missing(diag.diag_code):
                    _add_error(
                        errors,
                        field=f"diagnosis.{diag_type}.{seq_no}.diag_code",
                        message="必填项缺失",
                        section="诊断",
                        rule="required",
                        seq_no=seq_no,
                    )
                if not _is_missing(diag.diag_code) and _max_len(diag.diag_code) > spec["code_max"]:
                    _add_error(
                        errors,
                        field=f"diagnosis.{diag_type}.{seq_no}.diag_code",
                        message=f"长度超限（最大 {spec['code_max']}）",
                        section="诊断",
                        rule="max_length",
                        seq_no=seq_no,
                    )

    def _validate_tcm_operations(self, record: Record, errors: list[FieldError]) -> None:
        ops = sorted(record.tcm_operations or [], key=lambda o: int(o.seq_no))
        if len(ops) > 10:
            _add_error(errors, field="tcm_operation", message="中医治疗性操作最多 10 条", section="诊疗信息", rule="max_count")
        _validate_seq_no_continuous(errors, items=ops, field_prefix="tcm_operation", section="诊疗信息")

        for op in ops:
            seq_no = int(op.seq_no)
            if _is_missing(op.op_name):
                _add_error(errors, field=f"tcm_operation.{seq_no}.op_name", message="必填项缺失", section="诊疗信息", rule="required", seq_no=seq_no)
            elif _max_len(op.op_name) > 100:
                _add_error(errors, field=f"tcm_operation.{seq_no}.op_name", message="长度超限（最大 100）", section="诊疗信息", rule="max_length", seq_no=seq_no)

            if _is_missing(op.op_code):
                _add_error(errors, field=f"tcm_operation.{seq_no}.op_code", message="必填项缺失", section="诊疗信息", rule="required", seq_no=seq_no)
            elif _max_len(op.op_code) > 20:
                _add_error(errors, field=f"tcm_operation.{seq_no}.op_code", message="长度超限（最大 20）", section="诊疗信息", rule="max_length", seq_no=seq_no)

            if op.op_times is None or int(op.op_times) < 0:
                _add_error(errors, field=f"tcm_operation.{seq_no}.op_times", message="操作次数需为非负整数", section="诊疗信息", rule="range", seq_no=seq_no)

            if op.op_days is not None and int(op.op_days) < 0:
                _add_error(errors, field=f"tcm_operation.{seq_no}.op_days", message="操作天数需为非负整数", section="诊疗信息", rule="range", seq_no=seq_no)

    def _validate_surgeries(self, record: Record, errors: list[FieldError]) -> None:
        surgeries = sorted(record.surgeries or [], key=lambda s: int(s.seq_no))
        if len(surgeries) > 5:
            _add_error(errors, field="surgery", message="手术/操作最多 5 条", section="手术/操作", rule="max_count")
        _validate_seq_no_continuous(errors, items=surgeries, field_prefix="surgery", section="手术/操作")

        for surgery in surgeries:
            seq_no = int(surgery.seq_no)
            required_str_fields = {
                "op_name": (surgery.op_name, 100, "手术/操作名称必填"),
                "op_code": (surgery.op_code, 20, "手术/操作编码必填"),
                "operator_name": (surgery.operator_name, 40, "手术操作者必填"),
                "anesthesia_method": (surgery.anesthesia_method, 6, "麻醉方式必填"),
                "anesthesia_doctor": (surgery.anesthesia_doctor, 40, "麻醉医师必填"),
            }
            for key, (val, max_len, msg) in required_str_fields.items():
                if _is_missing(val):
                    _add_error(errors, field=f"surgery.{seq_no}.{key}", message=msg, section="手术/操作", rule="required", seq_no=seq_no)
                elif _max_len(val) > max_len:
                    _add_error(
                        errors,
                        field=f"surgery.{seq_no}.{key}",
                        message=f"长度超限（最大 {max_len}）",
                        section="手术/操作",
                        rule="max_length",
                        seq_no=seq_no,
                    )

            if surgery.op_time is None:
                _add_error(errors, field=f"surgery.{seq_no}.op_time", message="手术/操作日期必填", section="手术/操作", rule="required", seq_no=seq_no)

            if surgery.surgery_level is None:
                _add_error(errors, field=f"surgery.{seq_no}.surgery_level", message="手术分级必填", section="手术/操作", rule="required", seq_no=seq_no)
            elif int(surgery.surgery_level) < 0:
                _add_error(errors, field=f"surgery.{seq_no}.surgery_level", message="手术分级不合法", section="手术/操作", rule="range", seq_no=seq_no)

    def _validate_medication_and_herbs(self, record: Record, errors: list[FieldError]) -> None:
        med = record.medication_summary
        if med is None:
            _add_error(errors, field="medication_summary", message="缺少用药标识（外部数据未返回）", section="用药", rule="required")
            return

        for field in ["xysy", "zcysy", "zyzjsy", "ctypsy", "pfklsy"]:
            value = getattr(med, field, None)
            if _is_missing(value):
                _add_error(errors, field=f"medication_summary.{field}", message="必填项缺失", section="用药", rule="required")

        herbs = sorted(record.herb_details or [], key=lambda h: int(h.seq_no))
        if len(herbs) > 40:
            _add_error(errors, field="herb_detail", message="中草药明细最多 40 行", section="用药", rule="max_count")

        # 条件必填：使用传统饮片或配方颗粒（RC016=1）=> 至少 1 行
        if str(med.ctypsy).strip() == "1" or str(med.pfklsy).strip() == "1":
            if not herbs:
                _add_error(
                    errors,
                    field="herb_detail",
                    message="已使用传统饮片/配方颗粒时需至少填写 1 行中草药明细",
                    section="用药",
                    rule="conditional_required",
                )

        _validate_seq_no_continuous(errors, items=herbs, field_prefix="herb_detail", section="用药")
        for herb in herbs:
            seq_no = int(herb.seq_no)
            if _is_missing(herb.herb_type) or _is_missing(herb.route_code) or _is_missing(herb.route_name):
                _add_error(errors, field=f"herb_detail.{seq_no}", message="中草药明细同一行字段需完整", section="用药", rule="row_complete", seq_no=seq_no)
                continue

            if _max_len(herb.herb_type) > 1:
                _add_error(errors, field=f"herb_detail.{seq_no}.herb_type", message="长度超限（最大 1）", section="用药", rule="max_length", seq_no=seq_no)
            if _max_len(herb.route_code) > 30:
                _add_error(errors, field=f"herb_detail.{seq_no}.route_code", message="长度超限（最大 30）", section="用药", rule="max_length", seq_no=seq_no)
            if _max_len(herb.route_name) > 100:
                _add_error(errors, field=f"herb_detail.{seq_no}.route_name", message="长度超限（最大 100）", section="用药", rule="max_length", seq_no=seq_no)

            if herb.dose_count is None or int(herb.dose_count) < 0:
                _add_error(errors, field=f"herb_detail.{seq_no}.dose_count", message="用药剂数需为非负整数", section="用药", rule="range", seq_no=seq_no)

    def _validate_fee_summary(self, record: Record, errors: list[FieldError]) -> None:
        fee = record.fee_summary
        if fee is None:
            _add_error(errors, field="fee_summary", message="缺少费用信息（外部数据未返回）", section="费用", rule="required")
            return

        zfy = _to_decimal(getattr(fee, "zfy", None)) or Decimal("0")
        zfje = _to_decimal(getattr(fee, "zfje", None)) or Decimal("0")

        if zfy <= 0:
            _add_error(errors, field="fee_summary.zfy", message="总费用需大于 0", section="费用", rule="fee_relation")

        if zfje < 0 or zfje > zfy:
            _add_error(errors, field="fee_summary.zfje", message="自付金额需满足 0<=ZFJE<=ZFY", section="费用", rule="fee_relation")

        # 各分项：非负且不超过总费用（存在时）
        fee_fields = [
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
        ]
        for field in fee_fields:
            value = _to_decimal(getattr(fee, field, None))
            if value is None:
                continue
            if value < 0:
                _add_error(errors, field=f"fee_summary.{field}", message="金额不得为负数", section="费用", rule="fee_relation")
                continue
            if zfy > 0 and value > zfy:
                _add_error(errors, field=f"fee_summary.{field}", message="分项费用不得大于总费用", section="费用", rule="fee_relation")

        # 关系：SSZLF ≥ MZF + SSF
        sszlf = _to_decimal(getattr(fee, "sszlf", None))
        mzf = _to_decimal(getattr(fee, "mzf", None)) or Decimal("0")
        ssf = _to_decimal(getattr(fee, "ssf", None)) or Decimal("0")
        if sszlf is not None and sszlf < (mzf + ssf):
            _add_error(errors, field="fee_summary.sszlf", message="手术治疗费需满足 SSZLF ≥ MZF + SSF", section="费用", rule="fee_relation")

        # 关系：ZLF ≤ FSSZLXMF
        zlf = _to_decimal(getattr(fee, "zlf", None))
        fssz = _to_decimal(getattr(fee, "fsszlxmf", None))
        if zlf is not None and fssz is not None and zlf > fssz:
            _add_error(errors, field="fee_summary.zlf", message="临床物理治疗费不得大于非手术治疗项目费", section="费用", rule="fee_relation")

        # 关系：KJYWF ≤ XYF
        kjywf = _to_decimal(getattr(fee, "kjywf", None))
        xyf = _to_decimal(getattr(fee, "xyf", None))
        if kjywf is not None and xyf is not None and kjywf > xyf:
            _add_error(errors, field="fee_summary.kjywf", message="抗菌药物费用不得大于西药费", section="费用", rule="fee_relation")

        # 关系：ZYZJF ≤ ZCYF
        zyzjf = _to_decimal(getattr(fee, "zyzjf", None))
        zcyf = _to_decimal(getattr(fee, "zcyf", None))
        if zyzjf is not None and zcyf is not None and zyzjf > zcyf:
            _add_error(errors, field="fee_summary.zyzjf", message="医疗机构中药制剂费不得大于中成药费", section="费用", rule="fee_relation")

        # 关系：ZCYF1 ≥ PFKLF
        zcyf1 = _to_decimal(getattr(fee, "zcyf1", None))
        pfklf = _to_decimal(getattr(fee, "pfklf", None))
        if zcyf1 is not None and pfklf is not None and zcyf1 < pfklf:
            _add_error(errors, field="fee_summary.zcyf1", message="中草药费需满足 ZCYF1 ≥ PFKLF", section="费用", rule="fee_relation")

        # 关系：ZYZL ≥ 中医外治 + 中医骨伤 + 针刺与灸法 + 中医推拿治疗 + 中医肛肠治疗 + 中医特殊治疗
        zyzl = _to_decimal(getattr(fee, "zyzl", None))
        if zyzl is not None:
            parts = [
                _to_decimal(getattr(fee, "zywz", None)) or Decimal("0"),
                _to_decimal(getattr(fee, "zygs", None)) or Decimal("0"),
                _to_decimal(getattr(fee, "zcyjf", None)) or Decimal("0"),
                _to_decimal(getattr(fee, "zytnzl", None)) or Decimal("0"),
                _to_decimal(getattr(fee, "zygczl", None)) or Decimal("0"),
                _to_decimal(getattr(fee, "zytszl", None)) or Decimal("0"),
            ]
            if sum(parts) > zyzl:
                _add_error(errors, field="fee_summary.zyzl", message="中医治疗费需满足 ZYZL ≥ 各子项之和", section="费用", rule="fee_relation")

        # 关系：ZYTSTPJG/BZSS ≤ ZYQT（存在时校验）
        zyqt = _to_decimal(getattr(fee, "zyqt", None))
        zytstpjg = _to_decimal(getattr(fee, "zytstpjg", None))
        bzss = _to_decimal(getattr(fee, "bzss", None))
        if zyqt is not None:
            if zytstpjg is not None and zytstpjg > zyqt:
                _add_error(errors, field="fee_summary.zytstpjg", message="中医特殊调配加工费不得大于中医其他费", section="费用", rule="fee_relation")
            if bzss is not None and bzss > zyqt:
                _add_error(errors, field="fee_summary.bzss", message="辨证施膳费不得大于中医其他费", section="费用", rule="fee_relation")

        # 总费用与一级分项关系（避免对子项重复计入）
        top_level_fields = [
            "ylfwf",
            "zlczf",
            "hlf",
            "qtfy",
            "blzdf",
            "zdf",
            "yxxzdf",
            "lczdxmf",
            "fsszlxmf",
            "sszlf",
            "kff",
            "zyl_zyzd",
            "zyzl",
            "zyqt",
            "xyf",
            "zcyf",
            "zcyf1",
            "xf",
            "bdbblzpf",
            "qdbblzpf",
            "nxyzlzpf",
            "xbyzlzpf",
            "jcyyclf",
            "yyclf",
            "ssycxclf",
            "qtf",
        ]
        total_parts = sum((_to_decimal(getattr(fee, f, None)) or Decimal("0")) for f in top_level_fields)
        if zfy > 0 and total_parts > zfy:
            _add_error(errors, field="fee_summary.zfy", message="总费用需满足 ZFY ≥ 分项费用之和", section="费用", rule="fee_relation")

    def _dict_exists(self, set_code: str, code: str) -> bool:
        stmt = select(DictItem.id).where(
            DictItem.set_code == set_code,
            DictItem.status == 1,
            DictItem.code == code,
        )
        return self.db.execute(stmt.limit(1)).first() is not None

    def _dict_name(self, set_code: str, code: str) -> Optional[str]:
        stmt = select(DictItem.name).where(DictItem.set_code == set_code, DictItem.status == 1, DictItem.code == code)
        return self.db.execute(stmt.limit(1)).scalar_one_or_none()

    def _validate_dict_codes(self, record: Record, errors: list[FieldError]) -> None:
        base = record.base_info
        if base is None:
            return

        base_dict_map = {
            "xb": "RC001",
            "hy": "RC002",
            "mz": "RC035",
            "zjlb": "RC038",
            "ywgms": "RC037",
            "qtgms": "RC037",
            "jzlx": "RC041",
            "jzksdm": "RC023",
            "jzyszc": "RC044",
            "fz": "RC016",
            "sy": "RC016",
            "mzmtbhz": "RC016",
            "jzhzfj": "RC042",
            "jzhzqx": "RC045",
            "gj": "COUNTRY",
        }
        for field, set_code in base_dict_map.items():
            value = getattr(base, field, None)
            if _is_missing(value):
                continue
            if not self._dict_exists(set_code, str(value)):
                _add_error(errors, field=f"base_info.{field}", message=f"字典值不合法（{set_code}）", section="基础信息", rule="dict")

        med = record.medication_summary
        if med is not None:
            for field in ["xysy", "zcysy", "zyzjsy", "ctypsy", "pfklsy"]:
                value = getattr(med, field, None)
                if _is_missing(value):
                    continue
                if not self._dict_exists("RC016", str(value)):
                    _add_error(errors, field=f"medication_summary.{field}", message="用药标识值不合法（RC016）", section="用药", rule="dict")

        for op in record.tcm_operations or []:
            if _is_missing(op.op_code):
                continue
            if not self._dict_exists("ICD9CM3", str(op.op_code)):
                _add_error(errors, field=f"tcm_operation.{op.seq_no}.op_code", message="操作编码不合法（ICD9CM3）", section="诊疗信息", rule="dict", seq_no=op.seq_no)

        for surgery in record.surgeries or []:
            if not _is_missing(surgery.op_code) and not self._dict_exists("ICD9CM3", str(surgery.op_code)):
                _add_error(errors, field=f"surgery.{surgery.seq_no}.op_code", message="手术/操作编码不合法（ICD9CM3）", section="手术/操作", rule="dict", seq_no=surgery.seq_no)
            if not _is_missing(surgery.anesthesia_method) and not self._dict_exists("RC013", str(surgery.anesthesia_method)):
                _add_error(errors, field=f"surgery.{surgery.seq_no}.anesthesia_method", message="麻醉方式编码不合法（RC013）", section="手术/操作", rule="dict", seq_no=surgery.seq_no)
            if not _is_missing(surgery.surgery_level) and not self._dict_exists("RC029", str(surgery.surgery_level)):
                _add_error(errors, field=f"surgery.{surgery.seq_no}.surgery_level", message="手术分级编码不合法（RC029）", section="手术/操作", rule="dict", seq_no=surgery.seq_no)

        for herb in record.herb_details or []:
            if not _is_missing(herb.herb_type) and not self._dict_exists("HERB_TYPE", str(herb.herb_type)):
                _add_error(errors, field=f"herb_detail.{herb.seq_no}.herb_type", message="中草药类别编码不合法（HERB_TYPE）", section="用药", rule="dict", seq_no=herb.seq_no)
            if not _is_missing(herb.route_code) and not self._dict_exists("DRUG_ROUTE", str(herb.route_code)):
                _add_error(errors, field=f"herb_detail.{herb.seq_no}.route_code", message="用药途径编码不合法（DRUG_ROUTE）", section="用药", rule="dict", seq_no=herb.seq_no)
            if not _is_missing(herb.route_code) and not _is_missing(herb.route_name):
                expected_name = self._dict_name("DRUG_ROUTE", str(herb.route_code))
                if expected_name is not None and str(herb.route_name).strip() != expected_name:
                    _add_error(errors, field=f"herb_detail.{herb.seq_no}.route_name", message="用药途径名称与代码不一致", section="用药", rule="dict", seq_no=herb.seq_no)

        for diag in record.diagnoses or []:
            if _is_missing(diag.diag_code):
                continue
            diag_code = str(diag.diag_code)
            set_code: Optional[str] = None
            if diag.diag_type in {"wm_main", "wm_other"}:
                set_code = "ICD10"
            elif diag.diag_type == "tcm_disease_main":
                set_code = "TCM_DISEASE"
            elif diag.diag_type == "tcm_syndrome":
                set_code = "TCM_SYNDROME"
            if set_code and not self._dict_exists(set_code, diag_code):
                _add_error(errors, field=f"diagnosis.{diag.diag_type}.{diag.seq_no}.diag_code", message=f"诊断编码不合法（{set_code}）", section="诊断", rule="dict", seq_no=diag.seq_no)

