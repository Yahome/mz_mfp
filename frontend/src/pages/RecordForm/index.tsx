import React, { useEffect, useState } from 'react';
import { Form, Button, Space, App, Spin } from 'antd';
import { SaveOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { useUserStore } from '@/store/userStore';
import { getPrefillDataApi, saveDraftApi, submitRecordApi } from '@/api/mfp';
import BaseInfoSection from './components/BaseInfoSection';
import DiagnosisSection from './components/DiagnosisSection';
import OperationSection from './components/OperationSection';
import FeeSection from './components/FeeSection';
import MedicationSection from './components/MedicationSection';
import dayjs from 'dayjs';

const RecordForm: React.FC = () => {
    const [form] = Form.useForm();
    const { message } = App.useApp();
    const { patientNo } = useUserStore();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (patientNo) {
            loadData(patientNo);
        }
    }, [patientNo]);

    const loadData = async (pNo: string) => {
        setLoading(true);
        try {
            const data = await getPrefillDataApi(pNo);
            // Transform logic if needed
            if (data.base_info?.CSRQ) {
                data.base_info.CSRQ = dayjs(data.base_info.CSRQ);
            }
            form.setFieldsValue(data);
            message.success('数据已预填');
        } catch (e) {
            // error handled by request interceptor usually, but safe to log
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        try {
            setLoading(true);
            // Validate only basic info or skip validation for draft using getFieldsValue
            const values = form.getFieldsValue(true);
            // Append patient_no as it might not be in the form fields explicitly if relying on store
            const payload = {
                ...values,
                patient_no: patientNo,
                // Add other root fields required by backend schema if missing
            };
            await saveDraftApi(payload);
            message.success('暂存成功');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const payload = { ...values, patient_no: patientNo };
            await submitRecordApi(payload);
            message.success('提交成功');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Assume record_id=1 for mock or we need to get ID from save response. 
        // For now, let's just use a hardcoded or derived ID.
        // Actually best to save first.
        window.open(`http://localhost:8000/api/mz_mfp/records/1/export`, '_blank');
    };

    const handlePrint = () => {
        window.open(`/print/${patientNo}`, '_blank');
    };

    return (
        <Spin spinning={loading}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                    <Button onClick={handlePrint}>打印预览</Button>
                    <Button onClick={handleExport}>导出Excel</Button>
                    <Button icon={<SaveOutlined />} onClick={handleSaveDraft}>暂存</Button>
                    <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => form.submit()}>提交</Button>
                </Space>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{}}
            >
                <BaseInfoSection />

                {/* Placeholders for other sections */}
                <DiagnosisSection />
                <OperationSection />
                <MedicationSection />
                <FeeSection />
            </Form>
        </Spin>
    );
};

export default RecordForm;

