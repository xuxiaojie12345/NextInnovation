import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Select, Radio, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import './SearchUser.css';

interface SearchResult {
  userId: string;
  userName: string;
  market: string;
}

type RoleType = 'NOT_SET' | 'RULE' | 'TEMPLATE' | null;

const SearchUser: React.FC = () => {
  const navigate = useNavigate();

  const [searchUserId, setSearchUserId] = useState<string>('');
  const [searchUserName, setSearchUserName] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string | undefined>(undefined);
  const [roleType, setRoleType] = useState<RoleType>(null);
  const [marketList, setMarketList] = useState<{ market: string; description: string }[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    fetchMarketList();
  }, []);

  const fetchMarketList = async () => {
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD19SelectMarketMaster', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setMarketList(response.data.data || []);
      } else {
        setMarketList([]);
      }
    } catch {
      setMarketList([]);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

  const handleSearch = async () => {
    const userIdTrim = searchUserId.trim();
    const userNameTrim = searchUserName.trim();

    if (!userIdTrim && !userNameTrim && !selectedMarket && !roleType) {
      showMessage('At least one search condition is required.', 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    setHasSearched(true);

    try {
      const token = sessionStorage.getItem('userInfo');
      const body: Record<string, any> = {};
      if (userIdTrim) body.userId = userIdTrim;
      if (userNameTrim) body.userName = userNameTrim;
      if (selectedMarket) body.market = selectedMarket;
      if (roleType) body.roleType = roleType;

      const response = await axios.post('/api/UD19SearchHdoc', body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 'success') {
        setSearchResults(response.data.data.records || []);
        setTotalCount(response.data.data.totalCount || 0);
        if ((response.data.data.records || []).length === 0) {
          showMessage('No users found matching the criteria.', 'error');
        } else {
          showMessage(`Found ${response.data.data.totalCount} user(s).`, 'success');
        }
      } else {
        setSearchResults([]);
        setTotalCount(0);
        showMessage(response.data.message || 'No users found matching the criteria.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'No users found matching the criteria.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const marketOptions = marketList.map((m) => ({
    value: m.market,
    label: `${m.market} - ${m.description}`,
  }));

  const columns: ColumnsType<SearchResult> = [
    {
      title: 'Userid',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
    },
    {
      title: 'Market',
      dataIndex: 'market',
      key: 'market',
      width: 100,
    },
  ];

  return (
    <div className="sru-container">
      <div className="sru-header">
        <h1 className="sru-header-title">HDoc - Search User</h1>
      </div>

      <div className="sru-content">
        <div className="sru-card">
          {message && (
            <div className={`sru-message sru-message-${messageType}`}>{message}</div>
          )}

          <div className="sru-search-section">
            <div className="sru-form-row">
              <div className="sru-field">
                <label className="sru-label">Userid</label>
                <Input
                  className="sru-input"
                  value={searchUserId}
                  onChange={(e) => { setSearchUserId(e.target.value); clearMessage(); }}
                  maxLength={10}
                  placeholder="Search by user ID"
                />
              </div>
              <div className="sru-field">
                <label className="sru-label">User</label>
                <Input
                  className="sru-input"
                  value={searchUserName}
                  onChange={(e) => { setSearchUserName(e.target.value); clearMessage(); }}
                  maxLength={32}
                  placeholder="Search by user name"
                />
              </div>
            </div>

            <div className="sru-form-row">
              <div className="sru-field">
                <label className="sru-label">Market</label>
                <Select
                  className="sru-select"
                  value={selectedMarket}
                  onChange={(val) => { setSelectedMarket(val); clearMessage(); }}
                  placeholder="Select market"
                  options={marketOptions}
                  allowClear
                  style={{ width: '100%' }}
                />
              </div>
              <div className="sru-field">
                <label className="sru-label">Role</label>
                <Radio.Group
                  className="sru-radio-group"
                  value={roleType}
                  onChange={(e) => { setRoleType(e.target.value); clearMessage(); }}
                >
                  <Radio value="NOT_SET">Not set</Radio>
                  <Radio value="RULE">Rule</Radio>
                  <Radio value="TEMPLATE">Template</Radio>
                </Radio.Group>
              </div>
            </div>

            <div className="sru-search-btn-row">
              <Button
                className="sru-btn sru-btn-search"
                onClick={handleSearch}
                loading={isLoading}
              >
                Search
              </Button>
            </div>
          </div>

          {hasSearched && (
            <div className="sru-results-section">
              <div className="sru-count-row">
                <span className="sru-count-label">COUNT: </span>
                <span className="sru-count-value">{totalCount}</span>
              </div>

              <Table
                className="sru-table"
                columns={columns}
                dataSource={searchResults}
                rowKey="userId"
                pagination={false}
                size="small"
                locale={{ emptyText: 'No users found.' }}
                scroll={{ y: 360 }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="sru-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="sru-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default SearchUser;
