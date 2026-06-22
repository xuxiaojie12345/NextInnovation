import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography
} from '@mui/material';
import styles from '../assets/styles/HdocMenu.module.css';
// 其他组件可根据需要继续导入...

// --- 类型定义 ---

interface MenuItem {
  id: string;
  name: string;
  routePath: string;
}

interface MenuSubCategory {
  subCategoryName: string;
  items: MenuItem[];
}

interface MenuCategory {
  categoryName: string;
  subCategories?: MenuSubCategory[]; // 二级子分类（可选）
  items?: MenuItem[];                 // 直接包含的菜单项（可选）
}

// --- 完整的菜单配置（包含所有26个菜单项）---

const FULL_MENU_DATA: MenuCategory[] = [
  {
    categoryName: 'Generate Document',
    subCategories: [
      {
        subCategoryName: 'Generate',
        items: [
          { 
            id: 'menu-generate-doc', 
            name: 'Generate Doc', 
            routePath: '/HdocMenu/HdocGenerateHomologationDocument'
          },
          { id: 'menu-generate-batch', name: 'Generate in Batch', routePath: '/generate/batch' },
          { id: 'menu-regdata-archive', name: 'Regdata Archive', routePath: '/archive/regdata' },
          { id: 'menu-regdata-batch', name: 'Regdata Batch', routePath: '/batch/regdata' }
        ]
      }
    ]
  },
  {
    categoryName: 'Admin',
    items: [
      { id: 'menu-admin-update-rules', name: 'Update user defined variables (rules)', routePath: '/HomologationVariables' },
      { id: 'menu-admin-update-unicode', name: 'Update user defined variables (UNICODE rules)', routePath: '/admin/update-unicode' },
      { 
        id: 'menu-admin-existing-variables', 
        name: 'Existing HDoc variables', 
        routePath: '/admin/variables'
      },
      { id: 'menu-admin-unlock-document', name: 'Unlock Document', routePath: '/admin/unlock' },
      { id: 'menu-admin-number-series', name: 'HDoc Number Series', routePath: '/admin/number-series' },
      { 
        id: 'menu-admin-upload-template', 
        name: 'Upload/Delete template', 
        routePath: '/admin/template'
      },
      { id: 'menu-admin-list-templates', name: 'List available templates', routePath: '/admin/list-templates' },
      { id: 'menu-admin-vpps-vin', name: 'VPPS Vin plate', routePath: '/admin/vpps-vin' },
      { id: 'menu-admin-ad-ca-change', name: 'AD/CA Change', routePath: '/HdocMenu/AdChange' }
    ]
  },
  {
    categoryName: 'User Administration',
    items: [
      { id: 'menu-user-admin-hdoc-user', name: 'HDoc User Administration', routePath: '/HdocMenu/HDocUserAdministration' },
      { id: 'menu-user-admin-hdoc-doc', name: 'HDoc User Doc Administration', routePath: '/user-admin/hdoc-doc' },
      { id: 'menu-user-admin-search', name: 'Search User', routePath: '/user-admin/search' },
      { id: 'menu-user-admin-change-password', name: 'Change Password', routePath: '/user-admin/change-password' },
      { id: 'menu-user-admin-position', name: 'User Position', routePath: '/user-admin/position' }
    ]
  },
  {
    categoryName: 'Archive',
    items: [
      { id: 'menu-archive-search', name: 'Search', routePath: '/archive/search' },
      { id: 'menu-archive-upload', name: 'Upload Document', routePath: '/archive/upload' }
    ]
  },
  {
    categoryName: 'Documentation',
    items: [
      { 
        id: 'menu-doc-user-guide', 
        name: 'User Guide', 
        routePath: '/HdocMenu/HdocHelp'
      },
      { id: 'menu-doc-ad-ca-guide', name: 'AD/CA Change Guide', routePath: '' },
      { id: 'menu-doc-vin-plate-guide', name: 'Vin plate Guide FM/FH', routePath: '/docs/vin-plate-guide' },
      { id: 'menu-doc-archive-guide', name: 'Archive Guide', routePath: '/docs/archive-guide' },
      { id: 'menu-doc-privacy', name: 'Privacy', routePath: '/docs/privacy' }
    ]
  } 
];

// --- 组件主体 ---

const HdocMenu: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 菜单项点击处理 - 使用路由跳转
   * @param item 被点击的菜单项
   */
  const handleMenuItemClick = (item: MenuItem) => {
    // 使用路由跳转到对应页面
    navigate(item.routePath);
  };

// --- 组件主体 ---

  // 正常渲染菜单 + 右侧内容区域（通过Outlet显示子路由）
  return (
    <Box className={styles.menuContainer}>
      {/* 左侧菜单区域 */}
      <Box className={styles.leftSidebar}>
        {/* Volvo Logo 区域 - 使用 CSS 文字效果 */}
        <Box className={styles.logoContainer}>
          <div className={styles.logo}>
            VOLVO
          </div>
        </Box>

        {/* 菜单导航区域 */}
        <Box className={styles.menuContent}>
          {FULL_MENU_DATA.map((category) => (
            <Box key={category.categoryName} className={styles.categoryContainer}>
              {/* 一级分类标题 */}
              <Typography className={styles.categoryTitle}>
                {category.categoryName}
              </Typography>
              
              {/* 如果有二级子分类 */}
              {category.subCategories && category.subCategories.length > 0 && (
                <>
                  {category.subCategories.map((subCategory) => (
                    <Box key={subCategory.subCategoryName} className={styles.subCategoryContainer}>
                      {/* 二级子分类标题 */}
                      <Typography className={styles.subCategoryTitle}>
                        {subCategory.subCategoryName}
                      </Typography>
             
                      
                      {/* 子菜单项列表 */}
                      <List className={styles.menuList}>
                        {subCategory.items.map((item) => (
                          <ListItemButton
                            key={item.id}
                            id={item.id}
                            onClick={() => handleMenuItemClick(item)}
                            className={styles.menuItem}
                          >
                            <ListItemText
                            
                              primary={item.name}
                              className={styles.menuItemText}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>
                  ))}
                </>
              )}
              
              {/* 如果直接包含菜单项（无二级子分类） */}
              {category.items && category.items.length > 0 && (
                <>
                 
                  
                  {/* 菜单项列表 */}
                  <List className={styles.menuList}>
                    {category.items.map((item) => (
                      <ListItemButton
                        key={item.id}
                        id={item.id}
                        onClick={() => handleMenuItemClick(item)}
                        className={styles.menuItem}
                      >
                        <ListItemText
                          primary={item.name}
                          className={styles.menuItemText}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 右侧内容区域 - 通过Outlet显示子路由组件 */}
      <Box className={styles.rightContent}>
        <Box className={styles.contentWrapper}>
          {/* Outlet用于显示子路由组件 */}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default HdocMenu;
