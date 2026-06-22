import React from "react";
import { Outlet } from "react-router-dom";
import Menu from "./Menu";
import "./Menu.css";

/**
 * MenuLayout 布局组件
 * 左侧固定显示 Menu 导航栏，右侧显示子路由内容
 */
const MenuLayout: React.FC = () => {
  return (
    <div className="menu-layout">
      <Menu />
      <div className="menu-content-area">
        <Outlet />
      </div>
    </div>
  );
};

export default MenuLayout;
