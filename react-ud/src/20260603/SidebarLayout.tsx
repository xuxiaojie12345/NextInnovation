import React from "react";
import { Outlet } from "react-router-dom";
import UD02 from "./02/UD02";
import "./SidebarLayout.css";

/**
 * 全局侧边栏布局
 * UD02（菜单）固定在左侧，子路由内容显示在右侧
 */
const SidebarLayout: React.FC = () => {
  return (
    <div className="sidebar-layout">
      <aside className="sidebar">
        <UD02 />
      </aside>
      <main className="sidebar-content">
        <Outlet />
      </main>
    </div>
  );
};

export default SidebarLayout;
