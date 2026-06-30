import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../common/css/common.css';
import './MarketDocumentSettingsList.css';

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { doctype?: string; registerUser?: string; registerDatetime?: string } | null;

  const [documentType, setDocumentType] = useState(state?.doctype || '');
  const [market, setMarket] = useState('-EU');
  const [setting, setSetting] = useState('');
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
    setMarket('-EU');
    setSetting('');
    setBusinessUnit('BU');
    setUser('');
    setDate('');
    clearMessages();
  };

  const handleBack = () => {
    navigate('/menu/guide-user');
  };

  const handleUpdateMode = () => {
    // 机能暂时不实装
    return;
  };

  return (
    <div className="mdsl-container">
      <div className="mdsl-header">
        <h1>HDoc - Market Document Setting</h1>
      </div>

      {message && <div className="mdsl-error">{message}</div>}

      <div className="mdsl-bordered">
        {/* 按钮区域：在上方，有背景色 */}
        <div className="mdsl-btn-row">
          <button className="btn" onClick={handleSearch}>Search</button>
          <button className="btn" onClick={handleClear}>Clear</button>
          <button className="btn" onClick={handleBack}>Back</button>
          <button className="btn" onClick={handleUpdateMode}>Update Mode</button>
        </div>

        {/* 检索条件区域 */}
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
          <span className="mdsl-label">Market</span>
          <input
            type="text"
            className="mdsl-input"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
          />
        </div>
        <div className="mdsl-row">
          <span className="mdsl-label">Setting</span>
          <select
            className="mdsl-input mdsl-select"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
          >
            <option value="">-- Select --</option>
            <option value="NO_VDA_CACHE">NO_VDA_CACHE</option>
          </select>
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
      </div>
    </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
