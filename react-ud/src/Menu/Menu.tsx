import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './Menu.css';

interface MenuItem {
  label: string;
  path?: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const MENU_CATEGORIES: MenuCategory[] = [
  {
    title: 'Generate',
    items: [
      { label: 'Generate Doc', path: '/menu/generate-doc' },
      { label: 'Generate in Batch' },
      { label: 'Regdata Archive' },
      { label: 'Regdata Batch' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Update user defined variables (rules)', path: '/menu/homologation-variables' },
      { label: 'Update user defined variables (UNICODE rules)' },
      { label: 'Existing HDoc variables', path: '/menu/existing-hdoc-vars' },
      { label: 'Unlock Document' },
      { label: 'HDoc Number Series' },
      { label: 'Upload/Delete template', path: '/menu/upload-delete-template' },
      { label: 'List available templates', path: '/menu/list-templates' },
      { label: 'VPPS Vin plate', path: '/menu/vin-plate' },
      { label: 'AD/CA Change', path: '/menu/ad-ca-change' },
    ],
  },
  {
    title: 'User Administration',
    items: [
      { label: 'HDoc User Administration', path: '/menu/hdoc-user-admin' },
      { label: 'HDoc User Doc Administration', path: '/menu/hdoc-user-doc-admin' },
      { label: 'Search User', path: '/menu/search-user' },
      { label: 'Change Password' },
      { label: 'User Position' },
    ],
  },
  {
    title: 'Archive',
    items: [
      { label: 'Search' },
      { label: 'Upload Document' },
    ],
  },
  {
    title: 'Documentation',
    items: [
      { label: 'User Guide', path: '/menu/guide-user' },
      { label: 'AD/CA Change Guide' },
      { label: 'Vin plate Guide FM/FH' },
      { label: 'Archive Guide' },
      { label: 'Privacy' },
    ],
  },
];

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem('username') || localStorage.getItem('userId') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    navigate('/login', { replace: true });
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  // 当前路径是否为菜单根路径（无子路由选中）
  const isRootMenu = location.pathname === '/menu';

  return (
    <div className="menu-root">
      <aside className="menu-sidebar">
        <div className="sidebar-header">
          <h2>Generate Document</h2>
        </div>

        <nav className="sidebar-nav">
          {MENU_CATEGORIES.map((cat) => (
            <div key={cat.title} className="menu-section">
              <div className="section-title">{cat.title}</div>
              {cat.items.map((item) => (
                <div
                  key={item.label}
                  className={`menu-item${location.pathname === item.path ? ' active' : ''}${!item.path ? ' disabled' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                 <span className="menu-arrow">»</span>
                 {item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="menu-main">
        {isRootMenu ? (
          <>
            {/* <h1>Select a menu item to get started</h1> */}
            <h2 style={{ marginTop: '40px', textAlign: 'left', color: '#1c2771' }}>
              Welcome to the HDoc system. Please select an option from the menu on the left.
            </h2>
          </>
        ) : (
          <Outlet />
        )}
      </main>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-icon">👤</span>
          <span className="user-name">{username}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Menu;