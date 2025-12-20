import { Button, Descriptions, Space, Switch, Tag, theme } from "antd";
import { statusLabel, statusTagColor, type RecordStatus } from "@/utils/status";

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
  showSource: boolean;
  onToggleShowSource: (checked: boolean) => void;
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
  showSource,
  onToggleShowSource,
  onSaveDraft,
  onSubmit,
  onPrint,
  onReload,
}: Props) {
  const { token } = theme.useToken();

  const items = [
    { key: "name", label: "姓名", children: <span className="summary-value">{name || "-"}</span> },
    { key: "gender", label: "性别", children: <span className="summary-value">{gender || "-"}</span> },
    {
      key: "age",
      label: "年龄",
      children: <span className="summary-value">{age === null || age === undefined ? "-" : `${age} 岁`}</span>,
    },
    { key: "patientNo", label: "门诊号", children: <span className="summary-value"><code>{patientNo}</code></span> },
  ];

  return (
    <div
      className="sticky-summary"
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
        <Descriptions
          size="small"
          column={4}
          colon={false}
          items={items}
          styles={{ label: { color: "rgba(15,23,42,0.55)", fontSize: 12 } }}
        />

        <Space size="small" wrap>
          <Tag color={statusTagColor(recordStatus)}>{statusLabel(recordStatus)}</Tag>
          <Tag color="geekblue">v{version ?? "-"}</Tag>
          <Space size={6}>
            <span className="summary-label">来源</span>
            <Switch size="small" checked={showSource} onChange={onToggleShowSource} />
          </Space>
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
