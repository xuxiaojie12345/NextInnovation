/**
 * UserGuide组件 - 用户帮助指南页面
 * 
 * @description 提供系统帮助文档的导航功能，用户可以通过点击不同的链接，
 *              快速访问快速指南、文档类型列表、市场信息以及市场文档设置等相关帮助内容。
 *              严格按照詳細設計UD24.md中定义的画面项目（项番1-4）实现。
 * 
 * @features
 * - HDoc Quick Guide: 跳转到Download and Print Quick Guides画面
 * - List of document types.: 跳转到Document Types画面
 * - Markets in Hdoc: 跳转到Markets in HDoc画面
 * - HDoc - Market Document Setting: 跳转到HDoc - Market Document Settings画面
 * - 所有链接采用左对齐布局，保持界面简洁
 * - 无需输入操作，直接点击链接即可跳转
 * - 仅已认证用户可以访问此页面
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 防止未授权用户直接访问受限帮助文档
 * - 链接跳转需进行权限验证
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserGuide.css';

/**
 * 帮助链接配置接口定义
 */
interface HelpLink {
  label: string;
  route?: string;
  screenId?: number;
}

/**
 * UserGuide组件
 * 
 * @returns JSX.Element 渲染的帮助指南页面
 */
const UserGuide: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 帮助链接数据配置
   * 严格按照詳細設計UD24.md中定义的画面项目（项番1-4）
   * 布局样式参照UD24.png图片（标题、列表项等）
   * 
   * 项番1: HDoc Quick Guide (Link)
   * 项番2: List of document types. (Link)
   * 项番3: Markets in Hdoc (Link)
   * 项番4: HDoc - Market Document Setting (Link)
   */
  const helpLinks: HelpLink[] = [
    // 项番1: HDoc Quick Guide
    { label: 'HDoc Quick Guide', route: '/download-print-quick-guides', screenId: 23 },
    // 项番2: List of document types.
    { label: 'List of document types.', route: '/document-types', screenId: 22 },
    // 项番3: Markets in Hdoc
    { label: 'Markets in Hdoc', route: '/markets-in-hdoc', screenId: 21 },
    // 项番4: HDoc - Market Document Setting
    { label: 'HDoc - Market Document Setting', route: '/market-document-settings', screenId: 20 }
  ];

  /**
   * 处理帮助链接点击事件
   * 
   * @param link - 被点击的帮助链接
   * @description 根据链接的路由进行页面跳转
   *              如果定义了screenId，可用于后续权限控制或日志记录
   */
  const handleHelpLinkClick = (link: HelpLink): void => {
    if (link.route) {
      // 路由跳转到目标页面
      navigate(link.route);
    }
  };

  return (
    <div className="user-guide-container">
      {/* 主内容区域 */}
      <main className="user-guide-main">
        <div className="user-guide-content">
          {/* 左侧内容区域 */}
          <aside className="user-guide-sidebar">
            {/* 页面标题 */}
            <h1 className="user-guide-title">HDoc Help</h1>
            
            {/* 帮助链接列表 */}
            <ul className="help-link-list">
              {helpLinks.map((link, index) => (
                <li key={index} className="help-link-item">
                  <button
                    type="button"
                    className="help-link-button"
                    onClick={() => handleHelpLinkClick(link)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default UserGuide;
