import { Col, Form, Input, Row, Space, Tooltip } from "antd";
import DictRemoteSelect, { type DictItem } from "@/components/DictRemoteSelect";
import type { BaseInfoFormValues } from "./useRecordLogic";

type Props = {
  prefillMeta?: (key: string) => { readonly: boolean; source: string } | null;
};

function normalizeOptionalString(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  return s ? s : undefined;
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
    <>
      <div className="group-block">
        <div className="group-title">身份与证件</div>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  USERNAME（系统登录用户名）
                  {showSource ? sourceTip("USERNAME") : null}
                </Space>
              }
              name={["base_info", "username"]}
              rules={[{ required: true, message: "必填" }, { max: 10, message: "长度超限（最大 10）" }]}
            >
              <Input maxLength={10} readOnly={readonly("USERNAME")} className={readonly("USERNAME") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  JZKH（就诊卡号/病案号）
                  {showSource ? sourceTip("JZKH") : null}
                </Space>
              }
              name={["base_info", "jzkh"]}
              rules={[{ required: true, message: "必填" }, { max: 50, message: "长度超限（最大 50）" }]}
            >
              <Input maxLength={50} readOnly={readonly("JZKH")} className={readonly("JZKH") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  姓名（XM）
                  {showSource ? sourceTip("XM") : null}
                </Space>
              }
              name={["base_info", "xm"]}
              rules={[{ required: true, message: "必填" }, { max: 100, message: "长度超限（最大 100）" }]}
            >
              <Input maxLength={100} readOnly={readonly("XM")} className={readonly("XM") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  性别（XB / RC001）
                  {showSource ? sourceTip("XB") : null}
                </Space>
              }
              name={["base_info", "xb"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="RC001" allowClear placeholder="远程检索" disabled={readonly("XB")} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  出生日期（CSRQ）
                  {showSource ? sourceTip("CSRQ") : null}
                </Space>
              }
              name={["base_info", "csrq"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <Input type="date" disabled={readonly("CSRQ")} className={readonly("CSRQ") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  婚姻（HY / RC002）
                  {showSource ? sourceTip("HY") : null}
                </Space>
              }
              name={["base_info", "hy"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="RC002" allowClear placeholder="远程检索" disabled={readonly("HY")} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  国籍（GJ / COUNTRY）
                  {showSource ? sourceTip("GJ") : null}
                </Space>
              }
              name={["base_info", "gj"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="COUNTRY" allowClear placeholder="远程检索" disabled={readonly("GJ")} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  民族（MZ / RC035）
                  {showSource ? sourceTip("MZ") : null}
                </Space>
              }
              name={["base_info", "mz"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="RC035" allowClear placeholder="远程检索" disabled={readonly("MZ")} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  证件类别（ZJLB / RC038）
                  {showSource ? sourceTip("ZJLB") : null}
                </Space>
              }
              name={["base_info", "zjlb"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="RC038" allowClear placeholder="远程检索" disabled={readonly("ZJLB")} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  证件号码（ZJHM）
                  {showSource ? sourceTip("ZJHM") : null}
                </Space>
              }
              name={["base_info", "zjhm"]}
              rules={[{ required: true, message: "必填" }, { max: 18, message: "长度超限（最大 18）" }]}
            >
              <Input maxLength={18} readOnly={readonly("ZJHM")} className={readonly("ZJHM") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  现住址（XZZ）
                  {showSource ? sourceTip("XZZ") : null}
                </Space>
              }
              name={["base_info", "xzz"]}
              rules={[{ required: true, message: "必填" }, { max: 200, message: "长度超限（最大 200）" }]}
            >
              <Input maxLength={200} readOnly={readonly("XZZ")} className={readonly("XZZ") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  联系电话（LXDH）
                  {showSource ? sourceTip("LXDH") : null}
                </Space>
              }
              name={["base_info", "lxdh"]}
              rules={[{ required: true, message: "必填" }, { max: 40, message: "长度超限（最大 40）" }]}
            >
              <Input maxLength={40} readOnly={readonly("LXDH")} className={readonly("LXDH") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="group-block">
        <div className="group-title">过敏史</div>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  药物过敏史（YWGMS / RC037）
                  {showSource ? sourceTip("YWGMS") : null}
                </Space>
              }
              name={["base_info", "ywgms"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="RC037" allowClear placeholder="远程检索" disabled={readonly("YWGMS")} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="过敏药物（GMYW）" name={["base_info", "gmyw"]} rules={[{ max: 500, message: "长度超限（最大 500）" }]}>
              <Input maxLength={500} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="其他过敏史（QTGMS / RC037）" name={["base_info", "qtgms"]}>
              <DictRemoteSelect setCode="RC037" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="其他过敏原（QTGMY）" name={["base_info", "qtgmy"]} rules={[{ max: 200, message: "长度超限（最大 200）" }]}>
              <Input maxLength={200} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="group-block">
        <div className="group-title">就诊信息</div>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  挂号时间（GHSJ）
                  {showSource ? sourceTip("GHSJ") : null}
                </Space>
              }
              name={["base_info", "ghsj"]}
            >
              <Input type="datetime-local" disabled={readonly("GHSJ")} className={readonly("GHSJ") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  报到时间（BDSJ）
                  {showSource ? sourceTip("BDSJ") : null}
                </Space>
              }
              name={["base_info", "bdsj"]}
            >
              <Input type="datetime-local" disabled={readonly("BDSJ")} className={readonly("BDSJ") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  就诊时间（JZSJ）
                  {showSource ? sourceTip("JZSJ") : null}
                </Space>
              }
              name={["base_info", "jzsj"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <Input type="datetime-local" disabled={readonly("JZSJ")} className={readonly("JZSJ") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  就诊科室代码（JZKSDM / RC023）
                  {showSource ? sourceTip("JZKSDM") : null}
                </Space>
              }
              name={["base_info", "jzksdm"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect
                setCode="RC023"
                allowClear
                placeholder="远程检索（支持汉字/拼音）"
                disabled={readonly("JZKSDM")}
                onSelectItem={(item: DictItem) => {
                  const current = normalizeOptionalString(form.getFieldValue(["base_info", "jzks"]));
                  if (!current) form.setFieldValue(["base_info", "jzks"], item.name);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  就诊科室名称（JZKS）
                  {showSource ? sourceTip("JZKS") : null}
                </Space>
              }
              name={["base_info", "jzks"]}
              rules={[{ max: 100, message: "长度超限（最大 100）" }]}
            >
              <Input
                maxLength={100}
                placeholder="选择科室代码时可自动回填"
                readOnly={readonly("JZKS")}
                className={readonly("JZKS") ? "readonly-input" : undefined}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  接诊医师（JZYS）
                  {showSource ? sourceTip("JZYS") : null}
                </Space>
              }
              name={["base_info", "jzys"]}
              rules={[{ required: true, message: "必填" }, { max: 40, message: "长度超限（最大 40）" }]}
            >
              <Input maxLength={40} readOnly={readonly("JZYS")} className={readonly("JZYS") ? "readonly-input" : undefined} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label={
                <Space size="small">
                  接诊医师职称（JZYSZC / RC044）
                  {showSource ? sourceTip("JZYSZC") : null}
                </Space>
              }
              name={["base_info", "jzyszc"]}
              rules={[{ required: true, message: "必填" }]}
            >
              <DictRemoteSelect setCode="RC044" allowClear placeholder="远程检索" disabled={readonly("JZYSZC")} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="就诊类型（JZLX / RC041）" name={["base_info", "jzlx"]} rules={[{ required: true, message: "必填" }]}>
              <DictRemoteSelect setCode="RC041" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="是否复诊（FZ / RC016）" name={["base_info", "fz"]} rules={[{ required: true, message: "必填" }]}>
              <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="是否输液（SY / RC016）" name={["base_info", "sy"]} rules={[{ required: true, message: "必填" }]}>
              <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="是否门诊慢特病患者（MZMTBHZ / RC016）" name={["base_info", "mzmtbhz"]} rules={[{ required: true, message: "必填" }]}>
              <DictRemoteSelect setCode="RC016" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="group-block">
        <div className="group-title">急诊信息</div>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="急诊患者分级（JZHZFJ / RC042）"
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
              <DictRemoteSelect setCode="RC042" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="急诊患者去向（JZHZQX / RC045）"
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
              <DictRemoteSelect setCode="RC045" allowClear placeholder="远程检索" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="住院证开具时间（ZYZKJSJ）"
              name={["base_info", "zyzkjsj"]}
              dependencies={[["base_info", "jzhzqx"]]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const jzhzqx = getFieldValue(["base_info", "jzhzqx"]);
                    if (String(jzhzqx || "").trim() === "7" && !normalizeOptionalString(value)) {
                      return Promise.reject(new Error("急诊患者去向为“急诊转入院”时必填"));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input type="datetime-local" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      <div className="group-block">
        <div className="group-title">主诉</div>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="患者主诉（HZZS）" name={["base_info", "hzzs"]} rules={[{ max: 1500, message: "长度超限（最大 1500）" }]}>
              <Input.TextArea rows={2} maxLength={1500} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </>
  );
}
