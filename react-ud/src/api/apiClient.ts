import axios from 'axios';

/**
 * Axios实例配置
 * 
 * @description 创建全局axios实例，配置baseURL、超时时间、请求/响应拦截器等
 */
const apiClient = axios.create({
  // 后端API基础URL
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081',
  
  // 请求超时时间（毫秒）
  timeout: 30000,
  
  // 请求头配置
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 * 
 * @description 在发送请求之前执行的操作
 *              - 从localStorage获取token并添加到请求头
 *              - 记录请求日志（开发环境）
 */
apiClient.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // 将token添加到请求头
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 开发环境下记录请求信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Request:', {
        url: config.url,
        method: config.method,
        data: config.data,
        headers: config.headers,
      });
    }
    
    return config;
  },
  (error) => {
    // 处理请求错误
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 
 * @description 在收到响应之后执行的操作
 *              - 统一处理响应数据
 *              - 处理认证失败（401）跳转登录页
 *              - 记录响应日志（开发环境）
 */
apiClient.interceptors.response.use(
  (response) => {
    // 开发环境下记录响应信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  (error) => {
    // 处理响应错误
    console.error('Response Error:', error);
    
    // 如果是401未授权错误，清除token并跳转到登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
