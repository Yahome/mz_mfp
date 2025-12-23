import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, message } from "antd";
import type { FormInstance } from "antd";
import { useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";
import type { DiagnosisRow } from "@/components/DiagnosisGroupCard";
import type { HerbRow } from "@/components/HerbDetailCard";
import type { SurgeryRow } from "@/components/SurgeryCard";
import type { TcmOpRow } from "@/components/TcmOperationCard";
import type { RecordStatus } from "@/utils/status";

export type FieldValue = {
  value: unknown;
  source: string;
  readonly: boolean;
};

export type PrefillResponse = {
  patient_no: string;
  visit_time?: string | null;
  fields: Record<string, FieldValue>;
};

export type FieldError = {
  field: string;
  message: string;
  rule?: string;
  section?: string | null;
  seq_no?: number | null;
};

export type RecordMeta = {
  record_id: number;
  patient_no: string;
  status: "draft" | "submitted";
  version: number;
  visit_time: string;
  submitted_at?: string | null;
};

export type RecordResponse = {
  record: RecordMeta;
  payload: {
    base_info: Record<string, any>;
    diagnoses: Array<{
      diag_type: "tcm_disease_main" | "tcm_syndrome" | "wm_main" | "wm_other";
      seq_no: number;
      diag_name: string;
      diag_code?: string | null;
    }>;
    tcm_operations: Array<{
      seq_no: number;
      op_name: string;
      op_code: string;
      op_times: number;
      op_days?: number | null;
    }>;
    surgeries: Array<{
      seq_no: number;
      op_name: string;
      op_code: string;
      op_time: string;
      operator_name: string;
      anesthesia_method: string;
      anesthesia_doctor: string;
      surgery_level: number;
    }>;
    herb_details: Array<{
      seq_no: number;
      herb_type: string;
      route_code: string;
      route_name: string;
      dose_count: number;
    }>;
  };
  medication_summary?: {
    xysy: string;
    zcysy: string;
    zyzjsy: string;
    ctypsy: string;
    pfklsy: string;
  } | null;
  fee_summary?: Record<string, any> | null;
};

export type BaseInfoFormValues = {
  base_info: {
    _show_source?: boolean;
    username: string;
    jzkh: string;
    xm: string;
    xb: string;
    csrq: string;
    hy: string;
    gj: string;
    mz: string;
    zjlb: string;
    zjhm: string;
    xzz: string;
    lxdh: string;
    ywgms: string;
    gmyw?: string;
    qtgms?: string;
    qtgmy?: string;
    ghsj?: string;
    bdsj?: string;
    jzsj: string;
    jzks?: string;
    jzksdm: string;
    jzys: string;
    jzyszc: string;
    jzlx: string;
    fz: string;
    sy: string;
    mzmtbhz: string;
    jzhzfj?: string;
    jzhzqx?: string;
    zyzkjsj?: string;
    hzzs?: string;
  };
};

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toDateValue(value: unknown): string {
  const s = asString(value);
  return s ? s.slice(0, 10) : "";
}

function toDateTimeLocalValue(value: unknown): string {
  const s = asString(value);
  if (!s) return "";
  if (s.includes("T")) return s.slice(0, 16);
  if (s.includes(" ")) return s.replace(" ", "T").slice(0, 16);
  return s.slice(0, 16);
}

function normalizeOptionalString(value: unknown): string | undefined {
  const s = asString(value).trim();
  return s ? s : undefined;
}

function reindexSeq<T extends { seq_no: number }>(rows: T[]): T[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export function buildErrorMap(errors: FieldError[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const err of errors) {
    map[err.field] = map[err.field] ? [...map[err.field], err.message] : [err.message];
  }
  return map;
}

function isEmptyDiagnosisRowValue(diagName: unknown, diagCode: unknown): boolean {
  return !normalizeOptionalString(diagName) && !normalizeOptionalString(diagCode);
}

function validateDiagnosisGroup(opts: {
  diagType: "tcm_disease_main" | "tcm_syndrome" | "wm_main" | "wm_other";
  title: string;
  rows: DiagnosisRow[];
  min: number;
  max: number;
  codeRequired: boolean;
}): FieldError[] {
  const { diagType, title, rows, min, max, codeRequired } = opts;
  const errors: FieldError[] = [];
  const trimmed = rows.map((r) => ({
    ...r,
    diag_name: asString(r.diag_name).trim(),
    diag_code: normalizeOptionalString(r.diag_code),
  }));

  const candidateRows =
    min > 0 ? trimmed : trimmed.filter((r) => !isEmptyDiagnosisRowValue(r.diag_name, r.diag_code));

  if (candidateRows.length < min) {
    errors.push({ field: `diagnosis.${diagType}`, message: `${title} 至少填写 ${min} 条` });
  }
  if (candidateRows.length > max) {
    errors.push({ field: `diagnosis.${diagType}`, message: `${title} 最多填写 ${max} 条` });
  }

  for (const row of reindexSeq(candidateRows)) {
    if (!normalizeOptionalString(row.diag_name)) {
      errors.push({
        field: `diagnosis.${diagType}.${row.seq_no}.diag_name`,
        message: "诊断名称必填",
        seq_no: row.seq_no,
      });
    }
    if (codeRequired && !normalizeOptionalString(row.diag_code)) {
      errors.push({
        field: `diagnosis.${diagType}.${row.seq_no}.diag_code`,
        message: "诊断编码必填",
        seq_no: row.seq_no,
      });
    }
  }
  return errors;
}

function validateSurgeryRows(rows: SurgeryRow[]): FieldError[] {
  const errors: FieldError[] = [];
  const candidates = rows.filter((s) => {
    const hasAnyText =
      !!normalizeOptionalString(s.op_name) ||
      !!normalizeOptionalString(s.op_code) ||
      !!normalizeOptionalString(s.op_time) ||
      !!normalizeOptionalString(s.operator_name) ||
      !!normalizeOptionalString(s.anesthesia_method) ||
      !!normalizeOptionalString(s.anesthesia_doctor);
    return hasAnyText || s.surgery_level !== undefined;
  });
  const normalized = reindexSeq(candidates);
  for (const row of normalized) {
    if (!normalizeOptionalString(row.op_name)) errors.push({ field: `surgery.${row.seq_no}.op_name`, message: "名称必填" });
    if (!normalizeOptionalString(row.op_code)) errors.push({ field: `surgery.${row.seq_no}.op_code`, message: "编码必填" });
    if (!normalizeOptionalString(row.op_time)) errors.push({ field: `surgery.${row.seq_no}.op_time`, message: "日期必填" });
    if (!normalizeOptionalString(row.operator_name))
      errors.push({ field: `surgery.${row.seq_no}.operator_name`, message: "操作者必填" });
    if (!normalizeOptionalString(row.anesthesia_method))
      errors.push({ field: `surgery.${row.seq_no}.anesthesia_method`, message: "麻醉方式必填" });
    if (!normalizeOptionalString(row.anesthesia_doctor))
      errors.push({ field: `surgery.${row.seq_no}.anesthesia_doctor`, message: "麻醉医师必填" });
    if (row.surgery_level === undefined || Number.isNaN(Number(row.surgery_level)))
      errors.push({ field: `surgery.${row.seq_no}.surgery_level`, message: "手术分级必填" });
  }
  return errors;
}

function validateTcmOpRows(rows: TcmOpRow[]): FieldError[] {
  const errors: FieldError[] = [];
  const candidates = rows.filter((o) => {
    const hasAnyText = !!normalizeOptionalString(o.op_name) || !!normalizeOptionalString(o.op_code);
    const hasAnyNumber = Number(o.op_times ?? 0) > 0 || o.op_days !== undefined;
    return hasAnyText || hasAnyNumber;
  });
  const normalized = reindexSeq(candidates);
  for (const row of normalized) {
    if (!normalizeOptionalString(row.op_name)) errors.push({ field: `tcm_operation.${row.seq_no}.op_name`, message: "操作名称必填" });
    if (!normalizeOptionalString(row.op_code)) errors.push({ field: `tcm_operation.${row.seq_no}.op_code`, message: "操作编码必填" });
    if (Number(row.op_times ?? 0) < 0) errors.push({ field: `tcm_operation.${row.seq_no}.op_times`, message: "次数需为非负整数" });
  }
  return errors;
}

function validateHerbRows(rows: HerbRow[]): FieldError[] {
  const errors: FieldError[] = [];
  const candidates = rows.filter((h) => {
    const hasAnyText =
      !!normalizeOptionalString(h.herb_type) ||
      !!normalizeOptionalString(h.route_code) ||
      !!normalizeOptionalString(h.route_name);
    const hasAnyNumber = Number(h.dose_count ?? 0) > 0;
    return hasAnyText || hasAnyNumber;
  });
  const normalized = reindexSeq(candidates);
  for (const row of normalized) {
    if (!normalizeOptionalString(row.herb_type)) errors.push({ field: `herb_detail.${row.seq_no}.herb_type`, message: "类别必填" });
    if (!normalizeOptionalString(row.route_code)) errors.push({ field: `herb_detail.${row.seq_no}.route_code`, message: "途径代码必填" });
    if (!normalizeOptionalString(row.route_name)) errors.push({ field: `herb_detail.${row.seq_no}.route_name`, message: "途径名称必填（请选择途径代码回填）" });
    if (Number(row.dose_count ?? 0) < 0) errors.push({ field: `herb_detail.${row.seq_no}.dose_count`, message: "剂数需为非负整数" });
  }
  return errors;
}

export function useRecordLogic(opts: { patientNo: string; form: FormInstance<BaseInfoFormValues> }) {
  const { patientNo, form } = opts;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [prefill, setPrefill] = useState<PrefillResponse | null>(null);
  const [record, setRecord] = useState<RecordResponse | null>(null);
  const [recordStatus, setRecordStatus] = useState<RecordStatus>("not_created");

  const [tcmDisease, setTcmDisease] = useState<DiagnosisRow[]>([{ seq_no: 1, diag_name: "", diag_code: "" }]);
  const [tcmSyndrome, setTcmSyndrome] = useState<DiagnosisRow[]>([{ seq_no: 1, diag_name: "", diag_code: "" }]);
  const [wmMain, setWmMain] = useState<DiagnosisRow[]>([{ seq_no: 1, diag_name: "", diag_code: "" }]);
  const [wmOther, setWmOther] = useState<DiagnosisRow[]>([]);
  const [tcmOps, setTcmOps] = useState<TcmOpRow[]>([]);
  const [surgeries, setSurgeries] = useState<SurgeryRow[]>([]);
  const [herbRows, setHerbRows] = useState<HerbRow[]>([]);

  const [validationErrors, setValidationErrors] = useState<FieldError[]>([]);
  const errorMap = useMemo(() => buildErrorMap(validationErrors), [validationErrors]);

  const getPrefillValue = useCallback((key: string) => prefill?.fields?.[key]?.value, [prefill]);

  const prefillMeta = useCallback(
    (key: string) => {
      const fv = prefill?.fields?.[key];
      if (!fv) return null;
      return {
        readonly: Boolean(fv.readonly),
        source: fv.source || "prefill",
      };
    },
    [prefill],
  );

  const medicationSummary = useMemo(() => {
    if (record?.medication_summary) return record.medication_summary;
    if (!prefill?.fields) return null;
    return {
      xysy: asString(getPrefillValue("XYSY")),
      zcysy: asString(getPrefillValue("ZCYSY")),
      zyzjsy: asString(getPrefillValue("ZYZJSY")),
      ctypsy: asString(getPrefillValue("CTYPSY")),
      pfklsy: asString(getPrefillValue("PFKLSY")),
    };
  }, [getPrefillValue, prefill?.fields, record?.medication_summary]);

  const feeSummary = useMemo(() => {
    if (record?.fee_summary) return record.fee_summary;
    if (!prefill?.fields) return null;
    return {
      zfy: asString(getPrefillValue("ZFY")),
      zfje: asString(getPrefillValue("ZFJE")),
      ylfwf: asString(getPrefillValue("YLFWF")),
      zlczf: asString(getPrefillValue("ZLCZF")),
    };
  }, [getPrefillValue, prefill?.fields, record?.fee_summary]);

  const applyFieldErrors = useCallback(
    (errors: FieldError[]) => {
      setValidationErrors(errors);
      const baseFieldErrors = errors.filter((e) => e.field.startsWith("base_info."));
      const byField: Record<string, string[]> = {};
      for (const err of baseFieldErrors) {
        const name = err.field.replace("base_info.", "");
        byField[name] = byField[name] ? [...byField[name], err.message] : [err.message];
      }
      const updates = Object.entries(byField).map(([name, msgs]) => ({
        name: ["base_info", name],
        errors: msgs,
      }));
      form.setFields(updates as any);
    },
    [form],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setValidationErrors([]);
    try {
      const prefillResp = await apiClient.get<PrefillResponse>("/mz_mfp/prefill", {
        params: { patient_no: patientNo },
        withCredentials: true,
      });
      setPrefill(prefillResp.data);

      let recordResp: RecordResponse | null = null;
      try {
        const resp = await apiClient.get<RecordResponse>(`/mz_mfp/records/${patientNo}`, { withCredentials: true });
        recordResp = resp.data;
      } catch (err: any) {
        if (err?.response?.status !== 404) throw err;
      }

      setRecord(recordResp);
      setRecordStatus(recordResp ? recordResp.record.status : "not_created");

      const baseFromPrefill = {
        username: asString(prefillResp.data.fields?.USERNAME?.value),
        jzkh: asString(prefillResp.data.fields?.JZKH?.value),
        xm: asString(prefillResp.data.fields?.XM?.value),
        xb: asString(prefillResp.data.fields?.XB?.value),
        csrq: toDateValue(prefillResp.data.fields?.CSRQ?.value),
        hy: asString(prefillResp.data.fields?.HY?.value),
        gj: asString(prefillResp.data.fields?.GJ?.value),
        mz: asString(prefillResp.data.fields?.MZ?.value),
        zjlb: asString(prefillResp.data.fields?.ZJLB?.value),
        zjhm: asString(prefillResp.data.fields?.ZJHM?.value),
        xzz: asString(prefillResp.data.fields?.XZZ?.value),
        lxdh: asString(prefillResp.data.fields?.LXDH?.value),
        ghsj: toDateTimeLocalValue(prefillResp.data.fields?.GHSJ?.value),
        bdsj: toDateTimeLocalValue(prefillResp.data.fields?.BDSJ?.value),
        jzsj: toDateTimeLocalValue(prefillResp.data.fields?.JZSJ?.value || prefillResp.data.visit_time),
        jzks: asString(prefillResp.data.fields?.JZKS?.value),
        jzksdm: asString(prefillResp.data.fields?.JZKSDM?.value),
        jzys: asString(prefillResp.data.fields?.JZYS?.value),
        jzyszc: asString(prefillResp.data.fields?.JZYSZC?.value),
        zyzkjsj: toDateTimeLocalValue(prefillResp.data.fields?.ZYZKJSJ?.value),
      };

      const baseInfo = recordResp
        ? {
            ...recordResp.payload.base_info,
            csrq: toDateValue(recordResp.payload.base_info.csrq),
            ghsj: toDateTimeLocalValue(recordResp.payload.base_info.ghsj),
            bdsj: toDateTimeLocalValue(recordResp.payload.base_info.bdsj),
            jzsj: toDateTimeLocalValue(recordResp.payload.base_info.jzsj),
            zyzkjsj:
              toDateTimeLocalValue(recordResp.payload.base_info.zyzkjsj) ||
              toDateTimeLocalValue(prefillResp.data.fields?.ZYZKJSJ?.value),
          }
        : {
            ...baseFromPrefill,
            ywgms: "",
            jzlx: "",
            fz: "",
            sy: "",
            mzmtbhz: "",
          };

      form.setFieldsValue({ base_info: baseInfo } as BaseInfoFormValues);

      if (recordResp) {
        const byType: Record<string, DiagnosisRow[]> = {};
        for (const d of recordResp.payload.diagnoses || []) {
          byType[d.diag_type] = byType[d.diag_type] || [];
          byType[d.diag_type].push({
            seq_no: d.seq_no,
            diag_name: d.diag_name,
            diag_code: d.diag_code || undefined,
          });
        }
        setTcmDisease(reindexSeq(byType.tcm_disease_main || [{ seq_no: 1, diag_name: "", diag_code: "" }]));
        setTcmSyndrome(reindexSeq(byType.tcm_syndrome || [{ seq_no: 1, diag_name: "", diag_code: "" }]));
        setWmMain(reindexSeq(byType.wm_main || [{ seq_no: 1, diag_name: "", diag_code: "" }]));
        setWmOther(reindexSeq(byType.wm_other || []));
        setTcmOps(
          reindexSeq(
            (recordResp.payload.tcm_operations || []).map((o) => ({
              seq_no: o.seq_no,
              op_name: o.op_name,
              op_code: o.op_code,
              op_times: o.op_times,
              op_days: o.op_days ?? undefined,
            })),
          ),
        );
        setSurgeries(
          reindexSeq(
            (recordResp.payload.surgeries || []).map((s) => ({
              seq_no: s.seq_no,
              op_name: s.op_name,
              op_code: s.op_code,
              op_time: toDateTimeLocalValue(s.op_time),
              operator_name: s.operator_name,
              anesthesia_method: s.anesthesia_method,
              anesthesia_doctor: s.anesthesia_doctor,
              surgery_level: s.surgery_level,
            })),
          ),
        );
        setHerbRows(
          reindexSeq(
            (recordResp.payload.herb_details || []).map((h) => ({
              seq_no: h.seq_no,
              herb_type: h.herb_type,
              route_code: h.route_code,
              route_name: h.route_name,
              dose_count: h.dose_count,
            })),
          ),
        );
      } else {
        setTcmDisease([{ seq_no: 1, diag_name: "", diag_code: "" }]);
        setTcmSyndrome([{ seq_no: 1, diag_name: "", diag_code: "" }]);
        setWmMain([{ seq_no: 1, diag_name: "", diag_code: "" }]);
        setWmOther([]);
        setTcmOps([]);
        setSurgeries([]);
        setHerbRows([]);
      }
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setLoadError(err?.response?.data?.message || err?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [form, navigate, patientNo]);

  useEffect(() => {
    setLoadError(null);
    setValidationErrors([]);
    setRecord(null);
    setPrefill(null);
    setRecordStatus("not_created");
  }, [patientNo]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleApiError = useCallback(
    async (err: any) => {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401) {
        navigate("/login", { replace: true });
        return;
      }
      if (httpStatus === 409) {
        const currentVersion = err?.response?.data?.detail?.current_version;
        Modal.confirm({
          title: "版本冲突",
          content: `当前记录已被他人修改（current_version=${currentVersion ?? "unknown"}），请刷新后重试。`,
          okText: "刷新",
          cancelText: "关闭",
          onOk: () => loadAll(),
        });
        return;
      }
      if (httpStatus === 422) {
        const errs = (err?.response?.data?.detail?.errors || []) as FieldError[];
        if (errs.length) {
          applyFieldErrors(errs);
          message.error("校验失败，请按提示修正后重试");
          return;
        }
      }
      setLoadError(err?.response?.data?.message || err?.message || "请求失败");
    },
    [applyFieldErrors, loadAll, navigate],
  );

  const buildPayload = useCallback(async () => {
    const values = await form.validateFields();

    const localErrors: FieldError[] = [];
    localErrors.push(
      ...validateDiagnosisGroup({
        diagType: "tcm_disease_main",
        title: "中医主病",
        rows: tcmDisease,
        min: 1,
        max: 1,
        codeRequired: true,
      }),
      ...validateDiagnosisGroup({
        diagType: "tcm_syndrome",
        title: "中医证候",
        rows: tcmSyndrome,
        min: 1,
        max: 2,
        codeRequired: true,
      }),
      ...validateDiagnosisGroup({
        diagType: "wm_main",
        title: "西医主要诊断",
        rows: wmMain,
        min: 1,
        max: 1,
        codeRequired: false,
      }),
      ...validateDiagnosisGroup({
        diagType: "wm_other",
        title: "西医其他诊断",
        rows: wmOther,
        min: 0,
        max: 10,
        codeRequired: false,
      }),
      ...validateTcmOpRows(tcmOps),
      ...validateSurgeryRows(surgeries),
      ...validateHerbRows(herbRows),
    );

    if (
      medicationSummary &&
      (String(medicationSummary.ctypsy || "").trim() === "1" || String(medicationSummary.pfklsy || "").trim() === "1")
    ) {
      const hasAnyHerbRow = herbRows.some((h) => {
        const hasAnyText =
          !!normalizeOptionalString(h.herb_type) ||
          !!normalizeOptionalString(h.route_code) ||
          !!normalizeOptionalString(h.route_name);
        const hasAnyNumber = Number(h.dose_count ?? 0) > 0;
        return hasAnyText || hasAnyNumber;
      });
      if (!hasAnyHerbRow) {
        localErrors.push({ field: "herb_detail", message: "已使用传统饮片/配方颗粒时需至少填写 1 行中草药明细" });
      }
    }

    if (localErrors.length) {
      applyFieldErrors(localErrors);
      throw new Error("LOCAL_VALIDATION_FAILED");
    }

    const base = values.base_info;
    const baseInfo = {
      username: asString(base.username).trim(),
      jzkh: asString(base.jzkh).trim(),
      xm: asString(base.xm).trim(),
      xb: asString(base.xb).trim(),
      csrq: asString(base.csrq).trim(),
      hy: asString(base.hy).trim(),
      gj: asString(base.gj).trim(),
      mz: asString(base.mz).trim(),
      zjlb: asString(base.zjlb).trim(),
      zjhm: asString(base.zjhm).trim(),
      xzz: asString(base.xzz).trim(),
      lxdh: asString(base.lxdh).trim(),
      ywgms: asString(base.ywgms).trim(),
      gmyw: normalizeOptionalString(base.gmyw),
      qtgms: normalizeOptionalString(base.qtgms),
      qtgmy: normalizeOptionalString(base.qtgmy),
      ghsj: normalizeOptionalString(base.ghsj),
      bdsj: normalizeOptionalString(base.bdsj),
      jzsj: asString(base.jzsj).trim(),
      jzks: normalizeOptionalString(base.jzks),
      jzksdm: asString(base.jzksdm).trim(),
      jzys: asString(base.jzys).trim(),
      jzyszc: asString(base.jzyszc).trim(),
      jzlx: asString(base.jzlx).trim(),
      fz: asString(base.fz).trim(),
      sy: asString(base.sy).trim(),
      mzmtbhz: asString(base.mzmtbhz).trim(),
      jzhzfj: normalizeOptionalString(base.jzhzfj),
      jzhzqx: normalizeOptionalString(base.jzhzqx),
      zyzkjsj: normalizeOptionalString(base.zyzkjsj),
      hzzs: normalizeOptionalString(base.hzzs),
    };

    const diagnoses: RecordResponse["payload"]["diagnoses"] = [];
    for (const row of reindexSeq(tcmDisease).map((r) => ({ ...r, diag_name: r.diag_name.trim(), diag_code: r.diag_code?.trim() }))) {
      diagnoses.push({
        diag_type: "tcm_disease_main",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }
    for (const row of reindexSeq(tcmSyndrome).map((r) => ({ ...r, diag_name: r.diag_name.trim(), diag_code: r.diag_code?.trim() }))) {
      diagnoses.push({
        diag_type: "tcm_syndrome",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }
    for (const row of reindexSeq(wmMain).map((r) => ({ ...r, diag_name: r.diag_name.trim(), diag_code: r.diag_code?.trim() }))) {
      diagnoses.push({
        diag_type: "wm_main",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }
    for (const row of reindexSeq(wmOther)
      .filter((r) => !isEmptyDiagnosisRowValue(r.diag_name, r.diag_code))
      .map((r) => ({ ...r, diag_name: r.diag_name.trim(), diag_code: r.diag_code?.trim() }))) {
      diagnoses.push({
        diag_type: "wm_other",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }

    const surgeryCandidates = surgeries.filter((s) => {
      const hasAnyText =
        !!normalizeOptionalString(s.op_name) ||
        !!normalizeOptionalString(s.op_code) ||
        !!normalizeOptionalString(s.op_time) ||
        !!normalizeOptionalString(s.operator_name) ||
        !!normalizeOptionalString(s.anesthesia_method) ||
        !!normalizeOptionalString(s.anesthesia_doctor);
      return hasAnyText || s.surgery_level !== undefined;
    });
    const normalizedSurgeries = reindexSeq(surgeryCandidates);

    const tcmOpCandidates = tcmOps.filter((o) => {
      const hasAnyText = !!normalizeOptionalString(o.op_name) || !!normalizeOptionalString(o.op_code);
      const hasAnyNumber = Number(o.op_times ?? 0) > 0 || o.op_days !== undefined;
      return hasAnyText || hasAnyNumber;
    });
    const normalizedTcmOps = reindexSeq(tcmOpCandidates);

    const herbCandidates = herbRows.filter((h) => {
      const hasAnyText =
        !!normalizeOptionalString(h.herb_type) ||
        !!normalizeOptionalString(h.route_code) ||
        !!normalizeOptionalString(h.route_name);
      const hasAnyNumber = Number(h.dose_count ?? 0) > 0;
      return hasAnyText || hasAnyNumber;
    });
    const normalizedHerbs = reindexSeq(herbCandidates);

    const payload = {
      base_info: baseInfo,
      diagnoses,
      tcm_operations: normalizedTcmOps.map((o) => ({
        seq_no: o.seq_no,
        op_name: asString(o.op_name).trim(),
        op_code: asString(o.op_code).trim(),
        op_times: Number(o.op_times ?? 0),
        op_days: o.op_days === undefined ? null : Number(o.op_days),
      })),
      surgeries: normalizedSurgeries.map((s) => ({
        seq_no: s.seq_no,
        op_name: asString(s.op_name).trim(),
        op_code: asString(s.op_code).trim(),
        op_time: asString(s.op_time).trim(),
        operator_name: asString(s.operator_name).trim(),
        anesthesia_method: asString(s.anesthesia_method).trim(),
        anesthesia_doctor: asString(s.anesthesia_doctor).trim(),
        surgery_level: Number(s.surgery_level),
      })),
      herb_details: normalizedHerbs.map((h) => ({
        seq_no: h.seq_no,
        herb_type: asString(h.herb_type).trim(),
        route_code: asString(h.route_code).trim(),
        route_name: asString(h.route_name).trim(),
        dose_count: Number(h.dose_count ?? 0),
      })),
    };
    return payload;
  }, [
    applyFieldErrors,
    form,
    herbRows,
    medicationSummary,
    surgeries,
    tcmDisease,
    tcmOps,
    tcmSyndrome,
    wmMain,
    wmOther,
  ]);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setLoadError(null);
    setValidationErrors([]);
    try {
      const payload = await buildPayload();
      const req: any = { payload };
      if (record?.record?.version) req.version = record.record.version;
      const resp = await apiClient.post<RecordResponse>(`/mz_mfp/records/${patientNo}/draft`, req, {
        withCredentials: true,
      });
      setRecord(resp.data);
      setRecordStatus(resp.data.record.status);
      message.success("已保存");
    } catch (err: any) {
      if (err?.message === "LOCAL_VALIDATION_FAILED") return;
      if (!err?.response) {
        message.error(err?.message || "保存失败");
        return;
      }
      await handleApiError(err);
    } finally {
      setSaving(false);
    }
  }, [buildPayload, handleApiError, patientNo, record?.record?.version]);

  const submitRecord = useCallback(async () => {
    setSaving(true);
    setLoadError(null);
    setValidationErrors([]);
    try {
      const payload = await buildPayload();
      const req: any = { payload };
      if (record?.record?.version) req.version = record.record.version;
      const resp = await apiClient.post<RecordResponse>(`/mz_mfp/records/${patientNo}/submit`, req, {
        withCredentials: true,
      });
      setRecord(resp.data);
      setRecordStatus(resp.data.record.status);
      message.success("已提交");
    } catch (err: any) {
      if (err?.message === "LOCAL_VALIDATION_FAILED") return;
      if (!err?.response) {
        message.error(err?.message || "提交失败");
        return;
      }
      await handleApiError(err);
    } finally {
      setSaving(false);
    }
  }, [buildPayload, handleApiError, patientNo, record?.record?.version]);

  const printPreview = useCallback(async () => {
    if (!record?.record?.record_id) return;
    setSaving(true);
    setValidationErrors([]);
    try {
      const resp = await apiClient.get<string>(`/mz_mfp/records/${record.record.record_id}/print.html`, {
        withCredentials: true,
        responseType: "text" as any,
      });
      const w = window.open("", "_blank");
      if (!w) {
        message.error("无法打开新窗口，请检查浏览器拦截设置");
        return;
      }
      w.document.open();
      w.document.write(resp.data);
      w.document.close();
      w.focus();
      w.print();
    } catch (err: any) {
      await handleApiError(err);
    } finally {
      setSaving(false);
    }
  }, [handleApiError, record?.record?.record_id]);

  return {
    loading,
    saving,
    loadError,
    record,
    recordStatus,
    prefill,
    validationErrors,
    validationErrorsCount: validationErrors.length,
    errorMap,
    prefillMeta,
    medicationSummary,
    feeSummary,
    loadAll,
    saveDraft,
    submitRecord,
    printPreview,

    tcmDisease,
    setTcmDisease,
    tcmSyndrome,
    setTcmSyndrome,
    wmMain,
    setWmMain,
    wmOther,
    setWmOther,
    tcmOps,
    setTcmOps,
    surgeries,
    setSurgeries,
    herbRows,
    setHerbRows,
  };
}
