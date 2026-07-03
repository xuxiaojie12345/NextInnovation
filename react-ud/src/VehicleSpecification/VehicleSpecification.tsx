import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { api } from '../services/api';
import '../common/css/common.css';
import './VehicleSpecification.css';

interface KolaItem {
  symbol: string;
  description: string;
}

interface VehicleSpecData {
  model: string;
  build: string;
  productType: string;
  vin: string;
  symbolStr: string;
  countryOfOperation: string;
  customerAdap: string;
  familyId: string;
  variantId: string;
  kolaList: KolaItem[];
}

const VehicleSpecification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { serie: string; chnr: string } | null;

  const [data, setData] = useState<VehicleSpecData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const serie = state?.serie || '';
  const chnr = state?.chnr || '';

  useEffect(() => {
    if (!serie || !chnr) {
      setErrorMessage('Chassis no is required. Please return to the previous page.');
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await api.post<VehicleSpecData>('/vehiclespecification', {
          serie,
          chno: chnr,
        });
        if (res.code === 200 && res.data) {
          setData(res.data);
        } else {
          setErrorMessage(res.message || 'No vehicle data found for the given chassis number.');
        }
      } catch {
        setErrorMessage('System error. Please contact administrator.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [serie, chnr]);

  if (isLoading) {
    return <div className="vs-loading">Loading vehicle specifications...</div>;
  }

  if (errorMessage) {
    return (
      <div className="vs-container">
        <div className="vs-error">{errorMessage}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/menu/generate-doc')}>Back</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="vs-container">
        <div className="vs-error">No vehicle data found for the given chassis number.</div>
        <button className="btn btn-secondary" onClick={() => navigate('/menu/generate-doc')}>Back</button>
      </div>
    );
  }

  return (
    <div className="vs-container">
      <h1 className="vs-title">VDA - Vehicle Specification</h1>

      {/* 表头左对齐 */}

      {/* 四列表格：项目名: | 项目值 | 项目名: | 项目值 */}
      <table className="vs-info-table">
        <tbody>
          <tr>
            <td className="info-label"><strong>Chassis no:</strong></td>
            <td className="info-value">{serie} {chnr}</td>
            <td className="info-label"><strong>Model:</strong></td>
            <td className="info-value">{data.model || '-'}</td>
          </tr>
          <tr>
            <td className="info-label"><strong>Built week:</strong></td>
            <td className="info-value">{data.build || '-'}</td>
            <td className="info-label"><strong>Product type:</strong></td>
            <td className="info-value">{data.productType || '-'}</td>
          </tr>
          <tr>
            <td className="info-label"><strong>VIN:</strong></td>
            <td className="info-value">{data.vin || '-'}</td>
            <td className="info-label"><strong>Engine no:</strong></td>
            <td className="info-value">{data.kolaList && data.kolaList.length > 0 ? data.kolaList[0].symbol : '-'}</td>
          </tr>
          <tr>
            <td className="info-label"><strong>Country of Operation:</strong></td>
            <td className="info-value">{data.countryOfOperation || '-'}</td>
            <td className="info-label"><strong>Symbol:</strong></td>
            <td className="info-value">{data.symbolStr || '-'}</td>
          </tr>
        </tbody>
      </table>

      {/* 间隔 30px */}
      <div style={{ height: '30px' }} />

      {/* KOLA Configuration 左对齐 */}

      {data.kolaList && data.kolaList.length > 0 ? (
        <div className="vs-symbol-list">
          {data.kolaList.map((kola, idx) => (
            <div key={idx} className="vs-symbol-item">
              <Tooltip title={kola.description} placement="bottom" >
                <span className="td-symbol">{kola.symbol}</span>
              </Tooltip>
            </div>
          ))}
        </div>
      ) : (
        <div className="vs-empty">No symbol data available.</div>
      )}

      {/* 画面底部：S-Note NO */}
      <div style={{ height: '30px'}}/>
      <div className="vs-footer">
        <strong>S-Note NO: </strong>
        <span className="vs-link-text" onClick={() => {}}>{data.customerAdap || '-'}</span>
      </div>

    </div>
  );
};

export default VehicleSpecification;
