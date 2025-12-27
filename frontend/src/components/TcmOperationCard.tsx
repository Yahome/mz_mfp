import { Button, Input, InputNumber, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export type TcmOpRow = {
  seq_no: number;
  op_name: string;
  op_code: string;
  op_times: number;
  op_days?: number;
};

export type TcmOpDictTarget = {
  kind: "tcm_operation";
  setCode: "ICD9CM3";
  title: string;
  rowIndex: number;
  rowSeqNo: number;
};

type Props = {
  rows: TcmOpRow[];
  setRows: (next: TcmOpRow[]) => void;
  errorMap: Record<string, string[]>;
  max?: number;
  activeTarget?: TcmOpDictTarget | null;
  onActivateTarget?: (target: TcmOpDictTarget) => void;
};

function reindexSeq(rows: TcmOpRow[]): TcmOpRow[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export default function TcmOperationCard({
  rows,
  setRows,
  errorMap,
  max = 10,
  activeTarget,
  onActivateTarget,
}: Props) {
  const groupErrorKey = "tcm_operation";
  const groupErrors = errorMap[groupErrorKey] || [];

  const addRow = () => {
    if (rows.length >= max) return;
    setRows(reindexSeq([...rows, { seq_no: rows.length + 1, op_name: "", op_code: "", op_times: 0 }]));
  };

  const removeRow = (index: number) => {
    setRows(reindexSeq(rows.filter((_, i) => i !== index)));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* 标题区域 - 放在plane-table外部 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Space size="small">
          <Text strong>中医治疗性操作</Text>
          <Tag color="default">
            {rows.length}/{max}
          </Tag>
        </Space>
      </div>

      {!!groupErrors.length && (
        <Typography.Text type="danger" style={{ display: "block", marginBottom: 12 }}>
          {groupErrors.join("；")}
        </Typography.Text>
      )}

      {/* plane-table表格 */}
      <div className="plane-table tcm-op">
        {/* 列标题 */}
        <div className="table-head">
          <span className="col category">序号</span>
          <span className="col code">中医治疗性操作编码（非手术类）</span>
          <span className="col name">中医治疗性操作名称（非手术类）</span>
          <span className="col times">中医治疗性操作次数</span>
          <span className="col days">中医治疗性操作天数</span>
          <span className="col action">操作</span>
        </div>

        {/* 表体 */}
        <div className="table-body">
          {rows.map((row, index) => {
            const nameKey = `tcm_operation.${row.seq_no}.op_name`;
            const codeKey = `tcm_operation.${row.seq_no}.op_code`;
            const timesKey = `tcm_operation.${row.seq_no}.op_times`;
            const daysKey = `tcm_operation.${row.seq_no}.op_days`;

            const nameMsgs = errorMap[nameKey] || [];
            const codeMsgs = errorMap[codeKey] || [];
            const timesMsgs = errorMap[timesKey] || [];
            const daysMsgs = errorMap[daysKey] || [];
            const isActive = activeTarget?.kind === "tcm_operation" && activeTarget.rowSeqNo === row.seq_no;

            return (
              <div key={row.seq_no} className={`table-row${isActive ? " is-active" : ""}`}>
                <div className="cell category">
                  <span className="index-num">{row.seq_no}</span>
                </div>
                <div
                  className="cell code clickable"
                  onClick={() => {
                    onActivateTarget?.({
                      kind: "tcm_operation",
                      setCode: "ICD9CM3",
                      title: "中医治疗性操作",
                      rowIndex: index,
                      rowSeqNo: row.seq_no,
                    });
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <Input
                      value={row.op_code}
                      readOnly
                      placeholder="点击右侧检索选择"
                      status={codeMsgs.length ? "error" : undefined}
                    />
                    {!!codeMsgs.length && <Text type="danger">{codeMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div
                  className="cell name clickable"
                  onClick={() => {
                    onActivateTarget?.({
                      kind: "tcm_operation",
                      setCode: "ICD9CM3",
                      title: "中医治疗性操作",
                      rowIndex: index,
                      rowSeqNo: row.seq_no,
                    });
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <Input
                      value={row.op_name}
                      readOnly
                      placeholder="点击右侧检索选择"
                      status={nameMsgs.length ? "error" : undefined}
                    />
                    {!!nameMsgs.length && <Text type="danger">{nameMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell times">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <InputNumber
                      min={0}
                      value={row.op_times}
                      onChange={(v) => {
                        const next = [...rows];
                        next[index] = { ...next[index], op_times: Number(v ?? 0) };
                        setRows(next);
                      }}
                      style={{ width: "100%" }}
                      status={timesMsgs.length ? "error" : undefined}
                    />
                    {!!timesMsgs.length && <Text type="danger">{timesMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell days">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <InputNumber
                      min={0}
                      value={row.op_days}
                      onChange={(v) => {
                        const next = [...rows];
                        next[index] = { ...next[index], op_days: v === null ? undefined : Number(v) };
                        setRows(next);
                      }}
                      style={{ width: "100%" }}
                      status={daysMsgs.length ? "error" : undefined}
                    />
                    {!!daysMsgs.length && <Text type="danger">{daysMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell action">
                  <div className="action-buttons">
                    <Button type="text" danger size="small" onClick={() => removeRow(index)}>
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 表尾 */}
        <div className="table-footer">
          <Button type="dashed" block size="small" onClick={addRow} disabled={rows.length >= max}>
            + 新增
          </Button>
        </div>
      </div>
    </div>
  );
}

