import React from 'react';
import { Card, Form, Row, Col, Input, Select, DatePicker } from 'antd';

const BaseInfoSection: React.FC = () => {
    return (
        <Card title="基础信息" style={{ marginBottom: 16 }}>
            <Row gutter={24}>
                <Col span={6}>
                    <Form.Item name={['base_info', 'XM']} label="姓名" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={['base_info', 'XB']} label="性别">
                        <Select options={[{ label: '男', value: '1' }, { label: '女', value: '2' }]} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={['base_info', 'CSRQ']} label="出生日期">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={['base_info', 'NL']} label="年龄">
                        <Input />
                    </Form.Item>
                </Col>

                <Col span={6}>
                    <Form.Item name={['base_info', 'GJ']} label="国籍">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={['base_info', 'MZ']} label="民族">
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={['base_info', 'ZJLB']} label="证件类别">
                        <Select options={[{ label: '身份证', value: '01' }]} />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={['base_info', 'ZJHM']} label="证件号码">
                        <Input />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
};

export default BaseInfoSection;
