// api.ts
const API_BASE_URL = '/api/v1/hdoc';

interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T | null;
}

export const api = {
  post: async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    return result;
  },
  
  get: async <T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> => {
    const url = new URL(`${API_BASE_URL}${endpoint}`, window.location.origin);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': localStorage.getItem('token') || '',
      },
    });
    
    const result = await response.json();
    return result;
  },

  del: async <T>(endpoint: string, data?: any): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') || '',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    const result = await response.json();
    return result;
  },

  /** 文件上传（multipart/form-data） */
  uploadFile: async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': localStorage.getItem('token') || '',
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  }
};