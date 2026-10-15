/**
 * Generate Homologation Document 表单校验工具模块
 * ------------------------------------------------------------------
 * 对应【詳細設計UD03.md】：
 *  - 控件 2.1：Chassis series(5, 半角英字) / Chassis no(10, 半角数字) /
 *    Document type(下拉，半角英数字+記号)
 *  - 校验 3.2：画面侧无强制校验，但输入需按字符范围过滤，防止非法字符输入
 *  - 异常 5：网络断开 / 500 错误消息常量
 *
 * 遵循开发规约 15，数据校验使用 Zod 库实现。
 * 抽离为独立模块，便于其他画面（UD04 Modify Document 等）复用。
 */
import { z } from 'zod';

/** Chassis series 允许的最大长度（详细设计 2.1 控件 1：MaxLength=5） */
export const CHASSIS_SERIES_MAX_LENGTH = 5;
/** Chassis no 允许的最大长度（详细设计 2.1 控件 2：MaxLength=10） */
export const CHASSIS_NO_MAX_LENGTH = 10;

/** Chassis series 合法字符正则：仅半角英字 [a-zA-Z] */
const CHASSIS_SERIES_PATTERN = /^[a-zA-Z]*$/;
/** Chassis no 合法字符正则：仅半角数字 [0-9] */
const CHASSIS_NO_PATTERN = /^[0-9]*$/;

/**
 * 错误消息常量：与详细设计的 Message 显示内容严格一致
 */
export const ERROR_MESSAGES = {
  /** Chassis series 必填（测试用例 13：必填项未输入） */
  CHASSIS_SERIES_REQUIRED: 'Chassis series is required.',
  /** Chassis series 含非法字符（仅允许半角英字） */
  CHASSIS_SERIES_FORMAT: 'Chassis series must contain only half-width letters.',
  /** Chassis no 必填（测试用例 13：必填项未输入） */
  CHASSIS_NO_REQUIRED: 'Chassis no is required.',
  /** Chassis no 含非法字符（仅允许半角数字） */
  CHASSIS_NO_FORMAT: 'Chassis no must contain only half-width numbers.',
  /** Document type 必填 */
  DOCUMENT_TYPE_REQUIRED: 'Document type is required.',
  /** 系统错误（API 500 / 服务器内部错误） */
  SYSTEM_ERROR: 'System error. Please contact administrator.',
  /** 网络断开 / 超时 */
  NETWORK_ERROR: 'Network error. Please check your connection.',
  /** 服务器内部错误（HTTP 500） */
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const;

/** 需要聚焦的字段类型 */
export type GenerateDocumentFocusField =
  | 'chassisSeries'
  | 'chassisNo'
  | 'documentType'
  | '';

/**
 * 校验结果的类型定义（供组件侧解构使用）
 */
export interface GenerateDocumentValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误消息（通过时为空字符串） */
  message: string;
  /** 需要移动焦点的字段 */
  focusField: GenerateDocumentFocusField;
}

/**
 * 校验对象表单输入值的类型定义
 */
export interface GenerateDocumentFormValues {
  /** Chassis series 输入值 */
  chassisSeries: string;
  /** Chassis no 输入值 */
  chassisNo: string;
  /** Document type 选择值 */
  documentType: string;
}

/**
 * 去除字符串首尾空格（详细设计 7.1 前置处理）
 * @param value 原始输入值
 * @returns 去空格后的值；非字符串返回空字符串
 */
export function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 全角字符 → 半角字符 转换（可复用的纯函数）
 * ------------------------------------------------------------------
 * 详细设计 2.1 要求输入仅允许「半角」字符。
 * 中文/日文输入法未切换时敲出的字母数字会是全角形式（如 ＪＰＣＴ），
 * 此处先归一化为半角，再交给过滤逻辑，可显著改善输入体验。
 *
 * @param value 原始输入值
 * @returns 半角化后的值
 */
export function toHalfWidth(value: string): string {
  return value
    .replace(/[\uFF01-\uFF5E]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/\u3000/g, ' ');
}

/**
 * 按允许字符与最大长度过滤输入值（实现「仅保留前 N 位」的规格）
 * ------------------------------------------------------------------
 * 对应测试用例 6 / 10：超过最大长度时仅保留前 N 位；
 * 对应测试用例 7 / 11：非法字符（非半角英字 / 半角数字）被过滤。
 *
 * @param rawValue 原始输入值
 * @param pattern 允许字符正则（须为「只匹配合法字符」的字符集正则）
 * @param maxLength 最大长度
 * @returns 过滤后的值
 */
