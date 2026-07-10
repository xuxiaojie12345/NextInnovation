import React from "react";
import { Outlet } from "react-router-dom";
import Menu from "../UD02Menu/UD02Menu";
import "./Layout.css";

const Layout: React.FC = () => {
  return (
    <div className='app-layout'>
      <aside className='app-layout-menu'>
        <Menu />
      </aside>
      <main className='app-layout-content'>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
