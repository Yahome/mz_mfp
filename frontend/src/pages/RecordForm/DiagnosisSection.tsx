import { Space } from "antd";
import type { DiagnosisRow } from "@/components/DiagnosisGroupCard";
import BoardingPassCard from "@/components/BoardingPassCard";
import TcmDiagnosisSection from "./TcmDiagnosisSection";
import WesternDiagnosisSection from "./WesternDiagnosisSection";

type Props = {
  tcmDisease: DiagnosisRow[];
  setTcmDisease: (next: DiagnosisRow[]) => void;
  tcmSyndrome: DiagnosisRow[];
  setTcmSyndrome: (next: DiagnosisRow[]) => void;
  wmMain: DiagnosisRow[];
  setWmMain: (next: DiagnosisRow[]) => void;
  wmOther: DiagnosisRow[];
  setWmOther: (next: DiagnosisRow[]) => void;
  errorMap: Record<string, string[]>;
};

export default function DiagnosisSection({
  tcmDisease,
  setTcmDisease,
  tcmSyndrome,
  setTcmSyndrome,
  wmMain,
  setWmMain,
  wmOther,
  setWmOther,
  errorMap,
}: Props) {
  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      {/* 中医诊断 */}
      <BoardingPassCard title="中医诊断" variant="success">
        <div style={{ background: "#FFFFFF", borderRadius: "8px", padding: "12px" }}>
          <TcmDiagnosisSection
            tcmDisease={tcmDisease}
            setTcmDisease={setTcmDisease}
            tcmSyndrome={tcmSyndrome}
            setTcmSyndrome={setTcmSyndrome}
            errorMap={errorMap}
          />
        </div>
      </BoardingPassCard>

      {/* 西医诊断 */}
      <BoardingPassCard title="西医诊断" variant="primary">
        <div style={{ background: "#FFFFFF", borderRadius: "8px", padding: "12px" }}>
          <WesternDiagnosisSection
            wmMain={wmMain}
            setWmMain={setWmMain}
            wmOther={wmOther}
            setWmOther={setWmOther}
            errorMap={errorMap}
          />
        </div>
      </BoardingPassCard>
    </Space>
  );
}
