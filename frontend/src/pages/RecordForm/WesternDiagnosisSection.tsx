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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
    </div>
  );
}
