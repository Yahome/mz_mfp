import { useEffect, useMemo, useRef } from "react";
import { Alert, Button, Form, Popover, Space, Typography } from "antd";
import { useSearchParams } from "react-router-dom";
import BaseInfoSection from "./BaseInfoSection";
import DiagnosisSection from "./DiagnosisSection";
import MedicationSection from "./MedicationSection";
import FeeSection from "./FeeSection";
import BoardingPassHeader from "./BoardingPassHeader";
import SurgerySection from "./SurgerySection";
import { useRecordLogic, type BaseInfoFormValues, type FieldError } from "./useRecordLogic";

const { Text } = Typography;

type Props = {
  patientNo: string;
};

export type SectionStats = {
  errors: number;
  missing: number;
};

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function calcAge(csrq: string | undefined): number | null {
  const v = (csrq || "").trim();
  if (!v) return null;
  const [yy, mm, dd] = v.split("-").map((x) => Number(x));
  if (!yy || !mm || !dd) return null;
  const now = new Date();
  let age = now.getFullYear() - yy;
  const hasBirthday =
    now.getMonth() + 1 > mm || (now.getMonth() + 1 === mm && now.getDate() >= dd);
  if (!hasBirthday) age -= 1;
  return age < 0 ? null : age;
}

function formatGender(xb: string | undefined): string {
  const v = (xb || "").trim();
  if (!v) return "-";
  if (v === "1") return "男";
  if (v === "2") return "女";
  if (v === "9" || v === "0") return "未知";
  return v;
}

function formatDoctorTitle(jzyszc: string | undefined): string {
  const v = (jzyszc || "").trim();
  if (!v) return "";
  if (v === "1") return "主任医师";
  if (v === "2") return "副主任医师";
  if (v === "3") return "主治医师";
  if (v === "4") return "住院医师";
  return v;
}

function sectionForField(field: string): string {
  if (field.startsWith("base_info.")) return "base";
  if (field.startsWith("diagnosis.")) return "diagnosis";
  if (field.startsWith("tcm_operation.") || field.startsWith("surgery.")) return "surgery";
  if (field.startsWith("herb_detail.") || field.startsWith("medication_summary.")) return "medication";
  if (field.startsWith("fee_summary.")) return "fee";
  return "base";
}

function buildValidationSummary(errors: FieldError[]) {
  return (
    <div>
      {errors.slice(0, 6).map((e) => (
        <div key={`${e.field}-${e.seq_no ?? ""}-${e.rule ?? ""}`}>
          <Text code>{e.field}</Text>：{e.message}
        </div>
      ))}
      {errors.length > 6 && <div>…共 {errors.length} 条</div>}
    </div>
  );
}

type TopStatsHookProps = {
  onStatsChange?: (stats: Record<string, SectionStats>) => void;
  onValidationErrorsChange?: (errors: Array<{ field: string; message: string; section?: string }>) => void;
};

