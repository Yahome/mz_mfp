import { theme } from "antd";
import { CSSProperties, ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning";
  style?: CSSProperties;
};

const variantStyles = {
  primary: {
    background: "linear-gradient(135deg, #E6F7FF 0%, #F0F9FF 100%)",
    borderColor: "#1890ff",
  },
  secondary: {
    background: "linear-gradient(135deg, #F0F5FF 0%, #F9F0FF 100%)",
    borderColor: "#722ED1",
  },
  success: {
    background: "linear-gradient(135deg, #F6FFED 0%, #F0FFF4 100%)",
    borderColor: "#52C41A",
  },
  warning: {
    background: "linear-gradient(135deg, #FFFBE6 0%, #FFF7E6 100%)",
    borderColor: "#FA8C16",
  },
};

export default function BoardingPassCard({
  title,
  subtitle,
  extra,
  children,
  variant = "primary",
  style,
}: Props) {
  const { token } = theme.useToken();
  const variantStyle = variantStyles[variant];

  return (
    <div
      style={{
        background: variantStyle.background,
        border: `2px solid ${variantStyle.borderColor}`,
        borderRadius: "12px",
        padding: "16px 20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        ...style,
      }}
    >
      {(title || subtitle || extra) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: children ? 12 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {title && (
              <span style={{ fontSize: 16, fontWeight: 600, color: variantStyle.borderColor }}>
                {title}
              </span>
            )}
            {subtitle && (
              <span style={{ fontSize: 14, color: token.colorTextSecondary }}>
                {subtitle}
              </span>
            )}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
