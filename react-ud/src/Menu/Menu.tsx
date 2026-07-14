import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';

interface MenuItem {
  label: string;
  path?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * Menu 菜单页面组件
 * 
 * 功能说明：
 * - 提供系统各功能模块的导航入口
 * - 用户点击菜单项可跳转到对应的功能画面
 * - 按功能分组展示菜单项（Generate、Admin、User Administration、Documentation）
 * 
 * @component
 * @returns {JSX.Element} Menu菜单页面元素
 */
const Menu: React.FC = () => {
  const navigate = useNavigate();

  // ==================== 状态管理 ====================
  const [errorMessage, setErrorMessage] = useState<string>('');

  // ==================== 画面初始化 ====================
  useEffect(() => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ==================== 菜单配置 ====================
  const menuSections: MenuSection[] = [
    {
      title: 'Generate Document',
      items: [
        { label: 'Generate Doc', path: '/UD03' },                    // 跳转到 UD03 画面
        { label: 'Generate in Batch' },
        { label: 'Regdata Archive' },
        { label: 'Regdata Batch' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: 'Update user defined variables (rules)', path: '/UD08' },   // 跳转到 UD08 画面
        { label: 'Update user defined variables (UNICODE rules)' },
        { label: 'Existing HDoc variables', path: '/UD10' },                 // 跳转到 UD10 画面
        { label: 'Unlock Document' },
        { label: 'HDoc Number Series' },
        { label: 'Upload/Delete template', path: '/UD12' },                  // 跳转到 UD12 画面
        { label: 'List available templates', path: '/UD14' },                // 跳转到 UD14 画面
        { label: 'VPPS Vin plate', path: '/UD15' },                          // 跳转到 UD15 画面
        { label: 'AD/CA Change', path: '/UD16' },                            // 跳转到 UD16 画面
      ],
    },
    {
      title: 'User Administration',
      items: [
        { label: 'HDoc User Administration', path: '/UD17' },                // 跳转到 UD17 画面
        { label: 'HDoc User Doc Administration', path: '/UD18' },            // 跳转到 UD18 画面
        { label: 'Search User', path: '/UD19' },                             // 跳转到 UD19 画面
        { label: 'Change Password' },
        { label: 'User Position' },
      ],
    },
    {
      title: 'Archive',
      items: [
        { label: 'Search' },
        { label: 'Upload Document' },
      ],
    },
    {
      title: 'Documentation',
      items: [
        { label: 'User Guide', path: '/UD24' },                              // 跳转到 UD24 画面
        { label: 'AD/CA Change Guide' },
        { label: 'Vin plate Guide FM/FH' },
        { label: 'Archive Guide' },
        { label: 'Privacy' },
      ],
    },
  ];

  /**
   * 处理菜单项点击事件
   * 处理流程：
   * 1. 检查菜单项是否配置了path
   * 2. 如果配置了path，使用navigate进行路由跳转
   * 3. 如果未配置path，仅记录日志（待开发功能）
   * 
   * @param {MenuItem} item - 被点击的菜单项
   */
  const handleMenuItemClick = (item: MenuItem) => {
    // 清除之前的错误消息
    setErrorMessage('');
    if (item.path) {
      try {
        // 有path配置，执行路由跳转
        navigate(item.path);
      } catch (error) {
        // 异常处理 - 网络异常导致路由失败
        setErrorMessage('页面跳转失败，请稍后重试');
      }
    }
  };

  return (
    <div className="menu-container">
      <div className="menu-header">
        <img 
          src="/volvo-logo.png" alt="VOLVO" className="volvo-logo"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const textLogo = document.createElement('div');
              textLogo.className = 'text-logo';
              textLogo.textContent = 'VOLVO';
              parent.appendChild(textLogo);
            }
          }}
        />
      </div>

      {/* 错误消息显示区域 */}
      {errorMessage && (
        <div className="menu-error">
          <span className="menu-error-icon">⚠</span>
          <span className="menu-error-text">{errorMessage}</span>
        </div>
      )}

      <div className="menu-content">
        {menuSections.map((section, index) => (
          <div key={index} className="menu-section">
            <h3 className="section-title">{section.title}</h3>
            <ul className="menu-list">
              {section.items.map((item, itemIndex) => (
                <li 
                  key={itemIndex} 
                  className={`menu-item${item.path ? ' clickable' : ''}`}
                  onClick={() => handleMenuItemClick(item)}
                  style={{ cursor: item.path ? 'pointer' : 'default' }}
                >
                  <span className="menu-arrow">»</span>
                  <span className="menu-label">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
