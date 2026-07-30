/// <reference types="react-scripts" />

// CSS模块类型声明
declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

// 普通CSS文件类型声明（用于side-effect import）
declare module '*.css' {
  const content: any;
  export default content;
}
