import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";
import DictRemoteSelect from "@/components/DictRemoteSelect";
import DiagnosisGroupCard, { type DiagnosisRow } from "@/components/DiagnosisGroupCard";
import HerbDetailCard, { type HerbRow } from "@/components/HerbDetailCard";
import SurgeryCard, { type SurgeryRow } from "@/components/SurgeryCard";
import TcmOperationCard, { type TcmOpRow } from "@/components/TcmOperationCard";
import { statusLabel, statusTagColor, type RecordStatus } from "@/utils/status";

type FieldValue = {
  value: unknown;
  source: string;
  readonly: boolean;
};

type PrefillResponse = {
  patient_no: string;
  visit_time?: string | null;
  fields: Record<string, FieldValue>;
};

type FieldError = {
  field: string;
  message: string;
  rule?: string;
  section?: string | null;
  seq_no?: number | null;
};

type RecordMeta = {
  record_id: number;
  patient_no: string;
  status: "draft" | "submitted";
  version: number;
  visit_time: string;
  submitted_at?: string | null;
};

type RecordResponse = {
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

type Props = {
  patientNo: string;
};

type BaseInfoFormValues = {
  base_info: {
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

const { Title, Paragraph, Text } = Typography;

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

function buildErrorMap(errors: FieldError[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const err of errors) {
    map[err.field] = map[err.field] ? [...map[err.field], err.message] : [err.message];
  }
  return map;
}

function sectionForField(field: string): string {
  if (field.startsWith("base_info.")) return "base";
  if (field.startsWith("diagnosis.") || field.startsWith("tcm_operation.") || field.startsWith("surgery.")) return "diagnosis";
  if (field.startsWith("herb_detail.") || field.startsWith("medication_summary.")) return "herb";
  if (field.startsWith("fee_summary.")) return "fee";
  return "export";
}

export default function RecordForm({ patientNo }: Props) {
  const [form] = Form.useForm<BaseInfoFormValues>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [prefill, setPrefill] = useState<PrefillResponse | null>(null);
  const [record, setRecord] = useState<RecordResponse | null>(null);
  const [recordStatus, setRecordStatus] = useState<RecordStatus>("not_created");

  const [activePanels, setActivePanels] = useState<string[]>(["base", "diagnosis"]);

  const [tcmDisease, setTcmDisease] = useState<DiagnosisRow[]>([{ seq_no: 1, diag_name: "", diag_code: "" }]);
  const [tcmSyndrome, setTcmSyndrome] = useState<DiagnosisRow[]>([{ seq_no: 1, diag_name: "", diag_code: "" }]);
  const [wmMain, setWmMain] = useState<DiagnosisRow[]>([{ seq_no: 1, diag_name: "", diag_code: "" }]);
  const [wmOther, setWmOther] = useState<DiagnosisRow[]>([]);
  const [tcmOps, setTcmOps] = useState<TcmOpRow[]>([]);
  const [surgeries, setSurgeries] = useState<SurgeryRow[]>([]);
  const [herbRows, setHerbRows] = useState<HerbRow[]>([]);

  const [validationErrors, setValidationErrors] = useState<FieldError[]>([]);
  const errorMap = useMemo(() => buildErrorMap(validationErrors), [validationErrors]);
  const lastErrorRef = useRef<string | null>(null);

  const statusTag = useMemo(
    () => <Tag color={statusTagColor(recordStatus)}>{statusLabel(recordStatus)}</Tag>,
    [recordStatus],
  );

  const getPrefillValue = (key: string) => prefill?.fields?.[key]?.value;

  const prefillTag = (key: string) => {
    const fv = prefill?.fields?.[key];
    if (!fv) return null;
    if (fv.readonly) return <Tag color="gold">只读</Tag>;
    return <Tag color="blue">{fv.source || "prefill"}</Tag>;
  };

  const deriveMedicationSummary = () => {
    if (record?.medication_summary) return record.medication_summary;
    if (!prefill?.fields) return null;
    return {
      xysy: asString(getPrefillValue("XYSY")),
      zcysy: asString(getPrefillValue("ZCYSY")),
      zyzjsy: asString(getPrefillValue("ZYZJSY")),
      ctypsy: asString(getPrefillValue("CTYPSY")),
      pfklsy: asString(getPrefillValue("PFKLSY")),
    };
  };

  const deriveFeeSummary = () => {
    if (record?.fee_summary) return record.fee_summary;
    if (!prefill?.fields) return null;
    return {
      zfy: asString(getPrefillValue("ZFY")),
      zfje: asString(getPrefillValue("ZFJE")),
      ylfwf: asString(getPrefillValue("YLFWF")),
      zlczf: asString(getPrefillValue("ZLCZF")),
    };
  };

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    setValidationErrors([]);
    lastErrorRef.current = null;
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
      };

      const baseInfo = recordResp
        ? {
            ...recordResp.payload.base_info,
            csrq: toDateValue(recordResp.payload.base_info.csrq),
            ghsj: toDateTimeLocalValue(recordResp.payload.base_info.ghsj),
            bdsj: toDateTimeLocalValue(recordResp.payload.base_info.bdsj),
            jzsj: toDateTimeLocalValue(recordResp.payload.base_info.jzsj),
            zyzkjsj: toDateTimeLocalValue(recordResp.payload.base_info.zyzkjsj),
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
  };

  useEffect(() => {
    setLoadError(null);
    setValidationErrors([]);
    setRecord(null);
    setPrefill(null);
    setRecordStatus("not_created");
  }, [patientNo]);

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientNo]);

  useEffect(() => {
    if (!validationErrors.length) return;
    if (lastErrorRef.current === validationErrors[0].field) return;
    lastErrorRef.current = validationErrors[0].field;

    const first = validationErrors[0];
    const section = sectionForField(first.field);
    setActivePanels((prev) => (prev.includes(section) ? prev : [...prev, section]));
    setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (first.field.startsWith("base_info.")) {
        const key = first.field.replace("base_info.", "");
        form.scrollToField(["base_info", key], { behavior: "smooth", block: "center" });
      }
    }, 50);
  }, [form, validationErrors]);

  const applyFieldErrors = (errors: FieldError[]) => {
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
  };

  const handleApiError = async (err: any) => {
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
  };

  const buildPayload = async () => {
    const values = await form.validateFields();
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
    for (const row of reindexSeq(tcmDisease)) {
      diagnoses.push({
        diag_type: "tcm_disease_main",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }
    for (const row of reindexSeq(tcmSyndrome)) {
      diagnoses.push({
        diag_type: "tcm_syndrome",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }
    for (const row of reindexSeq(wmMain)) {
      diagnoses.push({
        diag_type: "wm_main",
        seq_no: row.seq_no,
        diag_name: row.diag_name,
        diag_code: row.diag_code || null,
      });
    }
    for (const row of reindexSeq(wmOther)) {
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
    const surgeryPayload = normalizedSurgeries.map((s) => {
      if (!normalizeOptionalString(s.op_time)) {
        throw new Error(`手术/操作第 ${s.seq_no} 条缺少日期，请补全或删除该行`);
      }
      if (s.surgery_level === undefined) {
        throw new Error(`手术/操作第 ${s.seq_no} 条缺少手术分级，请补全或删除该行`);
      }
      return {
        seq_no: s.seq_no,
        op_name: s.op_name,
        op_code: s.op_code,
        op_time: s.op_time,
        operator_name: s.operator_name,
        anesthesia_method: s.anesthesia_method,
        anesthesia_doctor: s.anesthesia_doctor,
        surgery_level: Number(s.surgery_level),
      };
    });

    const payload = {
      base_info: baseInfo,
      diagnoses,
      tcm_operations: reindexSeq(tcmOps).map((o) => ({
        seq_no: o.seq_no,
        op_name: o.op_name,
        op_code: o.op_code,
        op_times: Number(o.op_times),
        op_days: o.op_days === undefined ? null : Number(o.op_days),
      })),
      surgeries: surgeryPayload,
      herb_details: reindexSeq(herbRows).map((h) => ({
        seq_no: h.seq_no,
        herb_type: h.herb_type,
        route_code: h.route_code,
        route_name: h.route_name,
        dose_count: Number(h.dose_count),
      })),
    };
    return payload;
  };

  const saveDraft = async () => {
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
      if (!err?.response) {
        const msg = err?.message || "保存失败";
        message.error(msg);
        setActivePanels((prev) => (prev.includes("diagnosis") ? prev : [...prev, "diagnosis"]));
        return;
      }
      await handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const submitRecord = async () => {
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
      if (!err?.response) {
        const msg = err?.message || "提交失败";
        message.error(msg);
        setActivePanels((prev) => (prev.includes("diagnosis") ? prev : [...prev, "diagnosis"]));
        return;
      }
      await handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const printPreview = async () => {
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
  };

  const medSummary = deriveMedicationSummary();
  const feeSummary = deriveFeeSummary() as any;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            中医门（急）诊诊疗信息
          </Title>
          {loadError && <Alert type="error" showIcon message={loadError} />}
          {validationErrors.length > 0 && (
            <Alert
              type="error"
              showIcon
              message="校验失败"
              description={
                <div>
                  {validationErrors.slice(0, 6).map((e) => (
                    <div key={e.field}>
                      <Text code>{e.field}</Text>：{e.message}
                    </div>
                  ))}
                  {validationErrors.length > 6 && <div>…共 {validationErrors.length} 条</div>}
                </div>
              }
            />
          )}
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <Statistic
                title="门诊号"
                value={patientNo}
                valueRender={() => <span>{patientNo}</span>}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="就诊时间"
                value={asString(getPrefillValue("JZSJ") || prefill?.visit_time || record?.record?.visit_time || "-")}
              />
            </Col>
            <Col span={6}>
              <Statistic title="科室" value={asString(getPrefillValue("JZKS") || record?.payload?.base_info?.jzks || "-")} />
            </Col>
            <Col span={6}>
              <Statistic title="医生" value={asString(getPrefillValue("JZYS") || record?.payload?.base_info?.jzys || "-")} />
            </Col>
            <Col span={6}>
              <div style={{ paddingTop: 4 }}>
                <Text type="secondary">状态</Text>
                <div>{statusTag}</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ paddingTop: 4 }}>
                <Text type="secondary">版本</Text>
                <div>
                  <Tag color="geekblue">{record?.record?.version ?? "-"}</Tag>
                </div>
              </div>
            </Col>
          </Row>
        </Space>
      </Card>

      <Form form={form} layout="vertical" size="middle" requiredMark="optional">
        <Collapse
          activeKey={activePanels}
          onChange={(keys) => setActivePanels(Array.isArray(keys) ? (keys as string[]) : [String(keys)])}
          destroyInactivePanel
        >
          <Collapse.Panel header="基础信息" key="base">
            <div id="base">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">USERNAME（系统登录用户名）{prefillTag("USERNAME")}</Space>}
                    name={["base_info", "username"]}
                    rules={[{ required: true, message: "必填" }, { max: 10, message: "长度超限（最大 10）" }]}
                  >
                    <Input maxLength={10} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">JZKH（就诊卡号/病案号）{prefillTag("JZKH")}</Space>}
                    name={["base_info", "jzkh"]}
                    rules={[{ required: true, message: "必填" }, { max: 50, message: "长度超限（最大 50）" }]}
                  >
                    <Input maxLength={50} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">姓名（XM）{prefillTag("XM")}</Space>}
                    name={["base_info", "xm"]}
                    rules={[{ required: true, message: "必填" }, { max: 100, message: "长度超限（最大 100）" }]}
                  >
                    <Input maxLength={100} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">性别（XB / RC001）{prefillTag("XB")}</Space>}
                    name={["base_info", "xb"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC001" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">出生日期（CSRQ）{prefillTag("CSRQ")}</Space>}
                    name={["base_info", "csrq"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <Input type="date" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">婚姻（HY / RC002）{prefillTag("HY")}</Space>}
                    name={["base_info", "hy"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC002" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">国籍（GJ / COUNTRY）{prefillTag("GJ")}</Space>}
                    name={["base_info", "gj"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="COUNTRY" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">民族（MZ / RC035）{prefillTag("MZ")}</Space>}
                    name={["base_info", "mz"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC035" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">证件类别（ZJLB / RC038）{prefillTag("ZJLB")}</Space>}
                    name={["base_info", "zjlb"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC038" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">证件号码（ZJHM）{prefillTag("ZJHM")}</Space>}
                    name={["base_info", "zjhm"]}
                    rules={[{ required: true, message: "必填" }, { max: 18, message: "长度超限（最大 18）" }]}
                  >
                    <Input maxLength={18} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">现住址（XZZ）{prefillTag("XZZ")}</Space>}
                    name={["base_info", "xzz"]}
                    rules={[{ required: true, message: "必填" }, { max: 200, message: "长度超限（最大 200）" }]}
                  >
                    <Input maxLength={200} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">联系电话（LXDH）{prefillTag("LXDH")}</Space>}
                    name={["base_info", "lxdh"]}
                    rules={[{ required: true, message: "必填" }, { max: 40, message: "长度超限（最大 40）" }]}
                  >
                    <Input maxLength={40} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="药物过敏史（YWGMS / RC037）"
                    name={["base_info", "ywgms"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC037" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="过敏药物（GMYW）"
                    name={["base_info", "gmyw"]}
                    rules={[{ max: 500, message: "长度超限（最大 500）" }]}
                  >
                    <Input maxLength={500} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="其他过敏史（QTGMS / RC037）" name={["base_info", "qtgms"]}>
                    <DictRemoteSelect setCode="RC037" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="其他过敏原（QTGMY）"
                    name={["base_info", "qtgmy"]}
                    rules={[{ max: 200, message: "长度超限（最大 200）" }]}
                  >
                    <Input maxLength={200} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">挂号时间（GHSJ）{prefillTag("GHSJ")}</Space>}
                    name={["base_info", "ghsj"]}
                  >
                    <Input type="datetime-local" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">报到时间（BDSJ）{prefillTag("BDSJ")}</Space>}
                    name={["base_info", "bdsj"]}
                  >
                    <Input type="datetime-local" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">就诊时间（JZSJ）{prefillTag("JZSJ")}</Space>}
                    name={["base_info", "jzsj"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <Input type="datetime-local" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">就诊科室名称（JZKS）{prefillTag("JZKS")}</Space>}
                    name={["base_info", "jzks"]}
                    rules={[{ max: 100, message: "长度超限（最大 100）" }]}
                  >
                    <Input maxLength={100} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">就诊科室代码（JZKSDM / RC023）{prefillTag("JZKSDM")}</Space>}
                    name={["base_info", "jzksdm"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC023" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">接诊医师（JZYS）{prefillTag("JZYS")}</Space>}
                    name={["base_info", "jzys"]}
                    rules={[{ required: true, message: "必填" }, { max: 40, message: "长度超限（最大 40）" }]}
                  >
                    <Input maxLength={40} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={<Space size="small">接诊医师职称（JZYSZC / RC044）{prefillTag("JZYSZC")}</Space>}
                    name={["base_info", "jzyszc"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC044" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="就诊类型（JZLX / RC041）"
                    name={["base_info", "jzlx"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC041" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="是否复诊（FZ / RC016）" name={["base_info", "fz"]} rules={[{ required: true, message: "必填" }]}>
                    <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="是否输液（SY / RC016）" name={["base_info", "sy"]} rules={[{ required: true, message: "必填" }]}>
                    <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="是否门诊慢特病患者（MZMTBHZ / RC016）"
                    name={["base_info", "mzmtbhz"]}
                    rules={[{ required: true, message: "必填" }]}
                  >
                    <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    label="急诊患者分级（JZHZFJ / RC042）"
                    name={["base_info", "jzhzfj"]}
                    dependencies={[["base_info", "jzlx"]]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const jzlx = getFieldValue(["base_info", "jzlx"]);
                          if (String(jzlx || "").trim() === "3" && !normalizeOptionalString(value)) {
                            return Promise.reject(new Error("急诊就诊类型下必填"));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <DictRemoteSelect setCode="RC042" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="急诊患者去向（JZHZQX / RC045）"
                    name={["base_info", "jzhzqx"]}
                    dependencies={[["base_info", "jzlx"]]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const jzlx = getFieldValue(["base_info", "jzlx"]);
                          if (String(jzlx || "").trim() === "3" && !normalizeOptionalString(value)) {
                            return Promise.reject(new Error("急诊就诊类型下必填"));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <DictRemoteSelect setCode="RC045" allowClear placeholder="远程检索" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="住院证开具时间（ZYZKJSJ）"
                    name={["base_info", "zyzkjsj"]}
                    dependencies={[["base_info", "jzhzqx"]]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          const jzhzqx = getFieldValue(["base_info", "jzhzqx"]);
                          if (String(jzhzqx || "").trim() === "7" && !normalizeOptionalString(value)) {
                            return Promise.reject(new Error("急诊患者去向为“急诊转入院”时必填"));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                  >
                    <Input type="datetime-local" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label="患者主诉（HZZS）"
                    name={["base_info", "hzzs"]}
                    rules={[{ max: 1500, message: "长度超限（最大 1500）" }]}
                  >
                    <Input.TextArea rows={2} maxLength={1500} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </Collapse.Panel>

          <Collapse.Panel header="诊疗信息（诊断/操作/手术）" key="diagnosis">
            <div id="diagnosis">
              <Alert
                type="warning"
                showIcon
                message="多值列表按 seq_no 保序"
                description="删除/新增会自动重排 seq_no，禁止跳号空洞；条数超限将导致提交校验失败。"
                style={{ marginBottom: 12 }}
              />

              <DiagnosisGroupCard
                title="中医主病（必填 1 条）"
                diagType="tcm_disease_main"
                dictSetCode="TCM_DISEASE"
                rows={tcmDisease}
                setRows={setTcmDisease}
                max={1}
                min={1}
                codeRequired
                errorMap={errorMap}
              />
              <DiagnosisGroupCard
                title="中医证候（必填 1 条，最多 2 条）"
                diagType="tcm_syndrome"
                dictSetCode="TCM_SYNDROME"
                rows={tcmSyndrome}
                setRows={setTcmSyndrome}
                max={2}
                min={1}
                codeRequired
                errorMap={errorMap}
              />
              <DiagnosisGroupCard
                title="西医主要诊断（必填 1 条）"
                diagType="wm_main"
                dictSetCode="ICD10"
                rows={wmMain}
                setRows={setWmMain}
                max={1}
                min={1}
                codeRequired={false}
                errorMap={errorMap}
              />
              <DiagnosisGroupCard
                title="西医其他诊断（最多 10 条）"
                diagType="wm_other"
                dictSetCode="ICD10"
                rows={wmOther}
                setRows={setWmOther}
                max={10}
                min={0}
                codeRequired={false}
                errorMap={errorMap}
              />

              <Divider />

              <TcmOperationCard rows={tcmOps} setRows={setTcmOps} errorMap={errorMap} />
              <SurgeryCard rows={surgeries} setRows={setSurgeries} errorMap={errorMap} />
            </div>
          </Collapse.Panel>

          <Collapse.Panel header="用药/中草药（用药标识只读）" key="herb">
            <div id="herb">
              {!medSummary && (
                <Alert
                  type="warning"
                  showIcon
                  message="外部用药标识未返回"
                  description="提交时后端会阻断，请联系信息科确认 V_EMR_MZ_PAGE_FEE 视图字段。"
                  style={{ marginBottom: 12 }}
                />
              )}
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label={<Space size="small">是否使用西药（XYSY）{prefillTag("XYSY")}</Space>}>
                    <Input value={medSummary?.xysy || "-"} readOnly />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={<Space size="small">是否使用中成药（ZCYSY）{prefillTag("ZCYSY")}</Space>}>
                    <Input value={medSummary?.zcysy || "-"} readOnly />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={<Space size="small">是否使用中药制剂（ZYZJSY）{prefillTag("ZYZJSY")}</Space>}>
                    <Input value={medSummary?.zyzjsy || "-"} readOnly />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={<Space size="small">是否使用传统饮片（CTYPSY）{prefillTag("CTYPSY")}</Space>}>
                    <Input value={medSummary?.ctypsy || "-"} readOnly />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<Space size="small">是否使用配方颗粒（PFKLSY）{prefillTag("PFKLSY")}</Space>}>
                    <Input value={medSummary?.pfklsy || "-"} readOnly />
                  </Form.Item>
                </Col>
              </Row>
              <HerbDetailCard rows={herbRows} setRows={setHerbRows} errorMap={errorMap} />
            </div>
          </Collapse.Panel>

          <Collapse.Panel header="费用（只读）" key="fee">
            <div id="fee">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title={<Space size="small">总费用（ZFY）{prefillTag("ZFY")}</Space>} value={feeSummary?.zfy ?? "-"} />
                </Col>
                <Col span={6}>
                  <Statistic title={<Space size="small">自付金额（ZFJE）{prefillTag("ZFJE")}</Space>} value={feeSummary?.zfje ?? "-"} />
                </Col>
                <Col span={6}>
                  <Statistic title={<Space size="small">一般医疗服务费（YLFWF）{prefillTag("YLFWF")}</Space>} value={feeSummary?.ylfwf ?? "-"} />
                </Col>
                <Col span={6}>
                  <Statistic title={<Space size="small">一般治疗操作费（ZLCZF）{prefillTag("ZLCZF")}</Space>} value={feeSummary?.zlczf ?? "-"} />
                </Col>
              </Row>
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                费用字段来自 HIS 费用视图，仅展示；保存/提交时由后端按外部数据刷新并审计。
              </Paragraph>
            </div>
          </Collapse.Panel>

          <Collapse.Panel header="保存/提交/打印" key="export">
            <div id="export">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  提交会触发后端全量校验；打印仅允许已提交记录。
                </Paragraph>
                <Space wrap>
                  <Button type="primary" onClick={saveDraft} loading={saving} disabled={loading}>
                    保存草稿
                  </Button>
                  <Button type="primary" ghost onClick={submitRecord} loading={saving} disabled={loading}>
                    提交
                  </Button>
                  <Button
                    onClick={printPreview}
                    loading={saving}
                    disabled={loading || saving || recordStatus !== "submitted" || !record?.record?.record_id}
                  >
                    打印预览
                  </Button>
                  <Button onClick={loadAll} disabled={loading || saving}>
                    刷新
                  </Button>
                  {record?.record?.record_id && <Tag color="blue">record_id={record.record.record_id}</Tag>}
                </Space>
                {recordStatus !== "submitted" && (
                  <Alert type="info" showIcon message="当前记录未提交，打印按钮已禁用。" />
                )}
              </Space>
            </div>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Space>
  );
}
