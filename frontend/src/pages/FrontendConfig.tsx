import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, Space, Typography, message } from "antd";
import { useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";

type SessionPayload = {
  login_name: string;
  his_id: string;
  doc_code?: string | null;
  dept_code: string;
  dept_his_code?: string | null;
  display_name?: string | null;
  roles: string[];
  expires_at: string;
};

type FrontendConfigResponse = {
  config: Record<string, any>;
  updated_by?: string | null;
  updated_at?: string | null;
};

export default function FrontendConfig() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<FrontendConfigResponse | null>(null);
  const [configText, setConfigText] = useState("");

  const isAdmin = useMemo(() => (session?.roles || []).includes("admin"), [session]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await apiClient.get<SessionPayload>("/auth/me", { withCredentials: true });
      setSession(me.data);
      if (!(me.data.roles || []).includes("admin")) {
        setError("仅管理员可查看/更新前端配置");
        return;
      }
      const resp = await apiClient.get<FrontendConfigResponse>("/config/frontend", { withCredentials: true });
      setConfig(resp.data);
      setConfigText(JSON.stringify(resp.data.config ?? {}, null, 2));
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.response?.data?.message || err?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      let parsed: any = {};
      try {
        parsed = JSON.parse(configText || "{}");
      } catch (e: any) {
        setError(`配置不是合法 JSON：${e?.message || e}`);
        return;
      }
      const resp = await apiClient.put<FrontendConfigResponse>(
        "/config/frontend",
        { config: parsed },
        { withCredentials: true },
      );
      setConfig(resp.data);
      setConfigText(JSON.stringify(resp.data.config ?? {}, null, 2));
      message.success("配置已更新");
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.response?.data?.message || err?.message || "更新失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Typography.Title level={4} style={{ margin: 0 }}>
          前端配置（/api/config/frontend）
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          建议约定（可自行扩展）：
          <Typography.Text code>session_keepalive</Typography.Text>、
          <Typography.Text code>session_warning</Typography.Text>
        </Typography.Paragraph>
      </Card>

      {error && <Alert type="error" showIcon message={error} />}

      <Card
        title="配置 JSON"
        extra={
          <Space>
            <Button onClick={loadAll} disabled={loading}>
              刷新
            </Button>
            <Button type="primary" onClick={onSave} loading={loading} disabled={!isAdmin}>
              保存
            </Button>
          </Space>
        }
      >
        {config && (
          <Typography.Paragraph type="secondary">
            updated_by: <Typography.Text code>{config.updated_by ?? "-"}</Typography.Text>{" "}
            updated_at: <Typography.Text code>{config.updated_at ?? "-"}</Typography.Text>
          </Typography.Paragraph>
        )}
        <Form layout="vertical">
          <Form.Item>
            <Input.TextArea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={18}
              spellCheck={false}
              disabled={loading || !isAdmin}
            />
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}

