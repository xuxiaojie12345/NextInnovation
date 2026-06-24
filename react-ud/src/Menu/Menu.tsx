import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Layout, Menu as AntMenu, Typography } from "antd";
import {
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  FolderOpenOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import "./Menu.css";

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

// 菜单项类型定义
interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  children?: MenuItem[];
  route?: string;
}

// 菜单配置（对应详细设计2.2 画面布局说明）
const menuItems: MenuItem[] = [
  {
    key: "Generate",
    label: "Generate",
    icon: <FileTextOutlined />,
    children: [
      { key: "GenerateDoc", label: "Generate Doc", route: "/Menu/GenerateHomologationDocument" },
      { key: "GenerateBatch", label: "Generate in Batch", route: "/Menu/GenerateInBatch" },
      { key: "RegdataArchive", label: "Regdata Archive", route: "/Menu/RegdataArchive" },
      { key: "RegdataBatch", label: "Regdata Batch", route: "/Menu/RegdataBatch" },
    ],
  },
  {
    key: "Admin",
    label: "Admin",
    icon: <SettingOutlined />,
    children: [
      { key: "UpdateRules", label: "Update user defined variables (rules)", route: "/Menu/HomologationVariables" },
      { key: "UpdateUnicodeRules", label: "Update user defined variables (UNICODE rules)", route: "/Menu/HomologationVariables" },
      { key: "ExistingVariables", label: "Existing HDoc variables", route: "/Menu/ExistingHDocVariables" },
      { key: "UnlockDocument", label: "Unlock Document", route: "/Menu/UnlockDocument" },
      { key: "HDocNumberSeries", label: "HDoc Number Series", route: "/Menu/HDocNumberSeries" },
      { key: "UploadDeleteTemplate", label: "Upload/Delete template", route: "/Menu/UploadDeleteTemplate" },
      { key: "ListTemplates", label: "List available templates", route: "/Menu/ListTemplates" },
      { key: "VPPSVinPlate", label: "VPPS Vin plate", route: "/Menu/VinPlate" },
      { key: "ADCAChange", label: "AD/CA Change", route: "/Menu/ADCAChange" },
    ],
  },
  {
    key: "UserAdmin",
    label: "User Administration",
    icon: <UserOutlined />,
    children: [
      { key: "HDocUserAdmin", label: "HDoc User Administration", route: "/Menu/HDocUserAdministration" },
      { key: "HDocUserDocAdmin", label: "HDoc User Doc Administration", route: "/Menu/HDocUserDocAdministration" },
      { key: "SearchUser", label: "Search User", route: "/Menu/SearchUser" },
      { key: "ChangePassword", label: "Change Password", route: "/Menu/ChangePassword" },
      { key: "UserPosition", label: "User Position", route: "/Menu/UserPosition" },
    ],
  },
  {
    key: "Archive",
    label: "Archive",
    icon: <FolderOpenOutlined />,
    children: [
      { key: "ArchiveSearch", label: "Search", route: "/Menu/ArchiveSearch" },
      { key: "UploadDocument", label: "Upload Document", route: "/Menu/UploadDocument" },
    ],
  },
  {
    key: "Documentation",
    label: "Documentation",
    icon: <BookOutlined />,
    children: [
      { key: "UserGuide", label: "User Guide", route: "/Menu/UserGuide" },
      { key: "ADCAChangeGuide", label: "AD/CA Change Guide", route: "/Menu/ADCAChangeGuide" },
      { key: "VinPlateGuide", label: "Vin plate Guide FM/FH", route: "/Menu/VinPlateGuide" },
      { key: "ArchiveGuide", label: "Archive Guide", route: "/Menu/ArchiveGuide" },
      { key: "Privacy", label: "Privacy", route: "/Menu/Privacy" },
    ],
  },
];

// 获取用户权限列表（从 localStorage 中读取）
const getUserPermissions = (): string[] => {
  try {
    const userInfoStr = localStorage.getItem("userInfo");
    if (!userInfoStr) {
      return [];
    }
    const userInfo = JSON.parse(userInfoStr);
    // 权限列表存储在 userInfo.permissions 中，若没有则赋予所有权限（开发阶段）
    return userInfo.permissions || [
      "GenerateDoc", "GenerateBatch", "RegdataArchive", "RegdataBatch",
      "UpdateRules", "UpdateUnicodeRules", "ExistingVariables", "UnlockDocument",
      "HDocNumberSeries", "UploadDeleteTemplate", "ListTemplates", "VPPSVinPlate", "ADCAChange",
      "HDocTemplateCheck",
      "HDocUserAdmin", "HDocUserDocAdmin", "SearchUser", "ChangePassword", "UserPosition",
      "ArchiveSearch", "UploadDocument",
      "UserGuide", "ADCAChangeGuide", "VinPlateGuide", "ArchiveGuide", "Privacy",
    ];
  } catch {
    return [];
  }
};

