// API 服务层：封装 POST/GET/DELETE/文件上传
export const API_BASE_URL = "/api/v1/hdoc";

/** 请求超时时间（毫秒） */
const REQUEST_TIMEOUT = 30000;

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

/**
 * 带超时的 fetch 封装
 * 超时或网络异常时返回统一格式的错误响应
 */
async function fetchWithTimeout<T>(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT,
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const result = await response.json();
    return result;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === "AbortError") {
      return { code: 408, message: "Request timeout.", data: null };
    }
    return {
      code: 0,
      message: "System error. Please contact administrator.",
      data: null,
    };
  }
}

const authHeader = (): Record<string, string> => ({
  Authorization: localStorage.getItem("token") || "",
});

export const api = {
  post: async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    return fetchWithTimeout<T>(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(data),
    });
  },

  get: async <T>(
    endpoint: string,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> => {
    const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
    if (params) {
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, params[key]),
      );
    }
    return fetchWithTimeout<T>(url.toString(), {
      method: "GET",
      headers: {
        ...authHeader(),
      },
    });
  },

  del: async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    return fetchWithTimeout<T>(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  /** 文件上传（multipart/form-data） */
  uploadFile: async <T>(
    endpoint: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> => {
    return fetchWithTimeout<T>(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        ...authHeader(),
      },
      body: formData,
    });
  },
};
