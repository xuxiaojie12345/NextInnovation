/**
 * パスワード入力の検証ルール
 *
 * ログイン画面（Login.tsx）とユーザー管理画面（UserManagementScreen.tsx）で共用する。
 * 仕様書: react-kadou/docs/Login_パスワード入力検証仕様.html
 *
 * ・必須（空白のみは不可）
 * ・最大 50 文字
 * ・半角英数字 + ASCII 記号（0x21〜0x7E）のみ。全角・空白・制御文字は不可
 * ・パスワードは trim() などの加工をせず、入力値をそのまま照合する
 */
import type { Rule } from 'antd/es/form';

/** パスワードの最大文字数 */
export const PASSWORD_MAX_LENGTH = 50;

/** 許容文字：半角英数字 + ASCII 記号（0x21〜0x7E） */
export const PASSWORD_PATTERN = /^[\x21-\x7E]+$/;

/** エラーメッセージ（画面・テストで共用） */
export const PASSWORD_MESSAGE = {
  required: 'パスワードを入力してください。',
  max: `パスワードは${PASSWORD_MAX_LENGTH}文字以内で入力してください。`,
  charset: 'パスワードは半角英数字と記号で入力してください。',
} as const;

/**
 * パスワードを検証する。
 * @returns エラーメッセージ（問題がなければ null）
 */
export const validatePassword = (
  value: string | null | undefined,
): string | null => {
  const input = value ?? '';
  if (input.trim() === '') return PASSWORD_MESSAGE.required;
  if (input.length > PASSWORD_MAX_LENGTH) return PASSWORD_MESSAGE.max;
  if (!PASSWORD_PATTERN.test(input)) return PASSWORD_MESSAGE.charset;
  return null;
};

/** antd の Form.Item に渡す検証ルール */
export const passwordFormRules: Rule[] = [
  {
    required: true,
    whitespace: true,
    message: PASSWORD_MESSAGE.required,
  },
  {
    max: PASSWORD_MAX_LENGTH,
    message: PASSWORD_MESSAGE.max,
  },
  {
    pattern: PASSWORD_PATTERN,
    message: PASSWORD_MESSAGE.charset,
  },
];
