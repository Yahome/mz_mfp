import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Divider, Layout, Menu, Modal, Select, Space, Typography, message } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiClient from "@/services/apiClient";

const { Header, Sider, Content } = Layout;

const ZOOM_STORAGE_KEY = "mz_mfp_ui_zoom_percent";
const ZOOM_OPTIONS = [100, 105, 110, 115, 120, 125, 130] as const;

function parseZoomPercent(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (!(ZOOM_OPTIONS as readonly number[]).includes(parsed)) return null;
  return parsed;
}

const sections = [
  { key: "base", title: "基础信息" },
  { key: "diagnosis", title: "诊断信息" },
  { key: "surgery", title: "手术与操作" },
  { key: "medication", title: "用药信息" },
  { key: "fee", title: "费用信息" },
];

type ValidationError = {
  field: string;
  message: string;
  section?: string;
};

type Props = {
  children: React.ReactNode;
  patientNo?: string;
  showFormNav?: boolean;
  sectionStats?: Record<string, { errors: number; missing: number }>;
  validationErrors?: ValidationError[];
  onErrorClick?: (error: ValidationError) => void;
};

export default function AppLayout({ children, patientNo, showFormNav, sectionStats, validationErrors, onErrorClick }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState<{
    login_name: string;
    his_id?: string;
    display_name?: string | null;
    dept_code: string;
    dept_his_code?: string | null;
    dept_name?: string | null;
    roles: string[];
    expires_at: string;
  } | null>(null);
  const [frontendConfig, setFrontendConfig] = useState<Record<string, any>>({});
  const [zoomPercent, setZoomPercent] = useState(100);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptOptions, setDeptOptions] = useState<Array<{ value: string; label: string; name?: string | null }>>([]);
  const [deptSwitching, setDeptSwitching] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const warnedForExpiresAtRef = useRef<string | null>(null);

  const isAdmin = useMemo(() => (session?.roles || []).includes("admin"), [session]);
  const isQc = useMemo(() => (session?.roles || []).includes("qc"), [session]);
  const isDoctorOnly = useMemo(() => {
    const roles = session?.roles || [];
    const roleSet = new Set(roles);
    return roleSet.size === 1 && roleSet.has("doctor");
  }, [session]);
  const canSwitchDept = isDoctorOnly;

  const loadSession = async () => {
    const resp = await apiClient.get("/auth/me", { withCredentials: true });
    setSession(resp.data);
    const roles = resp.data?.roles || [];
    const isDoctor = roles.length === 1 && roles.includes("doctor");
    if (isDoctor) {
      setSelectedDept(resp.data.dept_his_code || resp.data.dept_code);
    }
  };

  const loadFrontendConfig = async () => {
    const resp = await apiClient.get("/config/frontend", { withCredentials: true });
    setFrontendConfig(resp.data?.config || {});
  };

  const loadDeptOptions = async () => {
    const resp = await apiClient.get<{ current_dept_code: string; depts: { dept_code: string }[] }>("/auth/depts", {
      withCredentials: true,
    });
    const opts = (resp.data.depts || []).map((item: any) => {
      const code = item.dept_code;
      const name = item.dept_name || "";
      return { value: code, label: name ? `${name}（${code}）` : code, name };
    });
    setDeptOptions(opts);
    if (!selectedDept && resp.data.current_dept_code) {
      setSelectedDept(resp.data.current_dept_code);
    }
  };

  const handleSwitchDept = async () => {
    if (!selectedDept) {
      message.warning("请选择科室");
      return;
    }
    setDeptSwitching(true);
    try {
      await apiClient.post(
        "/auth/switch-dept",
        { dept_code: selectedDept },
        { withCredentials: true },
      );
      message.success("科室已切换");
      const me = await apiClient.get("/auth/me", { withCredentials: true });
      setSession(me.data);
      setDeptModalOpen(false);
      navigate("/app", { replace: true });
      window.location.reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "切换失败";
      message.error(msg);
    } finally {
      setDeptSwitching(false);
    }
  };

  const renewSession = async (opts?: { silent?: boolean }) => {
    const resp = await apiClient.post("/auth/renew", {}, { withCredentials: true });
    setSession(resp.data);
    if (!opts?.silent) {
      message.success("会话已续期");
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout", {}, { withCredentials: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "退出失败";
      message.error(msg);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadSession();
        await loadDeptOptions();
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
    try {
      const next = parseZoomPercent(localStorage.getItem(ZOOM_STORAGE_KEY));
      if (next !== null) setZoomPercent(next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ZOOM_STORAGE_KEY, String(zoomPercent));
    } catch {
      // ignore
    }
  }, [zoomPercent]);

  useEffect(() => {
    const nextZoom = String(zoomPercent / 100);
    try {
      document.body.style.zoom = nextZoom;
    } catch {
      // ignore
    }
    return () => {
      try {
        document.body.style.zoom = "";
      } catch {
        // ignore
      }
    };
  }, [zoomPercent]);

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
          {(isAdmin || isQc) && (
            <Link to="/export" style={{ color: "#fff", opacity: 0.85 }}>
              导出
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/config" style={{ color: "#fff", opacity: 0.85 }}>
              配置管理
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin/reset" style={{ color: "#fff", opacity: 0.85 }}>
              患者清理
            </Link>
          )}
        </Space>
        <Space size="middle" align="center" wrap>
          <Space size={6} align="center">
            <Typography.Text style={{ color: "#fff" }}>缩放</Typography.Text>
            <Select
              size="small"
              value={zoomPercent}
              onChange={(value) => setZoomPercent(value)}
              options={(ZOOM_OPTIONS as readonly number[]).map((value) => ({ value, label: `${value}%` }))}
              style={{ width: 88 }}
            />
          </Space>
          <Typography.Text style={{ color: "#fff" }}>
          {session?.login_name ? `用户: ${session.display_name || session.login_name}` : "未登录"} | 门诊号: {patientNo || "-"}
          </Typography.Text>
          {canSwitchDept && (
            <Button size="small" onClick={() => setDeptModalOpen(true)} ghost>
              科室: {session?.dept_name || session?.dept_his_code || session?.dept_code || "-"}
            </Button>
          )}
          <Button size="small" onClick={handleLogout}>
            退出
          </Button>
        </Space>
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
            <div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
              <Menu
                mode="inline"
                selectedKeys={[
                  new URLSearchParams(location.search).get("section") || "base",
                ]}
                items={sections.map((s) => {
                  const stats = sectionStats?.[s.key];
                  const hasErrors = !!stats?.errors;
                  const hasMissing = !!stats?.missing;
                  const badge = hasErrors ? (
                    <Badge className="menu-badge" count={stats?.errors} size="small" />
                  ) : hasMissing ? (
                    <Badge className="menu-badge" count={stats?.missing} size="small" color="#f59e0b" />
                  ) : null;
                  return {
                    key: s.key,
                    label: (
                      <Space size="small" style={{ width: "100%", justifyContent: "space-between" }}>
                        <span>{s.title}</span>
                        {badge}
                      </Space>
                    ),
                  };
                })}
                onClick={(e) => {
                  const params = new URLSearchParams(location.search);
                  params.set("section", e.key);
                  navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
                }}
              />

              {!collapsed && validationErrors && validationErrors.length > 0 && (
                <>
                  <Divider style={{ margin: "12px 0" }} />
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                      <Space size="small" style={{ color: "#F5222D" }}>
                        <ExclamationCircleOutlined />
                        <Typography.Text strong style={{ color: "#F5222D", fontSize: 13 }}>
                          错误消息
                        </Typography.Text>
                      </Space>
                      {validationErrors.slice(0, 10).map((error, index) => (
                        <Alert
                          key={`${error.field}-${index}`}
                          message={error.message}
                          type="error"
                          showIcon={false}
                          style={{
                            fontSize: 12,
                            padding: "4px 8px",
                            cursor: "pointer",
                            marginBottom: 4,
                          }}
                          onClick={() => onErrorClick?.(error)}
                        />
                      ))}
                      {validationErrors.length > 10 && (
                        <Typography.Text type="secondary" style={{ fontSize: 12, paddingLeft: 8 }}>
                          ...还有 {validationErrors.length - 10} 条错误
                        </Typography.Text>
                      )}
                    </Space>
                  </div>
                </>
              )}
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
      <Modal
        title="切换科室"
        open={deptModalOpen}
        onCancel={() => setDeptModalOpen(false)}
        onOk={handleSwitchDept}
        confirmLoading={deptSwitching}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            仅可切换到已授权的科室
          </Typography.Paragraph>
          <Select
            showSearch
            filterOption={(input, option) => (option?.value || "").toLowerCase().includes(input.toLowerCase())}
            value={selectedDept || undefined}
            options={deptOptions}
            placeholder="选择科室"
            onFocus={() => {
              if (!deptOptions.length) void loadDeptOptions();
            }}
            onChange={(v) => setSelectedDept(v)}
            style={{ width: "100%" }}
            optionFilterProp="label"
          />
        </Space>
      </Modal>
    </Layout>
  );
}