export default function RecordForm({ patientNo, onStatsChange, onValidationErrorsChange }: Props & TopStatsHookProps) {
  const [form] = Form.useForm<BaseInfoFormValues>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading,
    saving,
    loadError,
    record,
    recordStatus,
    validationErrors,
    validationErrorsCount,
    errorMap,
    prefill,
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
  } = useRecordLogic({ patientNo, form });

  const baseInfo = Form.useWatch(["base_info"], form);
  const showSource = Form.useWatch(["base_info", "_show_source"], form);
  const xm = asString(baseInfo?.xm);
  const xb = asString(baseInfo?.xb);
  const csrq = asString(baseInfo?.csrq);
  const jzks = asString(baseInfo?.jzks);
  const jzksdm = asString(baseInfo?.jzksdm);
  const lxdh = asString(baseInfo?.lxdh);
  const jzys = asString(baseInfo?.jzys);
  const jzyszc = asString(baseInfo?.jzyszc);

  const age = useMemo(() => calcAge(csrq), [csrq]);
  const gender = useMemo(() => formatGender(xb), [xb]);
  const doctorTitle = useMemo(() => formatDoctorTitle(jzyszc), [jzyszc]);

  const pediatricsWarning = useMemo(() => {
    const deptName = asString(jzks);
    const deptCode = asString(jzksdm);
    const isPediatrics = /儿科|儿童/.test(deptName) || /(^|-)EK($|-)/i.test(deptCode);
    if (!isPediatrics) return null;
    if (age === null) return null;
    if (age <= 14) return null;
    return `当前科室疑似“儿科”，但年龄为 ${age} 岁（>14）。请确认科室/出生日期是否正确。`;
  }, [age, jzks, jzksdm]);

  const canPrint = useMemo(
    () => recordStatus === "submitted" && !!record?.record?.record_id,
    [record?.record?.record_id, recordStatus],
  );

  const currentSection = useMemo(() => {
    const raw = searchParams.get("section") || "base";
    const allowed = new Set(["base", "diagnosis", "surgery", "medication", "fee"]);
    return allowed.has(raw) ? raw : "base";
  }, [searchParams]);

  useEffect(() => {
    const raw = searchParams.get("section");
    if (!raw) {
      const next = new URLSearchParams(searchParams);
      next.set("section", "base");
      setSearchParams(next, { replace: true });
      return;
    }
    const allowed = new Set(["base", "diagnosis", "surgery", "medication", "fee"]);
    if (!allowed.has(raw)) {
      const next = new URLSearchParams(searchParams);
      next.set("section", "base");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!validationErrors.length) return;
    const first = validationErrors[0];
    if (lastErrorRef.current === first.field) return;
    lastErrorRef.current = first.field;

    const section = sectionForField(first.field);
    {
      const next = new URLSearchParams(searchParams);
      next.set("section", section);
      setSearchParams(next, { replace: true });
    }

    if (first.field.startsWith("base_info.")) {
      const key = first.field.replace("base_info.", "");
      form.scrollToField(["base_info", key], { behavior: "smooth", block: "center" });
    }
  }, [form, searchParams, setSearchParams, validationErrors]);

  const visitTimeText = useMemo(() => {
    return (
      asString(prefill?.fields?.JZSJ?.value) ||
      asString(prefill?.visit_time) ||
      asString(record?.record?.visit_time) ||
      "-"
    );
  }, [prefill?.fields, prefill?.visit_time, record?.record?.visit_time]);

  const groupErrorCounts = useMemo(() => {
    const bySection: Record<string, number> = { base: 0, diagnosis: 0, surgery: 0, fee: 0 };
    for (const err of validationErrors) {
      const section = sectionForField(err.field);
      bySection[section] = (bySection[section] || 0) + 1;
    }
    return bySection;
  }, [validationErrors]);

  const getSectionStats = useMemo(
    () => (section: "base" | "diagnosis" | "surgery" | "medication" | "fee") => ({
      errors: groupErrorCounts[section] || 0,
      missing: 0,
    }),
    [groupErrorCounts],
  );

  useEffect(() => {
    if (!onStatsChange) return;
    onStatsChange({
      base: getSectionStats("base"),
      diagnosis: getSectionStats("diagnosis"),
      surgery: getSectionStats("surgery"),
      medication: getSectionStats("medication"),
      fee: getSectionStats("fee"),
    });
  }, [getSectionStats, onStatsChange]);

  useEffect(() => {
    if (!onValidationErrorsChange) return;
    const errors = validationErrors.map((err) => ({
      field: err.field,
      message: err.message,
      section: sectionForField(err.field),
    }));
    onValidationErrorsChange(errors);
  }, [validationErrors, onValidationErrorsChange]);

  const contentBlurStyle = loading ? { filter: "blur(2px)", pointerEvents: "none", userSelect: "none" } : {};

  return (
    <div style={{ position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "rgba(255,255,255,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
          }}
        >
          <Space direction="vertical" align="center">
            <span className="ant-spin ant-spin-spinning">
              <span className="ant-spin-dot ant-spin-dot-spin">
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
                <i className="ant-spin-dot-item" />
              </span>
            </span>
            <Text type="secondary">患者数据加载中，请稍候…</Text>
          </Space>
        </div>
      )}

      <Space direction="vertical" size="middle" style={{ width: "100%", ...contentBlurStyle }}>
        <BoardingPassHeader
          patientNo={patientNo}
          name={xm}
          gender={gender}
          age={age}
        visitTime={visitTimeText}
        phone={lxdh}
        department={jzks}
        doctor={jzys}
        doctorTitle={doctorTitle}
        recordStatus={recordStatus}
        version={record?.record?.version ?? null}
        loading={loading}
        saving={saving}
        canPrint={canPrint}
        onSaveDraft={saveDraft}
        onSubmit={submitRecord}
        onPrint={printPreview}
        onReload={loadAll}
      />

      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {loadError && <Alert type="error" showIcon banner style={{ borderRadius: 12 }} message={loadError} />}
        {validationErrors.length > 0 && (
          <Alert
            type="error"
            showIcon
            banner
            style={{ borderRadius: 12 }}
            message={
              <Space size="small" wrap>
                <Text strong>校验失败</Text>
                <Text type="secondary">共 {validationErrorsCount} 条</Text>
                <Popover content={buildValidationSummary(validationErrors)} title="错误明细" placement="bottomLeft">
                  <Button type="link" size="small" style={{ padding: 0 }}>
                    查看
                  </Button>
                </Popover>
              </Space>
            }
          />
        )}
        {pediatricsWarning && (
          <Alert
            type="warning"
            showIcon
            banner
            style={{ borderRadius: 12 }}
            message={
              <Space size="small" wrap>
                <Text strong>跨模块预警</Text>
                <Text type="secondary">{pediatricsWarning}</Text>
              </Space>
            }
          />
        )}

        <Form.Provider
          onFormChange={() => {
            if (validationErrors.length) lastErrorRef.current = null;
          }}
        >
          <Form
            form={form}
            layout="vertical"
            size="middle"
            requiredMark="optional"
            className="form-shell"
            initialValues={{ base_info: { _show_source: false } }}
          >
            <div className="flat-panel base-info-panel" style={{ display: currentSection === "base" ? "block" : "none" }}>
              <div className="panel-title">
                基础信息
              </div>
              <BaseInfoSection prefillMeta={prefillMeta} />
            </div>

            <div className="flat-panel" style={{ display: currentSection === "diagnosis" ? "block" : "none" }}>
              <div className="panel-title">诊断信息</div>
              <DiagnosisSection
                tcmDisease={tcmDisease}
                setTcmDisease={setTcmDisease}
                tcmSyndrome={tcmSyndrome}
                setTcmSyndrome={setTcmSyndrome}
                wmMain={wmMain}
                setWmMain={setWmMain}
                wmOther={wmOther}
                setWmOther={setWmOther}
                errorMap={errorMap}
              />
            </div>

            <div className="flat-panel" style={{ display: currentSection === "surgery" ? "block" : "none" }}>
              <div className="panel-title">手术与操作</div>
              <SurgerySection
                tcmOps={tcmOps}
                setTcmOps={setTcmOps}
                surgeries={surgeries}
                setSurgeries={setSurgeries}
                errorMap={errorMap}
              />
            </div>

            <div className="flat-panel" style={{ display: currentSection === "medication" ? "block" : "none" }}>
              <div className="panel-title">用药信息</div>
              <MedicationSection
                medicationSummary={medicationSummary}
                herbRows={herbRows}
                setHerbRows={setHerbRows}
                prefillMeta={prefillMeta}
                errorMap={errorMap}
              />
            </div>

            <div className="flat-panel" style={{ display: currentSection === "fee" ? "block" : "none" }}>
              <div className="panel-title">费用信息</div>
              <FeeSection feeSummary={feeSummary} prefillMeta={prefillMeta} />
            </div>
          </Form>
        </Form.Provider>
      </Space>
    </Space>
    </div>
  );
}
