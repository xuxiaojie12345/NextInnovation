import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

// 菜单项定义
interface MenuItem {
  code: string;
  label: string;
  path: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

// 全菜单定义（用于权限过滤）
const ALL_MENU_CATEGORIES: MenuCategory[] = [
  {
    title: "Generate",
    items: [
      { code: "generate_doc", label: "Generate Doc", path: "/generate-document" },
    ],
  },
  {
    title: "Admin",
    items: [
      { code: "admin_update_variables", label: "Update user defined variables (rules)", path: "/admin/update-variables" },
      { code: "admin_existing_variables", label: "Existing HDoc variables", path: "/admin/existing-variables" },
      { code: "admin_upload_template", label: "Upload/Delete template", path: "/admin/upload-template" },
      { code: "admin_list_templates", label: "List available templates", path: "/admin/list-templates" },
      { code: "admin_vpps_vin_plate", label: "VPPS Vin plate", path: "/admin/vpps-vin-plate" },
      { code: "admin_ad_ca_change", label: "AD/CA Change", path: "/admin/ad-ca-change" },
    ],
  },
  {
    title: "User Administration",
    items: [
      { code: "user_admin_hdoc_user", label: "HDoc User Administration", path: "/user-admin/hdoc-user" },
      { code: "user_admin_hdoc_user_doc", label: "HDoc User Doc Administration", path: "/user-admin/hdoc-user-doc" },
      { code: "user_admin_search_user", label: "Search User", path: "/user-admin/search-user" },
    ],
  },
  {
    title: "Documentation",
    items: [
      { code: "documentation_user_guide", label: "User Guide", path: "/documentation/user-guide" },
    ],
  },
];

// 权限代码 → 菜单项查找表
const PERMISSION_MAP = new Map<string, { categoryTitle: string; itemCode: string }>();
ALL_MENU_CATEGORIES.forEach((category) => {
  category.items.forEach((item) => {
    PERMISSION_MAP.set(item.code, { categoryTitle: category.title, itemCode: item.code });
  });
});

const Menu: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [userID, setUserID] = useState<string>("");
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // 初始化：获取用户ID和权限
  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      // 未登录，跳转到登录页
      navigate("/login");
      return;
    }
    setUserID(storedUserID);
    fetchPermissions(storedUserID);
  }, [navigate]);

  // 调用获取权限API
  const fetchPermissions = async (userId: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/menu/getpermissions?userId=${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && data.data && data.data.permissions) {
        // 根据权限列表过滤菜单
        const allowedCodes = new Set<string>(data.data.permissions);
        const filtered = ALL_MENU_CATEGORIES
          .map((category) => ({
            ...category,
            items: category.items.filter((item) => allowedCodes.has(item.code)),
          }))
          .filter((category) => category.items.length > 0);

        if (filtered.length === 0) {
          // 没有任何权限
          setErrorMessage(`YOU (${userId}) ARE NOT AUTHORIZED TO ACCESS THIS PAGE`);
          setMenuCategories([]);
        } else {
          setMenuCategories(filtered);
        }
      } else {
        // API返回失败
        if (response.status === 401 || response.status === 403) {
          setErrorMessage(`YOU (${userId}) ARE NOT AUTHORIZED TO ACCESS THIS PAGE`);
        } else {
          setErrorMessage("System error. Please contact administrator.");
        }
        setMenuCategories([]);
      }
    } catch (error) {
      // 网络错误
      setErrorMessage("Network error or server unavailable. Please try again later.");
      setMenuCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换分类折叠/展开
  const toggleCategory = (title: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  // 处理菜单点击导航
  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  return (
    <div className="menu-page">
      {/* 顶部导航栏 */}
      <header className="menu-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">
            Welcome, {userID || "---"}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* 主内容区域：侧边栏 + 主体 */}
      <div className="menu-body">
        {/* 左侧边栏 */}
        <aside className="menu-sidebar">
          <h2 className="menu-panel-title">Generate Document</h2>

          {/* 加载中 */}
          {isLoading && (
            <div className="menu-loading">Loading...</div>
          )}

          {/* 错误消息 */}
          {!isLoading && errorMessage && (
            <div className="menu-error">{errorMessage}</div>
          )}

          {/* 菜单列表 */}
          {!isLoading && !errorMessage && menuCategories.length > 0 && (
            <nav className="menu-nav">
              {menuCategories.map((category) => (
                <div key={category.title} className="menu-category">
                  <div
                    className="menu-category-header"
                    onClick={() => toggleCategory(category.title)}
                  >
                    <span className="menu-category-arrow">
                      {collapsedCategories.has(category.title) ? "▸" : "▾"}
                    </span>
                    <span className="menu-category-title">{category.title}</span>
                  </div>
                  {!collapsedCategories.has(category.title) && (
                    <ul className="menu-items">
                      {category.items.map((item) => (
                        <li
                          key={item.code}
                          className="menu-item"
                          onClick={() => handleMenuClick(item.path)}
                        >
                          <span className="menu-item-icon">»</span>
                          <span className="menu-item-label">{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </nav>
          )}
        </aside>

        {/* 右侧主体区域 */}
        <main className="menu-main">
          <div className="menu-main-placeholder">
            <h3 className="menu-main-title">HDoc System</h3>
            <p className="menu-main-desc">
              请从左侧菜单中选择要使用的功能。
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Menu;
