import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Table, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './MarketDocumentSettingsList.css';

interface DocRecord {
  doctype: string;
  businessUnit: string;
  user: string;
  date: string;
}

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [documentList, setDocumentList] = useState<DocRecord[]>([]);
  const [selectedDoctype, setSelectedDoctype] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    fetchDocumentList();
  }, []);

  const fetchDocumentList = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD20SelectHdocDocumentList', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        const records = response.data.data.records || [];
        setDocumentList(records);
        if (records.length === 0) {
          setMessage('No records found.');
          setMessageType('error');
        }
      } else {
        setDocumentList([]);
        setMessage('No records found.');
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
      setDocumentList([]);
      setMessage('Failed to load document list.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    if (!selectedDoctype) {
      setMessage('No data found.');
      setMessageType('error');
      return;
    }
    const record = documentList.find((r) => r.doctype === selectedDoctype);
    if (record) {
      localStorage.setItem('marketDocumentSettingsSelected', JSON.stringify(record));
    }
    navigate(-1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      setMessage('Failed to print the list. Please try again.');
      setMessageType('error');
    }
  };

  const handleUserClick = (userId: string) => {
    try {
      window.open(`/edb-user-view?userId=${encodeURIComponent(userId)}`, '_blank');
    } catch {
      setMessage('Failed to navigate to user details page.');
      setMessageType('error');
    }
  };

  const columns: ColumnsType<DocRecord> = [
    {
      title: 'Document type',
      dataIndex: 'doctype',
      key: 'doctype',
      width: 200,
      render: (text: string, record: DocRecord) => (
        <span
          className="mds-doctype-cell"
          onClick={() => {
            // 点击已选中行时取消选中（符合仕様書 No.19/16；已选中时原生 radio 不再触发 onChange，
            // 故由 cell onClick 处理取消，radio onChange 负责选中）
            if (selectedDoctype === record.doctype) {
              setSelectedDoctype(null);
              setMessage('');
            }
          }}
        >
          <Radio
            checked={selectedDoctype === record.doctype}
            onChange={() => {
              setSelectedDoctype(record.doctype);
              setMessage('');
            }}
          />
          <span className="mds-doctype-text">{text}</span>
        </span>
      ),
    },
    {
      title: 'Business unit',
      dataIndex: 'businessUnit',
      key: 'businessUnit',
      width: 140,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 140,
      render: (text: string) => (
        <a
          className="mds-user-link"
          onClick={(e) => { e.preventDefault(); handleUserClick(text); }}
          href={`/edb-user-view?userId=${encodeURIComponent(text)}`}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 190,
    },
  ];

  return (
    <div className="mds-container">
      <div className="mds-header">
        <h1 className="mds-header-title">HDoc - Market Document Settings List</h1>
      </div>

      <div className="mds-content">
        <div className="mds-card">
          <div className="mds-search-criteria">
            <span className="mds-criteria-label">Search Criteria:</span>
            <span className="mds-criteria-value">
              Document type: {' '}
              {(location.state as any)?.documentType || '---'}
            </span>
          </div>

          {message && (
            <div className={`mds-message mds-message-${messageType}`}>{message}</div>
          )}

          <Table
            className="mds-table"
            columns={columns}
            dataSource={documentList}
            rowKey="doctype"
            pagination={false}
            size="small"
            loading={isLoading}
            locale={{ emptyText: 'No records found.' }}
            scroll={{ y: 400 }}
          />

          <div className="mds-count-row">
            <span className="mds-count-label">Total: </span>
            <span className="mds-count-value">{documentList.length}</span>
          </div>

          <div className="mds-buttons">
            <Button
              className="mds-btn mds-btn-select"
              onClick={handleSelect}
            >
              Select
            </Button>
            <Button
              className="mds-btn mds-btn-back"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              className="mds-btn mds-btn-print"
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="mds-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="mds-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
