import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Button } from 'antd';
import axios from 'axios';
import './ModifyDocument.css';

interface VariableItem {
  variable: string;
  description: string;
  currentValue: string;
  modifiedValue: string;
  editable: boolean;
}

interface ApiResponse {
  status: string;
  code: number;
  data: {
    variables: VariableItem[];
  } | null;
  message: string;
}

const ModifyDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [chassisNo, setChassisNo] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchVariableData = useCallback(async (chassis: string) => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post<ApiResponse>(
        '/api/UD05SelectVariableModification',
        { chassisNo: chassis },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success' && response.data.data) {
        setVariables(response.data.data.variables);
      } else {
        setMessage(response.data.message || 'Failed to load variable data.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        } else if (error.response.status === 404) {
          setMessage('Chassis not found or no variable data available');
        } else if (error.response.status >= 500) {
          setMessage('System busy, please try again later.');
        } else {
          setMessage('Failed to load variable data. Please try again.');
        }
      } else if (error.request) {
        setMessage('Failed to load variable data. Please try again.');
      } else {
        setMessage('Failed to load variable data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const state = location.state as { chassisNo?: string; market?: string } | null;
    const chassis = state?.chassisNo || '';
    const mkt = state?.market || '';

    if (!chassis) {
      setMessage('Invalid request. Missing chassis number.');
      setIsLoading(false);
      return;
    }

    setChassisNo(chassis);
    setMarket(mkt);
    fetchVariableData(chassis);
  }, [location.state, fetchVariableData]);

  const handleModifiedValueChange = (index: number, value: string) => {
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], modifiedValue: value };
      return updated;
    });
    if (message) setMessage('');
  };

  const handleSave = async () => {
    const modifiedVariables = variables.filter(
      (v) => v.modifiedValue && v.modifiedValue.trim() !== '' && v.modifiedValue.trim() !== v.currentValue
    );

    if (modifiedVariables.length === 0) {
      setMessage('NO UNRELEASED VERSION EXISTS!');
      return;
    }

    setIsSaving(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD05UpdateHdocAdcaModification',
        { chassisNo, variables: modifiedVariables },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        navigate('/save-modifications', {
          state: { chassis: chassisNo, variables: modifiedVariables },
        });
      } else {
        setMessage(response.data.message || 'Failed to save modifications.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
        } else if (error.response.status === 409) {
          setMessage('Data has been modified by others. Please refresh and try again.');
        } else if (error.response.status >= 500) {
          setMessage('System busy, please try again later.');
        } else {
          setMessage(error.response.data?.message || 'Failed to save modifications.');
        }
      } else if (error.request) {
        setMessage('Failed to save modifications. Please try again.');
      } else {
        setMessage('Failed to save modifications. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateDownload = async () => {
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/download/template', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_${chassisNo}.trf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage('Template file download failed. Please contact administrator.');
    }
  };

  const handleChassisLink = () => {
    // 与 SaveModifications 一致：通过 React Router navigate 在右侧内容区跳转，
    // 并以 state 传递 chassisNo（VehicleSpecification 从 location.state 读取）。
    navigate('/vda-vehicle-specification', {
      state: { chassisNo },
    });
  };

  if (isLoading) {
    return (
      <div className="md-container">
        <div className="md-header">
          <h1 className="md-header-title">HDoc - Modify Document</h1>
        </div>
        <div className="md-content">
          <div className="md-loading">
            <div className="md-loading-spinner" />
            <p className="md-loading-text">Loading variable data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md-container">
      <div className="md-header">
        <h1 className="md-header-title">HDoc - Modify Document</h1>
      </div>

      <div className="md-content">
        <div className="md-card">
          {message && <div className="md-message">{message}</div>}

          <div className="md-info-row">
            <span className="md-info-label">chassis no</span>
            <span className="md-link" onClick={handleChassisLink} role="button" tabIndex={0}>
              {chassisNo}
            </span>
          </div>
          <div className="md-info-row">
            <span className="md-info-label">Market</span>
            <span className="md-info-value">{market || '-'}</span>
          </div>
          <div className="md-info-row">
            <span className="md-info-label">Template</span>
            <span className="md-link" onClick={handleTemplateDownload} role="button" tabIndex={0}>
              Download template file
            </span>
          </div>

          {variables.length > 0 && (
            <div className="md-table-wrapper">
              <table className="md-table">
                <thead>
                  <tr>
                    <th className="md-th md-th-variable">Variable</th>
                    <th className="md-th md-th-desc">Description</th>
                    <th className="md-th md-th-current">Current value</th>
                    <th className="md-th md-th-modified">Modified value</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((item, index) => (
                    <tr key={item.variable} className="md-tr">
                      <td className="md-td md-td-variable">{item.variable}</td>
                      <td className="md-td md-td-desc">{item.description}</td>
                      <td className="md-td md-td-current">{item.currentValue || '-'}</td>
                      <td className="md-td md-td-modified">
                        <Input
                          className="md-input"
                          value={item.modifiedValue ?? ''}
                          onChange={(e) => handleModifiedValueChange(index, e.target.value)}
                          disabled={!item.editable}
                          maxLength={500}
                          placeholder={item.editable ? '' : '-'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="md-buttons">
            <Button
              type="primary"
              className="md-button md-button-save"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="md-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="md-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default ModifyDocument;
