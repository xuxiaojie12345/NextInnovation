import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import axios from 'axios';
import './VinPlate.css';

interface VpDataItem {
  variant: string;
  value: string;
}

interface VinPlateInfo {
  chassisNo: string;
  plateType: string;
  status: string;
  errorMessage: string | null;
  registerDatetime: string;
  docReady: string;
  docSent: string | null;
  printItems: string[];
  vpData: VpDataItem[];
}

const PLATE_TYPE_MAP: Record<string, string> = {
  '1': 'basic',
  '2': 'ADVANCED',
};

const STATUS_MAP: Record<string, string> = {
  '0': '新規追加',
  '1': 'xml doc 作成済み',
  '2': '送信済み',
  '9': 'エラー',
};

const VinPlate: React.FC = () => {
  const navigate = useNavigate();

  const [chassisNo, setChassisNo] = useState<string>('');
  const [vinPlateInfo, setVinPlateInfo] = useState<VinPlateInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const callApi = async (endpoint: string) => {
    if (!chassisNo.trim()) {
      showMessage('Chassis number is required.', 'error');
      return null;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        endpoint,
        { chassisNo: chassisNo.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.status === 'success') {
        showMessage(response.data.message, 'success');
        return response.data;
      }
      showMessage(response.data.message || 'Operation failed.', 'error');
      return null;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return null;
        }
        showMessage(error.response.data?.message || 'Operation failed.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInfo = async () => {
    if (!chassisNo.trim()) {
      showMessage('Chassis number is required.', 'error');
      return;
    }
    const result = await callApi('/api/UD15ViewInfo');
    if (result?.data) {
      setVinPlateInfo(result.data);
    } else {
      setVinPlateInfo(null);
    }
  };

  const handleSetRegenerate = async () => {
    const result = await callApi('/api/UD15SetRegenerate');
    if (result) handleViewInfo();
  };

  const handleSetOK = async () => {
    const result = await callApi('/api/UD15SetOK');
    if (result) handleViewInfo();
  };

  const handleChangeToBasicInfo = async () => {
    const result = await callApi('/api/UD15ChangetoBasicInfo');
    if (result) handleViewInfo();
  };

  const handleChangeToAdvancedInfo = async () => {
    const result = await callApi('/api/UD15ChangetoAdvancedInfo');
    if (result) handleViewInfo();
  };

  return (
    <div className="vp-container">
      <div className="vp-header">
        <h1 className="vp-header-title">HDoc - Vin Plate</h1>
      </div>

      <div className="vp-content">
        <div className="vp-card">
          {message && (
            <div className={`vp-message vp-message-${messageType}`}>{message}</div>
          )}

          <div className="vp-input-row">
            <div className="vp-field vp-field-input">
              <label className="vp-label">Chassis number</label>
              <Input
                className="vp-input"
                value={chassisNo}
                onChange={(e) => { setChassisNo(e.target.value); setMessage(''); }}
                maxLength={15}
              />
            </div>
            <div className="vp-field vp-field-btn">
              <label className="vp-label">&nbsp;</label>
              <Button
                className="vp-btn vp-btn-view"
                onClick={handleViewInfo}
                loading={isLoading}
              >
                View Info
              </Button>
            </div>
          </div>

          <div className="vp-action-row">
            <Button
              className="vp-btn vp-btn-regenerate"
              onClick={handleSetRegenerate}
              loading={isLoading}
              disabled={!vinPlateInfo}
            >
              Set Regenerate
            </Button>
            <Button
              className="vp-btn vp-btn-ok"
              onClick={handleSetOK}
              loading={isLoading}
              disabled={!vinPlateInfo}
            >
              Set OK
            </Button>
            <Button
              className="vp-btn vp-btn-basic"
              onClick={handleChangeToBasicInfo}
              loading={isLoading}
              disabled={!vinPlateInfo}
            >
              Change to Basic Info
            </Button>
            <Button
              className="vp-btn vp-btn-advanced"
              onClick={handleChangeToAdvancedInfo}
              loading={isLoading}
              disabled={!vinPlateInfo}
            >
              Change to Advanced Info
            </Button>
          </div>

          {vinPlateInfo && (
            <div className="vp-detail">
              <h2 className="vp-detail-title">VIN Plate Detail</h2>
              <table className="vp-detail-table">
                <tbody>
                  <tr>
                    <td className="vp-detail-label">Chassis number</td>
                    <td className="vp-detail-value">{vinPlateInfo.chassisNo}</td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Plate type</td>
                    <td className="vp-detail-value">
                      {PLATE_TYPE_MAP[vinPlateInfo.plateType] || vinPlateInfo.plateType}
                      &nbsp;({vinPlateInfo.plateType})
                    </td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Status</td>
                    <td className="vp-detail-value">
                      {STATUS_MAP[vinPlateInfo.status] || vinPlateInfo.status}
                      &nbsp;({vinPlateInfo.status})
                    </td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Error Message</td>
                    <td className="vp-detail-value vp-detail-error">
                      {vinPlateInfo.errorMessage || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Def.</td>
                    <td className="vp-detail-value">{vinPlateInfo.registerDatetime}</td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Data ready</td>
                    <td className="vp-detail-value">{vinPlateInfo.docReady}</td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Sent to CAB factory</td>
                    <td className="vp-detail-value">{vinPlateInfo.docSent || '-'}</td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">Print items</td>
                    <td className="vp-detail-value">
                      <ul className="vp-list">
                        {vinPlateInfo.printItems.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="vp-detail-label">VP Data</td>
                    <td className="vp-detail-value">
                      <table className="vp-sub-table">
                        <thead>
                          <tr>
                            <th>Variant</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vinPlateInfo.vpData.map((item, i) => (
                            <tr key={i}>
                              <td>{item.variant}</td>
                              <td>{item.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="vp-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="vp-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default VinPlate;
