import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './MarketsInHDoc.css';

interface MarketRecord {
  market: string;
  description: string;
}

const MarketsInHDoc: React.FC = () => {
  const navigate = useNavigate();

  const [marketList, setMarketList] = useState<MarketRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    fetchMarketList();
  }, []);

  const fetchMarketList = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD19SelectMarketMaster', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        const data = response.data.data || [];
        setMarketList(data);
        if (data.length === 0) {
          setMessage('No market data available.');
          setMessageType('error');
        }
      } else {
        setMarketList([]);
        setMessage('Failed to load market list.');
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
      }
      setMarketList([]);
      setMessage('Failed to load market list.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnsType<MarketRecord> = [
    {
      title: 'Market',
      dataIndex: 'market',
      key: 'market',
      width: 140,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: 'Weights from Hdoc',
      key: 'weights',
      width: 200,
      render: () => <span className="mih-weights-placeholder">-</span>,
    },
  ];

  return (
    <div className="mih-container">
      <div className="mih-header">
        <h1 className="mih-header-title">HDoc - Markets in HDoc</h1>
      </div>

      <div className="mih-content">
        <div className="mih-card">
          {message && (
            <div className={`mih-message mih-message-${messageType}`}>{message}</div>
          )}

          <Table
            className="mih-table"
            columns={columns}
            dataSource={marketList}
            rowKey="market"
            pagination={false}
            size="small"
            loading={isLoading}
            locale={{ emptyText: 'No market data available.' }}
            scroll={{ y: 420 }}
          />
        </div>
      </div>

      <div className="mih-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="mih-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default MarketsInHDoc;
