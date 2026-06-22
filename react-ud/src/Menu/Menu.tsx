// src/components/NavigationMenu/NavigationMenu.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

const Menu: React.FC = () => {
  const navigate = useNavigate();

  // 定义菜单数据结构
  interface MenuItem {
    id: string;
    label: string;
    path?: string; // 如果 undefined，则不是 Link
    type: "link" | "group";
    children?: MenuItem[];
  }

  // 菜单配置数据
  const menuData: MenuItem[] = [
    {
      id: "generate",
      label: "Generate",
      type: "group",
      children: [
        {
          // ✅ 带有 Link
          id: "gen_doc",
          label: "Generate Doc",
          path: "/generate-homologation-document",
          type: "link",
        },
        {
          // 无 Link
          id: "gen_batch",
          label: "Generate in Batch",
          type: "link",
        },
        {
          // 无 Link
          id: "reg_archive",
          label: "Regdata Archive",
          type: "link",
        },
        {
          // 无 Link
          id: "reg_batch",
          label: "Regdata Batch",
          type: "link",
        },
      ],
    },
    {
      id: "admin",
      label: "Admin",
      type: "group",
      children: [
        {
          // ✅ 带有 Link
          id: "admin_rules",
          label: "Update user defined variables (rules)",
          path: "/homologation-variables",
          type: "link",
        },
        {
          // 无 Link
          id: "admin_unicode",
          label: "Update user defined variables (UNICODE rules)",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "admin_existing",
          label: "Existing HDoc variables",
          path: "/hdoc-variables",
          type: "link",
        },
        {
          // 无 Link
          id: "admin_unlock",
          label: "Unlock Document",
          type: "link",
        },
        {
          // 无 Link
          id: "admin_series",
          label: "HDoc Number Series",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "admin_templates",
          label: "Upload/Delete template",
          path: "/upload-delete-template",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "admin_list_templates",
          label: "List available templates",
          path: "/list-available-templates",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "admin_pps_vin",
          label: "PPS Vin plate",
          path: "/vin-plate",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "admin_ad_ca",
          label: "AD/CA Change",
          path: "ad-change",
          type: "link",
        },
      ],
    },
    {
      id: "user_admin",
      label: "User Administration",
      type: "group",
      children: [
        {
          // ✅ 带有 Link
          id: "user_hdoc_admin",
          label: "HDoc User Administration",
          path: "/hdoc-user-administration",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "user_doc_admin",
          label: "HDoc User Doc Administration",
          path: "/hdoc-user-doc-administration",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "user_search",
          label: "Search User",
          path: "/search-user",
          type: "link",
        },
        {
          // ✅ 带有 Link
          id: "user_password",
          label: "Change Password",
          path: "/user/password",
          type: "link",
        },
        {
          // 无 Link
          id: "user_position",
          label: "User Position",
          type: "link",
        },
      ],
    },
    {
      id: "archive",
      label: "Archive",
      type: "group",
      children: [
        {
          // 无 Link
          id: "archive_search",
          label: "Search",
          type: "link",
        },
        {
          // 无 Link
          id: "archive_upload",
          label: "Upload Document",
          type: "link",
        },
      ],
    },
    {
      id: "documentation",
      label: "Documentation",
      type: "group",
      children: [
        {
          // ✅ 带有 Link
          id: "doc_user_guide",
          label: "User Guide",
          path: "/docs/user-guide",
          type: "link",
        },
        {
          // 无 Link
          id: "doc_ad_ca_guide",
          label: "AD/CA Change Guide",
          type: "link",
        },
        {
          // 无 Link
          id: "doc_vin_plate",
          label: "Vin plate Guide FM/FH",
          type: "link",
        },
        {
          // 无 Link
          id: "doc_archive_guide",
          label: "Archive Guide",
          type: "link",
        },
        {
          // 无 Link
          id: "doc_privacy",
          label: "Privacy",
          type: "link",
        },
      ],
    },
  ];

  // 处理点击事件
  const handleItemClick = (path: string | undefined) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className='navigation-menu'>
      {/* 标题区域 */}
      <div className='menu-header'>
        <h1>Generate Document</h1>
      </div>

      {/* 菜单项列表 */}
      <ul className='menu-list'>
        {menuData.map((module) => (
          <li key={module.id} className='menu-group'>
            <div className='group-title'>{module.label}</div>
            <ul className='submenu-list'>
              {module.children?.map((item) => {
                const isLink = !!item.path;
                return (
                  <li
                    key={item.id}
                    className={`menu-item ${isLink ? "clickable" : "disabled"}`}
                    onClick={() => handleItemClick(item.path)}
                  >
                    <span className='arrow-icon'>{isLink ? "»" : "-"}</span>
                    <span className='item-label'>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Menu;
