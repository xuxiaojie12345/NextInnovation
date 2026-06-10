import React from "react";
import { useNavigate } from "react-router-dom";
import "./Menu.css";

interface MenuItem {
  id: number;
  name: string;
  path: string;
  category: string;
  subCategory?: string;
}

const Menu: React.FC = () => {
  const navigate = useNavigate();

  // 菜单数据配置（根据图片调整）
  const menuItems: MenuItem[] = [
    // Generate Document 分类
    {
      id: 1,
      name: "Generate Doc",
      path: "/generate-doc",
      category: "Generate Document",
      subCategory: "Generate",
    },
    {
      id: 2,
      name: "Generate in Batch",
      path: "/generate-batch",
      category: "Generate Document",
      subCategory: "Generate",
    },
    {
      id: 3,
      name: "Regdata Archive",
      path: "/regdata-archive",
      category: "Generate Document",
      subCategory: "Generate",
    },
    {
      id: 4,
      name: "Regdata Batch",
      path: "/regdata-batch",
      category: "Generate Document",
      subCategory: "Generate",
    },

    // Admin 分类
    {
      id: 5,
      name: "Update user defined variables (rules)",
      path: "/admin/update-variables",
      category: "Admin",
    },
    {
      id: 6,
      name: "Update user defined variables (UNICODE rules)",
      path: "/admin/update-variables-unicode",
      category: "Admin",
    },
    {
      id: 7,
      name: "Existing HDoc variables",
      path: "/admin/existing-variables",
      category: "Admin",
    },
    {
      id: 8,
      name: "Unlock Document",
      path: "/admin/unlock-document",
      category: "Admin",
    },
    {
      id: 9,
      name: "HDoc Number Series",
      path: "/admin/hdoc-number-series",
      category: "Admin",
    },
    {
      id: 10,
      name: "Upload/Delete template",
      path: "/UploadDeleteTemplate", // 修改路径以匹配App.tsx中的路由配置
      category: "Admin",
    },
    {
      id: 11,
      name: "List available templates",
      path: "/admin/list-templates",
      category: "Admin",
    },
    {
      id: 12,
      name: "VPPS Vin plate",
      path: "/admin/vpps-vin-plate",
      category: "Admin",
    },
    {
      id: 13,
      name: "AD/CA Change",
      path: "/admin/ad-ca-change",
      category: "Admin",
    },

    // User Administration 分类
    {
      id: 14,
      name: "HDoc User Administration",
      path: "/user-admin/hdoc-user",
      category: "User Administration",
    },
    {
      id: 15,
      name: "HDoc User Doc Administration",
      path: "/user-admin/hdoc-user-doc",
      category: "User Administration",
    },
    {
      id: 16,
      name: "Search User",
      path: "/user-admin/search-user",
      category: "User Administration",
    },
    {
      id: 17,
      name: "Change Password",
      path: "/user-admin/change-password",
      category: "User Administration",
    },
    {
      id: 18,
      name: "User Position",
      path: "/user-admin/user-position",
      category: "User Administration",
    },

    // Archive 分类
    {
      id: 19,
      name: "Search",
      path: "/archive/search",
      category: "Archive",
    },
    {
      id: 20,
      name: "Upload Document",
      path: "/archive/upload",
      category: "Archive",
    },

    // Documentation 分类
    {
      id: 21,
      name: "User Guide",
      path: "/documentation/user-guide",
      category: "Documentation",
    },
    {
      id: 22,
      name: "AD/CA Change Guide",
      path: "/documentation/ad-ca-guide",
      category: "Documentation",
    },
    {
      id: 23,
      name: "Vin plate Guide FM/FH",
      path: "/documentation/vin-plate-guide",
      category: "Documentation",
    },
    {
      id: 24,
      name: "Archive Guide",
      path: "/documentation/archive-guide",
      category: "Documentation",
    },
    {
      id: 25,
      name: "Privacy",
      path: "/documentation/privacy",
      category: "Documentation",
    },
  ];

  // 按分类分组菜单项
  const groupedMenus = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // 菜单点击处理
  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  // 按子分类分组（用于 Generate Document）
  const groupBySubCategory = (items: MenuItem[]) => {
    return items.reduce((acc, item) => {
      const key = item.subCategory || "default";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  };

  return (
    <div className='menu-container'>
      {/* 左侧边栏 */}
      <div className='menu-sidebar'>
        {/* VOLVO 品牌标识 */}
        <div className='menu-header'>
          <h1 className='volvo-logo'>VOLVO</h1>
        </div>

        <div className='menu-content'>
          {/* 遍历所有分类 */}
          {Object.entries(groupedMenus).map(([category, items]) => (
            <div key={category} className='menu-category'>
              {/* 分类标题 */}
              <div className='category-header'>
                <h2 className='category-title'>{category}</h2>
              </div>

              {/* 菜单项列表 */}
              <div className='menu-list'>
                {/* 如果有子分类（如 Generate） */}
                {category === "Generate Document" ? (
                  <>
                    {Object.entries(groupBySubCategory(items)).map(
                      ([subCat, subItems]) => (
                        <div key={subCat} className='sub-category'>
                          <h3 className='sub-category-title'>{subCat}</h3>
                          {subItems.map((item) => (
                            <div
                              key={item.id}
                              className='menu-item'
                              onClick={() => handleMenuClick(item.path)}
                              role='button'
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  handleMenuClick(item.path);
                                }
                              }}
                            >
                              <span className='menu-item-arrow'>»</span>
                              <span className='menu-item-text'>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      ),
                    )}
                  </>
                ) : (
                  // 其他分类直接显示菜单项
                  items.map((item) => (
                    <div
                      key={item.id}
                      className='menu-item'
                      onClick={() => handleMenuClick(item.path)}
                      role='button'
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleMenuClick(item.path);
                        }
                      }}
                    >
                      <span className='menu-item-arrow'>»</span>
                      <span className='menu-item-text'>{item.name}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 主内容区域（右侧） */}
      <div className='main-content'>
        <h2>Welcome to HDoc System</h2>
        <p>Please select a menu item from the left sidebar to get started.</p>
      </div>
    </div>
  );
};

export default Menu;
