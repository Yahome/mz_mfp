import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Divider, Form, Input, Space, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import apiClient from "@/services/apiClient";
import logo from "@/pic/image.png";

type LoginForm = {
  login_name: string;
  password: string;
};

const { Title, Paragraph, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "门诊病案首页填写系统";
  }, []);

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
    <div className="login-page">
      <div className="login-blob login-blob-left" />
      <div className="login-blob login-blob-right" />
      <div className="login-overlay" />
      <main className="login-shell">
        <Card
          className="login-card"
          bordered={false}
          bodyStyle={{ padding: "32px 32px 28px" }}
        >
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div style={{ textAlign: "center" }}>
              <img src={logo} alt="logo" className="login-logo" />
              <Title level={3} style={{ marginBottom: 6 }}>
                益阳市第一中医医院<br />
                门诊病案首页填写系统
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                登录后选择患者进行门诊首页填写与提交。
              </Paragraph>
            </div>

            <Form layout="vertical" onFinish={onFinish} requiredMark="optional" className="login-form">
              <Form.Item
                label="登录账号"
                name="login_name"
                rules={[{ required: true, message: "请输入登录账号" }]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined style={{ color: "rgba(148,163,184,0.9)" }} />}
                  placeholder="如：0001"
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined style={{ color: "rgba(148,163,184,0.9)" }} />}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="login-submit"
                >
                  登 录
                </Button>
              </Form.Item>
            </Form>

            {error && <Alert type="error" message={error} showIcon />}

            <div className="login-footer">
              <Text type="secondary" style={{ fontSize: 12 }}>
                信息中心自研
              </Text>
              <Divider plain className="login-divider">
                <Text type="secondary" style={{ letterSpacing: 2, fontSize: 11 }}>
                  Protected System
                </Text>
              </Divider>
            </div>
          </Space>
        </Card>
      </main>
    </div>
  );
}
