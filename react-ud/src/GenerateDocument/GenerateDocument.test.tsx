/**
 * GenerateDocument 组件单元测试
 * ------------------------------------------------------------------
 * 基于【単体テスト仕様書UD03.md】的测试用例作成。
 * 覆盖：画面初始化与表示、输入校验、按钮操作、异常处理。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import GenerateDocument from './GenerateDocument';
import {
  CHASSIS_NO_MAX_LENGTH,
  CHASSIS_SERIES_MAX_LENGTH,
  filterChassisNo,
  filterChassisSeries,
  toHalfWidth,
  validateGenerateDocumentForm,
} from './utils/validators';

/** Mock useNavigate，用于断言画面迁移的被调用情况（保留其余导出） */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/** sessionStorage 中的用户信息键名（与 Login 保持一致） */
const USER_STORAGE_KEY = 'edb_user_info';
/** 上一次提交条件的本地存储键名 */
const LAST_CONDITION_STORAGE_KEY = 'edb_last_generate_condition';

/**
 * 渲染 GenerateDocument 组件（使用 MemoryRouter 提供路由上下文）
 * @returns Testing Library 渲染结果
 */
const renderGenerateDocument = () =>
  render(
    <MemoryRouter>
      <GenerateDocument />
    </MemoryRouter>,
  );

/** 获取各控件元素 */
const getChassisSeriesInput = (): HTMLElement =>
  screen.getByLabelText('Chassis series');
const getChassisNoInput = (): HTMLElement => screen.getByLabelText('Chassis no');
const getDocumentTypeSelect = (): HTMLElement =>
  screen.getByLabelText('Document type');
const getSubmitButton = (): HTMLElement =>
  screen.getByRole('button', { name: 'Submit' });
const getResetButton = (): HTMLElement =>
  screen.getByRole('button', { name: 'Reset' });
const getHelpButton = (): HTMLElement =>
  screen.getByRole('button', { name: 'Help' });

