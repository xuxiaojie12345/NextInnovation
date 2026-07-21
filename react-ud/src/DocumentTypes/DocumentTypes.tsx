import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './DocumentTypes.css';

interface DocTypeRecord {
  doctype: string;
  description?: string;
}

const DocumentTypes: React.FC = () => {
  const navigate = useNavigate();

  const [documentTypes, setDocumentTypes] = useState<DocTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD20SelectHdocDocumentList', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        const records = response.data.data.records || [];
        setDocumentTypes(records);
        if (records.length === 0) {
          setMessage('No document types available.');
          setMessageType('error');
        }
      } else {
        setDocumentTypes([]);
        setMessage('Failed to load document types.');
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
      setDocumentTypes([]);
      setMessage('Failed to load document types.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnsType<DocTypeRecord> = [
    {
      title: 'Key',
      dataIndex: 'doctype',
      key: 'doctype',
      width: 200,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 400,
      render: (text: string | undefined) => text || '-',
    },
  ];

  return (
    <div className="dot-container">
      <div className="dot-header">
        <h1 className="dot-header-title">HDoc - Document Types</h1>
      </div>

      <div className="dot-content">
        <div className="dot-card">
          {message && (
            <div className={`dot-message dot-message-${messageType}`}>{message}</div>
          )}

          <Table
            className="dot-table"
            columns={columns}
            dataSource={documentTypes}
            rowKey="doctype"
            pagination={false}
            size="small"
            loading={isLoading}
            locale={{ emptyText: 'No document types available.' }}
            scroll={{ y: 420 }}
          />
        </div>
      </div>

      <div className="dot-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="dot-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default DocumentTypes;
