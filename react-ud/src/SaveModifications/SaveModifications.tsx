import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import axios from 'axios';
import './SaveModifications.css';

interface Modification {
  variable: string;
  newValue: string;
}

interface ModificationData {
  serie: string;
  chassisNo: string;
  doctype: string;
  version: number;
  modifications: Modification[];
  foundUnreleasedVersion: boolean;
  message: string;
}

const SaveModifications: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [serie, setSerie] = useState<string>('');
  const [chassisNo, setChassisNo] = useState<string>('');
  const [doctype, setDoctype] = useState<string>('');
  const [version, setVersion] = useState<number | null>(null);
  const [modifications, setModifications] = useState<Modification[]>([]);
  const [foundUnreleasedVersion, setFoundUnreleasedVersion] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchModificationData = useCallback(async (s: string, cn: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD06SelectHdocAdcaModification',
        { serie: s, chassisNo: cn },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success' && response.data.data) {
        const d: ModificationData = response.data.data;
        setSerie(d.serie || s);
        setChassisNo(d.chassisNo || cn);
        setDoctype(d.doctype || '-');
        setVersion(d.version ?? null);
        setModifications(d.modifications || []);
        setFoundUnreleasedVersion(d.foundUnreleasedVersion ?? false);
        setApiMessage(d.message || '');
      } else {
        setErrorMessage(response.data.message || 'Failed to load modification data.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        } else if (error.response.status === 404) {
          setErrorMessage('No modification data found.');
        } else if (error.response.status >= 500) {
          setErrorMessage('System busy. Please try again later.');
        } else {
          setErrorMessage('Failed to retrieve modification data.');
        }
      } else if (error.request) {
        setErrorMessage('Network connection failed. Please try again later.');
      } else {
        setErrorMessage('Failed to retrieve modification data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const state = location.state as Record<string, any> | null;
    const chassisParam: string = state?.chassis || '';

    if (!chassisParam) {
      setErrorMessage('Invalid chassis parameter.');
      setIsLoading(false);
      return;
    }

    const parts = chassisParam.split('-');
    let s: string;
    let cn: string;
    if (parts.length >= 2) {
      s = parts[0];
      cn = parts.slice(1).join('-');
    } else {
      s = '';
      cn = chassisParam;
    }

    setSerie(s);
    setChassisNo(cn);
    fetchModificationData(s, cn);
  }, [location.state, fetchModificationData]);

  const handleClose = () => {
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        window.close();
      }
    } catch {
      navigate('/menu');
    }
  };

  if (isLoading) {
    return (
      <div className="sm-container">
        <div className="sm-header">
          <h1 className="sm-header-title">HDoc - Save Modifications</h1>
        </div>
        <div className="sm-content">
          <div className="sm-loading">
            <div className="sm-loading-spinner" />
            <p className="sm-loading-text">Loading modification data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm-container">
      <div className="sm-header">
        <h1 className="sm-header-title">HDoc - Save Modifications</h1>
      </div>

      <div className="sm-content">
        <div className="sm-card">
          {errorMessage && <div className="sm-message sm-message-error">{errorMessage}</div>}

          {!errorMessage && (
            <>
              <div className="sm-info-row">
                <span className="sm-info-label">Chassis serie</span>
                <span className="sm-info-value">{serie}</span>
              </div>
              <div className="sm-info-row">
                <span className="sm-info-label">Chassis number</span>
                <span className="sm-info-value">{chassisNo}</span>
              </div>
              <div className="sm-info-row">
                <span className="sm-info-label">Doctype</span>
                <span className="sm-info-value">{doctype}</span>
              </div>
              <div className="sm-info-row">
                <span className="sm-info-label">Version</span>
                <span className="sm-info-value">{version != null ? version : '-'}</span>
              </div>

              <div className="sm-section">
                <span className="sm-info-label">Storing</span>
                <div className="sm-storing-list">
                  {modifications.length > 0 ? (
                    modifications.map((mod, index) => (
                      <div key={index} className="sm-storing-item">
                        {mod.variable} = {mod.newValue}
                      </div>
                    ))
                  ) : (
                    <span className="sm-info-value">-</span>
                  )}
                </div>
              </div>

              <div className="sm-section">
                <div className="sm-status-row">
                  <span className="sm-status-icon">
                    {foundUnreleasedVersion ? '●' : '○'}
                  </span>
                  <span className={`sm-status-text ${foundUnreleasedVersion ? 'sm-status-found' : 'sm-status-not-found'}`}>
                    FOUND UNRELEASED VERSION
                  </span>
                </div>
                {apiMessage && (
                  <div className="sm-api-message">{apiMessage}</div>
                )}
              </div>

              <div className="sm-buttons">
                <Button
                  type="primary"
                  className="sm-button sm-button-close"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="sm-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="sm-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default SaveModifications;
