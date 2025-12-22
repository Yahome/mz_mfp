import { Space, Tooltip } from "antd";
import FeeDisplayComplete from "./FeeDisplayComplete";

type Props = {
  feeSummary: Record<string, any> | null;
  prefillMeta?: (key: string) => { readonly: boolean; source: string } | null;
};

export default function FeeSection({ feeSummary, prefillMeta }: Props) {
  const sourceTip = (key: string) => {
    const info = prefillMeta?.(key);
    if (!info) return null;
    return (
      <Tooltip title={`来源：${info.source}${info.readonly ? "（只读）" : ""}`}>
        <span className="meta-badge">{info.readonly ? "只读" : info.source}</span>
      </Tooltip>
    );
  };

  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      <FeeDisplayComplete feeSummary={feeSummary} showSource={false} sourceTip={sourceTip} />
    </Space>
  );
}
