/// <reference types="react-scripts" />

/**
 * CSS模块类型声明
 * 允许TypeScript识别CSS文件的导入
 */
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

/**
 * 图片资源类型声明
 * 允许TypeScript识别图片文件的导入
 */
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
