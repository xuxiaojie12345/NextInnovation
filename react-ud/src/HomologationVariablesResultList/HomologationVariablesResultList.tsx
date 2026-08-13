import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Table, Checkbox, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import axios from 'axios';
import './HomologationVariablesResultList.css';

interface UD09Record {
  pc: string;
  num: number;
  market: string;
  variable: string;
  val: string;
  vs: string;
  vs2: string;
  comments: string;
  addDate: string;
  deleteDate: string | null;
  registerUser: string;
  registerDatetime: string;
}

interface UD09SearchCriteria {
  pc?: string | null;
  num?: string | null;
  market?: string | null;
  variable?: string | null;
  val?: string | null;
  vs?: string | null;
  vs2?: string | null;
  comments?: string | null;
  addDateFrom?: string | null;
  addDateTo?: string | null;
  deleteDateFrom?: string | null;
  deleteDateTo?: string | null;
  createdByUser?: string | null;
}

const HomologationVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [records, setRecords] = useState<UD09Record[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const getPk = (r: UD09Record) => `${r.pc}_${r.num}_${r.market}`;

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const fetchSearchResults = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const criteria: UD09SearchCriteria = (location.state as any)?.searchCriteria || {};

      const response = await axios.post(
        '/api/UD09Search',
        criteria,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        const result = response.data.data;
        const recordList: UD09Record[] = result?.records || [];
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
        showMessage(error.response.data?.message || 'Search failed.', 'error');
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

  const handleCheckboxChange = (record: UD09Record, e: CheckboxChangeEvent) => {
    const pk = getPk(record);
    const newSet = new Set(selectedRowKeys);
    if (e.target.checked) {
      newSet.add(pk);
    } else {
      newSet.delete(pk);
    }
    setSelectedRowKeys(newSet);
  };

  const handleSelectAll = (e: CheckboxChangeEvent) => {
    if (e.target.checked) {
      setSelectedRowKeys(new Set(records.map(getPk)));
    } else {
      setSelectedRowKeys(new Set());
    }
  };

  const handleSelect = () => {
    if (selectedRowKeys.size === 0) {
      showMessage('Please select at least one record.', 'error');
      return;
    }
    const firstKey = Array.from(selectedRowKeys)[0];
    const firstRecord = records.find((r) => getPk(r) === firstKey);
    if (firstRecord) {
      navigate('/homologation-variables', {
        state: { selectedRecord: firstRecord },
      });
    }
  };

  const handleBack = () => {
    const searchCriteria: UD09SearchCriteria = (location.state as any)?.searchCriteria || {};
    navigate('/homologation-variables', {
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

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.size === 0) {
      showMessage('Please select at least one record to delete.', 'error');
      return;
    }
    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete the selected records?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        setIsLoading(true);
        setMessage('');
        try {
          const token = sessionStorage.getItem('userInfo');
          const selectedRecords = Array.from(selectedRowKeys).map((key) => {
            const [pc, num, market] = key.split('_');
            return { pc, num: parseInt(num, 10), market };
          });

          const response = await axios.post(
            '/api/UD09DeleteSelected',
            { selectedRecords },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.status === 'success') {
            setSelectedRowKeys(new Set());
            await fetchSearchResults();
            showMessage(response.data.message || 'Records deleted successfully.', 'success');
          } else {
            showMessage(response.data.message || 'Failed to delete selected records.', 'error');
          }
        } catch (error: any) {
          if (error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
              sessionStorage.removeItem('userInfo');
              navigate('/');
              return;
            }
            showMessage(error.response.data?.message || 'Failed to delete selected records. Please try again later.', 'error');
          } else {
            showMessage('Network connection failed. Please try again later.', 'error');
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const columns: ColumnsType<UD09Record> = [
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
      className: 'hvrl-checkbox-col',
      render: (_: any, record: UD09Record) => (
        <Checkbox
          checked={selectedRowKeys.has(getPk(record))}
          onChange={(e) => handleCheckboxChange(record, e)}
        />
      ),
    },
    { title: 'Product class', dataIndex: 'pc', key: 'pc', width: 100 },
    { title: 'Number', dataIndex: 'num', key: 'num', width: 100 },
    { title: 'Market', dataIndex: 'market', key: 'market', width: 80 },
    { title: 'Variable', dataIndex: 'variable', key: 'variable', width: 150 },
    { title: 'Value', dataIndex: 'val', key: 'val', width: 120 },
    { title: 'Variant string', dataIndex: 'vs', key: 'vs', width: 120 },
    { title: 'Comments', dataIndex: 'comments', key: 'comments', width: 120 },
    { title: 'Add', dataIndex: 'addDate', key: 'addDate', width: 90 },
    { title: 'Delete', dataIndex: 'deleteDate', key: 'deleteDate', width: 90, render: (v: string | null) => v || '' },
    {
      title: 'Created by user',
      dataIndex: 'registerUser',
      key: 'registerUser',
      width: 120,
      render: (value: string) => (
        <a
          href={`/edb-user-view/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {value}
        </a>
      ),
    },
    { title: 'Date', dataIndex: 'registerDatetime', key: 'registerDatetime', width: 140 },
  ];

  return (
    <div className="hvrl-container">
      <div className="hvrl-header">
        <h1 className="hvrl-header-title">HDoc - Homologation Variables Result List</h1>
      </div>

      <div className="hvrl-content">
        <div className="hvrl-card">
          {message && (
            <div className={`hvrl-message hvrl-message-${messageType}`}>{message}</div>
          )}

          <div className="hvrl-table-section">
            <Table
              className="hvrl-table"
              columns={columns}
              dataSource={records}
              rowKey={getPk}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} records`,
              }}
              scroll={{ x: 1300 }}
              size="small"
              loading={isLoading}
            />
          </div>

          <div className="hvrl-count">Number of lines found: {totalCount}</div>

          <div className="hvrl-buttons">
            <Button className="hvrl-btn hvrl-btn-select" onClick={handleSelect} disabled={isLoading}>
              Select
            </Button>
            <Button className="hvrl-btn hvrl-btn-back" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
            <Button className="hvrl-btn hvrl-btn-print" onClick={handlePrint} disabled={isLoading}>
              Print
            </Button>
            <Button
              className="hvrl-btn hvrl-btn-delete"
              onClick={handleDeleteSelected}
              disabled={isLoading}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      </div>

      <div className="hvrl-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="hvrl-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default HomologationVariablesResultList;
