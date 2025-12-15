import React from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useUserStore } from '@/store/userStore';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const { logout, patientNo } = useUserStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                padding: '0 24px',
                boxShadow: '0 2px 8px #f0f1f2'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0, color: '#1677ff', marginRight: 16 }}>
                        中医病案首页
                    </Title>
                    {patientNo && (
                        <Text type="secondary">
                            当前病历号: <Text strong>{patientNo}</Text>
                        </Text>
                    )}
                </div>

                <Space>
                    <Button type="text" icon={<UserOutlined />}>医生工作站</Button>
                    <Button type="text" danger icon={<LogoutOutlined />} onClick={handleLogout}>退出</Button>
                </Space>
            </Header>

            <Content style={{ padding: '24px', margin: 0 }}>
                {children}
            </Content>
        </Layout>
    );
};

export default MainLayout;
