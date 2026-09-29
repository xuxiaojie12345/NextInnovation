/// <reference types="vite/client" />

/**
 * Vite 环境变量的类型定义
 * 声明 authApi.ts 中使用的 VITE_API_BASE_URL
 */
interface ImportMetaEnv {
  /** API 基础地址（未设置时为空字符串，即使用相对路径） */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** 图片资源的模块声明 */
declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}
