import { useEffect, useState } from "react";
import { Card, Col, Row, Space, Typography } from "antd";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import BoardingPassInfoGrid from "@/components/BoardingPassInfoGrid";

const { Text } = Typography;

type FeeSummary = Record<string, any>;

type Props = {
  feeSummary: FeeSummary | null;
  showSource: boolean;
  sourceTip?: (key: string) => React.ReactNode;
};

type FeeCategory = {
  title: string;
  icon: string;
  fields: Array<{ label: string; key: string; subKey?: string }>;
};

const FEE_CATEGORIES: FeeCategory[] = [
  {
    title: "综合医疗服务类",
    icon: "💊",
    fields: [
      { label: "(1) 一般医疗服务费", key: "ylfwf" },
      { label: "(2) 一般治疗操作费", key: "zlczf" },
      { label: "(3) 护理费", key: "hlf" },
      { label: "(4) 其他费用", key: "qtfy" },
    ],
  },
  {
    title: "诊断类",
    icon: "🔬",
    fields: [
      { label: "(5) 病理诊断费", key: "blzdf" },
      { label: "(6) 实验室诊断费", key: "zdf" },
      { label: "(7) 影像学诊断费", key: "yxxzdf" },
      { label: "(8) 临床诊断项目费", key: "lczdxmf" },
    ],
  },
  {
    title: "治疗类",
    icon: "💉",
    fields: [
      { label: "(9) 非手术治疗项目费", key: "fsszlxmf" },
      { label: "临床物理治疗费", key: "zlf" },
      { label: "(10) 手术治疗费", key: "sszlf" },
      { label: "手术费", key: "ssf", subKey: "手术" },
      { label: "麻醉费", key: "mzf", subKey: "麻醉" },
    ],
  },
  {
    title: "康复类",
    icon: "🏥",
    fields: [{ label: "(11) 康复费", key: "kff" }],
  },
  {
    title: "中医类",
    icon: "⚕️",
    fields: [
      { label: "(12) 中医治疗费", key: "zyzl" },
      { label: "中医辨证论治费", key: "zyl_zyzd" },
      { label: "中医辨证论治会诊费", key: "zybzlzhzf" },
      { label: "中医外治", key: "zywz" },
      { label: "中医骨伤", key: "zygs" },
      { label: "针刺与灸法", key: "zcyjf" },
      { label: "中医推拿治疗", key: "zytnzl" },
      { label: "中医肛肠治疗", key: "zygczl" },
      { label: "中医特殊治疗", key: "zytszl" },
      { label: "中药特殊调配加工", key: "zytstpjg" },
      { label: "辨证施膳", key: "bzss" },
    ],
  },
  {
    title: "西药类",
    icon: "💊",
    fields: [
      { label: "(13) 西药费", key: "xyf" },
      { label: "抗菌药物费用", key: "kjywf" },
    ],
  },
  {
    title: "中药类",
    icon: "🌿",
    fields: [
      { label: "(14) 中成药费", key: "zcyf" },
      { label: "(15) 中草药费", key: "zcyf1" },
      { label: "医疗机构中药制剂费", key: "zyzjf" },
      { label: "配方颗粒费", key: "pfklf" },
    ],
  },
  {
    title: "血液和血制品类",
    icon: "🩸",
    fields: [
      { label: "(16) 血费", key: "xf" },
      { label: "(17) 白蛋白类制品费", key: "bdbblzpf" },
      { label: "(18) 球蛋白类制品费", key: "qdbblzpf" },
      { label: "(19) 凝血因子类制品费", key: "nxyzlzpf" },
      { label: "(20) 细胞因子类制品费", key: "xbyzlzpf" },
    ],
  },
  {
    title: "耗材类",
    icon: "🔧",
    fields: [
      { label: "(21) 检查用一次性医用材料费", key: "jcyyclf" },
      { label: "(22) 治疗用一次性医用材料费", key: "yyclf" },
      { label: "(23) 手术用一次性医用材料费", key: "ssycxclf" },
    ],
  },
  {
    title: "10.其他类",
    icon: "📋",
    fields: [{ label: "(24) 其他费", key: "qtf" }],
  },
];

const moneyFormatter = new Intl.NumberFormat("zh-CN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatFeeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "0.00";
  const num = Number(value);
  if (!Number.isFinite(num)) return "0.00";
  return moneyFormatter.format(num);
}

function hasFeeAmount(feeSummary: FeeSummary | null, fields: Array<{ key: string }>): boolean {
  if (!feeSummary) return false;
  return fields.some((field) => {
    const value = feeSummary[field.key];
    const num = Number(value);
    return !isNaN(num) && num > 0;
  });
}

