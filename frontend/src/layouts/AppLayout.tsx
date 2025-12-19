import { useEffect, useMemo, useRef, useState } from "react";
import { Layout, Menu, Space, Typography, Button, Modal, message } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";

const { Header, Sider, Content } = Layout;

const sections = [
  { key: "base", title: "基础信息" },
  { key: "diagnosis", title: "诊断信息" },
  { key: "surgery", title: "手术与操作" },
  { key: "fee", title: "用药/中草药/费用" },
];

type Props = {
  children: React.ReactNode;
  patientNo?: string;
  showFormNav?: boolean;
};

export default function AppLayout({ children, patientNo, showFormNav }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<{
    login_name: string;
    dept_code: string;
    roles: string[];
    expires_at: string;
  } | null>(null);
  const [frontendConfig, setFrontendConfig] = useState<Record<string, any>>({});
  const warnedForExpiresAtRef = useRef<string | null>(null);

  const isAdmin = useMemo(() => (session?.roles || []).includes("admin"), [session]);

  const loadSession = async () => {
    const resp = await apiClient.get("/auth/me", { withCredentials: true });
    setSession(resp.data);
  };

  const loadFrontendConfig = async () => {
    const resp = await apiClient.get("/config/frontend", { withCredentials: true });
    setFrontendConfig(resp.data?.config || {});
  };

  const renewSession = async (opts?: { silent?: boolean }) => {
    const resp = await apiClient.post("/auth/renew", {}, { withCredentials: true });
    setSession(resp.data);
    if (!opts?.silent) {
      message.success("会话已续期");
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadSession();
        await loadFrontendConfig();
      } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 401) {
          navigate("/login", { replace: true });
          return;
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keepalive = frontendConfig?.session_keepalive;
    const enabled = Boolean(keepalive?.enabled);
    const intervalSeconds = Number(keepalive?.interval_seconds || 0);
    if (!enabled || !intervalSeconds || intervalSeconds <= 0) return;

    const timer = window.setInterval(() => {
      void renewSession({ silent: true }).catch(() => undefined);
    }, Math.max(30, intervalSeconds) * 1000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontendConfig]);

  useEffect(() => {
    const warning = frontendConfig?.session_warning;
    const enabled = Boolean(warning?.enabled);
    const warnBefore = Number(warning?.warn_before_seconds || 0);
    const warningMessage = String(warning?.message || "会话即将过期，请及时保存。");
    if (!enabled || !warnBefore || warnBefore <= 0) return;
    if (!session?.expires_at) return;

    const timer = window.setInterval(() => {
      if (!session?.expires_at) return;
      const expiresAt = new Date(session.expires_at).getTime();
      if (Number.isNaN(expiresAt)) return;
      const secondsLeft = Math.floor((expiresAt - Date.now()) / 1000);
      if (secondsLeft <= warnBefore && warnedForExpiresAtRef.current !== session.expires_at) {
        warnedForExpiresAtRef.current = session.expires_at;
        Modal.confirm({
          title: "会话即将过期",
          content: `${warningMessage}（剩余约 ${Math.max(0, secondsLeft)} 秒）`,
          okText: frontendConfig?.session_keepalive?.enabled ? "立即续期" : "我知道了",
          cancelText: "关闭",
          onOk: async () => {
            if (frontendConfig?.session_keepalive?.enabled) await renewSession();
          },
        });
      }
    }, 15000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontendConfig, session?.expires_at]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#fff",
        }}
      >
        <Space size="middle">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
            style={{ color: "#fff" }}
            disabled={!showFormNav}
          />
          <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
            门诊病案首页填写系统
          </Typography.Title>
          <Link to="/app" style={{ color: "#fff", opacity: 0.85 }}>
            就诊列表
          </Link>
          <Link to="/prefill-test" style={{ color: "#fff", opacity: 0.85 }}>
            预填测试页
          </Link>
          {isAdmin && (
            <Link to="/admin/config" style={{ color: "#fff", opacity: 0.85 }}>
              配置管理
            </Link>
          )}
        </Space>
        <Typography.Text style={{ color: "#fff" }}>
          {session?.login_name ? `用户: ${session.login_name}` : "未登录"} | 门诊号: {patientNo || "-"}
        </Typography.Text>
      </Header>
      <Layout>
        {showFormNav && (
          <Sider
            collapsible
            collapsed={collapsed}
            trigger={null}
            width={220}
            breakpoint="lg"
            onBreakpoint={(broken) => setCollapsed(broken)}
            style={{ background: "#fff", borderRight: "1px solid #f0f0f0" }}
          >
            <div style={{ padding: "16px" }}>
              <Menu
                mode="inline"
                selectedKeys={[
                  new URLSearchParams(location.search).get("section") || "base",
                ]}
                items={sections.map((s) => ({ key: s.key, label: s.title }))}
                onClick={(e) => {
                  const params = new URLSearchParams(location.search);
                  params.set("section", e.key);
                  navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
                }}
              />
            </div>
          </Sider>
        )}
        <Content
          style={{
            padding: "16px",
            background: "#f7f9fc",
            minWidth: 960,
            overflowX: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
