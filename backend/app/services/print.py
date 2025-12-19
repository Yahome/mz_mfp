from __future__ import annotations

from datetime import date, datetime
from html import escape
from typing import Any, Optional

from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.errors import AppError
from app.models.export_log import ExportLog
from app.models.record import Record
from app.schemas.auth import SessionPayload
from app.services.auth import VisitAccessContext, validate_patient_access
from app.services.external import ExternalDataAdapter
from app.services.utils import first_value
from app.services.validation import ValidationService


def _fmt(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.strftime("%Y-%m-%d")
    return str(value)


def _esc(value: Any) -> str:
    return escape(_fmt(value))


class PrintService:
    def __init__(self, db: Session, external: ExternalDataAdapter) -> None:
        self.db = db
        self.external = external

    def render_print_html(self, *, record_id: int, session: SessionPayload) -> str:
        record = self._load_record(record_id)
        if record is None:
            raise AppError(code="not_found", message="记录不存在", http_status=status.HTTP_404_NOT_FOUND)

        try:
            self._ensure_access(record=record, session=session)

            if record.status != "submitted":
                raise AppError(
                    code="validation_failed",
                    message="仅已提交记录允许打印",
                    http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            errors = ValidationService(self.db).validate_for_submit(record)
            if errors:
                raise AppError(
                    code="validation_failed",
                    message="校验失败",
                    http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail={"errors": [err.model_dump() for err in errors]},
                )

            html = self._build_html(record)
            self._log(record_id=record.id, export_type="print", status_="success", created_by=session)
            self.db.commit()
            return html
        except AppError as exc:
            self._log(
                record_id=record.id,
                export_type="print",
                status_="failed",
                created_by=session,
                error_message=exc.message,
                detail={"code": exc.code},
            )
            self.db.commit()
            raise

    def _load_record(self, record_id: int) -> Optional[Record]:
        stmt = (
            select(Record)
            .where(Record.id == record_id)
            .options(
                joinedload(Record.org),
                joinedload(Record.base_info),
                joinedload(Record.diagnoses),
                joinedload(Record.tcm_operations),
                joinedload(Record.surgeries),
                joinedload(Record.medication_summary),
                joinedload(Record.herb_details),
                joinedload(Record.fee_summary),
            )
        )
        return self.db.execute(stmt).scalars().first()

    def _ensure_access(self, *, record: Record, session: SessionPayload) -> None:
        base_row = self.external.fetch_base_info(record.patient_no)
        if not base_row:
            raise AppError(code="not_found", message="未找到就诊记录", http_status=status.HTTP_404_NOT_FOUND)

        base_map = dict(base_row)
        visit_context = VisitAccessContext(
            dept_code=first_value(base_map, ["JZKSDM", "jzksdm", "DEPT_CODE", "dept_code", "JZKSDMHIS", "jzksdmhis"]),
            doc_code=first_value(base_map, ["JZYS_DM", "JZYSBM", "JZYSBM_CODE", "jzysdm", "DOC_CODE"]),
        )
        validate_patient_access(record.patient_no, session, visit_context)

    def _log(
        self,
        *,
        record_id: int,
        export_type: str,
        status_: str,
        created_by: SessionPayload,
        error_message: Optional[str] = None,
        detail: Optional[dict[str, Any]] = None,
    ) -> None:
        operator = created_by.doc_code or created_by.login_name
        self.db.add(
            ExportLog(
                record_id=record_id,
                export_type=export_type,
                file_name=None,
                file_path=None,
                status=status_,
                error_message=error_message,
                detail=detail,
                created_by=operator,
            )
        )

    def _build_html(self, record: Record) -> str:
        base = record.base_info
        org = record.org
        if base is None or org is None:
            raise AppError(code="internal_error", message="记录数据不完整", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 诊断映射（与导出模板字段对齐的最小集合）
        def _first_diag(diag_type: str) -> Optional[Any]:
            items = [d for d in (record.diagnoses or []) if d.diag_type == diag_type]
            if not items:
                return None
            return sorted(items, key=lambda d: int(d.seq_no))[0]

        tcm_disease = _first_diag("tcm_disease_main")
        wm_main = _first_diag("wm_main")
        tcm_syndromes = sorted([d for d in (record.diagnoses or []) if d.diag_type == "tcm_syndrome"], key=lambda d: int(d.seq_no))
        wm_others = sorted([d for d in (record.diagnoses or []) if d.diag_type == "wm_other"], key=lambda d: int(d.seq_no))

        parts: list[str] = []
        parts.append(
            """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>门（急）诊诊疗信息页打印</title>
  <style>
    body { font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; color: #111; }
    h1 { font-size: 18px; margin: 0 0 10px; text-align: center; }
    h2 { font-size: 14px; margin: 14px 0 6px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #333; padding: 6px 8px; font-size: 12px; vertical-align: top; word-wrap: break-word; }
    th { background: #f5f5f5; }
    .kv th { width: 160px; text-align: right; }
    .muted { color: #666; font-size: 11px; }
    @media print {
      .no-print { display: none; }
      a { color: inherit; text-decoration: none; }
      h2 { page-break-after: avoid; }
      table { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
"""
        )

        parts.append(f"<h1>中医门（急）诊诊疗信息页（打印）</h1>")
        parts.append(f"<div class='muted'>RecordID: {_esc(record.id)}　PatientNo: {_esc(record.patient_no)}</div>")

        parts.append("<h2>就诊过程信息</h2>")
        parts.append("<table class='kv'>")
        parts.append(f"<tr><th>医疗机构名称（JGMC）</th><td>{_esc(org.jgmc)}</td><th>组织机构代码（ZZJGDM）</th><td>{_esc(org.zzjgdm)}</td></tr>")
        parts.append(f"<tr><th>系统登录用户名（USERNAME）</th><td>{_esc(base.username)}</td><th>就诊卡号/病案号（JZKH）</th><td>{_esc(base.jzkh)}</td></tr>")
        parts.append(f"<tr><th>挂号时间（GHSJ）</th><td>{_esc(base.ghsj)}</td><th>报到时间（BDSJ）</th><td>{_esc(base.bdsj)}</td></tr>")
        parts.append(f"<tr><th>就诊时间（JZSJ）</th><td>{_esc(base.jzsj)}</td><th>就诊类型（JZLX）</th><td>{_esc(base.jzlx)}</td></tr>")
        parts.append(f"<tr><th>就诊科室（JZKS）</th><td>{_esc(base.jzks)}</td><th>就诊科室代码（JZKSDM）</th><td>{_esc(base.jzksdm)}</td></tr>")
        parts.append(f"<tr><th>接诊医师（JZYS）</th><td>{_esc(base.jzys)}</td><th>接诊医师职称（JZYSZC）</th><td>{_esc(base.jzyszc)}</td></tr>")
        parts.append(f"<tr><th>急诊患者分级（JZHZFJ）</th><td>{_esc(base.jzhzfj)}</td><th>急诊患者去向（JZHZQX）</th><td>{_esc(base.jzhzqx)}</td></tr>")
        parts.append(f"<tr><th>住院证开具时间（ZYZKJSJ）</th><td colspan='3'>{_esc(base.zyzkjsj)}</td></tr>")
        parts.append("</table>")

        parts.append("<h2>患者基本信息</h2>")
        parts.append("<table class='kv'>")
        parts.append(f"<tr><th>姓名（XM）</th><td>{_esc(base.xm)}</td><th>性别（XB）</th><td>{_esc(base.xb)}</td></tr>")
        parts.append(f"<tr><th>出生日期（CSRQ）</th><td>{_esc(base.csrq)}</td><th>婚姻（HY）</th><td>{_esc(base.hy)}</td></tr>")
        parts.append(f"<tr><th>国籍（GJ）</th><td>{_esc(base.gj)}</td><th>民族（MZ）</th><td>{_esc(base.mz)}</td></tr>")
        parts.append(f"<tr><th>证件类别（ZJLB）</th><td>{_esc(base.zjlb)}</td><th>证件号码（ZJHM）</th><td>{_esc(base.zjhm)}</td></tr>")
        parts.append(f"<tr><th>现住址（XZZ）</th><td colspan='3'>{_esc(base.xzz)}</td></tr>")
        parts.append(f"<tr><th>联系电话（LXDH）</th><td>{_esc(base.lxdh)}</td><th>药物过敏史（YWGMS）</th><td>{_esc(base.ywgms)}</td></tr>")
        parts.append(f"<tr><th>过敏药物（GMYW）</th><td colspan='3'>{_esc(base.gmyw)}</td></tr>")
        parts.append(f"<tr><th>其他过敏史（QTGMS）</th><td>{_esc(base.qtgms)}</td><th>其他过敏原（QTGMY）</th><td>{_esc(base.qtgmy)}</td></tr>")
        parts.append("</table>")

        parts.append("<h2>主诉</h2>")
        parts.append("<table class='kv'>")
        parts.append(f"<tr><th>患者主诉（HZZS）</th><td>{_esc(base.hzzs)}</td></tr>")
        parts.append("</table>")

        parts.append("<h2>诊断信息</h2>")
        parts.append("<table>")
        parts.append("<tr><th>类别</th><th>名称</th><th>编码</th></tr>")
        parts.append(
            f"<tr><td>中医疾病（MZD_ZB/JBDM_ZB）</td><td>{_esc(getattr(tcm_disease, 'diag_name', None))}</td><td>{_esc(getattr(tcm_disease, 'diag_code', None))}</td></tr>"
        )
        parts.append(
            f"<tr><td>西医主要诊断（MZZD_ZYZD/MZZD_JBBM）</td><td>{_esc(getattr(wm_main, 'diag_name', None))}</td><td>{_esc(getattr(wm_main, 'diag_code', None))}</td></tr>"
        )
        for item in tcm_syndromes:
            parts.append(
                f"<tr><td>中医证候（第{_esc(item.seq_no)}组）</td><td>{_esc(item.diag_name)}</td><td>{_esc(item.diag_code)}</td></tr>"
            )
        for item in wm_others:
            parts.append(
                f"<tr><td>西医其他诊断（第{_esc(item.seq_no)}条）</td><td>{_esc(item.diag_name)}</td><td>{_esc(item.diag_code)}</td></tr>"
            )
        parts.append("</table>")

        parts.append("<h2>中医治疗性操作（非手术类）</h2>")
        parts.append("<table>")
        parts.append("<tr><th>序号</th><th>名称</th><th>编码</th><th>次数</th><th>天数</th></tr>")
        for op in sorted(record.tcm_operations or [], key=lambda o: int(o.seq_no)):
            parts.append(
                f"<tr><td>{_esc(op.seq_no)}</td><td>{_esc(op.op_name)}</td><td>{_esc(op.op_code)}</td><td>{_esc(op.op_times)}</td><td>{_esc(op.op_days)}</td></tr>"
            )
        if not record.tcm_operations:
            parts.append("<tr><td colspan='5' class='muted'>（无）</td></tr>")
        parts.append("</table>")

        parts.append("<h2>手术/操作</h2>")
        parts.append("<table>")
        parts.append("<tr><th>序号</th><th>名称</th><th>编码</th><th>日期</th><th>操作者</th><th>麻醉方式</th><th>麻醉医师</th><th>分级</th></tr>")
        for s in sorted(record.surgeries or [], key=lambda o: int(o.seq_no)):
            parts.append(
                "<tr>"
                f"<td>{_esc(s.seq_no)}</td>"
                f"<td>{_esc(s.op_name)}</td>"
                f"<td>{_esc(s.op_code)}</td>"
                f"<td>{_esc(s.op_time)}</td>"
                f"<td>{_esc(s.operator_name)}</td>"
                f"<td>{_esc(s.anesthesia_method)}</td>"
                f"<td>{_esc(s.anesthesia_doctor)}</td>"
                f"<td>{_esc(s.surgery_level)}</td>"
                "</tr>"
            )
        if not record.surgeries:
            parts.append("<tr><td colspan='8' class='muted'>（无）</td></tr>")
        parts.append("</table>")

        parts.append("<h2>用药情况</h2>")
        med = record.medication_summary
        parts.append("<table class='kv'>")
        parts.append(
            f"<tr><th>是否使用西药（XYSY）</th><td>{_esc(getattr(med, 'xysy', None))}</td><th>是否使用中成药（ZCYSY）</th><td>{_esc(getattr(med, 'zcysy', None))}</td></tr>"
        )
        parts.append(
            f"<tr><th>是否使用中药制剂（ZYZJSY）</th><td>{_esc(getattr(med, 'zyzjsy', None))}</td><th>是否使用传统饮片（CTYPSY）</th><td>{_esc(getattr(med, 'ctypsy', None))}</td></tr>"
        )
        parts.append(
            f"<tr><th>是否使用配方颗粒（PFKLSY）</th><td colspan='3'>{_esc(getattr(med, 'pfklsy', None))}</td></tr>"
        )
        parts.append("</table>")

        parts.append("<h2>中草药明细</h2>")
        parts.append("<table>")
        parts.append("<tr><th>序号</th><th>类别（ZCYLB）</th><th>途径代码（YYTJDM）</th><th>途径名称（YYTJMC）</th><th>剂数（YYJS）</th></tr>")
        for h in sorted(record.herb_details or [], key=lambda o: int(o.seq_no)):
            parts.append(
                f"<tr><td>{_esc(h.seq_no)}</td><td>{_esc(h.herb_type)}</td><td>{_esc(h.route_code)}</td><td>{_esc(h.route_name)}</td><td>{_esc(h.dose_count)}</td></tr>"
            )
        if not record.herb_details:
            parts.append("<tr><td colspan='5' class='muted'>（无）</td></tr>")
        parts.append("</table>")

        parts.append("<h2>费用信息</h2>")
        fee = record.fee_summary
        parts.append("<table>")
        parts.append("<tr><th>字段</th><th>值</th><th>字段</th><th>值</th></tr>")
        fee_pairs = [
            ("ZFY", getattr(fee, "zfy", None)),
            ("ZFJE", getattr(fee, "zfje", None)),
            ("YLFWF", getattr(fee, "ylfwf", None)),
            ("ZLCZF", getattr(fee, "zlczf", None)),
            ("HLF", getattr(fee, "hlf", None)),
            ("QTFY", getattr(fee, "qtfy", None)),
            ("BLZDF", getattr(fee, "blzdf", None)),
            ("ZDF", getattr(fee, "zdf", None)),
            ("YXXZDF", getattr(fee, "yxxzdf", None)),
            ("LCZDXMF", getattr(fee, "lczdxmf", None)),
            ("FSSZLXMF", getattr(fee, "fsszlxmf", None)),
            ("ZLF", getattr(fee, "zlf", None)),
            ("SSZLF", getattr(fee, "sszlf", None)),
            ("MZF", getattr(fee, "mzf", None)),
            ("SSF", getattr(fee, "ssf", None)),
            ("KFF", getattr(fee, "kff", None)),
            ("ZYL_ZYZD", getattr(fee, "zyl_zyzd", None)),
            ("ZYZL", getattr(fee, "zyzl", None)),
            ("ZYWZ", getattr(fee, "zywz", None)),
            ("ZYGS", getattr(fee, "zygs", None)),
            ("ZCYJF", getattr(fee, "zcyjf", None)),
            ("ZYTNZL", getattr(fee, "zytnzl", None)),
            ("ZYGCZL", getattr(fee, "zygczl", None)),
            ("ZYTSZL", getattr(fee, "zytszl", None)),
            ("ZYQT", getattr(fee, "zyqt", None)),
            ("ZYTSTPJG", getattr(fee, "zytstpjg", None)),
            ("BZSS", getattr(fee, "bzss", None)),
            ("XYF", getattr(fee, "xyf", None)),
            ("KJYWF", getattr(fee, "kjywf", None)),
            ("ZCYF", getattr(fee, "zcyf", None)),
            ("ZYZJF", getattr(fee, "zyzjf", None)),
            ("ZCYF1", getattr(fee, "zcyf1", None)),
            ("PFKLF", getattr(fee, "pfklf", None)),
            ("XF", getattr(fee, "xf", None)),
            ("BDBBLZPF", getattr(fee, "bdbblzpf", None)),
            ("QDBBLZPF", getattr(fee, "qdbblzpf", None)),
            ("NXYZLZPF", getattr(fee, "nxyzlzpf", None)),
            ("XBYZLZPF", getattr(fee, "xbyzlzpf", None)),
            ("JCYYCLF", getattr(fee, "jcyyclf", None)),
            ("YYCLF", getattr(fee, "yyclf", None)),
            ("SSYCXCLF", getattr(fee, "ssycxclf", None)),
            ("QTF", getattr(fee, "qtf", None)),
        ]
        for idx in range(0, len(fee_pairs), 2):
            left = fee_pairs[idx]
            right = fee_pairs[idx + 1] if idx + 1 < len(fee_pairs) else ("", "")
            parts.append(f"<tr><th>{_esc(left[0])}</th><td>{_esc(left[1])}</td><th>{_esc(right[0])}</th><td>{_esc(right[1])}</td></tr>")
        parts.append("</table>")

        parts.append("</body></html>")
        return "".join(parts)

