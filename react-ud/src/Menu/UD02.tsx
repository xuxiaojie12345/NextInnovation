import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UD02.css";

// ===== 类型定义 =====

/** 用户信息 */
interface User {
  userId: string;
  name: string;
  token: string;
}

/** 菜单项 */
interface MenuItem {
  label: string;
  path: string;
}

/** 菜单组 */
interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

// ===== 辅助函数 =====

/**
 * 从 localStorage 读取当前登录用户信息
 * @returns User | null
 */
const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem("user_info");
    if (!userStr) return null;

    const userInfo = JSON.parse(userStr);
    const token = localStorage.getItem("auth_token");
    return {
      userId: userInfo.userId || "",
      name: userInfo.name || "",
      token: token || "",
    };
  } catch {
    // 解析失败时返回 null，触发重定向至登录页
    return null;
  }
};

// ===== 菜单配置（严格按画面参数定义） =====

const MENU_STRUCTURE: MenuGroup[] = [
  {
    id: "generate",
    title: "Generate",
    items: [{ label: "Generate Doc", path: "/UD03" }],
  },
  {
    id: "admin",
    title: "Admin",
    items: [
      {
        label: "Update user defined variables (rules)",
        path: "/UD08",
      },
      { label: "Existing HDoc variables", path: "/UD10" },
      { label: "Upload/Delete template", path: "/UD12" },
      { label: "Template Check", path: "/UD13" },
      { label: "List Templates", path: "/UD14" },
      { label: "VPPS Vin plate", path: "/UD15" },
      { label: "AD/CA Change", path: "/UD16" },
    ],
  },
  {
    id: "user-administration",
    title: "User Administration",
    items: [
      { label: "HDoc User Administration", path: "/UD17" },
      { label: "HDoc User Doc Administration", path: "/UD18" },
      { label: "Search User", path: "/UD19" },
    ],
  },
  {
    id: "documentation",
    title: "Documentation",
    items: [{ label: "User Guide", path: "/UD24" }],
  },
];

// ===== 主菜单组件 =====

const UD02 = React.memo(() => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 3.1 处理流程 - Page Mount: 会话校验
  useEffect(() => {
    const currentUser = getCurrentUser();

    // 校验详细规格表 No.1: Session Check
    if (!currentUser || !currentUser.token) {
      // 会话过期或无用户，重定向至登录页
      navigate("/UD01", { replace: true });
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [navigate]);

  // 处理菜单项点击 - 路由跳转
  const handleLinkClick = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="main-menu-container">
        <div className="loading-message">加载中...</div>
      </div>
    );
  }

  return (
    <div className="main-menu-container">
      {/* HeaderLogo: 白色字体，蓝色背景底板 */}
      <header className="header">
        <div className="header-logo">VOLVO</div>
      </header>

      {/* 菜单区域：浅灰色背景，靠左对齐 */}
      <nav className="menu-nav">
        {MENU_STRUCTURE.map((group) => (
          <div key={group.id} className="menu-group">
            {/* 模块标题（Label）：常显，不可点击 */}
            <h2 className="group-title">{group.title}</h2>

            {/* 子菜单项列表 */}
            {group.items.length > 0 && (
              <ul className="menu-list">
                {group.items.map((item, index) => (
                  <li key={index} className="menu-item">
                    <span
                      className="menu-link"
                      onClick={() => handleLinkClick(item.path)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleLinkClick(item.path);
                        }
                      }}
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* 用户信息显示 */}
        {user && (
          <div className="user-info">
            <span>Logged in as: {user.name}</span>
          </div>
        )}
      </nav>
    </div>
  );
});

export default UD02;
