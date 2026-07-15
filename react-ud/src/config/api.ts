/**
 * API 配置模块
 * 统一管理后端 API 地址和 axios 实例
 * 所有组件请从此模块导入，而不是硬编码地址
 */
import axios from 'axios';

/** 后端 API 基础地址 */
export const API_BASE_URL = 'http://localhost:8081';

/** 预配置的 axios 实例（含 baseURL），所有请求自动加上 API_BASE_URL 前缀 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// api

export default api;
