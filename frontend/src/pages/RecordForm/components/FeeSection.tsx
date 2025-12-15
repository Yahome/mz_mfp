import React from 'react';
import { Card, Descriptions } from 'antd';

// A simple way to map fee structure. For complex 42 items, normally a table or grid is better.
const FeeSection: React.FC = () => {
    // In real implementation, this would map fields like fee_summary.ylfwf etc.
    // For Form, we can use Form.Item with `shouldUpdate` or just read from external props if it's read-only.
    // However, since it's inside a Form, we can use `Form.useWatch` or `<Form.Item>` with `readOnly`.
    // Let's use dumb Form.Item for layout consistent.

    return (
        <Card title="费用信息 (只读)" style={{ marginBottom: 16 }}>
            <Descriptions bordered size="small" column={4}>
                <Descriptions.Item label="总费用">
                    <FormItemReadOnly name={['fee_summary', 'zfy']} />
                </Descriptions.Item>
                <Descriptions.Item label="自付金额">
                    <FormItemReadOnly name={['fee_summary', 'zfje']} />
                </Descriptions.Item>
                <Descriptions.Item label="一般医疗服务费">
                    <FormItemReadOnly name={['fee_summary', 'ylfwf']} />
                </Descriptions.Item>
                <Descriptions.Item label="中医辨证论治费">
                    <FormItemReadOnly name={['fee_summary', 'zyzl']} />
                </Descriptions.Item>
                {/* ... Add more items as needed */}
            </Descriptions>
        </Card>
    );
};

// Helper component to render form value as text
import { Form, Input } from 'antd';
const FormItemReadOnly = ({ name }: { name: string[] }) => {
    return (
        <Form.Item name={name} noStyle>
            <Input bordered={false} readOnly style={{ padding: 0, color: '#000' }} />
        </Form.Item>
    )
}

export default FeeSection;
