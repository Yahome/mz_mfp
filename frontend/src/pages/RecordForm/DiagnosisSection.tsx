import { Divider, Space } from "antd";
import type { DiagnosisRow } from "@/components/DiagnosisGroupCard";
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
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <div className="group-block">
        <div className="group-title">中医诊断</div>
        <div className="compact-table">
          <TcmDiagnosisSection
            tcmDisease={tcmDisease}
            setTcmDisease={setTcmDisease}
            tcmSyndrome={tcmSyndrome}
            setTcmSyndrome={setTcmSyndrome}
            errorMap={errorMap}
          />
        </div>
      </div>
      <Divider style={{ margin: "4px 0" }} />
      <div className="group-block">
        <div className="group-title">西医诊断</div>
        <div className="compact-table">
          <WesternDiagnosisSection
            wmMain={wmMain}
            setWmMain={setWmMain}
            wmOther={wmOther}
            setWmOther={setWmOther}
            errorMap={errorMap}
          />
        </div>
      </div>
    </Space>
  );
}
