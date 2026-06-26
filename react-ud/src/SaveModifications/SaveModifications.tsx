import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './SaveModifications.css';

interface Modification {
  variable: string;
  newVal: string;
}

interface SaveModData {
  doctype: string;
  version: string;
  modifications: Modification[];
  hasUnreleasedVersion: boolean;
}

const SaveModifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { serie: string; chnr: string } | null;

  const [data, setData] = useState<SaveModData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!state || !state.serie || !state.chnr) {
      setErrorMessage('Invalid chassis information.');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [serie, chnr] = state.chnr.includes('-')
          ? state.chnr.split('-')
          : [state.serie, state.chnr];

        const res = await api.post<SaveModData>('/adcamodification', { serie, chno: chnr });

        if (res.code === 200 && res.data) {
          setData(res.data);
        } else {
          setErrorMessage(res.message || 'No modifications found.');
        }
      } catch {
        setErrorMessage('System error. Please contact administrator.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [state]);

  const handleClose = () => {
    navigate('/menu/generate-doc');
  };

  if (isLoading) {
    return (
      <div className="save-mod-container">
        <div className="save-mod-loading">Loading...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="save-mod-container">
        <div className="save-mod-error">{errorMessage}</div>
        <button className="btn btn-secondary" onClick={handleClose}>Close</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="save-mod-container">
        <div className="save-mod-error">Invalid chassis information.</div>
        <button className="btn btn-secondary" onClick={handleClose}>Close</button>
      </div>
    );
  }

  return (
    <div className="save-mod-container">
      <h1 className="save-mod-title">Save Modifications</h1>

      <div className="save-mod-info">
        <div className="save-mod-info-row">
          <span className="info-label">Chassis serie:</span>
          <span className="info-value">{state?.serie}</span>
        </div>
        <div className="save-mod-info-row">
          <span className="info-label">Chassis number:</span>
          <span className="info-value">{state?.chnr}</span>
        </div>
        <div className="save-mod-info-row">
          <span className="info-label">Doctype:</span>
          <span className="info-value">{data.doctype}</span>
        </div>
      </div>

      <div className="save-mod-version-row">
        <span className="info-label">Version:</span>
        <span className="info-value">{data.version}</span>
      </div>

      <div className="save-mod-version-row">
        <span className="info-label">Storing:</span>
        <span className="info-value">
          {data.modifications.map((mod, idx) => (
            <span key={idx}>{mod.variable} {mod.newVal}{idx < data.modifications.length - 1 ? ', ' : ''}</span>
          ))}
        </span>
      </div>

      {data.hasUnreleasedVersion && (
        <div className="save-mod-unreleased">FOUND UNRELEASED VERSION</div>
      )}

      <div className="save-mod-message">VERSION IS RELEASED</div>

      <div className="save-mod-actions" style={{ marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={handleClose}>Close</button>
      </div>
    </div>
  );
};

export default SaveModifications;
