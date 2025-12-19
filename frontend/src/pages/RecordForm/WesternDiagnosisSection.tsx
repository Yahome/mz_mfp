import { Alert, Space } from "antd";
import DiagnosisGroupCard, { type DiagnosisRow } from "@/components/DiagnosisGroupCard";

type Props = {
  wmMain: DiagnosisRow[];
  setWmMain: (next: DiagnosisRow[]) => void;
  wmOther: DiagnosisRow[];
  setWmOther: (next: DiagnosisRow[]) => void;
  errorMap: Record<string, string[]>;
};

export default function WesternDiagnosisSection({ wmMain, setWmMain, wmOther, setWmOther, errorMap }: Props) {
  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="动态行快捷键"
        description="在“诊断名称”输入框内：Ctrl+Enter 新增；Ctrl+Backspace 删除当前行。"
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
    </Space>
  );
}

