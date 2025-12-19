import { useState } from "react";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import apiClient from "../services/apiClient";

type PrefillResponse = {
  patient_no: string;
  visit_time?: string;
  fields: Record<
    string,
    {
      value: unknown;
      source: string;
      readonly: boolean;
    }
  >;
};

export default function PrefillTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PrefillResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { patient_no: string }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const resp = await apiClient.get<PrefillResponse>("/mz_mfp/prefill", {
        params: { patient_no: values.patient_no },
        withCredentials: true,
      });
      setResult(resp.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "请求失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      <Card title="HIS 预填测试">
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="patient_no"
            name="patient_no"
            rules={[{ required: true, message: "请输入 patient_no" }]}
          >
            <Input placeholder="例如：P123456" allowClear />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              查询预填
            </Button>
          </Form.Item>
        </Form>
        {error && (
          <Alert
            style={{ marginTop: 12 }}
            type="error"
            message="查询失败"
            description={error}
            showIcon
          />
        )}
      </Card>
      {result && (
        <Card title="返回结果">
          <Typography.Paragraph copyable>
            {JSON.stringify(result, null, 2)}
          </Typography.Paragraph>
        </Card>
      )}
    </Space>
  );
}
