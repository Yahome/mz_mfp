import { useState } from "react";
import { Button, Card, DatePicker, Space, Typography, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import apiClient from "@/services/apiClient";

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function ExportReport() {
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    const [from, to] = range || [];
    if (!from || !to) {
      message.warning("请选择开始和结束日期");
      return;
    }
    setLoading(true);
    try {
      const resp = await apiClient.get(`/mz_mfp/exports/report.xlsx`, {
        params: { from: from.format("YYYY-MM-DD"), to: to.format("YYYY-MM-DD") },
        responseType: "blob",
        withCredentials: true,
      });
      const blob = new Blob([resp.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const disposition = resp.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?(.*?)"?$/);
      const filename = match?.[1] || `report_${from.format("YYYYMMDD")}_${to.format("YYYYMMDD")}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success("导出已开始");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "导出失败";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="门诊病案首页导出" bordered={false} bodyStyle={{ padding: 16 }}>
      <Space direction="vertical" size="large">
        <Space direction="vertical" size="small">
          <Text strong>日期范围</Text>
          <RangePicker
            value={range || [null, null]}
            onChange={(value) => setRange(value as any)}
            allowClear
            disabled={loading}
          />
        </Space>
        <Space>
          <Button type="primary" onClick={handleExport} loading={loading}>
            导出 XLSX
          </Button>
          <Text type="secondary">导出接口：/mz_mfp/exports/report.xlsx，需登录</Text>
        </Space>
      </Space>
    </Card>
  );
}
