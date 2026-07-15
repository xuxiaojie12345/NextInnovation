// Menu 组件

// 对应功能模块

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Layout, Menu as AntMenu, Typography } from "antd";
import "./Menu.css";

const { Sider, Content } = Layout;
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
    key: "GenerateDucument",
    label: "Generate Ducument",
  },
  {
    key: "subGenerate",
    label: "Generate",
    children: [
      { key: "GenerateDoc", label: "Generate Doc", route: "/Menu/GenerateHomologationDocument" },
      { key: "GenerateBatch", label: "Generate in Batch", route: "#" },
      { key: "RegdataArchive", label: "Regdata Archive", route: "#" },
      { key: "RegdataBatch", label: "Regdata Batch", route: "#" },
    ],
  },
  {
    key: "subAdmin",
    label: "Admin",
    children: [
      { key: "UpdateRules", label: "Update user defined variables (rules)", route: "/Menu/HomologationVariables" },
      { key: "UpdateUnicodeRules", label: "Update user defined variables (UNICODE rules)", route: "#" },
      { key: "ExistingVariables", label: "Existing HDoc variables", route: "/Menu/ExistingHDocVariables" },
      { key: "UnlockDocument", label: "Unlock Document", route: "#" },
      { key: "HDocNumberSeries", label: "HDoc Number Series", route: "#" },
      { key: "UploadDeleteTemplate", label: "Upload/Delete template", route: "/Menu/UploadDeleteTemplate" },
      { key: "ListTemplates", label: "List available templates", route: "/Menu/ListTemplates" },
      { key: "VPPSVinPlate", label: "VPPS Vin plate", route: "/Menu/VinPlate" },
      { key: "ADCAChange", label: "AD/CA Change", route: "/Menu/ADCAChange" },
    ],
  },
  {
    key: "UserAdmin",
    label: "User Administration",
    children: [
      { key: "HDocUserAdmin", label: "HDoc User Administration", route: "/Menu/HDocUserAdministration" },
      { key: "HDocUserDocAdmin", label: "HDoc User Doc Administration", route: "/Menu/HDocUserDocAdministration" },
      { key: "SearchUser", label: "Search User", route: "/Menu/SearchUser" },
      { key: "ChangePassword", label: "Change Password", route: "#" },
      { key: "UserPosition", label: "User Position", route: "#" },
    ],
  },
  {
    key: "Archive",
    label: "Archive",
    children: [
      { key: "ArchiveSearch", label: "Search", route: "#" },
      { key: "UploadDocument", label: "Upload Document", route: "#" },
    ],
  },
  {
    key: "Documentation",
    label: "Documentation",
    children: [
      { key: "UserGuide", label: "User Guide", route: "/Menu/UserGuide" },
      { key: "ADCAChangeGuide", label: "AD/CA Change Guide", route: "#" },
      { key: "VinPlateGuide", label: "Vin plate Guide FM/FH", route: "#" },
      { key: "ArchiveGuide", label: "Archive Guide", route: "#" },
      { key: "Privacy", label: "Privacy", route: "#" },
    ],
  },
];

// 获取用户权限列表（从 localStorage 中读取）
const getUserPermissions = (): string[] => {
  try {
    // userInfoStr

    const userInfoStr = localStorage.getItem("userInfo");
    if (!userInfoStr) {
      return [];
    }
    // userInfo

    const userInfo = JSON.parse(userInfoStr);
    // 权限列表存储在 userInfo.permissions 中，若没有则赋予所有权限（开发阶段）
    return userInfo.permissions || [
      "GenerateDucument",
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

// 根据权限过滤菜单项（递归过滤所有层级）
const filterMenuByPermissions = (items: MenuItem[], permissions: string[]): MenuItem[] => {
  return items
    .map((item) => {
      if (item.children) {
        // filteredChildren

        const filteredChildren = filterMenuByPermissions(item.children, permissions);
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
  // map

  const map: Record<string, string> = {};
  // traverse

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
  // keys

  const keys: string[] = [];
  // traverse

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

// Menu

const Menu: React.FC = () => {
  // navigate

  const navigate = useNavigate();
  // location

  const location = useLocation();
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
      // userInfo

      const userInfo = JSON.parse(userInfoStr);
    } catch {
      navigate("/");
      return;
    }

    // 获取权限并过滤菜单
    const permissions = getUserPermissions();
    // filtered

    const filtered = filterMenuByPermissions(menuItems, permissions);
    setFilteredMenuItems(filtered);

    // 递归收集所有层级的 key，使所有子菜单默认展开
    const getAllKeys = (items: MenuItem[]): string[] => {
      // keys

      const keys: string[] = [];
      for (const item of items) {
        keys.push(item.key);
        if (item.children) keys.push(...getAllKeys(item.children));
      }
      return keys;
    };
    // defaultOpenKeys

    const defaultOpenKeys = getAllKeys(filtered);
    setOpenKeys(defaultOpenKeys);
  }, [navigate]);

  // 根据当前路由高亮对应的菜单项
  useEffect(() => {
    // routeMap

    const routeMap = buildRouteMap(menuItems);
    // currentPath

    const currentPath = location.pathname;

    // 查找匹配当前路由的菜单项 key
    const findKeyByRoute = (items: MenuItem[]): string | null => {
      for (const item of items) {
        if (item.route && currentPath.startsWith(item.route)) {
          return item.key;
        }
        if (item.children) {
          // found

          const found = findKeyByRoute(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    // matchedKey

    const matchedKey = findKeyByRoute(menuItems);
    if (matchedKey) {
      setSelectedKeys([matchedKey]);
    }
  }, [location.pathname]);

  // 菜单点击事件处理（对应详细设计3.1 处理流程-菜单点击处理）
  const handleMenuClick = (info: { key: string }) => {
    // routeMap

    const routeMap = buildRouteMap(filteredMenuItems);
    // route

    const route = routeMap[info.key];

    // 设置选中状态（即使 route === '#' 也高亮）
    setSelectedKeys([info.key]);

    if (route && route !== '#') {
      navigate(route);
    }
  };

  // 禁止折叠：所有子菜单始终保持展开
  const handleOpenChange = () => {
    // 不执行任何操作，阻止用户折叠菜单
  };

  // 转换为 Ant Design Menu 数据格式
  const antMenuItems = convertToAntMenuItems(filteredMenuItems);

  // 获取所有叶子节点 key（用于高亮）
  const leafKeys = getLeafKeys(filteredMenuItems);

  return (
    <Layout className="menu-layout">
      {/* 左侧菜单区 */}
      <Sider
        width={460}
        className="menu-sider"
      >
        {/* 系统标题 */}
        <div className="menu-header">
          <div className="menu-title">
            <Text strong style={{ color: "#fff", fontSize: 16 }}>
              EDB Engineering Database
            </Text>

          </div>
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
      </Sider>

      {/* 右侧内容区 */}
      <Layout className="menu-content-layout">

        <Content className="menu-content">
          {/* 使用 Outlet 动态加载子路由内容（对应详细设计2.2 右侧内容区） */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

// Menu

export default Menu;
