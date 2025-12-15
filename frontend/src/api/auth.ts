import request from '@/utils/request';

export interface LoginParams {
    username?: string;
    password?: string;
}

export interface LoginResult {
    access_token: string;
    token_type: string;
}

export const loginApi = (data: LoginParams) => {
    return request.post<any, LoginResult>('/auth/login', null, { params: data });
};

// HIS Jump is usually a GET handling, but if we need to verify token explicitly:
export const verifyTokenApi = () => {
    // Placeholder if we add a /me endpoint later
    return Promise.resolve({ valid: true });
};
