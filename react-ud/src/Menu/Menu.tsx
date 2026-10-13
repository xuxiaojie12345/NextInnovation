/**
 * Menu 组件 - 系统主菜单页面
 * ------------------------------------------------------------------
 * 对应【详细设计UD02.md（Menu 模块）】：
 *  - 画面布局 2.1：菜单标题（居中固定 "Menu"）+ 按业务分组的导航 Link +
 *    右上角 Welcome Message
 *  - 控件 2.1：12 个画面迁移 Link（Generate / Admin / User Administration /
 *    Documentation 分组）、Welcome Message(Label, 256, 右对齐, 动态显示)、
 *    Menu Title(Label, 居中, 固定显示 "Menu")
 *  - 业务 3.1：点击任意 Link → 获取登录 userID → 迁移到对应画面并传递 userID
 *  - 接口 4：无（本画面不调用任何后端 API）
 *  - 异常 5：路由不存在(404) / 未登录直接访问(路由守卫) / 网络 / 服务器错误
 *
 * @component
 * @returns {React.JSX.Element} 菜单页面
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../fTRYDXFAD.jpeg';
import './Menu.css';

/** 认证成功后保存用户信息的 sessionStorage 键名（与 Login 保持一致） */
const USER_STORAGE_KEY = 'edb_user_info';
/** 认证成功后保存 Token 的 sessionStorage 键名（与 Login 保持一致） */
const TOKEN_STORAGE_KEY = 'edb_auth_token';

/** 画面标题固定显示值（详细设计 2.1 控件 14：初期值 "Menu"，固定显示） */
const MENU_TITLE = 'Menu';
/** Welcome Message 文案前缀（详细设计 2.1 控件 13：显示 "Welcome, {userID}"） */
const WELCOME_PREFIX = 'Welcome';

/** 菜单项定义：分组标题、项目名称、迁移目标路径（详细设计 2.1 控件 1〜12） */
interface MenuItem {
  /** 分组名（Generate / Admin / User Administration / Documentation） */
  group: string;
  /** 项目显示名（控件 項目名） */
  label: string;
  /** 迁移目标路由路径 */
  path: string;
}

/**
 * 菜单项一览（严格对应详细设计的 12 个 Link）
 * 分组顺序：Generate → Admin → User Administration → Documentation
 */
const MENU_ITEMS: MenuItem[] = [
  { group: 'Generate', label: 'Generate Doc', path: '/generate-document' },
  {
    group: 'Admin',
    label: 'Update user defined variables (rules)',
    path: '/homologation-variables',
  },
  { group: 'Admin', label: 'Existing HDoc variables', path: '/variables' },
  { group: 'Admin', label: 'Upload/Delete template', path: '/upload-delete-template' },
  { group: 'Admin', label: 'List available templates', path: '/list-available-templates' },
  { group: 'Admin', label: 'VPPS Vin plate', path: '/vin-plate' },
  { group: 'Admin', label: 'AD/CA Change', path: '/ad-change' },
  {
    group: 'User Administration',
    label: 'HDoc User Administration',
    path: '/user-administration',
  },
  {
    group: 'User Administration',
    label: 'HDoc User Doc Administration',
    path: '/user-doc-administration',
  },
  { group: 'User Administration', label: 'Search User', path: '/search-user' },
  { group: 'User Administration', label: 'Change Password', path: '/change-password' },
  { group: 'Documentation', label: 'User Guide', path: '/user-guide' },
];

/**
 * 从会话存储中读取当前登录的 userID（详细设计 6：userID 从登录成功后的会话状态取得）
 * @returns {string} 登录 userID；未登录或解析失败时返回空字符串
 */
function readLoggedInUserId(): string {
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return '';
    // Login.tsx 以 JSON 字符串形式保存 userid，此处兼容纯文本形式
    const parsed = raw.startsWith('"') ? (JSON.parse(raw) as string) : raw;
    return typeof parsed === 'string' ? parsed : '';
  } catch {
    // 解析异常时安全返回空值，避免影响画面渲染
    return '';
  }
}

/**
 * Menu 组件本体
 * @returns {React.JSX.Element} 菜单页面
 */
function Menu(): React.JSX.Element {
  /* ------------------------------ State 定义 ------------------------------ */
  // 详细设计 6：使用 React State 管理 userID
  /** 当前登录 userID */
  const [userID, setUserID] = useState<string>('');

  const navigate = useNavigate();

  /* ------------------------------ 生命周期 ------------------------------ */
  useEffect(() => {
    // 详细设计 3.1：前置处理，获取当前登录的 userID
    setUserID(readLoggedInUserId());
  }, []);

  /* ------------------------------ 工具方法 ------------------------------ */
  /**
   * 按分组聚合菜单项（使用 useMemo 避免不必要的重复计算，规约 17）
   * @returns {Array<[string, MenuItem[]]>} 分组名与对应菜单项的键值对数组
   */
  const groupedItems = useMemo<Array<[string, MenuItem[]]>>(() => {
    const map = new Map<string, MenuItem[]>();
    MENU_ITEMS.forEach((item) => {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, []);

  /**
   * 画面迁移处理（详细设计 3.1 结果处理）
   * 点击 Link → 迁移到对应画面 → 将登录的 userID 传递给后续画面。
   * @param path 目标路由路径
   */
  const handleNavigate = useCallback(
    (path: string): void => {
      // 通过路由 state 传递 userID（对应详细设计「把 userID 传递过去」）
      navigate(path, { state: { userID } });
    },
    [navigate, userID],
  );

  /* ------------------------------ 渲染 ------------------------------ */
  return (
    <div
      className="menu-screen"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* 顶栏：菜单标题（居中）+ 欢迎信息（右对齐） */}
      <header className="menu-header">
        <h1 className="menu-header__title">{MENU_TITLE}</h1>
        {/*
          控件 13：Welcome Message
          详细设计 2.1：MaxLength 256、任意可见字符、右对齐、动态显示 "Welcome, {userID}"
          详细设计 7：内容为空时不占位
        */}
        <p
          className={`menu-header__welcome${
            userID ? ' menu-header__welcome--visible' : ''
          }`}
          title={userID ? `${WELCOME_PREFIX}, ${userID}` : ''}
        >
          {userID ? `${WELCOME_PREFIX}, ${userID}` : ''}
        </p>
      </header>

      {/* 主体：按业务分组的导航 Link（详细设计 2.1 控件 1〜12） */}
      <main className="menu-content" aria-label="Menu navigation">
        <div className="menu-panel">
          {groupedItems.map(([group, items]) => (
            <section className="menu-group" key={group}>
              <h2 className="menu-group__title">{group}</h2>
              <ul className="menu-group__list">
                {/* 列表渲染始终设置 key（规约 16） */}
                {items.map((item) => (
                  <li className="menu-group__item" key={item.path}>
                    <button
                      type="button"
                      className="menu-link"
                      onClick={() => handleNavigate(item.path)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Menu;

/** 供单元测试与外部复用的常量导出 */
export { MENU_ITEMS, MENU_TITLE, USER_STORAGE_KEY, TOKEN_STORAGE_KEY, readLoggedInUserId };
