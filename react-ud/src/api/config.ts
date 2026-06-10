import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:8081", // 明确指定后端API的基础URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// // 请求拦截器
// apiClient.interceptors.request.use(
//   (config: AxiosRequestConfig) => {
//     // 在发送请求之前做些什么
//     // 例如：添加 token
//     const token = localStorage.getItem('token');
//     if (token && config.headers) {
//       (config.headers as any).Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     // 对请求错误做些什么
//     return Promise.reject(error);
//   }
// );

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，跳转到登录页
          localStorage.removeItem("token");
          window.location.href = "/";
          break;
        case 403:
          console.error("没有权限访问");
          break;
        case 500:
          console.error("服务器错误");
          break;
        default:
          console.error("请求失败:", error.response.data);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error("网络错误，请检查网络连接");
    } else {
      // 请求配置出错
      console.error("请求配置错误:", error.message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;