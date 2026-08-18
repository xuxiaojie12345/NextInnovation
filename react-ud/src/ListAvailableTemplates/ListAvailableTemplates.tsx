import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './ListAvailableTemplates.css';

interface MarketInfo {
  code: string;
  description: string;
}

interface TemplateFileInfo {
  filename: string;
  used: string;
  lastMod: string;
  size: string;
}

const ListAvailableTemplates: React.FC = () => {
  const navigate = useNavigate();

  const [marketList, setMarketList] = useState<MarketInfo[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [templateList, setTemplateList] = useState<TemplateFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const token = sessionStorage.getItem('userInfo');
        const response = await axios.get('/api/UD14SelectMarketmaster', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status === 'success') {
          setMarketList(response.data.data || []);
        } else {
          showMessage('Failed to load market list.', 'error');
        }
      } catch (error: any) {
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            sessionStorage.removeItem('userInfo');
            navigate('/');
            return;
          }
          showMessage(error.response.data?.message || 'Failed to load market list.', 'error');
        } else {
          showMessage('Network connection failed. Please try again later.', 'error');
        }
      }
    };
    fetchMarkets();
  }, [navigate]);

  useEffect(() => {
    if (selectedMarket) {
      fetchTemplateList(selectedMarket);
    } else {
      setTemplateList([]);
      setMessage('');
    }
  }, [selectedMarket]);

  const fetchTemplateList = async (market: string) => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD14SelectHdocuserdefinedrules', {
        params: { market },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        const templates: TemplateFileInfo[] = response.data.data || [];
        setTemplateList(templates);
        if (templates.length === 0) {
          showMessage('No templates found for the selected market.', 'error');
        }
      } else {
        showMessage(response.data.message || 'Failed to load template list.', 'error');
        setTemplateList([]);
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Failed to load template list.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
      setTemplateList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (filename: string) => {
    if (!selectedMarket) return;
    window.location.href = `/api/UD14downfile?market=${encodeURIComponent(selectedMarket)}&fileName=${encodeURIComponent(filename)}`;
  };

  const columns: ColumnsType<TemplateFileInfo> = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
      width: 250,
      render: (value: string) => (
        <a
          href="#"
          className="lat-file-link"
          onClick={(e) => {
            e.preventDefault();
            handleDownload(value);
          }}
        >
          {value}
        </a>
      ),
    },
    { title: 'Used', dataIndex: 'used', key: 'used', width: 220 },
    { title: 'Last Mod', dataIndex: 'lastMod', key: 'lastMod', width: 160 },
    { title: 'Size', dataIndex: 'size', key: 'size', width: 100 },
  ];

  return (
    <div className="lat-container">
      <div className="lat-header">
        <h1 className="lat-header-title">HDoc - List Available Templates</h1>
      </div>

      <div className="lat-content">
        <div className="lat-card">
          {message && (
            <div className={`lat-message lat-message-${messageType}`}>{message}</div>
          )}

          <div className="lat-market-row">
            <div className="lat-field">
              <label className="lat-label">Select Market</label>
              <Select
                className="lat-select"
                placeholder=""
                value={selectedMarket || undefined}
                allowClear
                onChange={(v) => { setSelectedMarket(v); setMessage(''); }}
                options={marketList.map((m) => ({
                  value: m.code,
                  label: `${m.code} - ${m.description}`,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent="No data"
              />
            </div>
          </div>

          {selectedMarket && (
            <div className="lat-table-section">
              <Table
                className="lat-table"
                columns={columns}
                dataSource={templateList}
                rowKey={(record) => record.filename}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} templates`,
                }}
                scroll={{ x: 730 }}
                size="small"
                loading={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      <div className="lat-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="lat-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default ListAvailableTemplates;