// 根据权限过滤菜单项
const filterMenuByPermissions = (items: MenuItem[], permissions: string[]): MenuItem[] => {
  return items
    .map((item) => {
      if (item.children) {
        const filteredChildren = item.children.filter((child) =>
          permissions.includes(child.key)
        );
        return filteredChildren.length > 0
          ? { ...item, children: filteredChildren }
          : null;
      }
      return permissions.includes(item.key) ? item : null;
    })
    .filter((item): item is MenuItem => item !== null);
};

// 将菜单配置转换为 Ant Design Menu 的 items 格式
const convertToAntMenuItems = (items: MenuItem[]): any[] => {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children
      ? convertToAntMenuItems(item.children)
      : undefined,
  }));
};

// 构建 key -> route 的映射
const buildRouteMap = (items: MenuItem[]): Record<string, string> => {
  const map: Record<string, string> = {};
  const traverse = (list: MenuItem[]) => {
    list.forEach((item) => {
      if (item.route) {
        map[item.key] = item.route;
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  };
  traverse(items);
  return map;
};

// 获取所有叶子节点的 key
const getLeafKeys = (items: MenuItem[]): string[] => {
  const keys: string[] = [];
  const traverse = (list: MenuItem[]) => {
    list.forEach((item) => {
      if (item.children) {
        traverse(item.children);
      } else {
        keys.push(item.key);
      }
    });
  };
  traverse(items);
  return keys;
};

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  useEffect(() => {
    // 检查用户是否登录（对应详细设计3.2 校验详细规格表 No.1）
    const userInfoStr = localStorage.getItem("userInfo");
    if (!userInfoStr) {
      navigate("/");
      return;
    }
    try {
      const userInfo = JSON.parse(userInfoStr);
      setCurrentUser(userInfo.username || userInfo.userid || "");
    } catch {
      navigate("/");
      return;
    }

    // 获取权限并过滤菜单
    const permissions = getUserPermissions();
    const filtered = filterMenuByPermissions(menuItems, permissions);
    setFilteredMenuItems(filtered);

    // 初始化默认展开的一级菜单
    const defaultOpenKeys = filtered.map((item) => item.key);
    setOpenKeys(defaultOpenKeys);
  }, [navigate]);

  // 根据当前路由高亮对应的菜单项
  useEffect(() => {
    const routeMap = buildRouteMap(menuItems);
    const currentPath = location.pathname;

    // 查找匹配当前路由的菜单项 key
    const findKeyByRoute = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.route && currentPath.startsWith(item.route)) {
          return item.key;
        }
        if (item.children) {
          const found = findKeyByRoute(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const matchedKey = findKeyByRoute(menuItems);
    if (matchedKey) {
      setSelectedKeys([matchedKey]);
    }
  }, [location.pathname]);

  // 菜单点击事件处理（对应详细设计3.1 处理流程-菜单点击处理）
  const handleMenuClick = (info: { key: string }) => {
    const routeMap = buildRouteMap(filteredMenuItems);
    const route = routeMap[info.key];

    if (route) {
      navigate(route);
    }
  };

  // 处理一级菜单展开/折叠
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  // 转换为 Ant Design Menu 数据格式
  const antMenuItems = convertToAntMenuItems(filteredMenuItems);

  // 获取所有叶子节点 key（用于高亮）
  const leafKeys = getLeafKeys(filteredMenuItems);

  return (
    <Layout className="menu-layout">
      {/* 左侧菜单区 */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={280}
        className="menu-sider"
        trigger={null}
      >
        {/* 系统标题 */}
        <div className="menu-header">
          {!collapsed && (
            <div className="menu-title">
              <Text strong style={{ color: "#fff", fontSize: 16 }}>
                EDB Engineering Database
              </Text>
              {currentUser && (
                <div className="menu-user-info">
                  <UserOutlined style={{ marginRight: 4 }} />
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                    {currentUser}
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 菜单树 */}
        <div className="menu-tree-container">
          <AntMenu
            mode="inline"
            theme="dark"
            selectedKeys={selectedKeys.filter((k) => leafKeys.includes(k))}
            openKeys={openKeys}
            onOpenChange={handleOpenChange}
            onClick={handleMenuClick}
            items={antMenuItems}
            className="menu-tree"
          />
        </div>

        {/* 折叠按钮 */}
        <div className="menu-footer">
          <div
            className="menu-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </div>
      </Sider>

      {/* 右侧内容区 */}
      <Layout className="menu-content-layout">
        <Header className="menu-content-header">
          <div className="header-left">
            <span
              className="header-collapse-trigger"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Text className="header-title">EDB Engineering Database</Text>
          </div>
          <div className="header-right">
            <Text
              className="header-logout"
              onClick={() => {
                localStorage.removeItem("userInfo");
                navigate("/");
              }}
            >
              Logout
            </Text>
          </div>
        </Header>
        <Content className="menu-content">
          {/* 使用 Outlet 动态加载子路由内容（对应详细设计2.2 右侧内容区） */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Menu;
