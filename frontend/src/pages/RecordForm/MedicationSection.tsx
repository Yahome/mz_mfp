import { Alert, Col, Form, Input, Row, Space, Tooltip } from "antd";
import HerbDetailCard, { type HerbRow } from "@/components/HerbDetailCard";
import styles from "./MedicationSection.module.css";
import { formatYesNoRc016 } from "@/utils/valueFormat";

type MedicationSummary = {
  xysy: string;
  zcysy: string;
  zyzjsy: string;
  ctypsy: string;
  pfklsy: string;
};

type Props = {
  medicationSummary: MedicationSummary | null;
  herbRows: HerbRow[];
  setHerbRows: (next: HerbRow[]) => void;
  prefillMeta?: (key: string) => { readonly: boolean; source: string } | null;
  errorMap: Record<string, string[]>;
};

export default function MedicationSection({
  medicationSummary,
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
    <Space direction="vertical" size="small" style={{ width: "100%" }} className={styles.root}>
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
                  是否使用西药
                  {showSource ? sourceTip("XYSY") : null}
                </Space>
              }
            >
              <Input value={formatYesNoRc016(medicationSummary?.xysy)} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用中成药
                  {showSource ? sourceTip("ZCYSY") : null}
                </Space>
              }
            >
              <Input value={formatYesNoRc016(medicationSummary?.zcysy)} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用中药制剂
                  {showSource ? sourceTip("ZYZJSY") : null}
                </Space>
              }
            >
              <Input value={formatYesNoRc016(medicationSummary?.zyzjsy)} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用传统饮片
                  {showSource ? sourceTip("CTYPSY") : null}
                </Space>
              }
            >
              <Input value={formatYesNoRc016(medicationSummary?.ctypsy)} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <Space size="small">
                  是否使用配方颗粒
                  {showSource ? sourceTip("PFKLSY") : null}
                </Space>
              }
            >
              <Input value={formatYesNoRc016(medicationSummary?.pfklsy)} readOnly className="readonly-input" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="group-block">
        <div className="compact-table">
          <HerbDetailCard rows={herbRows} setRows={setHerbRows} errorMap={errorMap} />
        </div>
      </div>
    </Space>
  );
}
