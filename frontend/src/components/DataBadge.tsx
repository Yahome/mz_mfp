import type { CSSProperties, ReactNode } from "react";

type Props = {
  label: ReactNode;
  value?: ReactNode;
  emphasis?: boolean;
  title?: string;
  style?: CSSProperties;
};

export default function DataBadge({ label, value, emphasis, title, style }: Props) {
  const isEmpty =
    value === null || value === undefined || (typeof value === "string" && value.trim().length === 0);
  const displayValue = isEmpty ? "-" : value;
  const resolvedTitle = title ?? (typeof displayValue === "string" ? displayValue : undefined);

  return (
    <div className={`data-badge${emphasis ? " emphasis" : ""}`} style={style}>
      <span className="badge-label">{label}</span>
      <div className="badge-value" title={resolvedTitle}>
        {displayValue}
      </div>
    </div>
  );
}
