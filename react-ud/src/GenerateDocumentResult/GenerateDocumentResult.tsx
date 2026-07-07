import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './GenerateDocumentResult.css';

interface GenerateDocData {
  ordernumber: string;
  buildWeek: string;
  specWeek: string;
  market: string;
  noteNo: string;
  loadIndex: string;
  frontLoadIndex: string;
  frontSpeedIndex: string;
  driveLoadIndex: string;
  driveSpeedIndex: string;
  modifyDocLink: boolean;
  replacingParameters: {
    variable: string;
  };
  informationParameter: string;
  errors: string[];
  usingTemplate: string;
}

const GenerateDocumentResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { serie: string; chnr: string; doctype: string } | null;

  const [data, setData] = useState<GenerateDocData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 固定值
  const masterMarket = '-EU';
  const hdocVersion = '4.2.1';
  const usingTemplate = 'eU/VIN PLATE_UD TRUCKS TSA INDO PHIL.rtf';

  useEffect(() => {
    if (!state || !state.serie || !state.chnr) {
      setErrorMessage('Invalid chassis information.');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setErrorMessage('');
      setIsLoading(true);
      try {
        const res = await api.post<GenerateDocData>('/generatedocument', {
          serie: state.serie,
          chnr: state.chnr,
        });

        if (res.code === 200 && res.data) {
          setData(res.data);
        } 
      } catch {
        setErrorMessage('System error. Please contact administrator.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [state]);

  const formatDateTime = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
  };

  if (isLoading) {
    return <div className="gen-doc-result-loading">Loading...</div>;
  }

  if (errorMessage) {
    return (
      <div className="gen-doc-result-container">
        <div className="gen-doc-result-error">{errorMessage}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/menu/generate-doc')}>
          Back
        </button>
      </div>
    );
  }

  const serie = state?.serie || '';
  const chnr = state?.chnr || '';

  const handleChassisNoClick = () => {
    navigate('/menu/vehicle-specification', {
      state: {
        serie,
        chnr,
      },
    });
  };

  const handleModifyDocClick = () => {
    navigate('/menu/modify-document', {
      state: {
        serie,
        chnr,
        market: data?.market || '',
        userId: localStorage.getItem('userId'),
      },
    });
  };

  return (
    <div className="gen-doc-result-container">
      <h1 className="gen-doc-result-title">Generate document</h1>

      {/* 信息列表 */}
      <div className="info-list">
        <div className="info-row">
          <span className="info-label"><strong>Chassis no</strong></span>
          <span className="info-value">
            <strong>{serie} </strong>
            <span className="link-chassis" onClick={handleChassisNoClick}>
              {chnr || '-'}
            </span>
          </span>
        </div>
        <div className="info-row">
          <span className="info-label">Ordernumber</span>
          <span className="info-value">{data?.ordernumber || '-'}</span>
        </div>
        <div className="info-row" style={{ marginTop: '10px' }}>
          <span className="info-label">Build week</span>
          <span className="info-value">{data?.buildWeek || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Spec week</span>
          <span className="info-value">{data?.specWeek || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Market</span>
          <span className="info-value">{data?.market || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Master Market</span>
          <span className="info-value">{masterMarket}</span>
        </div>
        <div className="info-row" style={{ marginTop: '30px' }}>
          <span className="info-label">S-Note NO</span>
          <span className="info-value">{data?.noteNo || '-'}</span>
        </div>
        {data?.noteNo && (
          <div className="s-note-message">
            The S-Notes above can affect homologation documents.
          </div>
        )}

        <div className="info-row" style={{ marginTop: '20px' }}>
          <span className="info-label">Front load index</span>
          <span className="info-value">FTLI-{data?.frontLoadIndex || data?.loadIndex || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Front speed index</span>
          <span className="info-value">FTSI-{data?.frontSpeedIndex || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Drive load index</span>
          <span className="info-value">DTLI-{data?.driveLoadIndex || data?.loadIndex || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Drive speed index</span>
          <span className="info-value">DTSI-{data?.driveSpeedIndex || '-'}</span>
        </div>       
      </div>

      {/* 文档信息 */}
      <div className="doc-section">
        <div className="info-row" style={{ marginTop: '25px',marginBottom: '10px' }}>
          <span className="info-value">
            <span className="link-like" onClick={() => alert('Analyze Rules clicked')}>
              Analyze Rules
            </span>
          </span>
        </div>

        {data?.modifyDocLink && (
          <div className="info-row">
            <span className="info-value modify-warning link-like" style={{ textDecorationColor: 'red', color: 'red', marginBottom: '10px', cursor: 'pointer' }} onClick={handleModifyDocClick}>
              After def change detected. Document need to be modified.
            </span>
          </div>
        )}

        <div className="info-row">
          <span className="info-label">Using template</span>
          <span className="info-value">{usingTemplate}</span>
        </div>

        <div className="info-row">
          <strong>Replacing parameters</strong>
        </div>

        <div className="info-row">
          <span className="info-label">AD Change. Modifying</span>
          <span className="info-value">
            {data?.replacingParameters?.variable || '-'}
          </span>
        </div>

        <div className="info-row" style={{ marginTop: '30px',marginBottom: '30px' }}>
          <span className="info-value">
            <span className="link-like" style={{ textDecorationColor: '#000d72', color: '#000d72'}} onClick={() => alert('Generated document clicked')}>
              <strong>Generated document</strong>
            </span>
          </span>
        </div>


        {data?.informationParameter && (
          <div className="info-row">
            <span className="info-label">Information parameter</span>
            <span className="info-value">{data.informationParameter}</span>
          </div>
        )}

        {/* 错误日志 */}
        {data?.errors && data.errors.length > 0 && (
          <div className="error-log">
            {data.errors.map((err, idx) => (
              <div key={idx} className="error-log-line">{err}</div>
            ))}
          </div>
        )}

        <div className="info-row" style={{ marginTop: '50px' }}>
          <span className="info-label">Date</span>
          <span className="info-value">{formatDateTime()}</span>
        </div>

        <div className="info-row">
          <span className="info-label">HDoc version</span>
          <span className="info-value">{hdocVersion}</span>
        </div>
      </div>

    </div>
  );
};

export default GenerateDocumentResult;
