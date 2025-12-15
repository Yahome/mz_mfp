import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useUserStore } from '@/store/userStore';

const Entry: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setToken, setPatientNo } = useUserStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const patientNo = searchParams.get('patient_no');

        if (token) {
            setToken(token);
            if (patientNo) {
                setPatientNo(patientNo);
            }
            message.success('认证成功，正在跳转...');
            navigate('/');
        } else {
            message.error('无效的入口链接');
            navigate('/login');
        }
    }, [searchParams, navigate, setToken, setPatientNo]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <Spin tip="正在进入系统..." size="large" />
        </div>
    );
};

export default Entry;
