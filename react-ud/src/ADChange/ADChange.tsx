import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import axios from 'axios';
import './ADChange.css';

const { TextArea } = Input;

const ADChange: React.FC = () => {
  const navigate = useNavigate();

  const [serieChnr, setSerieChnr] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const parseSerieChnr = (input: string): { serie: string; chnr: string } | null => {
    if (!input || !input.includes('-')) return null;
    const parts = input.split('-');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return null;
    return { serie: parts[0].trim(), chnr: parts[1].trim() };
  };

  const callApi = async (endpoint: string, body: Record<string, string>) => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(endpoint, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        showMessage(response.data.message, 'success');
      } else {
        showMessage(response.data.message || 'Operation failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Operation failed.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = () => {
    if (!serieChnr.trim()) {
      showMessage('Serie-Chnr is required.', 'error');
      return;
    }
    const parsed = parseSerieChnr(serieChnr);
    if (!parsed) {
      showMessage('Invalid Serie-Chnr format. Expected format: Serie-Chnr.', 'error');
      return;
    }
    callApi('/api/UD16SelectHdocAdcaChange', { serie: parsed.serie, chnr: parsed.chnr });
  };

  const handleAdd = () => {
    if (!serieChnr.trim()) {
      showMessage('Serie-Chnr is required.', 'error');
      return;
    }
    const parsed = parseSerieChnr(serieChnr);
    if (!parsed) {
      showMessage('Invalid Serie-Chnr format. Expected format: Serie-Chnr.', 'error');
      return;
    }
    if (!desc.trim()) {
      showMessage('Description is required for ADD operation.', 'error');
      return;
    }
    callApi('/api/UD16InsertHdocAdcaChange', {
      serie: parsed.serie, chnr: parsed.chnr, reason: desc.trim(),
    });
  };

  const handleDelete = () => {
    if (!serieChnr.trim()) {
      showMessage('Serie-Chnr is required.', 'error');
      return;
    }
    const parsed = parseSerieChnr(serieChnr);
    if (!parsed) {
      showMessage('Invalid Serie-Chnr format. Expected format: Serie-Chnr.', 'error');
      return;
    }
    callApi('/api/UD16UpdateHdocAdcaChange', { serie: parsed.serie, chnr: parsed.chnr });
  };

  return (
    <div className="adc-container">
      <div className="adc-header">
        <h1 className="adc-header-title">HDoc - AD Change</h1>
      </div>

      <div className="adc-content">
        <div className="adc-card">
          {message && (
            <div className={`adc-message adc-message-${messageType}`}>{message}</div>
          )}

          <div className="adc-form-row">
            <div className="adc-field">
              <label className="adc-label">Serie-Chnr</label>
              <Input
                className="adc-input"
                value={serieChnr}
                onChange={(e) => { setSerieChnr(e.target.value); setMessage(''); }}
                maxLength={15}
                placeholder="e.g. AUS-123456"
              />
            </div>
          </div>

          <div className="adc-form-row">
            <div className="adc-field">
              <label className="adc-label">Desc</label>
              <TextArea
                className="adc-textarea"
                value={desc}
                onChange={(e) => { setDesc(e.target.value); setMessage(''); }}
                maxLength={4000}
                rows={3}
              />
            </div>
          </div>

          <div className="adc-buttons">
            <Button
              className="adc-btn adc-btn-check"
              onClick={handleCheck}
              loading={isLoading}
            >
              CHECK
            </Button>
            <Button
              className="adc-btn adc-btn-add"
              onClick={handleAdd}
              loading={isLoading}
            >
              ADD
            </Button>
            <Button
              className="adc-btn adc-btn-delete"
              onClick={handleDelete}
              loading={isLoading}
            >
              DELETE
            </Button>
          </div>
        </div>
      </div>

      <div className="adc-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="adc-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default ADChange;
