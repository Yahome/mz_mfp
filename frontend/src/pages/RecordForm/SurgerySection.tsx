import { Alert, Space } from "antd";
import type { SurgeryRow } from "@/components/SurgeryCard";
import SurgeryCard from "@/components/SurgeryCard";
import type { TcmOpRow } from "@/components/TcmOperationCard";
import TcmOperationCard from "@/components/TcmOperationCard";

type Props = {
  tcmOps: TcmOpRow[];
  setTcmOps: (next: TcmOpRow[]) => void;
  surgeries: SurgeryRow[];
  setSurgeries: (next: SurgeryRow[]) => void;
  errorMap: Record<string, string[]>;
};

export default function SurgerySection({ tcmOps, setTcmOps, surgeries, setSurgeries, errorMap }: Props) {
  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <Alert
        type="warning"
        showIcon
        message="多值列表按 seq_no 保序"
        description="删除/新增会自动重排 seq_no，禁止跳号空洞；条数超限将导致提交校验失败。"
      />
      <div className="group-block">
        <div className="compact-table">
          <TcmOperationCard rows={tcmOps} setRows={setTcmOps} errorMap={errorMap} />
        </div>
      </div>
      <div className="group-block">
        <div className="compact-table">
          <SurgeryCard rows={surgeries} setRows={setSurgeries} errorMap={errorMap} />
        </div>
      </div>
    </Space>
  );
}
