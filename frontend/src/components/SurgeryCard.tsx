import { Button, Card, Input, Space, Table, Tag, Typography } from "antd";
import type { KeyboardEvent } from "react";
import DictRemoteSelect from "@/components/DictRemoteSelect";

const { Text } = Typography;

export type SurgeryRow = {
  seq_no: number;
  op_name: string;
  op_code: string;
  op_time: string;
  operator_name: string;
  anesthesia_method: string;
  anesthesia_doctor: string;
  surgery_level: number | undefined;
};

type Props = {
  rows: SurgeryRow[];
  setRows: (next: SurgeryRow[]) => void;
  errorMap: Record<string, string[]>;
  max?: number;
};

function reindexSeq(rows: SurgeryRow[]): SurgeryRow[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export default function SurgeryCard({ rows, setRows, errorMap, max = 5 }: Props) {
  const groupErrorKey = "surgery";
  const groupErrors = errorMap[groupErrorKey] || [];

  const addRow = () => {
    if (rows.length >= max) return;
    setRows(
      reindexSeq([
        ...rows,
        {
          seq_no: rows.length + 1,
          op_name: "",
          op_code: "",
          op_time: "",
          operator_name: "",
          anesthesia_method: "",
          anesthesia_doctor: "",
          surgery_level: undefined,
        },
      ]),
    );
  };

  const removeRow = (index: number) => {
    setRows(reindexSeq(rows.filter((_, i) => i !== index)));
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      addRow();
      return;
    }
    if (e.ctrlKey && (e.key === "Backspace" || e.key === "Delete")) {
      e.preventDefault();
      removeRow(index);
    }
  };

  return (
    <Card
      size="small"
      title={
        <Space size="small">
          手术/操作
          <Tag color="default">
            {rows.length}/{max}
          </Tag>
        </Space>
      }
    >
      {!!groupErrors.length && (
        <Typography.Text type="danger" style={{ display: "block", marginBottom: 12 }}>
          {groupErrors.join("；")}
        </Typography.Text>
      )}
      <Table<SurgeryRow>
        size="small"
        rowKey="seq_no"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: "序号", dataIndex: "seq_no", width: 70 },
          {
            title: "名称",
            dataIndex: "op_name",
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.op_name`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <Input
                    value={row.op_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...next[index], op_name: e.target.value };
                      setRows(next);
                    }}
                    onKeyDown={(e) => handleRowKeyDown(e, index)}
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "编码（ICD9CM3）",
            dataIndex: "op_code",
            width: 300,
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.op_code`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <DictRemoteSelect
                    setCode="ICD9CM3"
                    value={row.op_code}
                    allowClear
                    placeholder="ICD9CM3 远程检索"
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], op_code: v || "" };
                      setRows(next);
                    }}
                    onSelectItem={(item) => {
                      const next = [...rows];
                      next[index] = { ...next[index], op_code: item.code, op_name: item.name };
                      setRows(next);
                    }}
                    style={{ width: "100%" }}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "日期",
            dataIndex: "op_time",
            width: 190,
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.op_time`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <Input
                    type="datetime-local"
                    value={row.op_time}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...next[index], op_time: e.target.value };
                      setRows(next);
                    }}
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "操作者",
            dataIndex: "operator_name",
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.operator_name`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <Input
                    value={row.operator_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...next[index], operator_name: e.target.value };
                      setRows(next);
                    }}
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "麻醉方式（RC013）",
            dataIndex: "anesthesia_method",
            width: 220,
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.anesthesia_method`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <DictRemoteSelect
                    setCode="RC013"
                    value={row.anesthesia_method}
                    allowClear
                    placeholder="远程检索"
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], anesthesia_method: v || "" };
                      setRows(next);
                    }}
                    style={{ width: "100%" }}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "麻醉医师",
            dataIndex: "anesthesia_doctor",
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.anesthesia_doctor`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <Input
                    value={row.anesthesia_doctor}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...next[index], anesthesia_doctor: e.target.value };
                      setRows(next);
                    }}
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "分级（RC029）",
            dataIndex: "surgery_level",
            width: 180,
            render: (_: any, row, index) => {
              const key = `surgery.${row.seq_no}.surgery_level`;
              const msgs = errorMap[key] || [];
              const value = row.surgery_level === undefined ? undefined : String(row.surgery_level);
              return (
                <div>
                  <DictRemoteSelect
                    setCode="RC029"
                    value={value}
                    allowClear
                    placeholder="远程检索"
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], surgery_level: v ? Number(v) : undefined };
                      setRows(next);
                    }}
                    style={{ width: "100%" }}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "操作",
            key: "action",
            width: 90,
            render: (_: any, _row, index) => (
              <Button danger type="link" onClick={() => removeRow(index)}>
                删除
              </Button>
            ),
          },
        ]}
      />
      <div style={{ marginTop: 8 }}>
        <Button
          type="dashed"
          onClick={addRow}
          disabled={rows.length >= max}
        >
          新增
        </Button>
      </div>
    </Card>
  );
}
