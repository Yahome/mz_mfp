import { useEffect, useMemo, useRef } from "react";
import { Alert, Card, Form, Space, Tag, Typography } from "antd";
import { useSearchParams } from "react-router-dom";
import BaseInfoSection from "./BaseInfoSection";
import DiagnosisSection from "./DiagnosisSection";
import FeeDetailSection from "./FeeDetailSection";
import PatientStickyHeader from "./PatientStickyHeader";
import SurgerySection from "./SurgerySection";
import { useRecordLogic, type BaseInfoFormValues, type FieldError } from "./useRecordLogic";

const { Text } = Typography;

type Props = {
  patientNo: string;
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

function sectionForField(field: string): string {
  if (field.startsWith("base_info.")) return "base";
  if (field.startsWith("diagnosis.")) return "diagnosis";
  if (field.startsWith("tcm_operation.") || field.startsWith("surgery.")) return "surgery";
  if (field.startsWith("herb_detail.") || field.startsWith("medication_summary.") || field.startsWith("fee_summary."))
    return "fee";
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

export default function RecordForm({ patientNo }: Props) {
  const [form] = Form.useForm<BaseInfoFormValues>();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    loading,
    saving,
    loadError,
    record,
    recordStatus,
    validationErrors,
    errorMap,
    prefill,
    prefillTag,
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
  const xm = asString(baseInfo?.xm);
  const xb = asString(baseInfo?.xb);
  const csrq = asString(baseInfo?.csrq);
  const jzks = asString(baseInfo?.jzks);
  const jzksdm = asString(baseInfo?.jzksdm);

  const age = useMemo(() => calcAge(csrq), [csrq]);
  const gender = useMemo(() => formatGender(xb), [xb]);

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
    const allowed = new Set(["base", "diagnosis", "surgery", "fee"]);
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
    const allowed = new Set(["base", "diagnosis", "surgery", "fee"]);
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

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <PatientStickyHeader
        patientNo={patientNo}
        name={xm || "-"}
        gender={gender}
        age={age}
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
        {loadError && <Alert type="error" showIcon message={loadError} />}
        {validationErrors.length > 0 && (
          <Alert type="error" showIcon message="校验失败" description={buildValidationSummary(validationErrors)} />
        )}
        {pediatricsWarning && <Alert type="warning" showIcon message="跨模块逻辑预警" description={pediatricsWarning} />}

        <Form.Provider
          onFormChange={() => {
            if (validationErrors.length) lastErrorRef.current = null;
          }}
        >
          <Form form={form} layout="vertical" size="middle" requiredMark="optional">
            <div style={{ display: currentSection === "base" ? "block" : "none" }}>
              <Card
                size="small"
                title={
                  <Space size="small">
                    基础信息
                    <Tag color="default">就诊时间：{visitTimeText}</Tag>
                  </Space>
                }
              >
                <BaseInfoSection prefillTag={prefillTag} />
              </Card>
            </div>

            <div style={{ display: currentSection === "diagnosis" ? "block" : "none" }}>
              <Card size="small" title="诊断信息">
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
              </Card>
            </div>

            <div style={{ display: currentSection === "surgery" ? "block" : "none" }}>
              <Card size="small" title="手术与操作">
                <SurgerySection
                  tcmOps={tcmOps}
                  setTcmOps={setTcmOps}
                  surgeries={surgeries}
                  setSurgeries={setSurgeries}
                  errorMap={errorMap}
                />
              </Card>
            </div>

            <div style={{ display: currentSection === "fee" ? "block" : "none" }}>
              <Card size="small" title="用药 / 中草药 / 费用">
                <FeeDetailSection
                  medicationSummary={medicationSummary}
                  feeSummary={feeSummary}
                  herbRows={herbRows}
                  setHerbRows={setHerbRows}
                  prefillTag={prefillTag}
                  errorMap={errorMap}
                />
              </Card>
            </div>
          </Form>
        </Form.Provider>
      </Space>
    </Space>
  );
}
