import React from 'react';
import { Card, Form, Row, Col, Input, Button, Select, Space } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const DiagnosisSection: React.FC = () => {
    return (
        <Card title="诊断信息" style={{ marginBottom: 16 }}>

            {/* 门诊诊断（中医） */}
            <Form.List name="diagnoses_tcm">
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ fontWeight: 'bold' }}>中医诊断 (MZZD_ZYZD)</span>
                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small" style={{ marginLeft: 8 }}>添加</Button>
                        </div>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                                <Col span={10}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'disease_code']}
                                        label={index === 0 ? "病名" : ""}
                                        style={{ marginBottom: 0 }}
                                        rules={[{ required: true, message: '请输入病名' }]}
                                    >
                                        <Input placeholder="输入病名或代码..." />
                                    </Form.Item>
                                </Col>
                                <Col span={10}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'syndrome_code']}
                                        label={index === 0 ? "证候" : ""}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Input placeholder="输入证候..." />
                                    </Form.Item>
                                </Col>
                                <Col span={2}>
                                    {fields.length > 0 ? (
                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: index === 0 ? 30 : 5 }} />
                                    ) : null}
                                </Col>
                            </Row>
                        ))}
                    </>
                )}
            </Form.List>

            <div style={{ height: 16 }} />

            {/* 门诊诊断（西医） */}
            <Form.List name="diagnoses_wm">
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ fontWeight: 'bold' }}>西医诊断 (MZZD_XYZD)</span>
                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small" style={{ marginLeft: 8 }}>添加</Button>
                        </div>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                                <Col span={20}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'disease_code']}
                                        label={index === 0 ? "诊断名称" : ""}
                                        style={{ marginBottom: 0 }}
                                        rules={[{ required: true, message: '请输入诊断' }]}
                                    >
                                        <Input placeholder="输入ICD或名称..." />
                                    </Form.Item>
                                </Col>
                                <Col span={2}>
                                    {fields.length > 0 ? (
                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: index === 0 ? 30 : 5 }} />
                                    ) : null}
                                </Col>
                            </Row>
                        ))}
                    </>
                )}
            </Form.List>
        </Card>
    );
};

export default DiagnosisSection;
