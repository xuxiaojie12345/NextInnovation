// API请求和响应类型定义

// 登录请求参数（后端 LoginRequest 字段：userId, password）
export interface LoginRequest {
  userId: string;
  password: string;
}

// 用户信息
export interface UserInfo {
  userId: string;
  userName: string;
  email: string;
}

// 登录响应数据
export interface LoginData {
  token: string;
  userInfo: UserInfo;
}

// API响应通用格式
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}
