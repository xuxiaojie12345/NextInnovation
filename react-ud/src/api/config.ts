import axios from 'axios';

/**
 * Axios 实例配置
 * 
 * 配置说明：
 * - baseURL: 后端API服务器地址（开发环境）
 * - timeout: 请求超时时间（毫秒）
 * - headers: 默认请求头
 */
const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '' // 生产环境使用相对路径，通过nginx等反向代理
    : 'http://localhost:8081', // 开发环境直接连接后端服务器
  timeout: 30000, // 30秒超时
});

/**
 * 请求拦截器
 * 在发送请求之前进行处理
 */
apiClient.interceptors.request.use(
  (config) => {
    // 如果是FormData上传，删除Content-Type让浏览器自动设置带boundary的multipart头
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // 可以在这里添加token等认证信息
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

/**
 * 响应拦截器
 * 处理响应数据或错误
 */
apiClient.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('userID');
          window.location.href = '/';
          break;
        case 403:
          console.error('没有权限访问该资源');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error(`请求失败: ${error.response.status}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('请求超时');
    } else {
      console.error('网络错误，请检查网络连接');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
