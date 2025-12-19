import { Alert, Space } from "antd";
import DiagnosisGroupCard, { type DiagnosisRow } from "@/components/DiagnosisGroupCard";

type Props = {
  tcmDisease: DiagnosisRow[];
  setTcmDisease: (next: DiagnosisRow[]) => void;
  tcmSyndrome: DiagnosisRow[];
  setTcmSyndrome: (next: DiagnosisRow[]) => void;
  errorMap: Record<string, string[]>;
};

export default function TcmDiagnosisSection({
  tcmDisease,
  setTcmDisease,
  tcmSyndrome,
  setTcmSyndrome,
  errorMap,
}: Props) {
  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message="动态行快捷键"
        description="在“诊断名称”输入框内：Ctrl+Enter 新增；Ctrl+Backspace 删除当前行。"
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
    </Space>
  );
}

