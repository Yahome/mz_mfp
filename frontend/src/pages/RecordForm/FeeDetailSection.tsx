import { Alert, Col, Divider, Form, Input, Row, Space, Tooltip, Typography } from "antd";
import HerbDetailCard, { type HerbRow } from "@/components/HerbDetailCard";
import FeeDisplayComplete from "./FeeDisplayComplete";

const { Paragraph } = Typography;

type MedicationSummary = {
  xysy: string;
  zcysy: string;
  zyzjsy: string;
  ctypsy: string;
  pfklsy: string;
};

type Props = {
  medicationSummary: MedicationSummary | null;
  feeSummary: Record<string, any> | null;
  herbRows: HerbRow[];
  setHerbRows: (next: HerbRow[]) => void;
  prefillMeta?: (key: string) => { readonly: boolean; source: string } | null;
  errorMap: Record<string, string[]>;
};

export default function FeeDetailSection({
  medicationSummary,
  feeSummary,
  herbRows,
  setHerbRows,
  prefillMeta,
  errorMap,
}: Props) {
  const form = Form.useFormInstance();
  const showSource = Form.useWatch(["base_info", "_show_source"], form);
  const meta = (key: string) => prefillMeta?.(key);
  const sourceTip = (key: string) => {
    const info = meta(key);
    if (!info) return null;
    return (
      <Tooltip title={`来源：${info.source}${info.readonly ? "（只读）" : ""}`}>
        <span className="meta-badge">{info.readonly ? "只读" : info.source}</span>
      </Tooltip>
    );
  };

  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      {!medicationSummary && (
        <Alert
          type="warning"
          showIcon
          message="外部用药标识未返回"
          description="提交时后端会阻断，请联系信息科确认 V_EMR_MZ_PAGE_FEE 视图字段。"
        />
      )}

      <div className="group-block">
        <div className="group-title">用药标识</div>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用西药（XYSY）
                  {showSource ? sourceTip("XYSY") : null}
                </Space>
              }
            >
              <Input value={medicationSummary?.xysy || "-"} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用中成药（ZCYSY）
                  {showSource ? sourceTip("ZCYSY") : null}
                </Space>
              }
            >
              <Input value={medicationSummary?.zcysy || "-"} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用中药制剂（ZYZJSY）
                  {showSource ? sourceTip("ZYZJSY") : null}
                </Space>
              }
            >
              <Input value={medicationSummary?.zyzjsy || "-"} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用传统饮片（CTYPSY）
                  {showSource ? sourceTip("CTYPSY") : null}
                </Space>
              }
            >
              <Input value={medicationSummary?.ctypsy || "-"} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用配方颗粒（PFKLSY）
                  {showSource ? sourceTip("PFKLSY") : null}
                </Space>
              }
            >
              <Input value={medicationSummary?.pfklsy || "-"} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="group-block">
        <div className="compact-table">
          <HerbDetailCard rows={herbRows} setRows={setHerbRows} errorMap={errorMap} />
        </div>
      </div>

      <Divider style={{ margin: "4px 0" }} />

      <FeeDisplayComplete feeSummary={feeSummary} showSource={showSource} sourceTip={sourceTip} />
    </Space>
  );
}
