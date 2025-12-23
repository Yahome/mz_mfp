import { theme } from "antd";
import { CSSProperties, ReactNode } from "react";

type InfoItem = {
  label: ReactNode;
  value: ReactNode;
  span?: 1 | 2 | 3 | 4;
};

type Props = {
  items: InfoItem[];
  style?: CSSProperties;
  background?: string;
};

export default function BoardingPassInfoGrid({ items, style, background = "#FFFFFF" }: Props) {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        background,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: "8px",
        padding: "12px 16px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px 24px",
        ...style,
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            gridColumn: `span ${item.span || 1}`,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>{item.label}</span>
          <div style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>
            {item.value || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}
