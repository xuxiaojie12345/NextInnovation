import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Menu.css';

// 菜单项类型定义
interface MenuItem {
  id: string;
  label: string;
  path: string;
  permission: string;
}

// 菜单分组类型定义
interface MenuSection {
  title: string;
  items: MenuItem[];
}

const Menu: React.FC = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  // 当前在右侧内容区加载的画面路径（iframe）
  const [activeUrl, setActiveUrl] = useState<string>('');

  const navigate = useNavigate();

  // 菜单配置定义
  const menuSections: MenuSection[] = [
    {
      title: 'Generate',
      items: [
        // 点击 Generate Doc：先进入认证文档信息输入画面（GenerateHomologationDocument），
        // 提交后再在右侧显示实际的 GenerateDocument 生成画面。
        { id: 'generateDoc', label: 'Generate Doc', path: '/GenerateHomologationDocument', permission: 'hdoc' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { id: 'updateVariables', label: 'Update user defined variables', path: '/modify-document', permission: 'hdoc_variables' },
        { id: 'existingVariables', label: 'Existing HDoc variables', path: '/existing-hdoc-variables', permission: 'hdoc_variables' },
        { id: 'uploadTemplate', label: 'Upload/Delete template', path: '/upload-delete-template', permission: 'hdoc_admin' },
        { id: 'listTemplates', label: 'List available templates', path: '/list-available-templates', permission: 'hdoc_admin' },
        { id: 'vinPlate', label: 'VPPS Vin plate', path: '/vin-plate', permission: 'hdoc_admin' },
        { id: 'adChange', label: 'AD Change', path: '/ad-change', permission: 'hdoc_admin' },
        { id: 'marketDocSettings', label: 'Market Document Settings List', path: '/market-document-settings-list', permission: 'hdoc_admin' },
        { id: 'marketsInHDoc', label: 'Markets in HDoc', path: '/markets-in-hdoc', permission: 'hdoc_admin' },
        { id: 'documentTypes', label: 'Document Types', path: '/document-types', permission: 'hdoc_admin' },
        { id: 'quickGuides', label: 'Download and Print Quick Guides', path: '/download-print-quick-guides', permission: 'hdoc_admin' },
        { id: 'adCaChange', label: 'AD/CA Change', path: '/ad-ca-change', permission: 'hdoc_admin' },
      ],
    },
    {
      title: 'User Administration',
      items: [
        { id: 'userAdmin', label: 'HDoc User Admin', path: '/hdoc-user-administration', permission: 'hdoc_user_admin' },
        { id: 'userDocAdmin', label: 'HDoc User Doc Admin', path: '/hdoc-user-doc-administration', permission: 'hdoc_user_admin' },
        { id: 'searchUser', label: 'Search User', path: '/search-user', permission: 'hdoc_user_admin' },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { id: 'userGuide', label: 'User Guide', path: '/user-guide', permission: 'hdoc' },
      ],
    },
  ];

  // 获取用户权限列表
  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const userInfoStr = sessionStorage.getItem('userInfo');
      if (!userInfoStr) {
        navigate('/');
        return;
      }
      // 后端 GetUserFunctionAuth 通过 @RequestHeader("userId") 读取用户 ID。
      // 从登录时保存的 userInfo 中解析 userId 并放入 userId 请求头。
      let userId = '';
      try {
        const info = JSON.parse(userInfoStr);
        userId = info.userId || '';
      } catch {
        userId = '';
      }
      if (!userId) {
        navigate('/');
        return;
      }
      const response = await axios.get('/api/user/GetUserFunctionAuth', {
        headers: { userId },
      });
      if (response.data.status === 'success') {
        setPermissions(response.data.data.permissions || []);
      } else {
        setErrorMessage('Failed to load menu. Please check your network.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        } else if (error.response.status >= 500) {
          setErrorMessage('System error. Please contact support.');
        } else {
          setErrorMessage('Failed to load menu. Please check your network.');
        }
      } else if (error.request) {
        setErrorMessage('Failed to load menu. Please check your network.');
      } else {
        setErrorMessage('Failed to load menu. Please check your network.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // 组件挂载时获取权限
  useEffect(() => {
    const userInfo = sessionStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/');
      return;
    }
    fetchPermissions();
  }, [fetchPermissions, navigate]);

  // 监听右侧 iframe 内子画面上报的跳转请求（跨画面通信）
  // 子画面（如 GenerateHomologationDocument）Submit 时通过
  // window.parent.postMessage({ type: 'NAVIGATE', path }) 通知 Menu 切换右侧内容。
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as { type?: string; path?: string } | null;
      if (msg && msg.type === 'NAVIGATE' && typeof msg.path === 'string') {
        setActiveUrl(msg.path);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 判断某个权限是否在权限列表中
  const hasPermission = (permission: string): boolean => {
    return permissions.some((p) => p === permission);
  };

  // 处理菜单点击：在右侧内容区（iframe）加载对应画面
  const handleMenuItemClick = (path: string) => {
    setActiveUrl(path);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setActiveUrl(path);
    }
  };

  // 处理重新加载按钮
  const handleRetry = () => {
    fetchPermissions();
  };

  // 获取当前登录用户名
  const getUserName = (): string => {
    const userInfoStr = sessionStorage.getItem('userInfo');
    if (!userInfoStr) return '';
    try {
      const info = JSON.parse(userInfoStr);
      return info.userName || info.name || '';
    } catch {
      return '';
    }
  };

  // 处理登出：清空 session 并返回登录页
  const handleLogout = () => {
    sessionStorage.removeItem('userInfo');
    setActiveUrl('');
    navigate('/');
  };

  // 顶部导航条：右侧显示用户名和 Logout 按钮
  const renderNavbar = () => (
    <div className="menu-navbar">
      <span className="menu-navbar-user">{getUserName()}</span>
      <button className="menu-navbar-logout" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );

  // 左侧菜单栏
  const renderSidebar = () => (
    <div className="menu-sidebar">
      <div className="menu-header">
        <div className="menu-logo">VOLVO</div>
      </div>
      <div className="menu-content">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter((item) => hasPermission(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title} className="menu-section">
              <h3 className="menu-section-title">{section.title}</h3>
              <ul className="menu-list">
                {visibleItems.map((item) => (
                  <li
                    key={item.id}
                    className={`menu-item${activeUrl === item.path ? ' menu-item-active' : ''}`}
                    tabIndex={0}
                    role="button"
                    onClick={() => handleMenuItemClick(item.path)}
                    onKeyDown={(e) => handleKeyDown(e, item.path)}
                  >
                    <span className="menu-arrow">&raquo;</span>
                    <span className="menu-label">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {/* 所有用户可见的 Change Password */}
        <div className="menu-section">
          <h3 className="menu-section-title">Account</h3>
          <ul className="menu-list">
            <li
              className={`menu-item${activeUrl === '/change-password' ? ' menu-item-active' : ''}`}
              tabIndex={0}
              role="button"
              onClick={() => handleMenuItemClick('/change-password')}
              onKeyDown={(e) => handleKeyDown(e, '/change-password')}
            >
              <span className="menu-arrow">&raquo;</span>
              <span className="menu-label">Change Password</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // 右侧内容区（iframe 加载对应的子画面）
  const renderContent = () => {
    if (!isLoading && permissions.length === 0 && !errorMessage) {
      return (
        <div className="menu-content-area">
          <div className="menu-error-container">
            <p className="menu-error-text">YOU ARE NOT AUTHORIZED TO ACCESS THIS PAGE</p>
            <button className="menu-retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      );
    }
    if (isLoading) {
      return (
        <div className="menu-content-area">
          <div className="menu-loading-container">
            <div className="menu-loading-spinner" />
            <p className="menu-loading-text">Loading menu...</p>
          </div>
        </div>
      );
    }
    if (errorMessage) {
      return (
        <div className="menu-content-area">
          <div className="menu-error-container">
            <p className="menu-error-text">{errorMessage}</p>
            <button className="menu-retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      );
    }
    // 正常：右侧为 iframe 内容区
    if (!activeUrl) {
      return (
        <div className="menu-content-area">
          <div className="menu-placeholder">
            <p>Select a menu item from the left to view its content.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="menu-content-area">
        <iframe
          className="menu-iframe"
          src={activeUrl}
          title={activeUrl}
        />
      </div>
    );
  };

  return (
    <div className="menu-container">
      {/* 顶部导航条（全宽） */}
      {renderNavbar()}
      {/* 左右分栏：左侧菜单 + 右侧内容 */}
      <div className="menu-body">
        {renderSidebar()}
        {renderContent()}
      </div>
    </div>
  );
};

export default Menu;
