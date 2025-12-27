import { useMemo, useState } from "react";
import { Space, message } from "antd";
import type { DiagnosisDictTarget, DiagnosisRow } from "@/components/DiagnosisGroupCard";
import BoardingPassCard from "@/components/BoardingPassCard";
import DictSearchPanel from "@/components/DictSearchPanel";
import TcmDiagnosisSection from "./TcmDiagnosisSection";
import WesternDiagnosisSection from "./WesternDiagnosisSection";
import type { DictItem } from "@/components/DictRemoteSelect";

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
  const [activeTarget, setActiveTarget] = useState<DiagnosisDictTarget | null>(null);

  const targetLabel = useMemo(() => {
    if (!activeTarget) return null;
    return `${activeTarget.title} 第${activeTarget.rowSeqNo}条`;
  }, [activeTarget]);

  const applyDictItem = (item: DictItem) => {
    if (!activeTarget) return;

    const updateRow = (rows: DiagnosisRow[], setRows: (next: DiagnosisRow[]) => void) => {
      const next = [...rows];
      const row = next[activeTarget.rowIndex];
      if (!row || row.seq_no !== activeTarget.rowSeqNo) {
        message.warning("目标行已变化，请重新点击左侧行后再回填");
        return;
      }
      next[activeTarget.rowIndex] = { ...row, diag_code: item.code, diag_name: item.name };
      setRows(next);
    };

    if (activeTarget.diagType === "tcm_disease_main") updateRow(tcmDisease, setTcmDisease);
    if (activeTarget.diagType === "tcm_syndrome") updateRow(tcmSyndrome, setTcmSyndrome);
    if (activeTarget.diagType === "wm_main") updateRow(wmMain, setWmMain);
    if (activeTarget.diagType === "wm_other") updateRow(wmOther, setWmOther);
  };

  return (
    <div className="dict-panel-layout">
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
              activeTarget={activeTarget}
              onActivateTarget={setActiveTarget}
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
              activeTarget={activeTarget}
              onActivateTarget={setActiveTarget}
            />
          </div>
        </BoardingPassCard>
      </Space>

      <DictSearchPanel
        setCode={activeTarget?.dictSetCode || null}
        targetLabel={targetLabel}
        onApplyItem={applyDictItem}
      />
    </div>
  );
}
