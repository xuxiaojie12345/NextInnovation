import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from 'antd';
import './UserGuide.css';

const UserGuide: React.FC = () => {
  const navigate = useNavigate();
  const [showOtherInformation, setShowOtherInformation] = useState(false);

  const links = [
    { label: 'HDoc Quick Guide', path: '/download-print-quick-guides' },
    { label: 'List of document types.', path: '/document-types' },
    { label: 'Markets in HDoc', path: '/markets-in-hdoc' },
    { label: 'HDoc - Market Document Setting', path: '/market-document-settings-list' },
    { label: 'Describation', path: '/describation' },
  ];

  return (
    <div className="usg-container">
      <div className="usg-header">
        <h1 className="usg-header-title">HDoc - User Guide</h1>
      </div>

      <div className="usg-content">
        <div className="usg-card">
          <h2 className="usg-subtitle">HDoc Help</h2>

          <div className="usg-links">
            {links.map((link) => (
              <div key={link.path} className="usg-link-row">
                <a
                  className="usg-link"
                  onClick={(e) => { e.preventDefault(); navigate(link.path); }}
                  href={link.path}
                >
                  {link.label}
                </a>
              </div>
            ))}
          </div>

          <div className="usg-other-section">
            <Checkbox
              className="usg-checkbox"
              checked={showOtherInformation}
              onChange={(e) => setShowOtherInformation(e.target.checked)}
            >
              Other Information
            </Checkbox>

            {showOtherInformation && (
              <div className="usg-other-content">
                <p>
                  For additional assistance, please contact the HDoc support team
                  at <a href="mailto:support.tpi@volvo.com">support.tpi@volvo.com</a>.
                </p>
                <p>
                  The HDoc system provides comprehensive document management
                  capabilities including document generation, template management,
                  user administration, and market-specific configurations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="usg-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="usg-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default UserGuide;