export function filterInput(
  rawValue: string,
  pattern: RegExp,
  maxLength: number,
): string {
  const halfWidthValue = toHalfWidth(rawValue);
  // 逐字符保留合法字符，再截断到最大长度
  const allowedChars = halfWidthValue
    .split('')
    .filter((char) => pattern.test(char))
    .join('');
  return allowedChars.slice(0, maxLength);
}

/**
 * Chassis series 专用过滤器：半角英字 + 最大 5 位
 * @param rawValue 原始输入值
 * @returns 过滤后的值
 */
export function filterChassisSeries(rawValue: string): string {
  return filterInput(rawValue, /^[a-zA-Z]$/, CHASSIS_SERIES_MAX_LENGTH);
}

/**
 * Chassis no 专用过滤器：半角数字 + 最大 10 位
 * @param rawValue 原始输入值
 * @returns 过滤后的值
 */
export function filterChassisNo(rawValue: string): string {
  return filterInput(rawValue, /^[0-9]$/, CHASSIS_NO_MAX_LENGTH);
}

/** Chassis series 校验 schema：必填 + 长度 + 半角英字 */
const chassisSeriesSchema = z
  .string()
  .transform(normalize)
  .refine((value) => value.length > 0, {
    message: ERROR_MESSAGES.CHASSIS_SERIES_REQUIRED,
  })
  .refine((value) => value.length <= CHASSIS_SERIES_MAX_LENGTH, {
    message: ERROR_MESSAGES.CHASSIS_SERIES_FORMAT,
  })
  .refine((value) => CHASSIS_SERIES_PATTERN.test(value), {
    message: ERROR_MESSAGES.CHASSIS_SERIES_FORMAT,
  });

/** Chassis no 校验 schema：必填 + 长度 + 半角数字 */
const chassisNoSchema = z
  .string()
  .transform(normalize)
  .refine((value) => value.length > 0, {
    message: ERROR_MESSAGES.CHASSIS_NO_REQUIRED,
  })
  .refine((value) => value.length <= CHASSIS_NO_MAX_LENGTH, {
    message: ERROR_MESSAGES.CHASSIS_NO_FORMAT,
  })
  .refine((value) => CHASSIS_NO_PATTERN.test(value), {
    message: ERROR_MESSAGES.CHASSIS_NO_FORMAT,
  });

/** Document type 校验 schema：必填 */
const documentTypeSchema = z
  .string()
  .transform(normalize)
  .refine((value) => value.length > 0, {
    message: ERROR_MESSAGES.DOCUMENT_TYPE_REQUIRED,
  });

/** 表单整体校验 schema */
const generateDocumentFormSchema = z.object({
  chassisSeries: chassisSeriesSchema,
  chassisNo: chassisNoSchema,
  documentType: documentTypeSchema,
});

/**
 * Chassis series 单项校验（供复用）
 * @param value 原始输入值
 * @returns 校验通过返回空字符串，否则返回错误消息
 */
export function validateChassisSeries(value: unknown): string {
  const result = chassisSeriesSchema.safeParse(value);
  return result.success ? '' : result.error.issues[0].message;
}

/**
 * Chassis no 单项校验（供复用）
 * @param value 原始输入值
 * @returns 校验通过返回空字符串，否则返回错误消息
 */
export function validateChassisNo(value: unknown): string {
  const result = chassisNoSchema.safeParse(value);
  return result.success ? '' : result.error.issues[0].message;
}

/**
 * Generate Homologation Document 表单整体校验
 * ------------------------------------------------------------------
 * 对应测试用例 13：必填项未输入时显示必填错误提示，且不做画面迁移。
 * 校验顺序：Chassis series → Chassis no → Document type（首个错误即返回）。
 *
 * @param values 表单输入值
 * @returns 统一格式的校验结果
 */
export function validateGenerateDocumentForm(
  values: GenerateDocumentFormValues,
): GenerateDocumentValidationResult {
  /** 字段与焦点字段的对应关系表，用于返回首个错误 */
  const fieldOrder: Array<{
    key: keyof GenerateDocumentFormValues;
    focusField: GenerateDocumentFocusField;
  }> = [
    { key: 'chassisSeries', focusField: 'chassisSeries' },
    { key: 'chassisNo', focusField: 'chassisNo' },
    { key: 'documentType', focusField: 'documentType' },
  ];

  for (const { key, focusField } of fieldOrder) {
    const fieldResult = generateDocumentFormSchema.shape[key].safeParse(
      values[key],
    );
    if (!fieldResult.success) {
      return {
        valid: false,
        message: fieldResult.error.issues[0].message,
        focusField,
      };
    }
  }

  return { valid: true, message: '', focusField: '' };
}
