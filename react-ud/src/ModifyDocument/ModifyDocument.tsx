import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './ModifyDocument.css';

interface VariableItem {
  variable: string;
  description: string;
  newVal: string;
}

interface Modification {
  variable: string;
  val: string;
}

const ModifyDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { serie: string; chnr: string; market?: string } | null;

  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [modifiedValues, setModifiedValues] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const serie = state?.serie || '';
  const chnr = state?.chnr || '';
  const market = state?.market || '';
  const chassisDisplay = `${serie} ${chnr}`;

  useEffect(() => {
    if (!serie || !chnr) {
      setErrorMessage('Invalid chassis information.');
      setIsLoading(false);
      return;
    }

    const fetchVariables = async () => {
      setIsLoading(true);
      try {
        const res = await api.post<VariableItem[]>('/modifydocument/select', {
          serie,
          chnr,
        });
        if (res.code === 200 && res.data) {
          setVariables(res.data);
          // Initialize modified values with current values
          const initial: Record<string, string> = {};
          res.data.forEach((v) => {
            initial[v.variable] = v.newVal || '';
          });
          setModifiedValues(initial);
        } else {
          setErrorMessage(res.message || 'Vehicle data not found.');
        }
      } catch {
        setErrorMessage('System error. Please contact administrator.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariables();
  }, [serie, chnr]);

  const handleValueChange = (variable: string, value: string) => {
    setModifiedValues((prev) => ({ ...prev, [variable]: value }));
  };

  const handleSave = async () => {
    // Check for empty values
    const emptyVars = variables.filter((v) => !modifiedValues[v.variable]?.trim());
    if (emptyVars.length > 0) {
      setErrorMessage('Value is required.');
      return;
    }

    // Check if any value actually changed
    const hasChanges = variables.some(
      (v) => modifiedValues[v.variable] !== (v.newVal || '')
    );
    if (!hasChanges) {
      setErrorMessage('NO UNRELEASED VERSION EXISTS!');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const modifications = variables
        .filter((v) => modifiedValues[v.variable] !== (v.newVal || ''))
        .map((v) => ({
          variable: v.variable,
          val: modifiedValues[v.variable],
        }));

      const res = await api.post('/modifydocument/update', {
        serie,
        chnr,
        modifications,
      });

      if (res.code === 200) {
        navigate('/menu/save-modifications', {
          state: {
            serie,
            chnr,
          },
        });
      } else {
        setErrorMessage(res.message || 'Failed to save modifications.');
      }
    } catch {
      setErrorMessage('System error. Please contact administrator.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <div className="modify-doc-loading">Loading...</div>;
  }

  if (errorMessage && variables.length === 0) {
    return (
      <div className="modify-doc-container">
        <div className="modify-doc-error">{errorMessage}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  return (
    <div className="modify-doc-container">
      <h1 className="modify-doc-title">Modify Document</h1>

      <div className="modify-doc-info">
        <div className="modify-doc-info-item">
          <span className="info-label">Chassis no:</span>
          <span className="info-value">{chassisDisplay}</span>
        </div>
        <div className="modify-doc-info-item">
          <span className="info-label">Market:</span>
          <span className="info-value">{market || '-'}</span>
        </div>
      </div>

      <div className="modify-doc-template">
        <span className="modify-doc-template-link" onClick={() => alert('Template download not implemented.')}>
          Template:aus/Download Template File
        </span>
      </div>

      {errorMessage && <div className="modify-doc-error">{errorMessage}</div>}

      {variables.length > 0 ? (
        <>
          <div className="modify-doc-save-bar">
            <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {/* <button className="btn btn-secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </button> */}
          </div>

          <div className="modify-doc-table-wrapper">
            <table className="modify-doc-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Description</th>
                  <th>Current value</th>
                  <th>Modified value</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((v) => (
                  <tr key={v.variable}>
                    <td className="td-var">{v.variable}</td>
                    <td className="td-desc">{v.description}</td>
                    <td className="td-current">{v.newVal || '-'}</td>
                    <td className="td-modified">
                      <input
                        type="text"
                        className="modify-input"
                        value={modifiedValues[v.variable] || ''}
                        onChange={(e) => handleValueChange(v.variable, e.target.value)}
                        maxLength={500}
                        placeholder="Enter new value"
                        disabled={isSaving}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="modify-doc-empty">No variables found.</div>
      )}
    </div>
  );
};

export default ModifyDocument;
