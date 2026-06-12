import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UD02.css";

// 类型定义
interface User {
  userId: string;
  name: string;
  token: string;
}

interface MenuItem {
  label: string;
  path: string;
}

interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}

const getCurrentUser = (): User | null => {
  console.log("=== UD02: 开始读取用户信息 ===");

  const userStr = localStorage.getItem("user_info");
  console.log("从 localStorage 读取的 user_info:", userStr);

  if (!userStr) {
    console.error("错误：localStorage 中没有 user_info");
    return null;
  }

  try {
    const userInfo = JSON.parse(userStr);
    console.log("解析后的 userInfo 对象:", userInfo);

    const token = localStorage.getItem("auth_token");
    console.log("从 localStorage 读取的 auth_token:", token);

    const user: User = {
      userId: userInfo.userId || "",
      name: userInfo.name || "",
      token: token || "",
    };

    console.log("最终返回的 user 对象:", user);
    return user;
  } catch (error) {
    console.error("解析用户信息失败:", error);
    return null;
  }
};

const UD02: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 3.1 处理流程 - Page Mount 检查
  useEffect(() => {
    const currentUser = getCurrentUser();

    console.log(
      "-1-----------------------" + currentUser + "------------------------",
    );
    // console.log("-2-----------------------"+ currentUser.token+ "------------------------");
    console.log(
      "-3-----------------------" + currentUser + "------------------------",
    );
    // 校验详细规格表 No.1: Session Check
    if (
      !currentUser ||
      !currentUser.token ||
      isTokenExpired(currentUser.token)
    ) {
      // 会话过期或无用户，重定向至登录页
      navigate("/UD01", { replace: true });
      return;
    }

    setUser(currentUser);
    setIsLoading(false);
  }, [navigate]);

  // 辅助函数：检查 Token 是否过期 (简化逻辑)
  const isTokenExpired = (token: string): boolean => {
    // 实际项目中应解析 JWT 或调用后端验证
    return false;
  };

  // 处理菜单项点击 - 直接路由跳转
  const handleLinkClick = (path: string) => {
    navigate(path);
  };

  if (isLoading) {
    return <div className="main-menu-container">加载中...</div>;
  }

  // 菜单配置数据
  const menuStructure: MenuGroup[] = [
    {
      id: "group1",
      title: "Generate Document",
      items: [
        { label: "Generate Doc", path: "/generate/doc" },
        { label: "Generate Batch", path: "/generate/batch" },
        { label: "Register Archive", path: "/archive/register" },
        { label: "Register Batch", path: "/archive/register-batch" },
      ],
    },
    {
      id: "group2",
      title: "Admin",
      items: [
        { label: "Update Rules", path: "/admin/rules" },
        { label: "Update Unicode", path: "/admin/unicode" },
        { label: "Existing Vars", path: "/admin/vars" },
        { label: "Unlock Doc", path: "/admin/unlock" },
        { label: "H Doc Series", path: "/admin/h-series" },
        { label: "Template Mgmt", path: "/admin/templates" },
        { label: "List Templates", path: "/admin/list-templates" },
        { label: "VPPS Vin", path: "/admin/vpps-vin" },
        { label: "ADCA Change", path: "/admin/adca-change" },
      ],
    },
    {
      id: "group3",
      title: "User Administration",
      items: [
        { label: "User Admin", path: "/user/admin" },
        { label: "User Doc Admin", path: "/user/doc-admin" },
        { label: "Search User", path: "/user/search" },
        { label: "Change Password", path: "/user/change-pwd" },
        { label: "User Pos", path: "/user/pos" },
      ],
    },
    {
      id: "group4",
      title: "Archive",
      items: [
        { label: "Archive Search", path: "/archive/search" },
        { label: "Upload Doc", path: "/archive/upload" },
      ],
    },
    {
      id: "group5",
      title: "Documentation",
      items: [
        { label: "User Guide", path: "/docs/user-guide" },
        { label: "ADCA Guide", path: "/docs/adca-guide" },
        { label: "Vin Plate Guide", path: "/docs/vin-plate-guide" },
        { label: "Archive Guide", path: "/docs/archive-guide" },
        { label: "Privacy Policy", path: "/docs/privacy" },
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
          </div>
        ))}
      </main>
    </div>
  );
};

export default UD02;
