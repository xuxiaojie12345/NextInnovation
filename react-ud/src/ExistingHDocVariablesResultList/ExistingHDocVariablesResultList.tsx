import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Table, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import axios from 'axios';
import './ExistingHDocVariablesResultList.css';

interface UD11Record {
  variable: string;
  type: string;
  description: string;
  createdByUser: string;
  createdDate: string;
}

interface UD11SearchCriteria {
  variable?: string | null;
  type?: string | null;
  description?: string | null;
  createdByUser?: string | null;
  date?: string | null;
}

const ExistingHDocVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [records, setRecords] = useState<UD11Record[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchSearchResults = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const criteria: UD11SearchCriteria = (location.state as any)?.searchCriteria || {};

      const response = await axios.post(
        '/api/UD11Search',
        criteria,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        const result = response.data.data;
        const recordList: UD11Record[] = result?.records || [];
        setRecords(recordList);
        setTotalCount(result?.totalCount || 0);
        if (recordList.length === 0) {
          showMessage('No records found matching the search criteria.', 'error');
        }
      } else {
        showMessage(response.data.message || 'Search failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Failed to retrieve variable list.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults();
  }, []);

  const handleCheckboxChange = (record: UD11Record, e: CheckboxChangeEvent) => {
    const key = record.variable;
    const newSet = new Set(selectedRowKeys);
    if (e.target.checked) {
      newSet.add(key);
    } else {
      newSet.delete(key);
    }
    setSelectedRowKeys(newSet);
  };

  const handleSelectAll = (e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      setSelectedRowKeys(new Set(records.map((r) => r.variable)));
    } else {
      setSelectedRowKeys(new Set());
    }
  };

  const handleSelect = () => {
    if (selectedRowKeys.size !== 1) {
      showMessage('Please select exactly one record.', 'error');
      return;
    }
    const selectedKey = Array.from(selectedRowKeys)[0];
    const selectedRecord = records.find((r) => r.variable === selectedKey);
    if (selectedRecord) {
      navigate('/existing-hdoc-variables', {
        state: { selectedRecord },
      });
    }
  };

  const handleDown = () => {
    if (selectedRowKeys.size === 0) {
      showMessage('No key defined for table.', 'error');
      return;
    }
    if (selectedRowKeys.size !== 1) {
      showMessage('Please select exactly one record.', 'error');
      return;
    }
    const selectedKey = Array.from(selectedRowKeys)[0];
    const selectedRecord = records.find((r) => r.variable === selectedKey);
    if (selectedRecord) {
      navigate('/homologation-variables', {
        state: { filterVariable: selectedRecord.variable },
      });
    }
  };

  const handleBack = () => {
    const searchCriteria: UD11SearchCriteria = (location.state as any)?.searchCriteria || {};
    navigate('/existing-hdoc-variables', {
      state: { backCriteria: searchCriteria },
    });
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      showMessage('Failed to print the list. Please try again.', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      showMessage('No data to export.', 'error');
      return;
    }
    try {
      const headers = ['Variable', 'Type', 'Description', 'Created by user', 'Date'];
      const csvContent = [
        headers.join(','),
        ...records.map((record) =>
          [
            `"${record.variable}"`,
            `"${record.type}"`,
            `"${record.description}"`,
            `"${record.createdByUser}"`,
            `"${record.createdDate}"`,
          ].join(','),
        ),
      ].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `HDoc_Variables_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      showMessage('Failed to export CSV file. Please try again.', 'error');
    }
  };

  const columns: ColumnsType<UD11Record> = [
    {
      title: (
        <Checkbox
          onChange={handleSelectAll}
          checked={records.length > 0 && selectedRowKeys.size === records.length}
          indeterminate={selectedRowKeys.size > 0 && selectedRowKeys.size < records.length}
        />
      ),
      key: 'checkbox',
      width: 50,
      className: 'erli-checkbox-col',
      render: (_: any, record: UD11Record) => (
        <Checkbox
          checked={selectedRowKeys.has(record.variable)}
          onChange={(e) => handleCheckboxChange(record, e)}
        />
      ),
    },
    { title: 'Variable', dataIndex: 'variable', key: 'variable', width: 150 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
    { title: 'Description', dataIndex: 'description', key: 'description', width: 250 },
    {
      title: 'Created by user',
      dataIndex: 'createdByUser',
      key: 'createdByUser',
      width: 140,
      render: (value: string) => (
        <a
          href={`/edb-user-view/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {value}
        </a>
      ),
    },
    { title: 'Date', dataIndex: 'createdDate', key: 'createdDate', width: 160 },
  ];

  return (
    <div className="erli-container">
      <div className="erli-header">
        <h1 className="erli-header-title">HDoc - Existing HDoc Variables Result List</h1>
      </div>

      <div className="erli-content">
        <div className="erli-card">
          {message && (
            <div className={`erli-message erli-message-${messageType}`}>{message}</div>
          )}

          <div className="erli-table-section">
            <Table
              className="erli-table"
              columns={columns}
              dataSource={records}
              rowKey={(record) => record.variable}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} records`,
              }}
              scroll={{ x: 870 }}
              size="small"
              loading={isLoading}
            />
          </div>

          <div className="erli-count">Number of lines found: {totalCount}</div>

          <div className="erli-buttons">
            <Button className="erli-btn erli-btn-select" onClick={handleSelect} disabled={isLoading}>
              Select
            </Button>
            <Button className="erli-btn erli-btn-down" onClick={handleDown} disabled={isLoading}>
              Down
            </Button>
            <Button className="erli-btn erli-btn-back" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
            <Button className="erli-btn erli-btn-print" onClick={handlePrint} disabled={isLoading}>
              Print
            </Button>
            <Button className="erli-btn erli-btn-excel" onClick={handleExportCSV} disabled={isLoading}>
              Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="erli-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="erli-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default ExistingHDocVariablesResultList;
