import React from 'react';
import { Card, Form, Row, Col, Input, Button, DatePicker } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const OperationSection: React.FC = () => {
    return (
        <Card title="手术与操作" style={{ marginBottom: 16 }}>
            <Form.List name="operations">
                {(fields, { add, remove }) => (
                    <>
                        <div style={{ marginBottom: 8 }}>
                            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>添加手术/操作</Button>
                        </div>
                        {fields.map(({ key, name, ...restField }) => (
                            <Row key={key} gutter={12} align="middle" style={{ marginBottom: 8 }}>
                                <Col span={6}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'op_name']}
                                        label="手术名称"
                                        rules={[{ required: true }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={5}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'op_code']}
                                        label="编码"
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={5}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'op_date']}
                                        label="日期"
                                    >
                                        <DatePicker />
                                    </Form.Item>
                                </Col>
                                <Col span={5}>
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'level']}
                                        label="级别"
                                    >
                                        <Input />
                                    </Form.Item>
                                </Col>
                                <Col span={2}>
                                    <MinusCircleOutlined onClick={() => remove(name)} style={{ marginTop: 30 }} />
                                </Col>
                            </Row>
                        ))}
                    </>
                )}
            </Form.List>
        </Card>
    );
};

export default OperationSection;
