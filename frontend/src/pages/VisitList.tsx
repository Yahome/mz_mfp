import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import apiClient from "@/services/apiClient";
import { statusLabel, statusTagColor, type RecordStatus } from "@/utils/status";

type SessionPayload = {
  login_name: string;
  doc_code: string;
  dept_code: string;
  roles: string[];
};

type VisitListItem = {
  patient_no: string;
  visit_time: string;
  xm?: string | null;
  dept_code?: string | null;
  doc_code?: string | null;
  dept_name?: string | null;
  doc_name?: string | null;
  status: RecordStatus;
  record_id?: number | null;
  version?: number | null;
};

type VisitListResponse = {
  page: number;
  page_size: number;
  total: number;
  items: VisitListItem[];
};

type FieldError = {
  field: string;
  message: string;
  rule?: string;
  section?: string | null;
  seq_no?: number | null;
};

type FieldAudit = {
  id: number;
  field_key: string;
  old_value?: string | null;
  new_value?: string | null;
  change_source: string;
  operator_code: string;
  created_at: string;
};

type RecordQcResponse = {
  record: {
    record_id: number;
    patient_no: string;
    status: "draft" | "submitted";
    version: number;
    visit_time: string;
    submitted_at?: string | null;
  };
  errors: FieldError[];
  audits: FieldAudit[];
};

