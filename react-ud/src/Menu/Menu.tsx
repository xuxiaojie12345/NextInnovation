import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "./Menu.css";

interface MenuItem {
  label: string;
  path?: string;
}

interface MenuCategory {
  groupHeader: string;
  linkList: MenuItem[];
}

const MENU_CATEGORIES: MenuCategory[] = [
  {
    groupHeader: "Generate",
    linkList: [
      { label: "Generate Doc", path: "/menu/generate-doc" },
      { label: "Generate in Batch" },
      { label: "Regdata Archive" },
      { label: "Regdata Batch" },
    ],
  },
  {
    groupHeader: "Admin",
    linkList: [
      {
        label: "Update user defined variables (rules)",
        path: "/menu/homologation-variables",
      },
      { label: "Update user defined variables (UNICODE rules)" },
      { label: "Existing HDoc variables", path: "/menu/existing-hdoc-vars" },
      { label: "Unlock Document" },
      { label: "HDoc Number Series" },
      { label: "Upload/Delete template", path: "/menu/upload-delete-template" },
      { label: "List available templates", path: "/menu/list-templates" },
      { label: "VPPS Vin plate", path: "/menu/vin-plate" },
      { label: "AD/CA Change", path: "/menu/ad-ca-change" },
    ],
  },
  {
    groupHeader: "User Administration",
    linkList: [
      { label: "HDoc User Administration", path: "/menu/hdoc-user-admin" },
      {
        label: "HDoc User Doc Administration",
        path: "/menu/hdoc-user-doc-admin",
      },
      { label: "Search User", path: "/menu/search-user" },
      { label: "Change Password" },
      { label: "User Position" },
    ],
  },
  {
    groupHeader: "Archive",
    linkList: [{ label: "Search" }, { label: "Upload Document" }],
  },
  {
    groupHeader: "Documentation",
    linkList: [
      { label: "User Guide", path: "/menu/guide-user" },
      { label: "AD/CA Change Guide" },
      { label: "Vin plate Guide FM/FH" },
      { label: "Archive Guide" },
      { label: "Privacy" },
    ],
  },
];

const Menu: React.FC = () => {
  const navigate = useNavigate();

  // 获取当前用户名
  const location = useLocation();
  const usernameVal = localStorage.getItem("username");
  const userIdVal = localStorage.getItem("userId");
  let username = "";
  if (usernameVal && usernameVal.trim()) {
    username = usernameVal;
  } else if (userIdVal && userIdVal.trim()) {
    username = userIdVal;
  } else {
    username = "User";
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    navigate("/login", { replace: true });
  };

  // link压下
  const handleLinkItemClick = (linkItem: MenuItem) => {
    if (linkItem.path) {
      navigate(linkItem.path);
    }
  };

  // 当前路径是否为菜单根路径（无子路由选中）
  const isRootMenu = location.pathname === "/menu";

  return (
    <div className="menu-root">
      <aside className="menu-sidebar">
        <div className="sidebar-header">
          <h2>Generate Document</h2>
        </div>

        {/* 菜单列表 */}
        <nav className="sidebar-nav">
          {MENU_CATEGORIES.map((menu) => (
            <div key={menu.groupHeader} className="menu-section">
              <div className="section-title">{menu.groupHeader}</div>
              {menu.linkList.map((linkItem) => (
                <div
                  key={linkItem.label}
                  className={`menu-item${location.pathname === linkItem.path ? " active" : ""}${!linkItem.path ? " disabled" : ""}`}
                  onClick={() => handleLinkItemClick(linkItem)}
                >
                  <span className="menu-arrow">»</span>
                  {linkItem.label}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* 初始主页面 */}
      <main className="menu-main">
        {isRootMenu ? (
          <>
            <h2
              style={{ marginTop: "40px", textAlign: "left", color: "#1c2771" }}
            >
              Welcome to the HDoc system. Please select an option from the menu
              on the left.
            </h2>
          </>
        ) : (
          <Outlet />
        )}
      </main>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-name">{username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Menu;
