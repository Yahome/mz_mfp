import { useState } from "react";
import { Card, theme } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";

type Props = {
  title: string;
  icon?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  bordered?: boolean;
};

export default function CollapsibleCard({ title, icon, defaultExpanded = false, children, bordered = true }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { token } = theme.useToken();

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          <div style={{ marginLeft: "auto", color: token.colorPrimary }}>
            {expanded ? <UpOutlined /> : <DownOutlined />}
          </div>
        </div>
      }
      bordered={bordered}
      style={{
        borderRadius: "8px",
        border: bordered ? `1px solid ${token.colorPrimary}` : "none",
        marginBottom: 12,
      }}
      styles={{
        header: {
          background: "linear-gradient(135deg, #E6F7FF 0%, #F0F9FF 100%)",
          borderBottom: expanded ? `1px solid ${token.colorBorderSecondary}` : "none",
          padding: "12px 16px",
        },
        body: {
          padding: expanded ? "16px" : 0,
          display: expanded ? "block" : "none",
        },
      }}
    >
      {children}
    </Card>
  );
}
