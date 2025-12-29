import { useMemo, useState } from "react";
import { Alert, Space, message } from "antd";
import DictSearchPanel from "@/components/DictSearchPanel";
import type { DictItem } from "@/components/DictRemoteSelect";
import type { SurgeryDictTarget, SurgeryRow } from "@/components/SurgeryCard";
import SurgeryCard from "@/components/SurgeryCard";
import type { TcmOpDictTarget, TcmOpRow } from "@/components/TcmOperationCard";
import TcmOperationCard from "@/components/TcmOperationCard";

type Props = {
  tcmOps: TcmOpRow[];
  setTcmOps: (next: TcmOpRow[]) => void;
  surgeries: SurgeryRow[];
  setSurgeries: (next: SurgeryRow[]) => void;
  errorMap: Record<string, string[]>;
};

export default function SurgerySection({ tcmOps, setTcmOps, surgeries, setSurgeries, errorMap }: Props) {
  const [activeTarget, setActiveTarget] = useState<SurgeryDictTarget | TcmOpDictTarget | null>(null);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const targetLabel = useMemo(() => {
    if (!activeTarget) return null;
    return `${activeTarget.title} 第${activeTarget.rowSeqNo}条`;
  }, [activeTarget]);

  const applyDictItem = (item: DictItem) => {
    if (!activeTarget) return;

    const updateRow = <T extends { seq_no: number; op_code: string; op_name: string }>(
      rows: T[],
      setRows: (next: T[]) => void,
    ) => {
      const next = [...rows];
      const row = next[activeTarget.rowIndex];
      if (!row || row.seq_no !== activeTarget.rowSeqNo) {
        message.warning("目标行已变化，请重新点击左侧行后再回填");
        return;
      }
      next[activeTarget.rowIndex] = { ...row, op_code: item.code, op_name: item.name };
      setRows(next);
    };

    if (activeTarget.kind === "tcm_operation") updateRow(tcmOps, setTcmOps);
    if (activeTarget.kind === "surgery") updateRow(surgeries, setSurgeries);
  };

  return (
    <div className="dict-panel-layout">
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <div className="group-block">
          <div className="compact-table">
            <TcmOperationCard
              rows={tcmOps}
              setRows={setTcmOps}
              errorMap={errorMap}
              activeTarget={activeTarget?.kind === "tcm_operation" ? activeTarget : null}
              onActivateTarget={(t) => {
                setActiveTarget(t);
                setFocusTrigger((x) => x + 1);
              }}
            />
          </div>
        </div>
        <div className="group-block">
          <div className="compact-table">
            <SurgeryCard
              rows={surgeries}
              setRows={setSurgeries}
              errorMap={errorMap}
              activeTarget={activeTarget?.kind === "surgery" ? activeTarget : null}
              onActivateTarget={(t) => {
                setActiveTarget(t);
                setFocusTrigger((x) => x + 1);
              }}
            />
          </div>
        </div>
      </Space>

      <DictSearchPanel
        setCode={activeTarget?.setCode || null}
        targetLabel={targetLabel}
        onApplyItem={applyDictItem}
        focusTrigger={focusTrigger}
      />
    </div>
  );
}
