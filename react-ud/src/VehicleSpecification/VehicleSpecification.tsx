import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import axios from 'axios';
import './VehicleSpecification.css';

interface SymbolItem {
  display: string;
  description: string;
  sortKey: string;
}

interface VehicleData {
  chassisNo: string;
  model: string;
  builtWeek: string;
  productType: string;
  vin: string;
  engineNo: string;
  countryOfOperation: string;
  sNoteNo: string;
  sNoteDesc: string;
  symbolList: SymbolItem[];
  symbolStr: string;
}

const VehicleSpecification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState<VehicleData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchVehicleData = useCallback(async (chassisNo: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD07VehicleSpecificationApi',
        { chassisNo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success' && response.data.data) {
        setData(response.data.data);
      } else {
        setErrorMessage(response.data.message || 'Failed to load vehicle specification data.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        } else if (error.response.status === 404) {
          setErrorMessage('No vehicle specification data found for this chassis.');
        } else if (error.response.status >= 500) {
          setErrorMessage('System busy. Please try again later.');
        } else {
          setErrorMessage('Failed to load vehicle specification data.');
        }
      } else if (error.request) {
        setErrorMessage('Network connection failed. Please try again later.');
      } else {
        setErrorMessage('Failed to load vehicle specification data.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const state = location.state as { chassisNo?: string } | null;
    const params = new URLSearchParams(location.search);
    const chassisNo = state?.chassisNo || params.get('chassisNo') || '';

    if (!chassisNo) {
      setErrorMessage('Invalid chassis number parameter.');
      setIsLoading(false);
      return;
    }

    fetchVehicleData(chassisNo);
  }, [location.state, location.search, fetchVehicleData]);

  if (isLoading) {
    return (
      <div className="vs-container">
        <div className="vs-header">
          <h1 className="vs-header-title">HDoc - Vehicle Specification</h1>
        </div>
        <div className="vs-content">
          <div className="vs-loading">
            <div className="vs-loading-spinner" />
            <p className="vs-loading-text">Loading vehicle specification...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vs-container">
      <div className="vs-header">
        <h1 className="vs-header-title">HDoc - Vehicle Specification</h1>
      </div>

      <div className="vs-content">
        <div className="vs-card">
          {errorMessage && <div className="vs-message vs-message-error">{errorMessage}</div>}

          {!errorMessage && data && (
            <>
              <div className="vs-row">
                <span className="vs-label">Chassis no</span>
                <span className="vs-value">{data.chassisNo}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">Model</span>
                <span className="vs-value">{data.model || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">Built week</span>
                <span className="vs-value">{data.builtWeek || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">Product type</span>
                <span className="vs-value">{data.productType || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">VIN</span>
                <span className="vs-value">{data.vin || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">Engine no</span>
                <span className="vs-value">{data.engineNo || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">Country of Operation</span>
                <span className="vs-value">{data.countryOfOperation || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">SYMBOL_STR</span>
                <span className="vs-value">
                  {data.symbolList && data.symbolList.length > 0 ? (
                    <span className="vs-symbol-list">
                      {data.symbolList.map((symbol, index) => (
                        <Tooltip key={index} title={symbol.description} mouseEnterDelay={0.3}>
                          <span className="vs-symbol-item">{symbol.display}</span>
                        </Tooltip>
                      ))}
                    </span>
                  ) : (
                    '-'
                  )}
                </span>
              </div>
              <div className="vs-row">
                <span className="vs-label">S-Note NO</span>
                <span className="vs-value">{data.sNoteNo || '-'}</span>
              </div>
              <div className="vs-row">
                <span className="vs-label">S-Note Desc</span>
                <span className="vs-value">{data.sNoteDesc || '-'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="vs-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="vs-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default VehicleSpecification;
