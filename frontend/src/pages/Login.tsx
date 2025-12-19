import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import apiClient from "@/services/apiClient";

type LoginForm = {
  login_name: string;
  password: string;
};

const { Title, Paragraph, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(
        "/auth/login",
        { login_name: values.login_name, password: values.password },
        { withCredentials: true },
      );
      navigate("/app", { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "登录失败";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <Card style={{ width: 420 }} bordered={false}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              门诊病案首页填写系统
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              登录后进入门诊首页填写与提交。
            </Paragraph>
          </div>

          <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
            <Form.Item
              label="登录账号"
              name="login_name"
              rules={[{ required: true, message: "请输入登录账号" }]}
            >
              <Input placeholder="如：admin" autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>

          {error && <Alert type="error" message={error} showIcon />}
          <Text type="secondary">
            也可通过 HIS 直跳进入，系统会自动创建会话。
          </Text>
        </Space>
      </Card>
    </div>
  );
}
