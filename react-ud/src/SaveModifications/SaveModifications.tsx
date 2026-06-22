import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../common/css/common.css';
import './SaveModifications.css';

interface Modification {
  variable: string;
  val: string;
}

const SaveModifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    serie: string;
    chnr: string;
    doctype: string;
    version: string;
    modifications: Modification[];
    vars: string;
    hasUnreleased: boolean;
  } | null;

  if (!state) {
    return (
      <div className="save-mod-container">
        <div className="save-mod-error">Invalid chassis information.</div>
        <button className="btn btn-secondary" onClick={() => navigate('/menu/generate-doc')}>Close</button>
      </div>
    );
  }

  const handleClose = () => {
    navigate('/menu/generate-doc');
  };

  return (
    <div className="save-mod-container">
      <h1 className="save-mod-title">Save Modifications</h1>

      <div className="save-mod-info">
        <div className="save-mod-info-row">
          <span className="info-label">Chassis serie:</span>
          <span className="info-value">{state.serie}</span>
        </div>
        <div className="save-mod-info-row">
          <span className="info-label">Chassis number:</span>
          <span className="info-value">{state.chnr}</span>
        </div>
        <div className="save-mod-info-row">
          <span className="info-label">Doctype:</span>
          <span className="info-value">{state.doctype}</span>
        </div>
      </div>

      <div className="save-mod-version-row">
        <span className="info-label">Version:</span>
        <span className="info-value">{state.version}</span>
      </div>

      <div className="save-mod-version-row">
        <span className="info-label">Storing:</span>
        <span className="info-value">
          {state.modifications.map((mod, idx) => (
            <span key={idx}>{mod.variable} {mod.val}{idx < state.modifications.length - 1 ? ', ' : ''}</span>
          ))}
        </span>
      </div>

      {/* <div className="save-mod-section">
        <h2 className="save-mod-section-title">Storing: </h2>
        <table className="save-mod-table">
          <thead>
            <tr>
              <th>Variable</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {state.modifications.map((mod, idx) => (
              <tr key={idx}>
                <td className="td-var">{mod.variable}</td>
                <td className="td-val">{mod.val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}

      {/* {state.hasUnreleased && (
        <div className="save-mod-unreleased">FOUND UNRELEASED VERSION</div>
      )} */}

      <div className="save-mod-info-row" style={{ marginTop: '5px', marginBottom: '5px' }}>
        <span className="info-label">FOUND UNRELEASED VERSION:</span>
        <span className="info-value">{state.version}</span>
      </div>

      {/* <div className="save-mod-unreleased">FOUND UNRELEASED VERSION</div> */}

      <div className="save-mod-message">VERSION IS RELEASED</div>

      <div className="save-mod-actions" style={{ marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={handleClose}>Close</button>
      </div>
    </div>
  );
};

export default SaveModifications;
