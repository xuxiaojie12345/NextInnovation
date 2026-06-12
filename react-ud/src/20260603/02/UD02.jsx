import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UD02.css";

// 模拟获取当前用户和权限的工具函数 (实际项目中应从 Context 或 Auth Service 获取)
const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
};

const UD02 = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 3.1 处理流程 - Page Mount 检查
  useEffect(() => {
    const currentUser = getCurrentUser();

    // 校验详细规格表 No.1: Session Check
    if (
      !currentUser ||
      !currentUser.token ||
      isTokenExpired(currentUser.token)
    ) {
      // 会话过期或无用户，重定向至登录页
      navigate("/login", { replace: true });
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [navigate]);

  // 辅助函数：检查 Token 是否过期 (简化逻辑)
  const isTokenExpired = (token) => {
    // 实际项目中应解析 JWT 或调用后端验证
    return false;
  };

  // 处理点击事件
  const handleLinkClick = (path, requiredPermission) => {
    // 校验详细规格表 No.2: Permission Check
    if (
      requiredPermission &&
      !user?.permissions?.includes(requiredPermission)
    ) {
      console.warn("Access Denied");
      // 可选：显示 Toast 提示 'Access Denied'
      return;
    }
    navigate(path);
  };

  if (isLoading) {
    return <div className="main-menu-container">Loading...</div>;
  }

  // 菜单配置数据 (对应 Screen Parameters 中的控件)
  // 结构：{ title: GroupName, items: [{ label, path, permission }] }
  const menuStructure = [
    {
      id: "group1",
      title: "Generate Document",
      items: [
        { label: "Generate Doc", path: "/generate/doc", permission: "GEN_DOC" },
        {
          label: "Generate Batch",
          path: "/generate/batch",
          permission: "GEN_BATCH",
        },
        {
          label: "Register Archive",
          path: "/archive/register",
          permission: "REG_ARCH",
        },
        {
          label: "Register Batch",
          path: "/archive/register-batch",
          permission: "REG_BATCH",
        },
      ],
    },
    {
      id: "group2",
      title: "Admin", // 对应 MenuGroup_2 Admin
      items: [
        {
          label: "Update Rules",
          path: "/admin/rules",
          permission: "ADMIN_RULES",
        },
        {
          label: "Update Unicode",
          path: "/admin/unicode",
          permission: "ADMIN_UNICODE",
        },
        {
          label: "Existing Vars",
          path: "/admin/vars",
          permission: "ADMIN_VARS",
        },
        {
          label: "Unlock Doc",
          path: "/admin/unlock",
          permission: "ADMIN_UNLOCK",
        },
        {
          label: "H Doc Series",
          path: "/admin/h-series",
          permission: "ADMIN_H_SERIES",
        },
        {
          label: "Template Mgmt",
          path: "/admin/templates",
          permission: "ADMIN_TPL_MGMT",
        },
        {
          label: "List Templates",
          path: "/admin/list-templates",
          permission: "ADMIN_LIST_TPL",
        },
        {
          label: "VPPS Vin",
          path: "/admin/vpps-vin",
          permission: "ADMIN_VPPS",
        },
        {
          label: "ADCA Change",
          path: "/admin/adca-change",
          permission: "ADMIN_ADCA",
        },
      ],
    },
    {
      id: "group3",
      title: "User Administration",
      items: [
        { label: "User Admin", path: "/user/admin", permission: "USER_ADMIN" },
        {
          label: "User Doc Admin",
          path: "/user/doc-admin",
          permission: "USER_DOC_ADMIN",
        },
        {
          label: "Search User",
          path: "/user/search",
          permission: "USER_SEARCH",
        },
        {
          label: "Change Password",
          path: "/user/change-pwd",
          permission: "USER_CHG_PWD",
        },
        { label: "User Pos", path: "/user/pos", permission: "USER_POS" },
      ],
    },
    {
      id: "group4",
      title: "Archive",
      items: [
        {
          label: "Archive Search",
          path: "/archive/search",
          permission: "ARCH_SEARCH",
        },
        {
          label: "Upload Doc",
          path: "/archive/upload",
          permission: "ARCH_UPLOAD",
        },
      ],
    },
    {
      id: "group5",
      title: "Documentation",
      items: [
        { label: "User Guide", path: "/docs/user-guide", permission: null }, // 通常文档无需特殊权限
        { label: "ADCA Guide", path: "/docs/adca-guide", permission: null },
        {
          label: "Vin Plate Guide",
          path: "/docs/vin-plate-guide",
          permission: null,
        },
        {
          label: "Archive Guide",
          path: "/docs/archive-guide",
          permission: null,
        },
        { label: "Privacy Policy", path: "/docs/privacy", permission: null },
      ],
    },
  ];

  return (
    <div className="main-menu-container">
      {/* HeaderLogo */}
      <header className="header">
        <div className="header-logo">VOLVO</div>
      </header>

      <main className="content">
        {menuStructure.map((group) => (
          <div key={group.id} className="menu-group">
            {/* MenuGroup Title */}
            <h2 className="group-title">{group.title}</h2>

            <ul className="menu-list">
              {group.items.map((item, index) => {
                // 如果设置了权限且用户没有该权限，则不渲染 (动态显示控制)
                if (
                  item.permission &&
                  !user?.permissions?.includes(item.permission)
                ) {
                  return null;
                }

                return (
                  <li key={index} className="menu-item">
                    <span
                      className="menu-link"
                      onClick={() =>
                        handleLinkClick(item.path, item.permission)
                      }
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
};

export default UD02;
