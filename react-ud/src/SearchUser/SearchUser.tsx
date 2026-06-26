import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './SearchUser.css';

interface UserRecord {
  userid: string;
  username: string;
  market: string;
}

type PermissionFilter = '' | 'R' | 'T';

const SearchUser: React.FC = () => {
  const location = useLocation();
  const state = location.state as { userid?: string } | null;

  const [userid, setUserid] = useState(state?.userid || '');
  const [username, setUsername] = useState('');
  const [market, setMarket] = useState('');
  const [permissionFilter, setPermissionFilter] = useState<PermissionFilter>('');
  const [markets, setMarkets] = useState<string[]>([]);
  const [results, setResults] = useState<UserRecord[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 加载 Market 列表
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post<{ marketList: string[] }>('/ud19/selectMarketMaster', {});
        if (res.code === 200 && res.data) {
          setMarkets(res.data.marketList || []);
        }
      } catch {
        // silently fail
      }
    })();
  }, []);

  // 如果有从外部传入的 userid（如从 EDB User View），自动执行查询
  useEffect(() => {
    if (state?.userid) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.userid]);

  const clearMessages = () => setMessage('');

  const handleSearch = async () => {
    clearMessages();

    if (!userid.trim() && !username.trim() && !market && !permissionFilter) {
      setMessage('请输入至少一个查询条件');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ hdocList: UserRecord[] }>('/ud19/searchHdoc', {
        userid: userid.trim(),
        user: username.trim(),
        check: permissionFilter,
        market: market,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.hdocList || [];
        setResults(list);
        if (list.length === 0) {
          setMessage('没有找到匹配的用户');
        }
      } else {
        setMessage('没有找到匹配的用户');
      }
    } catch {
      setMessage('系统暂时不可用，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="su-container">
      <div className="su-header">
        <h1>Search User</h1>
      </div>

      {message && <div className="su-error">{message}</div>}

      {/* Search form */}
      <div className="su-form">
        <div className="su-row">
          <span className="su-label">Userid</span>
          <input
            type="text"
            className="su-input"
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
            maxLength={10}
            disabled={isLoading}
          />
        </div>
        <div className="su-row">
          <span className="su-label">User</span>
          <input
            type="text"
            className="su-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={32}
            disabled={isLoading}
          />
        </div>
        <div className="su-row su-row-market-perm">
          <div className="su-market-section">
            <span className="su-label">Market</span>
            <select
              className="su-market-listbox"
              size={Math.max(markets.length, 3)}
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              disabled={isLoading}
            >
              {markets.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="su-perm-section">
            {/* <span className="su-label">Permission</span> */}
            <div className="su-perm-group">
              <label className="su-radio-label">
                <input
                  type="radio"
                  name="permission"
                  checked={permissionFilter === ''}
                  onChange={() => setPermissionFilter('')}
                  disabled={isLoading}
                />
                <span>Not set</span>
              </label>
              <label className="su-radio-label">
                <input
                  type="radio"
                  name="permission"
                  checked={permissionFilter === 'R'}
                  onChange={() => setPermissionFilter('R')}
                  disabled={isLoading}
                />
                <span>Rule</span>
              </label>
              <label className="su-radio-label">
                <input
                  type="radio"
                  name="permission"
                  checked={permissionFilter === 'T'}
                  onChange={() => setPermissionFilter('T')}
                  disabled={isLoading}
                />
                <span>Template</span>
              </label>
            </div>
          </div>
        </div>
        <div className="su-btn-row">
          <button className="btn" onClick={handleSearch} disabled={isLoading}>Search</button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="su-table-section">
          <table className="su-table">
            <thead>
              <tr>
                <th>Userid</th>
                <th>User</th>
                <th>Market</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.userid}</td>
                  <td>{row.username}</td>
                  <td>{row.market}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="su-count">COUNT: {results.length}</div>
        </div>
      )}
    </div>
  );
};

export default SearchUser;
