import { Button, Space, Tag, Typography, theme } from "antd";
import DataBadge from "@/components/DataBadge";
import { statusLabel, statusTagColor, type RecordStatus } from "@/utils/status";

const { Text } = Typography;

type Props = {
  patientNo: string;
  name?: string;
  gender?: string;
  age?: number | null;
  visitTime?: string;
  phone?: string;
  department?: string;
  doctor?: string;
  doctorTitle?: string;
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

function formatVisitDate(value: string | undefined): string {
  if (!value) return "-";
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return trimmed.split("T")[0] || trimmed;
}

export default function BoardingPassHeader({
  patientNo,
  name,
  gender,
  age,
  visitTime,
  phone,
  department,
  doctor,
  doctorTitle,
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

  const genderAge = `${gender || "-"} / ${age !== null && age !== undefined ? `${age}岁` : "-"}`;
  const doctorText = doctor ? (doctorTitle ? `${doctor}（${doctorTitle}）` : doctor) : "-";
  const visitDate = formatVisitDate(visitTime);

  return (
    <div
      className="boarding-pass-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "linear-gradient(135deg, #E6F7FF 0%, #F0F9FF 100%)",
        border: `2px solid ${token.colorPrimary}`,
        borderRadius: "12px",
        padding: "8px 10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div className="sticky-context-bar">
        <Space size="small" wrap>
          <Text strong style={{ fontSize: 14, color: token.colorPrimary }}>
            患者信息
          </Text>
          <Tag color={statusTagColor(recordStatus)}>{statusLabel(recordStatus)}</Tag>
          <Tag color="geekblue">v{version ?? "-"}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            门诊号:
          </Text>
          <code style={{ fontSize: 12, fontWeight: 600 }}>{patientNo}</code>
        </Space>

        <Space size="small" wrap>
          <Button size="small" type="primary" onClick={onSaveDraft} loading={saving} disabled={loading}>
            保存
          </Button>
          <Button size="small" type="primary" ghost onClick={onSubmit} loading={saving} disabled={loading}>
            提交
          </Button>
          <Button size="small" onClick={onPrint} loading={saving} disabled={!canPrint || loading || saving}>
            打印
          </Button>
          <Button size="small" onClick={onReload} disabled={loading || saving}>
            刷新
          </Button>
        </Space>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: "8px",
          padding: "8px 10px",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(120px, 1fr))",
              gap: "4px 10px",
              alignItems: "end",
            }}
          >
            <DataBadge label="姓名" value={name} emphasis />
            <DataBadge label="性别/年龄" value={genderAge} />
            <DataBadge label="联系电话" value={phone} />
            <DataBadge label="就诊科室" value={department} />
            <DataBadge label="接诊医师" value={doctorText} />
            <DataBadge label="就诊日期" value={visitDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
