/**
 * 认证 API 模块
 * ------------------------------------------------------------------
 * 对应【详细设计 5.1 AuthenticationApi】。
 * 使用 axios 统一封装请求，集中处理 HTTP 状态码到业务消息的映射。
 */
import axios, { AxiosError } from 'axios';
import type { AuthenticationResult } from '../utils/validators';

/** API 基础地址：接入真实后端时通过环境变量注入，缺省使用相对路径 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/** 请求超时时间（毫秒）—— 对应详细设计 4.1 的 10 秒 */
const REQUEST_TIMEOUT_MS = 10000;

/** axios 实例：统一超时时间与请求头 */
const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/** 详细设计 6. 异常处理中定义的错误消息 */
export const API_ERROR_MESSAGES = {
  INVALID_CREDENTIALS:
    "We didn't recognize the username or password you entered. Please try again.",
  ACCOUNT_LOCKED:
    'Your account is locked. Please contact your system administrator.',
  SYSTEM_ERROR: 'System error. Please contact administrator.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

/** HTTP 状态码 → 错误消息 的映射表（详细设计 5.1.7 状态码一览） */
const STATUS_MESSAGE_MAP: Record<number, string> = {
  401: API_ERROR_MESSAGES.INVALID_CREDENTIALS,
  403: API_ERROR_MESSAGES.ACCOUNT_LOCKED,
  500: API_ERROR_MESSAGES.SYSTEM_ERROR,
};

/** 后端返回的响应体类型定义 */
interface LoginApiResponseBody {
  /** 业务状态码 */
  code?: number;
  /** 显示用消息 */
  message?: string;
  /** 成功时的附带数据（与后端 LoginResponse 字段保持一致） */
  data?: {
    userid: string;
    username: string;
    token: string;
    /** 用户功能权限列表（后台 AuthenticationServiceImpl 返回） */
    functions?: string[];
    /** 用户市场权限列表（后台 AuthenticationServiceImpl 返回） */
    markets?: string[];
  } | null;
}

/**
 * 将 axios 异常转换为业务可读的错误结果
 * @param error axios 抛出的异常对象
 * @returns 统一格式的错误结果
 */
function toErrorResult(error: unknown): AuthenticationResult {
  // 场景一：请求已发出但服务端返回非 2xx 状态码
  const axiosError = error as AxiosError<LoginApiResponseBody>;
  if (axiosError?.response) {
    const status = axiosError.response.status;
    return {
      success: false,
      code: status,
      // 优先级：后端返回的 message → 映射表 → 系统异常
      message:
        axiosError.response.data?.message ||
        STATUS_MESSAGE_MAP[status] ||
        API_ERROR_MESSAGES.SYSTEM_ERROR,
    };
  }

  // 场景二：网络断开 / 超时（无 HTTP Response）
  return {
    success: false,
    code: 0,
    message: API_ERROR_MESSAGES.NETWORK_ERROR,
  };
}

/**
 * AuthenticationApi - 用户身份认证
 * POST /api/auth/login
 *
 * @param userID 用户 ID（已 trim，最大 10 位半角英数字）
 * @param password 密码（已 trim，最大 32 位半角英数字 + 符号）
 * @returns 统一格式的认证结果；调用方无需再处理 axios 异常
 */
export async function authenticationApi(
  userID: string,
  password: string,
): Promise<AuthenticationResult> {
  // Request Body：严格遵循详细设计的 { userid, password } 字段命名
  const requestBody = { userid: userID, password };

  try {
    const response = await httpClient.post<LoginApiResponseBody>(
      '/api/auth/login',
      requestBody,
    );
    const body = response.data || {};

    // Response Success (200)：code 为 200 或未定义时视为成功
    if (body.code === 200 || body.code === undefined) {
      return {
        success: true,
        code: 200,
        message: body.message || 'success',
        data: body.data || null,
      };
    }

    // 业务层面返回非 200（HTTP 200 但 code 异常）
    return {
      success: false,
      code: body.code,
      message: body.message || API_ERROR_MESSAGES.SYSTEM_ERROR,
    };
  } catch (error) {
    // 统一异常处理：401 / 403 / 500 / 网络异常
    return toErrorResult(error);
  }
}

/**
 * Mock 认证接口
 * ------------------------------------------------------------------
 * 当前工程未部署后端服务，为保证前端可独立运行，提供本地 Mock。
 * 接入真实后端时删除此函数及 Login.tsx 中的 USE_MOCK 分支即可。
 *
 * @param userID 用户 ID
 * @param password 密码
 * @returns 统一格式的认证结果
 */
export async function mockAuthenticationApi(
  userID: string,
  password: string,
): Promise<AuthenticationResult> {
  // 模拟网络延迟，便于观察 isLoading 状态下的按钮禁用效果
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Mock 规则：admin / Admin@123 → 成功；locked 开头 → 账户锁定；其余 → 认证失败
  if (userID === 'admin' && password === 'Admin@123') {
    return {
      success: true,
      code: 200,
      message: 'success',
      data: {
        userid: userID,
        username: 'Administrator',
        token: 'mock-token-0001',
      },
    };
  }

  if (userID.toLowerCase().startsWith('locked')) {
    return {
      success: false,
      code: 403,
      message: API_ERROR_MESSAGES.ACCOUNT_LOCKED,
    };
  }

  return {
    success: false,
    code: 401,
    message: API_ERROR_MESSAGES.INVALID_CREDENTIALS,
  };
}

export default authenticationApi;
