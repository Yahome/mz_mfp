import React from 'react';
import { Card, Form, Radio } from 'antd';

const MedicationSection: React.FC = () => {
    return (
        <Card title="用药情况" style={{ marginBottom: 16 }}>
            <Form.Item name={['medication_summary', 'xysy']} label="是否使用西药">
                <Radio.Group>
                    <Radio value="1">是</Radio>
                    <Radio value="2">否</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item name={['medication_summary', 'zcysy']} label="是否使用中成药">
                <Radio.Group>
                    <Radio value="1">是</Radio>
                    <Radio value="2">否</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item name={['medication_summary', 'zyzjsy']} label="是否使用中药制剂">
                <Radio.Group>
                    <Radio value="1">是</Radio>
                    <Radio value="2">否</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item name={['medication_summary', 'ctypsy']} label="是否使用传统饮片">
                <Radio.Group>
                    <Radio value="1">是</Radio>
                    <Radio value="2">否</Radio>
                </Radio.Group>
            </Form.Item>
            <Form.Item name={['medication_summary', 'pfklsy']} label="是否使用配方颗粒">
                <Radio.Group>
                    <Radio value="1">是</Radio>
                    <Radio value="2">否</Radio>
                </Radio.Group>
            </Form.Item>
        </Card>
    );
};

export default MedicationSection;
