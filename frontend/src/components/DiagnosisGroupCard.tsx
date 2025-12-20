import { Button, Card, Input, Space, Table, Tag, Typography } from "antd";
import DictRemoteSelect, { type DictItem } from "@/components/DictRemoteSelect";

const { Text } = Typography;

export type DiagnosisRow = { seq_no: number; diag_name: string; diag_code?: string };

type Props = {
  title: string;
  diagType: "tcm_disease_main" | "tcm_syndrome" | "wm_main" | "wm_other";
  dictSetCode: string;
  rows: DiagnosisRow[];
  setRows: (next: DiagnosisRow[]) => void;
  max: number;
  min: number;
  codeRequired: boolean;
  errorMap: Record<string, string[]>;
};

function reindexSeq(rows: DiagnosisRow[]): DiagnosisRow[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export default function DiagnosisGroupCard({
  title,
  diagType,
  dictSetCode,
  rows,
  setRows,
  max,
  min,
  codeRequired,
  errorMap,
}: Props) {
  const groupErrorKey = `diagnosis.${diagType}`;
  const groupErrors = errorMap[groupErrorKey] || [];

  const addRow = () => {
    if (rows.length >= max) return;
    setRows(reindexSeq([...rows, { seq_no: rows.length + 1, diag_name: "", diag_code: "" }]));
  };

  const removeRow = (index: number) => {
    if (rows.length <= min) return;
    setRows(reindexSeq(rows.filter((_, i) => i !== index)));
  };

  return (
    <Card
      size="small"
      title={
        <Space size="small">
          {title}
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
      <Table<DiagnosisRow>
        size="small"
        rowKey="seq_no"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: "序号", dataIndex: "seq_no", width: 70 },
          {
            title: "诊断名称",
            dataIndex: "diag_name",
            render: (_: any, row, index) => {
              const key = `diagnosis.${diagType}.${row.seq_no}.diag_name`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <Input
                    value={row.diag_name}
                    onChange={(e) => {
                      const next = [...rows];
                      next[index] = { ...next[index], diag_name: e.target.value };
                      setRows(next);
                    }}
                    placeholder="请输入或通过编码选择回填"
                    status={msgs.length ? "error" : undefined}
                  />
                  {!!msgs.length && <Text type="danger">{msgs.join("；")}</Text>}
                </div>
              );
            },
          },
          {
            title: codeRequired ? "诊断编码（必填）" : "诊断编码（可选）",
            dataIndex: "diag_code",
            width: 320,
            render: (_: any, row, index) => {
              const key = `diagnosis.${diagType}.${row.seq_no}.diag_code`;
              const msgs = errorMap[key] || [];
              return (
                <div>
                  <DictRemoteSelect
                    setCode={dictSetCode}
                    value={row.diag_code}
                    allowClear
                    placeholder={`${dictSetCode} 远程检索`}
                    onChange={(v) => {
                      const next = [...rows];
                      next[index] = { ...next[index], diag_code: v || "" };
                      setRows(next);
                    }}
                    onSelectItem={(item: DictItem) => {
                      const next = [...rows];
                      next[index] = { ...next[index], diag_code: item.code, diag_name: item.name };
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
              <Button
                danger
                type="link"
                disabled={rows.length <= min}
                onClick={() => removeRow(index)}
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
          onClick={addRow}
          disabled={rows.length >= max}
        >
          新增
        </Button>
      </div>
    </Card>
  );
}
