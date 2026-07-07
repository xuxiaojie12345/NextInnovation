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

  const navigate = useNavigate();

  // 菜单配置定义
  const menuSections: MenuSection[] = [
    {
      title: 'Generate',
      items: [
        { id: 'generateDoc', label: 'Generate Doc', path: '/generate-document', permission: 'hdoc' },
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
      const response = await axios.get('/api/user/GetUserFunctionAuth', {
        headers: { Authorization: `Bearer ${userInfoStr}` },
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

  // 判断某个权限是否在权限列表中
  const hasPermission = (permission: string): boolean => {
    return permissions.some((p) => p === permission);
  };

  // 处理菜单点击跳转
  const handleMenuItemClick = (path: string) => {
    navigate(path);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, path: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigate(path);
    }
  };

  // 处理重新加载按钮
  const handleRetry = () => {
    fetchPermissions();
  };

  // 无权限时显示提示
  if (!isLoading && permissions.length === 0 && !errorMessage) {
    return (
      <div className="menu-container">
        <div className="menu-header">
          <div className="menu-logo">VOLVO</div>
        </div>
        <div className="menu-error-container">
          <p className="menu-error-text">YOU ARE NOT AUTHORIZED TO ACCESS THIS PAGE</p>
          <button className="menu-retry-button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 加载中显示
  if (isLoading) {
    return (
      <div className="menu-container">
        <div className="menu-header">
          <div className="menu-logo">VOLVO</div>
        </div>
        <div className="menu-loading-container">
          <div className="menu-loading-spinner" />
          <p className="menu-loading-text">Loading menu...</p>
        </div>
      </div>
    );
  }

  // 错误时显示
  if (errorMessage) {
    return (
      <div className="menu-container">
        <div className="menu-header">
          <div className="menu-logo">VOLVO</div>
        </div>
        <div className="menu-error-container">
          <p className="menu-error-text">{errorMessage}</p>
          <button className="menu-retry-button" onClick={handleRetry}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-container">
      {/* 顶部标题区域 */}
      <div className="menu-header">
        <div className="menu-logo">VOLVO</div>
      </div>
      {/* 菜单内容区域 */}
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
                    className="menu-item"
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
              className="menu-item"
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
};

export default Menu;
