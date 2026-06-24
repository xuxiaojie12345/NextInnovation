import React from 'react';
import { Outlet } from 'react-router-dom';
import Menu from './Menu/Menu';
import './AppLayout.css';

/**
 * AppLayout 应用布局组件
 * 
 * 功能说明：
 * - 左侧显示固定菜单（Menu）
 * - 右侧显示路由匹配的子页面内容
 * - 保持菜单位置和大小不变
 * 
 * @component
 * @returns {JSX.Element} 应用布局元素
 */
const AppLayout: React.FC = () => {
  return (
    <div className='app-layout'>
      {/* 左侧菜单区域 - 固定宽度和位置 */}
      <div className='menu-sidebar'>
        <Menu />
      </div>

      {/* 右侧内容区域 - 显示路由匹配的页面 */}
      <div className='content-area'>
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
