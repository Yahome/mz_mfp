import { Alert, Col, Divider, Form, Input, Row, Space, Statistic, Typography } from "antd";
import type { ReactNode } from "react";
import HerbDetailCard, { type HerbRow } from "@/components/HerbDetailCard";

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
  prefillTag: (key: string) => ReactNode;
  errorMap: Record<string, string[]>;
};

export default function FeeDetailSection({
  medicationSummary,
  feeSummary,
  herbRows,
  setHerbRows,
  prefillTag,
  errorMap,
}: Props) {
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

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item label={<Space size="small">是否使用西药（XYSY）{prefillTag("XYSY")}</Space>}>
            <Input value={medicationSummary?.xysy || "-"} readOnly />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label={<Space size="small">是否使用中成药（ZCYSY）{prefillTag("ZCYSY")}</Space>}>
            <Input value={medicationSummary?.zcysy || "-"} readOnly />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label={<Space size="small">是否使用中药制剂（ZYZJSY）{prefillTag("ZYZJSY")}</Space>}>
            <Input value={medicationSummary?.zyzjsy || "-"} readOnly />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={<Space size="small">是否使用传统饮片（CTYPSY）{prefillTag("CTYPSY")}</Space>}>
            <Input value={medicationSummary?.ctypsy || "-"} readOnly />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={<Space size="small">是否使用配方颗粒（PFKLSY）{prefillTag("PFKLSY")}</Space>}>
            <Input value={medicationSummary?.pfklsy || "-"} readOnly />
          </Form.Item>
        </Col>
      </Row>

      <HerbDetailCard rows={herbRows} setRows={setHerbRows} errorMap={errorMap} />

      <Divider style={{ margin: "4px 0" }} />

      <Row gutter={16}>
        <Col span={6}>
          <Statistic title={<Space size="small">总费用（ZFY）{prefillTag("ZFY")}</Space>} value={feeSummary?.zfy ?? "-"} />
        </Col>
        <Col span={6}>
          <Statistic title={<Space size="small">自付金额（ZFJE）{prefillTag("ZFJE")}</Space>} value={feeSummary?.zfje ?? "-"} />
        </Col>
        <Col span={6}>
          <Statistic
            title={<Space size="small">一般医疗服务费（YLFWF）{prefillTag("YLFWF")}</Space>}
            value={feeSummary?.ylfwf ?? "-"}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title={<Space size="small">一般治疗操作费（ZLCZF）{prefillTag("ZLCZF")}</Space>}
            value={feeSummary?.zlczf ?? "-"}
          />
        </Col>
      </Row>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        费用字段全部来自 HIS 费用视图，直取展示，不做前端费用统计/校验；保存/提交时由后端按外部数据刷新并审计。
      </Paragraph>
    </Space>
  );
}
