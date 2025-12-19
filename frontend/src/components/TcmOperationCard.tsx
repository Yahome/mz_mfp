import { Button, Card, Input, InputNumber, Space, Table, Tag, Typography } from "antd";
import DictRemoteSelect from "@/components/DictRemoteSelect";

const { Text } = Typography;

export type TcmOpRow = {
  seq_no: number;
  op_name: string;
  op_code: string;
  op_times: number;
  op_days?: number;
};

type Props = {
  rows: TcmOpRow[];
  setRows: (next: TcmOpRow[]) => void;
  errorMap: Record<string, string[]>;
  max?: number;
};

function reindexSeq(rows: TcmOpRow[]): TcmOpRow[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export default function TcmOperationCard({ rows, setRows, errorMap, max = 10 }: Props) {
  const groupErrorKey = "tcm_operation";
  const groupErrors = errorMap[groupErrorKey] || [];

  return (
    <Card
      size="small"
      title={
        <Space size="small">
          中医治疗性操作
          <Tag color="default">
            {rows.length}/{max}
          </Tag>
        </Space>
      }
      style={{ marginBottom: 12 }}
    >
      {!!groupErrors.length && (
        <Typography.Text type="danger" style={{ display: "block", marginBottom: 12 }}>
          {groupErrors.join("；")}
        </Typography.Text>
      )}
      <Table<TcmOpRow>
        size="small"
        rowKey="seq_no"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: "序号", dataIndex: "seq_no", width: 70 },
          {
            title: "操作名称",
            dataIndex: "op_name",
            render: (_: any, row, index) => {
              const key = `tcm_operation.${row.seq_no}.op_name`;
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
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "操作编码（ICD9CM3）",
            dataIndex: "op_code",
            width: 320,
            render: (_: any, row, index) => {
              const key = `tcm_operation.${row.seq_no}.op_code`;
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
            title: "次数",
            dataIndex: "op_times",
            width: 110,
            render: (_: any, row, index) => {
              const key = `tcm_operation.${row.seq_no}.op_times`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <InputNumber
                    min={0}
                    value={row.op_times}
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], op_times: Number(v ?? 0) };
                      setRows(next);
                    }}
                    style={{ width: "100%" }}
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "天数（可选）",
            dataIndex: "op_days",
            width: 120,
            render: (_: any, row, index) => {
              const key = `tcm_operation.${row.seq_no}.op_days`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <InputNumber
                    min={0}
                    value={row.op_days}
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], op_days: v === null ? undefined : Number(v) };
                      setRows(next);
                    }}
                    style={{ width: "100%" }}
                    status={msgs.length ? "error" : undefined}
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
              <Button
                danger
                type="link"
                onClick={() => setRows(reindexSeq(rows.filter((_, i) => i !== index)))}
              >
                删除
              </Button>
            ),
          },
        ]}
      />
      <div style={{ marginTop: 8 }}>
        <Button
          type="dashed"
          onClick={() => {
            if (rows.length >= max) return;
            setRows(reindexSeq([...rows, { seq_no: rows.length + 1, op_name: "", op_code: "", op_times: 0 }]));
          }}
          disabled={rows.length >= max}
        >
          新增
        </Button>
      </div>
    </Card>
  );
}

