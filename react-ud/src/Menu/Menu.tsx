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

// 菜单配置：按类别分组
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

  // 登出：清除所有存储后跳转登录页
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  // 菜单点击：有路径则跳转，否则忽略
  const handleLinkItemClick = (linkItem: MenuItem) => {
    if (linkItem.path) {
      navigate(linkItem.path);
    }
  };

  const isRootMenu = location.pathname === "/menu";

  return (
    <div className="menu-root">
      <div className="menu-topbar">
        <div className="topbar-title">Generate Document</div>
      </div>
      <aside className="menu-sidebar print-hide-sidebar">
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

      <div className="sidebar-footer print-hide-sidebar">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-name">{username}</span>
        </div>
        <div className="footer-actions">
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Menu;
