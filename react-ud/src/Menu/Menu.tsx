import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Menu.css';

interface MenuItem {
  label: string;
  path?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const Menu: React.FC = () => {
  const navigate = useNavigate();

  const menuSections: MenuSection[] = [
    {
      title: 'Generate Document',
      items: [
        { label: 'Generate Doc' },
        { label: 'Generate in Batch' },
        { label: 'Regdata Archive' },
        { label: 'Regdata Batch' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: 'Update user defined variables (rules)' },
        { label: 'Update user defined variables (UNICODE rules)' },
        { label: 'Existing HDoc variables' },
        { label: 'Unlock Document' },
        { label: 'HDoc Number Series' },
        { label: 'Upload/Delete template' },
        { label: 'List available templates' },
        { label: 'VPPS Vin plate' },
        { label: 'AD/CA Change' },
      ],
    },
    {
      title: 'User Administration',
      items: [
        { label: 'HDoc User Administration' },
        { label: 'HDoc User Doc Administration' },
        { label: 'Search User', path: '/user-admin/search-user' },
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
        { label: 'User Guide' },
        { label: 'AD/CA Change Guide' },
        { label: 'Vin plate Guide FM/FH' },
        { label: 'Archive Guide' },
        { label: 'Privacy' },
      ],
    },
  ];

  const handleMenuItemClick = (item: MenuItem) => {
    // 已配置路由的菜单项跳转到对应画面（如 Search User → SearchUser 画面）
    if (item.path) {
      navigate(item.path);
    } else {
      console.log('Clicked:', item.label);
    }
  };

  return (
    <div className="menu-container">
      <div className="menu-header">
        <img 
          src="/volvo-logo.png" 
          alt="VOLVO" 
          className="volvo-logo"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              const textLogo = document.createElement('div');
              textLogo.className = 'text-logo';
              textLogo.textContent = 'VOLVO';
              parent.appendChild(textLogo);
            }
          }}
        />
      </div>

      <div className="menu-content">
        {menuSections.map((section, index) => (
          <div key={index} className="menu-section">
            <h3 className="section-title">{section.title}</h3>
            <ul className="menu-list">
              {section.items.map((item, itemIndex) => (
                <li 
                  key={itemIndex} 
                  className="menu-item"
                  onClick={() => handleMenuItemClick(item)}
                >
                  <span className="menu-arrow">»</span>
                  <span className="menu-label">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;