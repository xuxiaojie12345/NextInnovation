import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Menu.css";

// 定义菜单项的类型
interface MenuItem {
  id: string;
  label: string;
  to: string;
  children?: MenuItem[];
}

// 预定义的菜单结构
const menuItems: MenuItem[] = [
  {
    id: "generate",
    label: "Generate Document",
    to: "#",
    children: [
      { id: "generate-doc", label: ">>  Generate Doc", to: "/menu/HDoc" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    to: "#",
    children: [
      {
        id: "update-vars-rules",
        label: ">>  Update user defined variables (rules)",
        to: "/menu/homologation-variables",
      },
      {
        id: "existing-hdoc-vars",
        label: ">>  Existing HDoc variables",
        to: "/admin/existing-hdoc-vars",
      },
      {
        id: "unlock-doc",
        label: ">>  Unlock Document",
        to: "/admin/unlock-doc",
      },
      {
        id: "upload-delete-template",
        label: ">>  Upload/Delete template",
        to: "/admin/upload-delete-template",
      },
      {
        id: "list-available-templates",
        label: ">>  List available templates",
        to: "/admin/list-available-templates",
      },
      {
        id: "vpps-vin-plate",
        label: ">>  VPPS Vin plate",
        to: "/admin/vpps-vin-plate",
      },
      {
        id: "ad-ca-change",
        label: ">>  AD/CA Change",
        to: "/admin/ad-ca-change",
      },
    ],
  },
  {
    id: "user-admin",
    label: "User Administration",
    to: "#",
    children: [
      {
        id: "hdoc-user-admin",
        label: ">>  HDoc User Administration",
        to: "/user-admin/hdoc-user-admin",
      },
      {
        id: "hdoc-user-doc-admin",
        label: ">>  HDoc User Doc Administration",
        to: "/user-admin/hdoc-user-doc-admin",
      },
      {
        id: "search-user",
        label: ">>   Search User",
        to: "/user-admin/search-user",
      },
    ],
  },
  {
    id: "documentation",
    label: "Documentation",
    to: "#",
    children: [
      {
        id: "user-guide",
        label: ">>  User Guide",
        to: "/documentation/user-guide",
      },
    ],
  },
];

const Menu: React.FC = () => {
  const location = useLocation();

  // 判断当前路由是否匹配某个菜单项
  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="menu-group">
        {/* 父级菜单标题 (仅作为标签，不可点击或点击无折叠效果) */}
        <div className="menu-parent-label">{item.label}</div>

        {/* 子菜单列表 - 始终显示 */}
        {hasChildren && (
          <div className="submenu-list">
            {item.children?.map((child) => (
              <Link
                key={child.id}
                to={child.to}
                className={`submenu-link ${isActive(child.to) ? "active" : ""}`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}

        {/* 如果没有子项（例如 Generate Doc 直接链接的情况，可根据实际需求调整） */}
        {!hasChildren && (
          <Link
            to={item.to}
            className={`submenu-link ${isActive(item.to) ? "active" : ""}`}
          >
            {item.label}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="menu-container">
      <div className="menu-content">
        {menuItems.map((item) => renderMenuItem(item))}
      </div>
    </div>
  );
};

export default Menu;
