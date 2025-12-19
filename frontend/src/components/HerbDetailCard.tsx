import { Button, Card, Input, InputNumber, Space, Table, Tag, Typography } from "antd";
import DictRemoteSelect from "@/components/DictRemoteSelect";

const { Text } = Typography;

export type HerbRow = {
  seq_no: number;
  herb_type: string;
  route_code: string;
  route_name: string;
  dose_count: number;
};

type Props = {
  rows: HerbRow[];
  setRows: (next: HerbRow[]) => void;
  errorMap: Record<string, string[]>;
  max?: number;
};

function reindexSeq(rows: HerbRow[]): HerbRow[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export default function HerbDetailCard({ rows, setRows, errorMap, max = 40 }: Props) {
  const groupErrorKey = "herb_detail";
  const groupErrors = errorMap[groupErrorKey] || [];

  return (
    <Card
      size="small"
      title={
        <Space size="small">
          中草药明细
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
      <Table<HerbRow>
        size="small"
        rowKey="seq_no"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: "序号", dataIndex: "seq_no", width: 70 },
          {
            title: "类别（HERB_TYPE）",
            dataIndex: "herb_type",
            width: 220,
            render: (_: any, row, index) => {
              const key = `herb_detail.${row.seq_no}.herb_type`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <DictRemoteSelect
                    setCode="HERB_TYPE"
                    value={row.herb_type}
                    allowClear
                    placeholder="远程检索"
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], herb_type: v || "" };
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
            title: "途径代码（DRUG_ROUTE）",
            dataIndex: "route_code",
            width: 320,
            render: (_: any, row, index) => {
              const key = `herb_detail.${row.seq_no}.route_code`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <DictRemoteSelect
                    setCode="DRUG_ROUTE"
                    value={row.route_code}
                    allowClear
                    placeholder="远程检索"
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], route_code: v || "" };
                      setRows(next);
                    }}
                    onSelectItem={(item) => {
                      const next = [...rows];
                      next[index] = { ...next[index], route_code: item.code, route_name: item.name };
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
            title: "途径名称（回填）",
            dataIndex: "route_name",
            render: (_: any, row) => {
              const key = `herb_detail.${row.seq_no}.route_name`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <Input value={row.route_name} readOnly status={msgs.length ? "error" : undefined} />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: "剂数",
            dataIndex: "dose_count",
            width: 120,
            render: (_: any, row, index) => {
              const key = `herb_detail.${row.seq_no}.dose_count`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <InputNumber
                    min={0}
                    value={row.dose_count}
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], dose_count: Number(v ?? 0) };
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
              <Button danger type="link" onClick={() => setRows(reindexSeq(rows.filter((_, i) => i !== index)))}>
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
            setRows(
              reindexSeq([
                ...rows,
                { seq_no: rows.length + 1, herb_type: "", route_code: "", route_name: "", dose_count: 0 },
              ]),
            );
          }}
          disabled={rows.length >= max}
        >
          新增
        </Button>
      </div>
    </Card>
  );
}

