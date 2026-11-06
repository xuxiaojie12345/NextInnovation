/**
 * パスワード入力検証の単体テスト
 *
 * 仕様書（docs/Login_パスワード入力検証仕様.html 第7章）のテスト観点に対応する。
 * ・必須（空・空白のみ）
 * ・半角英数字 + ASCII 記号のみ許可
 * ・最大 50 文字
 * ・trim() は行わない
 */
import { describe, expect, it } from '@jest/globals';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
  validatePassword,
} from './passwordRules';

describe('validatePassword', () => {
  it('未入力はエラーになる', () => {
    expect(validatePassword('')).toBe(PASSWORD_MESSAGE.required);
    expect(validatePassword(undefined)).toBe(PASSWORD_MESSAGE.required);
    expect(validatePassword(null)).toBe(PASSWORD_MESSAGE.required);
  });

  it('半角スペースのみはエラーになる', () => {
    expect(validatePassword('   ')).toBe(PASSWORD_MESSAGE.required);
    expect(validatePassword('　')).toBe(PASSWORD_MESSAGE.required);
  });

  it('半角英数字のパスワードは許可される', () => {
    expect(validatePassword('pass1234')).toBeNull();
  });

  it('半角記号を含むパスワードは許可される', () => {
    expect(validatePassword('P@ssw0rd!#$%&()')).toBeNull();
    expect(validatePassword('a-b_c.d/e\\f')).toBeNull();
  });

  it('全角文字はエラーになる', () => {
    expect(validatePassword('ｐａｓｓ１２３４')).toBe(PASSWORD_MESSAGE.charset);
    expect(validatePassword('パスワード')).toBe(PASSWORD_MESSAGE.charset);
  });

  it('途中の半角スペースはエラーになる', () => {
    expect(validatePassword('pass 1234')).toBe(PASSWORD_MESSAGE.charset);
  });

  it('前後の半角スペースは trim されずエラーになる', () => {
    expect(validatePassword(' pass1234')).toBe(PASSWORD_MESSAGE.charset);
    expect(validatePassword('pass1234 ')).toBe(PASSWORD_MESSAGE.charset);
  });

  it('制御文字はエラーになる', () => {
    expect(validatePassword('pass\t1234')).toBe(PASSWORD_MESSAGE.charset);
    expect(validatePassword('pass\n1234')).toBe(PASSWORD_MESSAGE.charset);
  });

  it('最大文字数ちょうどは許可される', () => {
    const value = 'a'.repeat(PASSWORD_MAX_LENGTH);
    expect(value).toHaveLength(50);
    expect(validatePassword(value)).toBeNull();
  });

  it('最大文字数を超えるとエラーになる', () => {
    const value = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    expect(validatePassword(value)).toBe(PASSWORD_MESSAGE.max);
  });

  it('ASCII 記号をすべて許可する', () => {
    // 0x21〜0x7E を連結した文字列（半角英数字 + 記号）
    const printableAscii = Array.from({ length: 0x7e - 0x21 + 1 }, (_, i) =>
      String.fromCharCode(0x21 + i),
    ).join('');
    expect(printableAscii).toHaveLength(94);
    expect(PASSWORD_PATTERN.test(printableAscii)).toBe(true);
    // 最大文字数を超えるため、validate では桁数エラーになる
    expect(validatePassword(printableAscii)).toBe(PASSWORD_MESSAGE.max);
    expect(validatePassword(printableAscii.slice(0, PASSWORD_MAX_LENGTH))).toBeNull();
  });
});
