import { Form, Input, Space, Tooltip } from "antd";
import DictRemoteSelect from "@/components/DictRemoteSelect";
import type { BaseInfoFormValues } from "./useRecordLogic";
import type { ReactNode } from "react";
import styles from "./BaseInfoSection.module.css";

type Props = {
  prefillMeta?: (key: string) => { readonly: boolean; source: string } | null;
};

function normalizeOptionalString(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
}

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export default function BaseInfoSection({ prefillMeta }: Props) {
  const form = Form.useFormInstance<BaseInfoFormValues>();
  const showSource = Form.useWatch(["base_info", "_show_source"], form);
  const meta = (key: string) => prefillMeta?.(key);
  const readonly = (key: string) => Boolean(meta(key)?.readonly);
  const sourceTip = (key: string) => {
    const info = meta(key);
    if (!info) return null;
    return (
      <Tooltip title={`来源：${info.source}${info.readonly ? "（只读）" : ""}`}>
        <span className="meta-badge">{info.readonly ? "只读" : info.source}</span>
      </Tooltip>
    );
  };

  return (
    <div className={styles.stack}>
      <Form.Item name={["base_info", "username"]} hidden rules={[{ required: true, message: "必填" }, { max: 10, message: "长度超限（最大 10）" }]}>
        <Input maxLength={10} />
      </Form.Item>
      <Form.Item name={["base_info", "jzsj"]} hidden rules={[{ required: true, message: "必填" }]}>
        <Input />
      </Form.Item>
      <Form.Item name={["base_info", "jzksdm"]} hidden rules={[{ required: true, message: "必填" }]}>
        <Input />
      </Form.Item>
      <Form.Item name={["base_info", "jzks"]} hidden rules={[{ max: 100, message: "长度超限（最大 100）" }]}>
        <Input maxLength={100} />
      </Form.Item>
      <Form.Item name={["base_info", "jzys"]} hidden rules={[{ required: true, message: "必填" }, { max: 40, message: "长度超限（最大 40）" }]}>
        <Input maxLength={40} />
      </Form.Item>
      <Form.Item name={["base_info", "jzyszc"]} hidden rules={[{ required: true, message: "必填" }]}>
        <Input />
      </Form.Item>
      <SectionCard title="就诊信息">
        <div className={styles.ticketGrid}>
          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                就诊卡号/病案号
                {showSource ? sourceTip("JZKH") : null}
              </Space>
            }
            name={["base_info", "jzkh"]}
            rules={[{ required: true, message: "必填" }, { max: 50, message: "长度超限（最大 50）" }]}
          >
            <Input maxLength={50} readOnly={readonly("JZKH")} className={readonly("JZKH") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                姓名
                {showSource ? sourceTip("XM") : null}
              </Space>
            }
            name={["base_info", "xm"]}
            rules={[{ required: true, message: "必填" }, { max: 100, message: "长度超限（最大 100）" }]}
          >
            <Input maxLength={100} readOnly={readonly("XM")} className={readonly("XM") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                性别
                {showSource ? sourceTip("XB") : null}
              </Space>
            }
            name={["base_info", "xb"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <DictRemoteSelect setCode="RC001" allowClear placeholder="远程检索" disabled={readonly("XB")} labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                出生日期
                {showSource ? sourceTip("CSRQ") : null}
              </Space>
            }
            name={["base_info", "csrq"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <Input type="date" disabled={readonly("CSRQ")} className={readonly("CSRQ") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                婚姻状况
                {showSource ? sourceTip("HY") : null}
              </Space>
            }
            name={["base_info", "hy"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <DictRemoteSelect setCode="RC002" allowClear placeholder="远程检索" disabled={readonly("HY")} labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                国籍
                {showSource ? sourceTip("GJ") : null}
              </Space>
            }
            name={["base_info", "gj"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <DictRemoteSelect setCode="COUNTRY" allowClear placeholder="远程检索" disabled={readonly("GJ")} labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                民族
                {showSource ? sourceTip("MZ") : null}
              </Space>
            }
            name={["base_info", "mz"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <DictRemoteSelect setCode="RC035" allowClear placeholder="远程检索" disabled={readonly("MZ")} labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                证件类别
                {showSource ? sourceTip("ZJLB") : null}
              </Space>
            }
            name={["base_info", "zjlb"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <DictRemoteSelect setCode="RC038" allowClear placeholder="远程检索" disabled={readonly("ZJLB")} labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                证件号码
                {showSource ? sourceTip("ZJHM") : null}
              </Space>
            }
            name={["base_info", "zjhm"]}
            rules={[{ required: true, message: "必填" }, { max: 18, message: "长度超限（最大 18）" }]}
          >
            <Input maxLength={18} readOnly={readonly("ZJHM")} className={readonly("ZJHM") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                联系电话
                {showSource ? sourceTip("LXDH") : null}
              </Space>
            }
            name={["base_info", "lxdh"]}
            rules={[{ required: true, message: "必填" }, { max: 40, message: "长度超限（最大 40）" }]}
          >
            <Input maxLength={40} readOnly={readonly("LXDH")} className={readonly("LXDH") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                挂号时间
                {showSource ? sourceTip("GHSJ") : null}
              </Space>
            }
            name={["base_info", "ghsj"]}
          >
            <Input type="datetime-local" disabled={readonly("GHSJ")} className={readonly("GHSJ") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                报到时间
                {showSource ? sourceTip("BDSJ") : null}
              </Space>
            }
            name={["base_info", "bdsj"]}
          >
            <Input type="datetime-local" disabled={readonly("BDSJ")} className={readonly("BDSJ") ? "readonly-input" : undefined} />
          </Form.Item>

          <Form.Item className={styles.ticketItem} label="就诊类型" name={["base_info", "jzlx"]} rules={[{ required: true, message: "必填" }]}>
            <DictRemoteSelect setCode="RC041" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item className={styles.ticketItem} label="是否复诊" name={["base_info", "fz"]} rules={[{ required: true, message: "必填" }]}>
            <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item className={styles.ticketItem} label="是否输液" name={["base_info", "sy"]} rules={[{ required: true, message: "必填" }]}>
            <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item className={styles.ticketItem} label="是否门诊慢特病患者" name={["base_info", "mzmtbhz"]} rules={[{ required: true, message: "必填" }]}>
            <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label="急诊患者分级"
            name={["base_info", "jzhzfj"]}
            dependencies={[["base_info", "jzlx"]]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const jzlx = getFieldValue(["base_info", "jzlx"]);
                  if (String(jzlx || "").trim() === "3" && !normalizeOptionalString(value)) {
                    return Promise.reject(new Error("急诊就诊类型下必填"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DictRemoteSelect setCode="RC042" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label="急诊患者去向"
            name={["base_info", "jzhzqx"]}
            dependencies={[["base_info", "jzlx"]]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const jzlx = getFieldValue(["base_info", "jzlx"]);
                  if (String(jzlx || "").trim() === "3" && !normalizeOptionalString(value)) {
                    return Promise.reject(new Error("急诊就诊类型下必填"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DictRemoteSelect setCode="RC045" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                住院证开具时间
                {showSource ? sourceTip("ZYZKJSJ") : null}
              </Space>
            }
            name={["base_info", "zyzkjsj"]}
            dependencies={[["base_info", "jzhzqx"]]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const jzhzqx = getFieldValue(["base_info", "jzhzqx"]);
                  if (String(jzhzqx || "").trim() === "7" && !normalizeOptionalString(value)) {
                    return Promise.reject(new Error("急诊患者去向为「急诊转入院」时必填"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              type="datetime-local"
              disabled={readonly("ZYZKJSJ")}
              className={readonly("ZYZKJSJ") ? "readonly-input" : undefined}
            />
          </Form.Item>

          <Form.Item
            className={`${styles.ticketItem} ${styles.fullRow}`}
            label={
              <Space size="small">
                现住址
                {showSource ? sourceTip("XZZ") : null}
              </Space>
            }
            name={["base_info", "xzz"]}
            rules={[{ required: true, message: "必填" }, { max: 200, message: "长度超限（最大 200）" }]}
          >
            <Input maxLength={200} readOnly={readonly("XZZ")} className={readonly("XZZ") ? "readonly-input" : undefined} />
          </Form.Item>
        </div>
      </SectionCard>

      {/* 过敏史 */}
      <SectionCard title="过敏史">
        <div className={styles.ticketGrid}>
          <Form.Item
            className={styles.ticketItem}
            label={
              <Space size="small">
                药物过敏史
                {showSource ? sourceTip("YWGMS") : null}
              </Space>
            }
            name={["base_info", "ywgms"]}
            rules={[{ required: true, message: "必填" }]}
          >
            <DictRemoteSelect setCode="RC037" allowClear placeholder="远程检索" disabled={readonly("YWGMS")} labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label="过敏药物"
            name={["base_info", "gmyw"]}
            rules={[{ max: 500, message: "长度超限（最大 500）" }]}
          >
            <Input maxLength={500} />
          </Form.Item>

          <Form.Item className={styles.ticketItem} label="其他过敏史" name={["base_info", "qtgms"]}>
            <DictRemoteSelect setCode="RC037" allowClear placeholder="远程检索" labelMode="name" resolveValueLabel />
          </Form.Item>

          <Form.Item
            className={styles.ticketItem}
            label="其他过敏原"
            name={["base_info", "qtgmy"]}
            rules={[{ max: 200, message: "长度超限（最大 200）" }]}
          >
            <Input maxLength={200} />
          </Form.Item>
        </div>
      </SectionCard>

      {/* 主诉 */}
      <SectionCard title="主诉">
        <div className={styles.ticketGrid}>
          <Form.Item
            className={`${styles.ticketItem} ${styles.textareaItem} ${styles.fullRow}`}
            label="患者主诉"
            name={["base_info", "hzzs"]}
            rules={[{ max: 1500, message: "长度超限（最大 1500）" }]}
          >
            <Input.TextArea rows={3} maxLength={1500} />
          </Form.Item>
        </div>
      </SectionCard>
    </div>
  );
}
