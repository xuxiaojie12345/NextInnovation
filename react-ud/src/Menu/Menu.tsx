import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Menu.css';

interface MenuItem {
  id: number;
  label: string;
  path: string;
  category: string;
}

const menuItems: MenuItem[] = [
  {
    id: 1,
    label: 'Generate>>Generate Doc',
    path: '/generate/doc',
    category: 'Generate Document'
  },
  {
    id: 2,
    label: 'Admin>>Update user defined variables (rules)',
    path: '/admin/update-variables',
    category: 'Admin'
  },
  {
    id: 3,
    label: 'Admin>>Existing HDoc variables',
    path: '/admin/hdoc-variables',
    category: 'Admin'
  },
  {
    id: 4,
    label: 'Admin>>Upload/Delete template',
    path: '/UD12UploadDeletetemplate',
    category: 'Admin'
  },
  {
    id: 5,
    label: 'Admin>>List available templates',
    path: '/admin/list-templates',
    category: 'Admin'
  },
  {
    id: 6,
    label: 'Admin>>VPPS Vin plate',
    path: '/admin/vpps-vin-plate',
    category: 'Admin'
  },
  {
    id: 7,
    label: 'Admin>>AD/CA Change',
    path: '/admin/ad-ca-change',
    category: 'Admin'
  },
  {
    id: 8,
    label: 'User Administration>>HDoc User Administration',
    path: '/user-admin/hdoc-user-admin',
    category: 'User Administration'
  },
  {
    id: 9,
    label: 'User Administration>>HDoc User Doc Administration',
    path: '/user-admin/hdoc-doc-admin',
    category: 'User Administration'
  },
  {
    id: 10,
    label: 'User Administration>>Search User',
    path: '/user-admin/search-user',
    category: 'User Administration'
  },
  {
    id: 11,
    label: 'User Administration>>Change Password',
    path: '/user-admin/change-password',
    category: 'User Administration'
  },
  {
    id: 12,
    label: 'Documentation>>User Guide',
    path: '/documentation/user-guide',
    category: 'Documentation'
  }
];

function Menu() {
  const navigate = useNavigate();
  const location = useLocation();
  const userID = location.state?.userID || localStorage.getItem('userID');

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  // 按分类分组菜单项
  const groupedMenus = menuItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>
  );

  return (
    <div className='menu-container'>
      <div className='menu-box'>
        <h1 className='menu-title'>Menu</h1>

        {userID && (
          <div className='user-info'>
            <span>Welcome, {userID}</span>
          </div>
        )}

        <div className='menu-content'>
          {Object.entries(groupedMenus).map(([category, items]) => (
            <div key={category} className='menu-category'>
              <h2 className='category-title'>{category}</h2>
              <ul className='menu-list'>
                {items.map((item) => (
                  <li key={item.id} className='menu-item'>
                    <button
                      className='menu-link'
                      onClick={() => handleMenuClick(item.path)}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Menu;
