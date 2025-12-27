import { Button, Input, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export type DiagnosisRow = { seq_no: number; diag_name: string; diag_code?: string };

export type DiagnosisDictTarget = {
  kind: "diagnosis";
  diagType: "tcm_disease_main" | "tcm_syndrome" | "wm_main" | "wm_other";
  dictSetCode: string;
  title: string;
  rowIndex: number;
  rowSeqNo: number;
};

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
  activeTarget?: DiagnosisDictTarget | null;
  onActivateTarget?: (target: DiagnosisDictTarget) => void;
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
  activeTarget,
  onActivateTarget,
}: Props) {
  const addRow = () => {
    if (rows.length >= max) return;
    setRows(reindexSeq([...rows, { seq_no: rows.length + 1, diag_name: "", diag_code: "" }]));
  };

  const removeRow = (index: number) => {
    if (rows.length <= min) return;
    setRows(reindexSeq(rows.filter((_, i) => i !== index)));
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;
    const newRows = [...rows];
    const [item] = newRows.splice(index, 1);
    newRows.splice(newIndex, 0, item);
    setRows(reindexSeq(newRows));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* 标题区域 - 放在plane-table外部 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Space size="small">
          <Text strong>{title}</Text>
          <Tag color="default">
            {rows.length}/{max}
          </Tag>
        </Space>
      </div>

      {/* plane-table表格 */}
      <div className="plane-table simple">
        {/* 列标题 */}
        <div className="table-head simple">
          <span className="col category">序号</span>
          <span className="col code">编码</span>
          <span className="col name">诊断名称</span>
          <span className="col action">操作</span>
        </div>

        {/* 表体 */}
        <div className="table-body">
          {rows.map((row, index) => {
            const nameKey = `diagnosis.${diagType}.${row.seq_no}.diag_name`;
            const codeKey = `diagnosis.${diagType}.${row.seq_no}.diag_code`;
            const nameHasError = !!(errorMap[nameKey] || []).length;
            const codeHasError = !!(errorMap[codeKey] || []).length;
            const isMain = index === 0;
            const isActive = activeTarget?.kind === "diagnosis" && activeTarget.diagType === diagType && activeTarget.rowSeqNo === row.seq_no;

            return (
              <div key={row.seq_no} className={`table-row${isActive ? " is-active" : ""}`}>
                <div className="cell category">
                  {isMain ? (
                    <span className="main-tag">主</span>
                  ) : (
                    <span className="index-num">{row.seq_no}</span>
                  )}
                </div>
                <div
                  className="cell code clickable"
                  onClick={() => {
                    onActivateTarget?.({
                      kind: "diagnosis",
                      diagType,
                      dictSetCode,
                      title,
                      rowIndex: index,
                      rowSeqNo: row.seq_no,
                    });
                  }}
                >
                  <Input
                    value={row.diag_code || ""}
                    readOnly
                    placeholder={codeRequired ? "点击右侧检索选择（必填）" : "点击右侧检索选择（可选）"}
                    status={codeHasError ? "error" : undefined}
                  />
                </div>
                <div
                  className="cell name clickable"
                  onClick={() => {
                    onActivateTarget?.({
                      kind: "diagnosis",
                      diagType,
                      dictSetCode,
                      title,
                      rowIndex: index,
                      rowSeqNo: row.seq_no,
                    });
                  }}
                >
                  <Input
                    value={row.diag_name}
                    readOnly
                    placeholder="点击右侧检索选择"
                    status={nameHasError ? "error" : undefined}
                  />
                </div>
                <div className="cell action">
                  <div className="action-buttons">
                    <Button
                      type="link"
                      size="small"
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                    >
                      上移
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => moveRow(index, 1)}
                      disabled={index === rows.length - 1}
                    >
                      下移
                    </Button>
                    <Button
                      type="text"
                      danger
                      size="small"
                      onClick={() => removeRow(index)}
                      disabled={rows.length <= min}
                    >
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
            + 新增诊断
          </Button>
        </div>
      </div>
    </div>
  );
}
