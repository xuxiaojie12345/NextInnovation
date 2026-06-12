import api from './axios';

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface LoginResponseData {
  code: number;
  msg: string;
  data?: {
    token: string;
    userId: string;
    username: string;
  };
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponseData> => {
  const response = await api.post<LoginResponseData>('/api/authentication/login', data);
  return response.data;
};