function formatDate(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export default function VisitList() {
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slowLoading, setSlowLoading] = useState(false);
  const slowTimerRef = useRef<number | null>(null);

  const [fromDate, setFromDate] = useState<string>(() => formatDate(daysAgo(7)));
  const [toDate, setToDate] = useState<string>(() => formatDate(new Date()));
  const [outpatientNo, setOutpatientNo] = useState<string>("");
  const [patientName, setPatientName] = useState<string>("");
  const [deptCode, setDeptCode] = useState<string>("");
  const [docCode, setDocCode] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [data, setData] = useState<VisitListResponse | null>(null);

  const [qcOpen, setQcOpen] = useState(false);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcError, setQcError] = useState<string | null>(null);
  const [qcData, setQcData] = useState<RecordQcResponse | null>(null);

  const isElevated = useMemo(() => {
    const roles = session?.roles ?? [];
    return roles.includes("admin") || roles.includes("qc");
  }, [session]);

  const loadSession = async () => {
    const resp = await apiClient.get<SessionPayload>("/auth/me", { withCredentials: true });
    setSession(resp.data);
    const elevated = (resp.data.roles || []).includes("admin") || (resp.data.roles || []).includes("qc");
    if (!elevated) {
      setDeptCode(resp.data.dept_code);
      setDocCode(resp.data.doc_code);
    }
  };

  const loadList = async (opts?: { page?: number; pageSize?: number }) => {
    const nextPage = opts?.page ?? page;
    const nextPageSize = opts?.pageSize ?? pageSize;
    setLoading(true);
    setError(null);
    setSlowLoading(false);
    if (slowTimerRef.current) {
      window.clearTimeout(slowTimerRef.current);
    }
    slowTimerRef.current = window.setTimeout(() => setSlowLoading(true), 1200);
    try {
      const params: Record<string, any> = {
        from: fromDate,
        to: toDate,
        page: nextPage,
        page_size: nextPageSize,
      };
      if (outpatientNo) params.outpatient_no = outpatientNo;
      if (patientName) params.patient_name = patientName;
      if (status) params.status = status;
      if (deptCode) params.dept_code = deptCode;
      if (docCode) params.doc_code = docCode;

      const resp = await apiClient.get<VisitListResponse>("/mz_mfp/records", {
        params,
        withCredentials: true,
      });
      setData(resp.data);
      setPage(resp.data.page);
      setPageSize(resp.data.page_size);
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401) {
        navigate("/login", { replace: true });
        return;
      }
      const msg = err?.response?.data?.message || err?.message || "查询失败";
      setError(msg);
    } finally {
      setLoading(false);
      if (slowTimerRef.current) {
        window.clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    }
  };

  const openQc = async (row: VisitListItem) => {
    if (!row.record_id) return;
    setQcOpen(true);
    setQcLoading(true);
    setQcError(null);
    setQcData(null);
    try {
      const resp = await apiClient.get<RecordQcResponse>(`/mz_mfp/records/${row.record_id}/qc`, {
        withCredentials: true,
      });
      setQcData(resp.data);
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      if (httpStatus === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setQcError(err?.response?.data?.message || err?.message || "加载质控信息失败");
    } finally {
      setQcLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadSession();
        await loadList({ page: 1 });
      } catch (err: any) {
        const httpStatus = err?.response?.status;
        if (httpStatus === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(err?.response?.data?.message || err?.message || "初始化失败");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              就诊列表
            </Typography.Title>
          </div>

          <Form layout="inline">
            <Form.Item label="接诊时间">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="至">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="门诊号">
              <Input
                value={outpatientNo}
                onChange={(e) => setOutpatientNo(e.target.value.trim())}
                placeholder="精确匹配"
                style={{ width: 180 }}
                allowClear
              />
            </Form.Item>
            <Form.Item label="患者姓名">
              <Input
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="模糊匹配"
                style={{ width: 160 }}
                allowClear
              />
            </Form.Item>
            <Form.Item label="状态">
              <Select
                value={status || undefined}
                onChange={(v) => setStatus(v ?? "")}
                allowClear
                style={{ width: 160 }}
                options={[
                  { value: "draft", label: statusLabel("draft") },
                  { value: "submitted", label: statusLabel("submitted") },
                  { value: "not_created", label: statusLabel("not_created") },
                ]}
              />
            </Form.Item>
            <Form.Item label="科室" tooltip={!isElevated ? "医生角色固定科室条件" : undefined}>
              <Input
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                disabled={!isElevated}
                placeholder={isElevated ? "dept_code" : undefined}
                style={{ width: 140 }}
              />
            </Form.Item>
            <Form.Item label="医生" tooltip={!isElevated ? "医生角色固定医生条件" : undefined}>
              <Input
                value={docCode}
                onChange={(e) => setDocCode(e.target.value)}
                disabled={!isElevated}
                placeholder={isElevated ? "doc_code" : undefined}
                style={{ width: 160 }}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={() => loadList({ page: 1 })} loading={loading}>
                查询
              </Button>
            </Form.Item>
          </Form>

          {error && <Alert type="error" message={error} showIcon />}
          {loading && slowLoading && (
            <Alert
              type="info"
              showIcon
              message="正在同步就诊数据，请稍候"
              description="首次查询或时间范围较大时，会先从 HIS 视图同步到本地索引后再返回列表。"
            />
          )}
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Spin spinning={loading} tip={slowLoading ? "正在同步数据…" : undefined}>
          <Table<VisitListItem>
            rowKey="patient_no"
            loading={false}
            dataSource={data?.items ?? []}
            pagination={{
              current: data?.page ?? page,
              pageSize: data?.page_size ?? pageSize,
              total: data?.total ?? 0,
              showSizeChanger: true,
              onChange: (p, ps) => loadList({ page: p, pageSize: ps }),
            }}
            columns={[
              { title: "就诊时间", dataIndex: "visit_time", width: 180 },
              { title: "门诊号", dataIndex: "patient_no", width: 160 },
              { title: "姓名", dataIndex: "xm", width: 120 },
              {
                title: "科室",
                dataIndex: "dept_name",
                width: 180,
                render: (value: string | null | undefined, row) => value || row.dept_code || "-",
              },
              {
                title: "医生",
                dataIndex: "doc_name",
                width: 180,
                render: (value: string | null | undefined, row) => value || row.doc_code || "-",
              },
              {
                title: "状态",
                dataIndex: "status",
                width: 140,
                render: (value: VisitListItem["status"]) => (
                  <Tag color={statusTagColor(value)}>{statusLabel(value)}</Tag>
                ),
              },
              {
                title: "操作",
                key: "action",
                width: 160,
                render: (_, row) => (
                  <Space size="small">
                    <Button type="link" onClick={() => navigate(`/app?patient_no=${row.patient_no}`)}>
                      进入填写
                    </Button>
                    <Button
                      type="link"
                      disabled={!row.record_id}
                      onClick={() => {
                        if (!row.record_id) {
                          message.info("记录尚未创建，暂无质控信息");
                          return;
                        }
                        void openQc(row);
                      }}
                    >
                      质控
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Spin>
      </Card>

      <Drawer
        title={qcData ? `质控查看（record_id=${qcData.record.record_id}）` : "质控查看"}
        open={qcOpen}
        width={980}
        onClose={() => {
          setQcOpen(false);
          setQcError(null);
          setQcData(null);
        }}
      >
        {qcError && <Alert type="error" showIcon message={qcError} style={{ marginBottom: 12 }} />}
        <Spin spinning={qcLoading}>
          {qcData && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card size="small" title="记录信息">
                <Descriptions
                  size="small"
                  bordered
                  column={2}
                  items={[
                    { key: "patient_no", label: "patient_no", children: qcData.record.patient_no },
                    { key: "visit_time", label: "visit_time", children: qcData.record.visit_time },
                    { key: "status", label: "status", children: qcData.record.status },
                    { key: "version", label: "version", children: qcData.record.version },
                    { key: "submitted_at", label: "submitted_at", children: qcData.record.submitted_at || "-" },
                  ]}
                />
              </Card>

              <Card size="small" title={`校验错误（${qcData.errors.length}）`}>
                <Table<FieldError>
                  size="small"
                  rowKey={(row) => `${row.field}-${row.seq_no ?? ""}-${row.rule ?? ""}`}
                  pagination={false}
                  dataSource={qcData.errors}
                  columns={[
                    { title: "分区", dataIndex: "section", width: 120, render: (v) => v || "-" },
                    { title: "字段", dataIndex: "field", width: 300, ellipsis: true },
                    { title: "序号", dataIndex: "seq_no", width: 70, render: (v) => v ?? "-" },
                    { title: "规则", dataIndex: "rule", width: 140 },
                    { title: "提示", dataIndex: "message" },
                  ]}
                />
              </Card>

              <Card size="small" title={`审计记录（${qcData.audits.length}，最近 200 条）`}>
                <Table<FieldAudit>
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={qcData.audits}
                  columns={[
                    { title: "时间", dataIndex: "created_at", width: 170 },
                    { title: "操作者", dataIndex: "operator_code", width: 120 },
                    { title: "来源", dataIndex: "change_source", width: 90 },
                    { title: "字段", dataIndex: "field_key", width: 260, ellipsis: true },
                    { title: "旧值", dataIndex: "old_value", width: 200, ellipsis: true, render: (v) => v ?? "-" },
                    { title: "新值", dataIndex: "new_value", width: 200, ellipsis: true, render: (v) => v ?? "-" },
                  ]}
                  scroll={{ x: 1100 }}
                />
              </Card>
            </Space>
          )}
        </Spin>
      </Drawer>
    </Space>
  );
}