describe('GenerateDocument Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('画面初始化与表示', () => {
    // 用例 1：画面初期表示
    test('renders initial empty form with enabled buttons', () => {
      renderGenerateDocument();

      // Chassis series / Chassis no 输入框为空
      expect(getChassisSeriesInput()).toHaveValue('');
      expect(getChassisNoInput()).toHaveValue('');
      // Document type 下拉列表为空
      expect(getDocumentTypeSelect()).toHaveValue('');
      // Submit / Reset / Help 按钮显示且可用
      expect(getSubmitButton()).toBeEnabled();
      expect(getResetButton()).toBeEnabled();
      expect(getHelpButton()).toBeEnabled();
      // error message area 默认隐藏
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 用例 2：上一次提交条件回显
    test('restores last submitted condition on mount', () => {
      localStorage.setItem(
        LAST_CONDITION_STORAGE_KEY,
        JSON.stringify({
          chassisSeries: 'JPCT',
          chassisNo: '15101319',
          documentType: 'Homologation',
        }),
      );

      renderGenerateDocument();

      expect(getChassisSeriesInput()).toHaveValue('JPCT');
      expect(getChassisNoInput()).toHaveValue('15101319');
      expect(getDocumentTypeSelect()).toHaveValue('Homologation');
    });

    // 用例 3：pull-down 数据源
    test('provides document type options', () => {
      renderGenerateDocument();

      const options = screen
        .getAllByRole('option')
        .map((option) => option.textContent);
      expect(options).toContain('Homologation');
    });
  });

  describe('输入校验', () => {
    // 用例 5 / 6：最大长度 5 位，超出截断
    test('limits chassis series to 5 half-width letters', () => {
      renderGenerateDocument();

      fireEvent.change(getChassisSeriesInput(), {
        target: { value: 'ABCDE' },
      });
      expect(getChassisSeriesInput()).toHaveValue('ABCDE');

      fireEvent.change(getChassisSeriesInput(), {
        target: { value: 'ABCDEF' },
      });
      expect(getChassisSeriesInput()).toHaveValue('ABCDE');
    });

    // 用例 7：非法字符被过滤
    test('filters invalid characters in chassis series', () => {
      renderGenerateDocument();

      fireEvent.change(getChassisSeriesInput(), {
        target: { value: '123-@' },
      });
      expect(getChassisSeriesInput()).toHaveValue('');
    });

    // 用例 9 / 10：最大长度 10 位，超出截断
    test('limits chassis no to 10 half-width numbers', () => {
      renderGenerateDocument();

      fireEvent.change(getChassisNoInput(), {
        target: { value: '1234567890' },
      });
      expect(getChassisNoInput()).toHaveValue('1234567890');

      fireEvent.change(getChassisNoInput(), {
        target: { value: '12345678901' },
      });
      expect(getChassisNoInput()).toHaveValue('1234567890');
    });

    // 用例 11：非半角数字被过滤
    test('filters non-numeric characters in chassis no', () => {
      renderGenerateDocument();

      fireEvent.change(getChassisNoInput(), { target: { value: 'ABC' } });
      expect(getChassisNoInput()).toHaveValue('');
    });
  });

  describe('按钮操作', () => {
    // 用例 12：Submit 正常迁移并传递参数
    test('navigates with inputs and userID when submit clicked', () => {
      sessionStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify({ userid: 'admin' }),
      );
      renderGenerateDocument();

      fireEvent.change(getChassisSeriesInput(), {
        target: { value: 'JPCT' },
      });
      fireEvent.change(getChassisNoInput(), {
        target: { value: '15101319' },
      });
      fireEvent.change(getDocumentTypeSelect(), {
        target: { value: 'Homologation' },
      });
      fireEvent.click(getSubmitButton());

      expect(mockNavigate).toHaveBeenCalledWith('/generate-document-result', {
        state: {
          chassisSeries: 'JPCT',
          chassisNo: '15101319',
          documentType: 'Homologation',
          userID: 'admin',
        },
      });
    });

    // 用例 13：必填项未输入时不迁移并显示错误
    test('shows error and does not navigate when required fields empty', () => {
      renderGenerateDocument();

      fireEvent.click(getSubmitButton());

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Chassis series is required.',
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    // 用例 14：Reset 清空入力
    test('clears all inputs when reset clicked', () => {
      renderGenerateDocument();

      fireEvent.change(getChassisSeriesInput(), {
        target: { value: 'JPCT' },
      });
      fireEvent.change(getChassisNoInput(), {
        target: { value: '15101319' },
      });
      fireEvent.click(getSubmitButton()); // 触发一次错误消息
      fireEvent.click(getResetButton());

      expect(getChassisSeriesInput()).toHaveValue('');
      expect(getChassisNoInput()).toHaveValue('');
      expect(getDocumentTypeSelect()).toHaveValue('');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    // 用例 15：Help 画面迁移
    test('navigates to user guide when help clicked', () => {
      renderGenerateDocument();

      fireEvent.click(getHelpButton());

      expect(mockNavigate).toHaveBeenCalledWith('/user-guide', {
        state: { userID: '' },
      });
    });
  });

  describe('校验工具函数', () => {
    // 工具函数：全角转半角
    test('converts full-width characters to half-width', () => {
      expect(toHalfWidth('ＪＰＣＴ')).toBe('JPCT');
    });

    // 工具函数：Chassis series 过滤器
    test('filterChassisSeries keeps letters and truncates', () => {
      expect(filterChassisSeries('ab12CD3')).toBe('abCD');
      expect(filterChassisSeries('abcdefgh')).toHaveLength(
        CHASSIS_SERIES_MAX_LENGTH,
      );
    });

    // 工具函数：Chassis no 过滤器
    test('filterChassisNo keeps numbers and truncates', () => {
      expect(filterChassisNo('1a2b3')).toBe('123');
      expect(filterChassisNo('12345678901')).toHaveLength(
        CHASSIS_NO_MAX_LENGTH,
      );
    });

    // 工具函数：表单整体校验通过
    test('validateGenerateDocumentForm passes for valid values', () => {
      const result = validateGenerateDocumentForm({
        chassisSeries: 'JPCT',
        chassisNo: '15101319',
        documentType: 'Homologation',
      });
      expect(result.valid).toBe(true);
      expect(result.message).toBe('');
    });

    // 工具函数：表单整体校验返回首个错误及焦点字段
    test('validateGenerateDocumentForm returns first error field', () => {
      const result = validateGenerateDocumentForm({
        chassisSeries: '',
        chassisNo: '15101319',
        documentType: 'Homologation',
      });
      expect(result.valid).toBe(false);
      expect(result.focusField).toBe('chassisSeries');
    });
  });
});