export default function FeeDisplayComplete({ feeSummary, showSource, sourceTip }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(() => {
    const saved = localStorage.getItem("fee_expanded_categories");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        return new Set(arr);
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  // 自动展开有金额的分类
  useEffect(() => {
    if (!feeSummary) return;
    const autoExpanded = new Set<number>();
    FEE_CATEGORIES.forEach((category, index) => {
      if (hasFeeAmount(feeSummary, category.fields)) {
        autoExpanded.add(index);
      }
    });
    setExpandedCategories(autoExpanded);
  }, [feeSummary]);

  // 保存展开状态到 localStorage
  useEffect(() => {
    localStorage.setItem("fee_expanded_categories", JSON.stringify(Array.from(expandedCategories)));
  }, [expandedCategories]);

  const toggleCategory = (index: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const ybjjzf = (() => {
    const zfy = Number(feeSummary?.zfy);
    const zfje = Number(feeSummary?.zfje);
    if (!Number.isFinite(zfy) || !Number.isFinite(zfje)) return null;
    return zfy - zfje;
  })();

  return (
    <Space direction="vertical" size={4} style={{ width: "100%" }}>
      {/* 费用概览（无外框，仅保留数据） */}
      <div
        style={{
          background: "#fff",
          borderRadius: "8px",
          padding: "8px 12px",
        }}
      >
        <BoardingPassInfoGrid
          items={[
            {
              label: (
                <Space size="small">
                  总费用
                  {showSource && sourceTip ? sourceTip("ZFY") : null}
                </Space>
              ),
              value: <Text strong style={{ fontSize: 18, color: "#1890FF" }}>{formatFeeValue(feeSummary?.zfy)}</Text>,
            },
            {
              label: (
                <Space size="small">
                  自付金额
                  {showSource && sourceTip ? sourceTip("ZFJE") : null}
                </Space>
              ),
              value: <Text strong style={{ fontSize: 18, color: "#52C41A" }}>{formatFeeValue(feeSummary?.zfje)}</Text>,
            },
            {
              label: (
                <Space size="small">
                  医保支付
                  {showSource && sourceTip ? sourceTip("YBJJZF") : null}
                </Space>
              ),
              value: <Text strong style={{ fontSize: 18, color: "#FA8C16" }}>{formatFeeValue(ybjjzf)}</Text>,
            },
          ]}
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px 16px",
            padding: "10px 12px",
          }}
        />
      </div>

      {/* 费用分类明细 */}
      {FEE_CATEGORIES.map((category, categoryIndex) => {
        const isExpanded = expandedCategories.has(categoryIndex);
        const hasAmount = hasFeeAmount(feeSummary, category.fields);

        return (
          <Card
            key={categoryIndex}
            title={
              <Space size="small">
                <span>{category.icon}</span>
                <span style={{ fontWeight: 600 }}>{category.title}</span>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  ({category.fields.length}项)
                </Text>
                {hasAmount && (
                  <Text type="success" style={{ fontSize: 12 }}>
                    ● 有费用
                  </Text>
                )}
              </Space>
            }
            extra={
              <a
                onClick={() => toggleCategory(categoryIndex)}
                style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
              >
                {isExpanded ? (
                  <>
                    收起 <UpOutlined />
                  </>
                ) : (
                  <>
                    展开 <DownOutlined />
                  </>
                )}
              </a>
            }
            bordered
            size="small"
            bodyStyle={{ padding: 12 }}
            style={{
              borderRadius: "8px",
              borderLeft: hasAmount ? "4px solid #52C41A" : undefined,
            }}
          >
            {isExpanded && (
              <Row gutter={[12, 10]}>
                {category.fields.map((field) => (
                  <Col span={12} key={field.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Space size="small">
                        <Text style={{ fontSize: 14 }}>
                          {field.label}
                          {field.subKey && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {" "}
                              ({field.subKey})
                            </Text>
                          )}
                        </Text>
                        {showSource && sourceTip && sourceTip(field.key.toUpperCase())}
                      </Space>
                      <Text strong style={{ fontSize: 14, color: "#1890FF" }}>
                        {formatFeeValue(feeSummary?.[field.key])}
                      </Text>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
            {!isExpanded && (
              <div style={{ textAlign: "center", padding: "8px 0", color: "#8C8C8C" }}>点击"展开"查看明细</div>
            )}
          </Card>
        );
      })}

      <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 8 }}>
        费用字段全部来自 HIS 费用视图，直取展示，不做前端费用统计/校验；保存/提交时由后端按外部数据刷新并审计。
      </Text>
    </Space>
  );
}
