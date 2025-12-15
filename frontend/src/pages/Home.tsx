import React, { useEffect, useState } from 'react';
import { Card, Empty, Input, Button, Spin } from 'antd';
import { useUserStore } from '@/store/userStore';
import { getPrefillDataApi, PrefillData } from '@/api/mfp';

const { Search } = Input;

const Home: React.FC = () => {
    const { patientNo, setPatientNo } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PrefillData | null>(null);

    const fetchData = async (pNo: string) => {
        setLoading(true);
        try {
            const res = await getPrefillDataApi(pNo);
            setData(res);
        } catch (e) {
            // handled
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientNo) {
            fetchData(patientNo);
        }
    }, []);

    const onSearch = (value: string) => {
        setPatientNo(value);
        fetchData(value);
    };

    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <Search
                    placeholder="输入病历号回车 (例如: 123456)"
                    allowClear
                    enterButton="加载病案"
                    size="large"
                    onSearch={onSearch}
                    defaultValue={patientNo || ''}
                />
            </Card>

            <Card title="病案首页信息 (Demo)" loading={loading}>
                {data ? (
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                ) : (
                    <Empty description="暂无数据，请在上方输入病历号" />
                )}
            </Card>
        </div>
    );
};

export default Home;
