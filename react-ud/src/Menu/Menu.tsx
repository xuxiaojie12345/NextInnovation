/**
 * Menu 组件 - 主菜单页面（登录成功后的跳转目标）
 * ------------------------------------------------------------------
 * 详细设计 3.1：认证成功后跳转到 Menu 页面。
 * 详细设计 7.4：未认证用户访问 Menu 时应重定向回 Login。
 *
 * @component
 * @returns {React.JSX.Element} 主菜单页面
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';

/** 与 Login 模块约定的 sessionStorage 键名 */
const TOKEN_STORAGE_KEY = 'edb_auth_token';
const USER_STORAGE_KEY = 'edb_user_info';

/**
 * 从 sessionStorage 读取登录用户 ID（惰性初始化，避免在 effect 内 setState）
 * @returns 用户 ID，读取失败时返回空字符串
 */
function readStoredUserID(): string {
  const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
  if (!storedUser) return '';
  try {
    return JSON.parse(storedUser) || '';
  } catch {
    // 存储内容异常时忽略，不影响页面渲染
    return '';
  }
}

/**
 * Menu 组件本体
 * @returns {React.JSX.Element} 主菜单页面
 */
function Menu(): React.JSX.Element {
  const navigate = useNavigate();
  /** 当前登录用户 ID */
  const [userID] = useState<string>(readStoredUserID);

  // 详细设计 7.4：未认证用户访问受保护页面时重定向回 Login
  const isAuthenticated: boolean = Boolean(
    sessionStorage.getItem(TOKEN_STORAGE_KEY),
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * 退出登录：清除认证信息并返回登录页
   */
  const handleLogout = useCallback((): void => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    navigate('/login', { replace: true });
  }, [navigate]);

  return (
    <div className="menu-screen">
      <header className="menu-header">
        <h1 className="menu-header__title">
          <strong>EDB</strong> Engineering Database
        </h1>
        <div className="menu-header__user">
          <span className="menu-header__name">{userID || 'User'}</span>
          <button
            className="menu-header__logout"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="menu-main">
        <h2 className="menu-main__heading">Main Menu</h2>
      </main>
    </div>
  );
}

export default Menu;
