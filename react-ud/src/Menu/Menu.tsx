/**
 * Menu组件 - 系统主菜单页面
 * 
 * @description 提供各个功能模块的入口链接，用户通过点击不同的链接，
 *              可以迁移到对应的功能画面，实现系统的各项业务功能。
 *              严格按照詳細設計UD02.md中定义的画面项目（项番1-16）实现。
 * 
 * @features
 * - 所有功能链接清晰分类展示（Generate、Admin、User Administration、Documentation）
 * - 链接采用常表示方式，用户可随时访问
 * - 统一的左对齐布局，保持界面整洁
 * - 快速导航到各个功能模块，减少操作步骤
 * - 仅已认证用户可以访问此页面
 * - 各功能链接的访问权限需在后端进行验证
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 防止未授权用户直接访问受限功能
 */

import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './Menu.css';

/**
 * 菜单项配置接口定义
 */
interface MenuItem {
  label: string;
  route?: string;
  screenId?: number;
}

/**
 * 菜单分组接口定义
 */
interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * Menu组件
 * 
 * @returns JSX.Element 渲染的菜单页面
 */
const Menu: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 菜单数据配置
   * 严格按照詳細設計UD02.md中定义的画面项目（项番1-16）
   * 布局样式参照menu.png图片（左侧显示、分组标题等）
   * 
   * 项番1: Generate Document (Label - 分组标题)
   * 项番2: Generate (Label - 子分组标题)
   * 项番3: >>Generate Doc (Link - Screen ID: 03)
   * 项番4: Admin (Label - 分组标题)
   * 项番5: >>Update user defined variables (rules) (Link - Screen ID: 08)
   * 项番6: >>Existing HDoc variables (Link - Screen ID: 10)
   * 项番7: >>Upload/Delete template (Link - Screen ID: 12)
   * 项番8: >>List available templates (Link - Screen ID: 14)
   * 项番9: >>VPPS Vin plate (Link - Screen ID: 15)
   * 项番10: >>AD/CA Change (Link - Screen ID: 16)
   * 项番11: User Administration (Label - 分组标题)
   * 项番12: >>HDoc User Administration (Link - Screen ID: 17)
   * 项番13: >>HDoc User Doc Administration (Link - Screen ID: 18)
   * 项番14: >>Search User (Link - Screen ID: 19)
   * 项番15: Documentation (Label - 分组标题)
   * 项番16: >>User Guide (Link - Screen ID: 24)
   */
  const menuSections: MenuSection[] = [
    {
      title: 'Generate',
      items: [
        { label: 'Generate Doc', route: 'generate-document', screenId: 3 }
      ]
    },
    {
      title: 'Admin',
      items: [
        { label: 'Update user defined variables (rules)', route: 'update-user-defined-variables-rules', screenId: 8 },
        { label: 'Existing HDoc variables', route: 'existing-hdoc-variables', screenId: 10 },
        { label: 'Upload/Delete template', route: 'upload-delete-template', screenId: 12 },
        { label: 'List available templates', route: 'list-available-templates', screenId: 14 },
        { label: 'VPPS Vin plate', route: 'vin-plate', screenId: 15 },
        { label: 'AD/CA Change', route: 'ad-ca-change', screenId: 16 }
      ]
    },
    {
      title: 'User Administration',
      items: [
        { label: 'HDoc User Administration', route: 'hdoc-user-admin', screenId: 17 },
        { label: 'HDoc User Doc Administration', route: 'hdoc-user-doc-admin', screenId: 18 },
        { label: 'Search User', route: 'search-user', screenId: 19 }
      ]
    },
    {
      title: 'Documentation',
      items: [
        { label: 'User Guide', route: 'user-guide', screenId: 24 }
      ]
    }
  ];

  /**
   * 处理菜单项点击事件
   * 
   * @param item - 被点击的菜单项
   * @description 点击菜单项时在右侧区域显示对应画面内容预览
   *              该页面内保持菜单和右侧内容区并存，不进行整体页面跳转
   */
  const handleMenuItemClick = (item: MenuItem): void => {
    if (item.route) {
      navigate(`/Menu/${item.route}`);
    }
  };

  return (
    <div className="menu-container">
      <main className="menu-main">
        <aside className="menu-sidebar">
          {/* 项番1: Generate Document (分组标题) */}
          <h1 className="menu-main-title">Generate Document</h1>

          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="menu-section">
              <h2 className="menu-section-title">{section.title}</h2>
              <ul className="menu-list">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="menu-item">
                    <button
                      type="button"
                      className="menu-link"
                      onClick={() => handleMenuItemClick(item)}
                    >
                      » {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        <section className="menu-right-panel">
          <div className="menu-right-panel-body">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Menu;
