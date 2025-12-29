import { useEffect, useState } from "react";
import { Alert, Button, Card, Input, Space, Typography, message } from "antd";
import apiClient from "@/services/apiClient";

const { Text } = Typography;

type ResetResult = {
  status: string;
  patient_no: string;
  deleted_record_id: number | null;
};

export default function AdminResetPatient() {
  const [patientNo, setPatientNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiClient.get("/auth/me", { withCredentials: true });
        const roles: string[] = resp.data?.roles || [];
        const login = String(resp.data?.login_name || "").toLowerCase();
        const admin = login === "admin" || roles.map((r) => String(r).toLowerCase()).includes("admin");
        setIsAdmin(admin);
        if (!admin) {
          message.error("仅 admin 可访问该功能");
        }
      } catch (err: any) {
        message.error(err?.response?.data?.message || err?.message || "获取会话信息失败");
        setIsAdmin(false);
      }
    })();
  }, []);

  const handleReset = async () => {
    const trimmed = patientNo.trim();
    if (!trimmed) {
      message.warning("请输入门诊号");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resp = await apiClient.post<ResetResult>(`/mz_mfp/records/${encodeURIComponent(trimmed)}/reset`, null, {
        withCredentials: true,
      });
      setResult(resp.data);
      message.success("清理完成");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "清理失败";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="患者数据清理" bordered={false} bodyStyle={{ padding: 16 }}>
      {isAdmin === false && (
        <Alert type="error" message="无权限：仅 admin 可操作" showIcon style={{ marginBottom: 12 }} />
      )}
      <Space direction="vertical" size="middle" style={{ width: 360 }}>
        <div>
          <Text strong>门诊号</Text>
          <Input
            placeholder="请输入门诊号（patient_no）"
            value={patientNo}
            onChange={(e) => setPatientNo(e.target.value)}
            disabled={loading}
            style={{ marginTop: 8 }}
          />
        </div>
        <Button type="primary" onClick={handleReset} loading={loading} disabled={isAdmin === false}>
          一键清理并回到预填
        </Button>
        {result && (
          <Alert
            type="success"
            showIcon
            message="清理成功"
            description={
              <Space direction="vertical" size={4}>
                <Text>patient_no：{result.patient_no}</Text>
                <Text>deleted_record_id：{result.deleted_record_id ?? "无"}</Text>
              </Space>
            }
          />
        )}
        <Alert
          type="info"
          showIcon
          message="说明"
          description="清理会删除该患者在本系统的病案记录及子表/导出日志，下次进入将重新从 HIS 预填。仅 admin 可执行。"
        />
      </Space>
    </Card>
  );
}
