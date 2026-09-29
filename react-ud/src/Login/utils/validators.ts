/**
 * 表单校验工具模块
 * ------------------------------------------------------------------
 * 对应【Login_詳細設計.md 4.2 校验详细规格表】的前端校验规则。
 * 遵循开发规约 15，数据校验使用 Zod 库实现。
 * 抽离为独立模块，便于其他画面（注册、密码变更等）复用。
 */
import { z } from 'zod';

/** UserID 允许的字符：半角英数字（[a-zA-Z0-9]），最大长度 10 */
export const USERID_MAX_LENGTH = 10;
/** Password 允许的字符：半角英数字 + ASCII 可见符号，最大长度 32 */
export const PASSWORD_MAX_LENGTH = 32;

/** UserID 合法字符正则：仅半角英数字 */
const USERID_PATTERN = /^[a-zA-Z0-9]+$/;
/** Password 合法字符正则：ASCII 可见字符（! 到 ~，不含空白） */
const PASSWORD_PATTERN = /^[!-~]+$/;

/**
 * 错误消息常量：与详细设计的 Message Content 严格一致
 * （消息内容维持设计书中的英文文案）
 */
export const ERROR_MESSAGES = {
  /** 校验 No.1 / No.2：UserID 或 Password 为空 */
  REQUIRED: 'Username and password are required.',
  /** 校验 No.3：用户名或密码不正确（API 401） */
  INVALID_CREDENTIALS:
    "We didn't recognize the username or password you entered. Please try again.",
  /** 校验 No.4：账户已锁定（API 403） */
  ACCOUNT_LOCKED:
    'Your account is locked. Please contact your system administrator.',
  /** 校验 No.5：系统异常（API 500） */
  SYSTEM_ERROR: 'System error. Please contact administrator.',
  /** 网络断开 / 超时 */
  NETWORK_ERROR: 'Network error. Please check your connection.',
  /** 格式错误：UserID 含非法字符 */
  USERID_FORMAT: 'UserID must contain only half-width alphanumeric characters.',
  /** 格式错误：Password 含非法字符 */
  PASSWORD_FORMAT: 'Password contains invalid characters.',
  /** 长度错误：UserID 超出最大长度 */
  USERID_LENGTH: `UserID must be ${USERID_MAX_LENGTH} characters or less.`,
  /** 长度错误：Password 超出最大长度 */
  PASSWORD_LENGTH: `Password must be ${PASSWORD_MAX_LENGTH} characters or less.`,
} as const;

/** 校验结果的类型定义（供组件侧解构使用） */
export interface LoginFormValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误消息（通过时为空字符串） */
  message: string;
  /** 需要移动焦点的字段 */
  focusField: 'userID' | 'password' | '';
}

/** 校验对象表单输入值的类型定义 */
export interface LoginFormValues {
  /** UserID 输入值 */
  userId: string;
  /** Password 输入值 */
  password: string;
}

/**
 * API 认证结果的类型定义（与 authApi 共用）
 */
export interface AuthenticationResult {
  /** 是否认证成功 */
  success: boolean;
  /** HTTP 状态码（网络异常时为 0） */
  code: number;
  /** 显示用消息 */
  message?: string;
  /** 成功时的附带数据 */
  data?: {
    userid: string;
    username: string;
    token: string;
    /** 用户功能权限列表（后台 AuthenticationServiceImpl 返回） */
    functions?: string[];
    /** 用户市场权限列表（后台 AuthenticationServiceImpl 返回） */
    markets?: string[];
  } | null;
}

/**
 * 去除字符串首尾空格（详细设计 4.1 前置处理）
 * @param value 原始输入值
 * @returns 去空格后的值；非字符串返回空字符串
 */
export function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * UserID 校验 schema：必填 + 长度 + 半角英数字
 * 空值情况下返回通用的 REQUIRED 消息，其余情况返回各自的消息。
 */
const userIDSchema = z
  .string()
  .transform(normalize)
  .refine((value) => value.length > 0, { message: ERROR_MESSAGES.REQUIRED })
  .refine((value) => value.length <= USERID_MAX_LENGTH, {
    message: ERROR_MESSAGES.USERID_LENGTH,
  })
  .refine((value) => USERID_PATTERN.test(value), {
    message: ERROR_MESSAGES.USERID_FORMAT,
  });

/**
 * Password 校验 schema：必填 + 长度 + 半角英数字 + 符号
 * 空值情况下返回通用的 REQUIRED 消息，其余情况返回各自的消息。
 */
const passwordSchema = z
  .string()
  .transform(normalize)
  .refine((value) => value.length > 0, { message: ERROR_MESSAGES.REQUIRED })
  .refine((value) => value.length <= PASSWORD_MAX_LENGTH, {
    message: ERROR_MESSAGES.PASSWORD_LENGTH,
  })
  .refine((value) => PASSWORD_PATTERN.test(value), {
    message: ERROR_MESSAGES.PASSWORD_FORMAT,
  });

/** 表单整体校验 schema */
const loginFormSchema = z.object({
  userId: userIDSchema,
  password: passwordSchema,
});

/**
 * UserID 单项校验（供复用）
 * @param userId 原始 UserID 输入值
 * @returns 校验通过返回空字符串，否则返回错误消息
 */
export function validateUserId(userId: unknown): string {
  const result = userIDSchema.safeParse(userId);
  return result.success ? '' : result.error.issues[0].message;
}

/**
 * Password 单项校验（供复用）
 * @param password 原始 Password 输入值
 * @returns 校验通过返回空字符串，否则返回错误消息
 */
export function validatePassword(password: unknown): string {
  const result = passwordSchema.safeParse(password);
  return result.success ? '' : result.error.issues[0].message;
}

/**
 * 表单整体校验（点击 Login 按钮时调用）
 * 校验顺序遵循详细设计：先空值校验，再格式校验。
 * @param values 表单输入值
 * @returns 校验结果（valid / message / focusField）
 */
export function validateLoginForm(
  values: LoginFormValues,
): LoginFormValidationResult {
  const userId = normalize(values.userId);
  const password = normalize(values.password);

  // 前置空值校验：任一为空即返回通用消息
  if (!userId || !password) {
    return {
      valid: false,
      message: ERROR_MESSAGES.REQUIRED,
      // 焦点停留在第一个空字段
      focusField: !userId ? 'userID' : 'password',
    };
  }

  // 基于 Zod 的 schema 校验
  const result = loginFormSchema.safeParse({ userId, password });
  if (result.success) {
    return { valid: true, message: '', focusField: '' };
  }

  // 取首个检测到的错误作为显示对象
  const issue = result.error.issues[0];
  const errorField = issue.path[0] === 'password' ? 'password' : 'userID';
  return {
    valid: false,
    message: issue.message,
    focusField: errorField,
  };
}
