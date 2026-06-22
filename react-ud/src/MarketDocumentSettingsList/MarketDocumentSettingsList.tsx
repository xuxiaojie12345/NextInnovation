import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../common/css/common.css';
import './MarketDocumentSettingsList.css';

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { doctype?: string; registerUser?: string; registerDatetime?: string } | null;

  const [documentType, setDocumentType] = useState(state?.doctype || '');
  const [businessUnit, setBusinessUnit] = useState('BU');
  const [user, setUser] = useState(state?.registerUser || '');
  const [date, setDate] = useState(state?.registerDatetime || '');
  const [message, setMessage] = useState('');

  const clearMessages = () => setMessage('');

  const handleSearch = () => {
    clearMessages();
    navigate('/menu/market-document-setting/result', {
      state: {
        doctype: documentType,
        registerUser: user,
        registerDatetime: date,
      },
    });
  };

  const handleClear = () => {
    setDocumentType('');
    setBusinessUnit('BU');
    setUser('');
    setDate('');
    clearMessages();
  };

  const handleBack = () => {
    navigate('/menu/guide-user');
  };

  const handleUpdateRole = () => {
    // 机能暂时不实装
    return;
  };

  return (
    <div className="mdsl-container">
      <div className="mdsl-header">
        <h1>HDoc - Market Document Setting</h1>
      </div>

      {message && <div className="mdsl-error">{message}</div>}

      <div className="mdsl-form">
        <div className="mdsl-row">
          <span className="mdsl-label">Document type</span>
          <input
            type="text"
            className="mdsl-input"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            maxLength={20}
          />
        </div>
        <div className="mdsl-row">
          <span className="mdsl-label">Business unit</span>
          <select
            className="mdsl-input mdsl-select"
            value={businessUnit}
            onChange={(e) => setBusinessUnit(e.target.value)}
          >
            <option value="BU">BU</option>
          </select>
        </div>
        <div className="mdsl-row">
          <span className="mdsl-label">User</span>
          <input
            type="text"
            className="mdsl-input"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            maxLength={16}
          />
        </div>
        <div className="mdsl-row">
          <span className="mdsl-label">Date</span>
          <input
            type="text"
            className="mdsl-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="mdsl-btn-row">
          <button className="btn" onClick={handleSearch}>Search</button>
          <button className="btn" onClick={handleClear}>Clear</button>
          <button className="btn" onClick={handleBack}>Back</button>
          <button className="btn" onClick={handleUpdateRole}>Update role</button>
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
