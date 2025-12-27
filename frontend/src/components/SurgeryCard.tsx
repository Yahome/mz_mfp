import { Button, DatePicker, Input, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
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

export type SurgeryDictTarget = {
  kind: "surgery";
  setCode: "ICD9CM3";
  title: string;
  rowIndex: number;
  rowSeqNo: number;
};

type Props = {
  rows: SurgeryRow[];
  setRows: (next: SurgeryRow[]) => void;
  errorMap: Record<string, string[]>;
  max?: number;
  activeTarget?: SurgeryDictTarget | null;
  onActivateTarget?: (target: SurgeryDictTarget) => void;
};

function reindexSeq(rows: SurgeryRow[]): SurgeryRow[] {
  return rows.map((row, idx) => ({ ...row, seq_no: idx + 1 }));
}

export default function SurgeryCard({
  rows,
  setRows,
  errorMap,
  max = 5,
  activeTarget,
  onActivateTarget,
}: Props) {
  const groupErrorKey = "surgery";
  const groupErrors = errorMap[groupErrorKey] || [];

  const parseDateTime = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    const parsed = dayjs(normalized);
    return parsed.isValid() ? parsed : null;
  };

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

  const moveRow = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= rows.length) return;
    const nextRows = [...rows];
    const [item] = nextRows.splice(index, 1);
    nextRows.splice(nextIndex, 0, item);
    setRows(reindexSeq(nextRows));
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {/* 标题区域 - 放在plane-table外部 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Space size="small">
          <Text strong>手术/操作</Text>
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
      <div className="plane-table surgery">
        {/* 列标题 */}
        <div className="table-head">
          <span className="col category">序号</span>
          <span className="col name">名称</span>
          <span className="col code">编码（ICD9CM3）</span>
          <span className="col time">日期</span>
          <span className="col operator">操作者</span>
          <span className="col anesthesia-method">麻醉方式（RC013）</span>
          <span className="col anesthesia-doctor">麻醉医师</span>
          <span className="col surgery-level">分级（RC029）</span>
          <span className="col action">操作</span>
        </div>

        {/* 表体 */}
        <div className="table-body">
          {rows.map((row, index) => {
            const nameKey = `surgery.${row.seq_no}.op_name`;
            const codeKey = `surgery.${row.seq_no}.op_code`;
            const timeKey = `surgery.${row.seq_no}.op_time`;
            const operatorKey = `surgery.${row.seq_no}.operator_name`;
            const anesthesiaMethodKey = `surgery.${row.seq_no}.anesthesia_method`;
            const anesthesiaDoctorKey = `surgery.${row.seq_no}.anesthesia_doctor`;
            const levelKey = `surgery.${row.seq_no}.surgery_level`;

            const nameMsgs = errorMap[nameKey] || [];
            const codeMsgs = errorMap[codeKey] || [];
            const timeMsgs = errorMap[timeKey] || [];
            const operatorMsgs = errorMap[operatorKey] || [];
            const anesthesiaMethodMsgs = errorMap[anesthesiaMethodKey] || [];
            const anesthesiaDoctorMsgs = errorMap[anesthesiaDoctorKey] || [];
            const levelMsgs = errorMap[levelKey] || [];

            const levelValue = row.surgery_level === undefined ? undefined : String(row.surgery_level);
            const isActive = activeTarget?.kind === "surgery" && activeTarget.rowSeqNo === row.seq_no;

            return (
              <div key={row.seq_no} className={`table-row${isActive ? " is-active" : ""}`}>
                <div className="cell category">
                  <span className="index-num">{row.seq_no}</span>
                </div>
                <div
                  className="cell name clickable"
                  onClick={() => {
                    onActivateTarget?.({
                      kind: "surgery",
                      setCode: "ICD9CM3",
                      title: "手术/操作",
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
                <div
                  className="cell code clickable"
                  onClick={() => {
                    onActivateTarget?.({
                      kind: "surgery",
                      setCode: "ICD9CM3",
                      title: "手术/操作",
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
                <div className="cell time">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <DatePicker
                      showTime={{ format: "HH:mm:ss" }}
                      format="YYYY-MM-DD HH:mm:ss"
                      value={parseDateTime(row.op_time)}
                      allowClear
                      onChange={(_, dateString) => {
                        if (Array.isArray(dateString)) return;
                        const next = [...rows];
                        next[index] = { ...next[index], op_time: dateString || "" };
                        setRows(next);
                      }}
                      placeholder="请选择日期时间"
                      style={{ width: "100%" }}
                      status={timeMsgs.length ? "error" : undefined}
                    />
                    {!!timeMsgs.length && <Text type="danger">{timeMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell operator">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <Input
                      value={row.operator_name}
                      onChange={(e) => {
                        const next = [...rows];
                        next[index] = { ...next[index], operator_name: e.target.value };
                        setRows(next);
                      }}
                      status={operatorMsgs.length ? "error" : undefined}
                    />
                    {!!operatorMsgs.length && <Text type="danger">{operatorMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell anesthesia-method">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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
                      status={anesthesiaMethodMsgs.length ? "error" : undefined}
                    />
                    {!!anesthesiaMethodMsgs.length && <Text type="danger">{anesthesiaMethodMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell anesthesia-doctor">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <Input
                      value={row.anesthesia_doctor}
                      onChange={(e) => {
                        const next = [...rows];
                        next[index] = { ...next[index], anesthesia_doctor: e.target.value };
                        setRows(next);
                      }}
                      status={anesthesiaDoctorMsgs.length ? "error" : undefined}
                    />
                    {!!anesthesiaDoctorMsgs.length && <Text type="danger">{anesthesiaDoctorMsgs.join("；")}</Text>}
                  </div>
                </div>
                <div className="cell surgery-level">
                  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <DictRemoteSelect
                      setCode="RC029"
                      value={levelValue}
                      allowClear
                      placeholder="远程检索"
                      onChange={(v) => {
                        const next = [...rows];
                        next[index] = { ...next[index], surgery_level: v ? Number(v) : undefined };
                        setRows(next);
                      }}
                      style={{ width: "100%" }}
                      status={levelMsgs.length ? "error" : undefined}
                    />
                    {!!levelMsgs.length && <Text type="danger">{levelMsgs.join("；")}</Text>}
                  </div>
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
