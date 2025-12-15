import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

interface AuthGuardProps {
    children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const token = useUserStore((state) => state.token);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!token && location.pathname !== '/login') {
            navigate('/login');
        }
    }, [token, navigate, location]);

    if (!token) {
        return null; // or loading spinner
    }

    return <>{children}</>;
};

export default AuthGuard;
