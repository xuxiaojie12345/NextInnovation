/**
 * Menu 组件单元测试
 * ------------------------------------------------------------------
 * 基于【単体テスト仕様書UD02.md】的测试用例作成。
 * 覆盖：画面初始化与表示、Welcome Message、分组、画面迁移、异常处理。
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Menu, { MENU_ITEMS, USER_STORAGE_KEY, readLoggedInUserId } from './Menu';

/** Mock useNavigate，用于断言画面迁移的被调用情况（保留其余导出） */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * 渲染 Menu 组件（使用 MemoryRouter 提供路由上下文）
 * @returns Testing Library 渲染结果
 */
const renderMenu = () =>
  render(
    <MemoryRouter>
      <Menu />
    </MemoryRouter>,
  );

describe('Menu Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
  });

  describe('画面初始化与表示', () => {
    // 用例 1：画面初期表示
    test('renders menu title and all navigation links', () => {
      renderMenu();

      // Menu Title 居中固定显示 "Menu"
      expect(
        screen.getByRole('heading', { name: 'Menu', level: 1 }),
      ).toBeInTheDocument();
      // 12 个导航 Link 全部显示
      expect(screen.getAllByRole('button')).toHaveLength(MENU_ITEMS.length);
    });

    // 用例 2：链接按业务分组显示
    test('groups links by business category', () => {
      renderMenu();

      ['Generate', 'Admin', 'User Administration', 'Documentation'].forEach(
        (group) => {
          expect(
            screen.getByRole('heading', { name: group, level: 2 }),
          ).toBeInTheDocument();
        },
      );
    });
  });

  describe('Welcome Message', () => {
    // 用例 3：显示 "Welcome, {userID}"
    test('shows welcome message when userID exists in session', () => {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify('admin'));
      renderMenu();

      expect(screen.getByText('Welcome, admin')).toBeInTheDocument();
    });

    // 用例 4：无登录信息时 Welcome Message 不显示
    test('does not show welcome message when no userID', () => {
      renderMenu();

      expect(screen.queryByText(/Welcome,/)).not.toBeInTheDocument();
    });
  });

  describe('画面迁移', () => {
    // 用例 5：点击 Link 迁移并传递 userID
    test('navigates to target path with userID when link clicked', () => {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify('admin'));
      renderMenu();

      fireEvent.click(
        screen.getByRole('button', { name: 'Generate Doc' }),
      );

      expect(mockNavigate).toHaveBeenCalledWith('/generate-document', {
        state: { userID: 'admin' },
      });
    });

    // 用例 6：点击 User Guide 迁移到 /user-guide
    test('navigates to user guide when User Guide clicked', () => {
      renderMenu();

      fireEvent.click(screen.getByRole('button', { name: 'User Guide' }));

      expect(mockNavigate).toHaveBeenCalledWith('/user-guide', {
        state: { userID: '' },
      });
    });
  });

  describe('readLoggedInUserId 工具函数', () => {
    // 用例 7：JSON 形式存储的 userID 正确解析
    test('parses JSON stored userID', () => {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify('admin'));
      expect(readLoggedInUserId()).toBe('admin');
    });

    // 用例 8：纯文本形式存储的 userID 兼容读取
    test('reads plain text stored userID', () => {
      sessionStorage.setItem(USER_STORAGE_KEY, 'user01');
      expect(readLoggedInUserId()).toBe('user01');
    });

    // 用例 9：无存储时返回空字符串
    test('returns empty string when storage is empty', () => {
      expect(readLoggedInUserId()).toBe('');
    });

    // 用例 10：非法 JSON 时安全返回空字符串（不抛异常）
    test('returns empty string on invalid JSON', () => {
      sessionStorage.setItem(USER_STORAGE_KEY, '"invalid-json');
      expect(readLoggedInUserId()).toBe('');
    });
  });
});
