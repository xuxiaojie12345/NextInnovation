import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../common/css/common.css';
import './MarketsInHDoc.css';

interface MarketItem {
  market: string;
  description: string;
}

const MarketsInHDoc: React.FC = () => {
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.post<{ marketList: MarketItem[] }>('/ud21/markets', {});
        if (res.code === 200 && res.data) {
          setMarketList(res.data.marketList || []);
        } else {
          setMessage('无法获取市场信息');
        }
      } catch {
        setMessage('系统暂时不可用，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mh-container">
      <div className="mh-header">
        <h1>Markets in HDoc</h1>
      </div>

      {message && <div className="mh-error">{message}</div>}

      {isLoading ? (
        <div className="mh-loading">Loading...</div>
      ) : marketList.length > 0 ? (
        <div className="mh-table-section">
          <table className="mh-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Description</th>
                <th>Weights from Hdoc</th>
              </tr>
            </thead>
            <tbody>
              {marketList.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.market}</td>
                  <td>{item.description}</td>
                  <td>-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mh-empty">No markets found.</div>
      )}
    </div>
  );
};

export default MarketsInHDoc;
