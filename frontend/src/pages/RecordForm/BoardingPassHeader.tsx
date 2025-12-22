import { Button, Space, Switch, Tag, theme } from "antd";
import { statusLabel, statusTagColor, type RecordStatus } from "@/utils/status";

type Props = {
  patientNo: string;
  name?: string;
  gender?: string;
  age?: number | null;
  idType?: string;
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
  showSource: boolean;
  onToggleShowSource: (checked: boolean) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onPrint: () => void;
  onReload: () => void;
};

export default function BoardingPassHeader({
  patientNo,
  name,
  gender,
  age,
  idType,
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
  showSource,
  onToggleShowSource,
  onSaveDraft,
  onSubmit,
  onPrint,
  onReload,
}: Props) {
  const { token } = theme.useToken();

  const formatIdType = (type: string | undefined) => {
    if (!type) return "-";
    if (type === "1") return "身份证";
    if (type === "2") return "护照";
    if (type === "3") return "军官证";
    return type;
  };

  const formatVisitTime = (time: string | undefined) => {
    if (!time) return "-";
    // Format: 2025-12-21T10:44:36 -> 2025-12-21
    return time.split("T")[0] || time;
  };

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
        padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* 标题栏 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: token.colorPrimary }}>患者信息登机牌</span>
          <Tag color={statusTagColor(recordStatus)}>{statusLabel(recordStatus)}</Tag>
          <Tag color="geekblue">v{version ?? "-"}</Tag>
        </div>
        <div style={{ fontSize: 14, color: token.colorTextSecondary }}>
          门诊号: <code style={{ fontSize: 14, fontWeight: 600 }}>{patientNo}</code>
        </div>
      </div>

      {/* 患者信息卡片 */}
      <div
        style={{
          background: "#FFFFFF",
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: 12,
        }}
      >
        {/* 第一行 */}
        <div style={{ display: "flex", gap: 32, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>姓名</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>{name || "-"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>性别/年龄</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>
              {gender || "-"} / {age !== null && age !== undefined ? `${age} 岁` : "-"}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>证件类型</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>{formatIdType(idType)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>就诊日期</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: token.colorText }}>{formatVisitTime(visitTime)}</div>
          </div>
        </div>

        {/* 第二行 */}
        <div style={{ display: "flex", gap: 32 }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>联系电话</span>
            <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>{phone || "-"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>就诊科室</span>
            <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>{department || "-"}</div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>接诊医师</span>
            <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
              {doctor || "-"}
              {doctorTitle ? ` / ${doctorTitle}` : ""}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: token.colorTextSecondary }}>填写状态</span>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              <Tag color={statusTagColor(recordStatus)} style={{ margin: 0 }}>
                {recordStatus === "not_started" && "⚠️ 未填写"}
                {recordStatus === "draft" && "📝 草稿"}
                {recordStatus === "submitted" && "✓ 已提交"}
              </Tag>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮栏 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Space size={8}>
          <span style={{ fontSize: 13, color: token.colorTextSecondary }}>来源</span>
          <Switch size="small" checked={showSource} onChange={onToggleShowSource} />
        </Space>
        <Space size="small">
          <Button type="primary" onClick={onSaveDraft} loading={saving} disabled={loading}>
            保 存
          </Button>
          <Button type="primary" ghost onClick={onSubmit} loading={saving} disabled={loading}>
            提 交
          </Button>
          <Button onClick={onPrint} loading={saving} disabled={!canPrint || loading || saving}>
            打 印
          </Button>
          <Button onClick={onReload} disabled={loading || saving}>
            刷 新
          </Button>
        </Space>
      </div>
    </div>
  );
}
