import { Space, Tag, Typography } from "antd";

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

export default function HerbDetailCard({ rows, setRows, errorMap, max = 40 }: Props) {
  void setRows;
  void errorMap;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Space size="small">
          <Text strong>中草药明细</Text>
          <Tag color="default">
            {rows.length}/{max}
          </Tag>
        </Space>
      </div>

      <div className="plane-table herb-detail">
        <div className="table-head">
          <span className="col category">序号</span>
          <span className="col herb-type">中草药类别（ZCYLB）</span>
          <span className="col route-code">用药途径代码（YYTJDM）</span>
          <span className="col route-name">用药途径名称（YYTJMC）</span>
          <span className="col dose-count">用药剂数（YYJS）</span>
        </div>

        <div className="table-body">
          {rows.length ? (
            rows.map((row) => (
              <div key={row.seq_no} className="table-row">
                <div className="cell category">
                  <span className="index-num">{row.seq_no}</span>
                </div>
                <div className="cell herb-type">
                  <Text style={{ width: "100%" }}>{row.herb_type || "-"}</Text>
                </div>
                <div className="cell route-code">
                  <Text style={{ width: "100%" }}>{row.route_code || "-"}</Text>
                </div>
                <div className="cell route-name">
                  <Text style={{ width: "100%" }}>{row.route_name || "-"}</Text>
                </div>
                <div className="cell dose-count">
                  <Text style={{ width: "100%" }}>{Number.isFinite(row.dose_count) ? row.dose_count : "-"}</Text>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "10px 12px", background: "#fff" }}>
              <Text type="secondary">暂无数据</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
