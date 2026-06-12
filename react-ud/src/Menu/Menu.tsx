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
        { label: 'Generate Doc', path: '/UD01' },
        { label: 'Generate in Batch' },
        { label: 'Regdata Archive' },
        { label: 'Regdata Batch' },
      ],
    },
    {
      title: 'Admin',
      items: [
        { label: 'Update user defined variables (rules)', path: '/UD08' },
        { label: 'Update user defined variables (UNICODE rules)' },
        { label: 'Existing HDoc variables', path: '/UD11' },
        { label: 'Unlock Document' },
        { label: 'HDoc Number Series' },
        { label: 'Upload/Delete template' },
        { label: 'List available templates' },
        { label: 'VPPS Vin plate', path: '/UD15' },
        { label: 'AD/CA Change', path: '/UD16' },
      ],
    },
    {
      title: 'User Administration',
      items: [
        { label: 'HDoc User Administration', path: '/UD17' },
        { label: 'HDoc User Doc Administration', path: '/UD18' },
        { label: 'Search User' },
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
    if (item.path) {
      // 如果有路径，进行路由跳转
      navigate(item.path);
    } else {
      // 否则显示提示信息
      console.log('Clicked:', item.label);
      alert(`${item.label} - Functionality under development`);
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
