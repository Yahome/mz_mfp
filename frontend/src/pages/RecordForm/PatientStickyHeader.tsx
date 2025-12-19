import { Button, Space, Tag, Typography, theme } from "antd";
import { statusLabel, statusTagColor, type RecordStatus } from "@/utils/status";

const { Text } = Typography;

type Props = {
  patientNo: string;
  name?: string;
  gender?: string;
  age?: number | null;
  recordStatus: RecordStatus;
  version?: number | null;
  loading: boolean;
  saving: boolean;
  canPrint: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onPrint: () => void;
  onReload: () => void;
};

export default function PatientStickyHeader({
  patientNo,
  name,
  gender,
  age,
  recordStatus,
  version,
  loading,
  saving,
  canPrint,
  onSaveDraft,
  onSubmit,
  onPrint,
  onReload,
}: Props) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: token.colorFillAlter,
        borderBottom: `1px solid ${token.colorSplit}`,
        padding: "8px 16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <Space size="middle" wrap>
          <Space size={6}>
            <Text type="secondary">姓名</Text>
            <Text strong>{name || "-"}</Text>
          </Space>
          <Space size={6}>
            <Text type="secondary">性别</Text>
            <Text>{gender || "-"}</Text>
          </Space>
          <Space size={6}>
            <Text type="secondary">年龄</Text>
            <Text>{age === null || age === undefined ? "-" : `${age} 岁`}</Text>
          </Space>
          <Space size={6}>
            <Text type="secondary">门诊号</Text>
            <Text code>{patientNo}</Text>
          </Space>
        </Space>

        <Space size="small" wrap>
          <Tag color={statusTagColor(recordStatus)}>{statusLabel(recordStatus)}</Tag>
          <Tag color="geekblue">v{version ?? "-"}</Tag>
          <Button type="primary" onClick={onSaveDraft} loading={saving} disabled={loading}>
            保存
          </Button>
          <Button type="primary" ghost onClick={onSubmit} loading={saving} disabled={loading}>
            提交
          </Button>
          <Button onClick={onPrint} loading={saving} disabled={!canPrint || loading || saving}>
            打印
          </Button>
          <Button onClick={onReload} disabled={loading || saving}>
            刷新
          </Button>
        </Space>
      </div>
    </div>
  );
}

