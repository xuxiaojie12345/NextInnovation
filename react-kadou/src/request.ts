import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // 这里就是统一前缀
  timeout: 10000,
});

// 请求拦截器：每次发请求前自动执行
api.interceptors.request.use(
  (config) => {
    // 可以在这里统一带上 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器（可选，统一处理报错）
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 未登录可以在这里统一跳登录
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;