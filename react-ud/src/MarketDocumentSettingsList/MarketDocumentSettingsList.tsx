import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../common/css/common.css';
import './MarketDocumentSettingsList.css';

type Operator = '=' | '!=' | '>' | '<';

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { doctype?: string; registerUser?: string; registerDatetime?: string; doctypeOp?: string; registerUserOp?: string; registerDatetimeOp?: string } | null;

  const [documentType, setDocumentType] = useState(state?.doctype || '');
  const [documentTypeOp, setDocumentTypeOp] = useState<Operator>((state?.doctypeOp as Operator) || '=');
  const [market, setMarket] = useState('-EU');
  const [marketOp, setMarketOp] = useState<Operator>('=');
  const [setting, setSetting] = useState('');
  const [settingOp, setSettingOp] = useState<Operator>('=');
  const [businessUnit, setBusinessUnit] = useState('BU');
  const [businessUnitOp, setBusinessUnitOp] = useState<Operator>('=');
  const [user, setUser] = useState(state?.registerUser || '');
  const [userOp, setUserOp] = useState<Operator>((state?.registerUserOp as Operator) || '=');
  const [date, setDate] = useState(state?.registerDatetime || '');
  const [dateOp, setDateOp] = useState<Operator>((state?.registerDatetimeOp as Operator) || '=');
  const [message, setMessage] = useState('');

  const clearMessages = () => setMessage('');

  const isNumericField = (label: string): boolean => {
    return label === 'Date';
  };

  const renderOpSelect = (field: string, op: Operator, onChange: (v: Operator) => void) => {
    const numericOps = ['=', '>', '<'] as Operator[];
    const nonNumericOps = ['=', '!='] as Operator[];
    const ops = isNumericField(field) ? numericOps : nonNumericOps;
    const currentOp = ops.includes(op) ? op : '=';
    return (
      <select className="mdsl-op-select" value={currentOp} onChange={(e) => onChange(e.target.value as Operator)}>
        {ops.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  };

  const handleSearch = () => {
    clearMessages();
    navigate('/menu/market-document-setting/result', {
      state: {
        doctype: documentType,
        doctypeOp: documentTypeOp,
        registerUser: user,
        registerUserOp: userOp,
        registerDatetime: date,
        registerDatetimeOp: dateOp,
      },
    });
  };

  const handleClear = () => {
    setDocumentType('');
    setDocumentTypeOp('=');
    setMarket('-EU');
    setMarketOp('=');
    setSetting('');
    setSettingOp('=');
    setBusinessUnit('BU');
    setBusinessUnitOp('=');
    setUser('');
    setUserOp('=');
    setDate('');
    setDateOp('=');
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
            {renderOpSelect('Document type', documentTypeOp, setDocumentTypeOp)}
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
            {renderOpSelect('Market', marketOp, setMarketOp)}
            <input
              type="text"
              className="mdsl-input"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            />
          </div>
          <div className="mdsl-row">
            <span className="mdsl-label">Setting</span>
            {renderOpSelect('Setting', settingOp, setSettingOp)}
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
            {renderOpSelect('Business unit', businessUnitOp, setBusinessUnitOp)}
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
            {renderOpSelect('User', userOp, setUserOp)}
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
            {renderOpSelect('Date', dateOp, setDateOp)}
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
