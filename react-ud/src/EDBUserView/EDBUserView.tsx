import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './EDBUserView.css';

interface UserAuthData {
  userId: string;
  username: string;
  authList: { function: string; market: string }[];
}

const EDBUserView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { userid?: string } | null;

  const [userid, setUserid] = useState(state?.userid || '');
  const [userData, setUserData] = useState<UserAuthData | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 如果有从外部传入的 userid，自动查询
  useEffect(() => {
    if (state?.userid) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.userid]);

  const clearMessages = () => setMessage('');

  const handleSearch = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage('We did not find the userid you entered. Please try again.');
      return;
    }

    setIsLoading(true);
    setUserData(null);

    try {
      const res = await api.post<UserAuthData>('/user/info', {
        userid: trimmedId,
      });

      if (res.code === 200 && res.data) {
        setUserData(res.data);
      } else {
        setMessage('User information not found.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUserid('');
    setUserData(null);
    clearMessages();
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="edb-container">
      <div className="edb-header">
        <h1>EDB User View</h1>
      </div>

      {message && <div className="edb-error">{message}</div>}

      {/* ── Userid 输入 ── */}
      <table className="edb-input-table">
        <tbody>
          <tr>
            <td className="edb-label-cell">Userid</td>
            <td>
              <input
                type="text"
                className="edb-input"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                disabled={isLoading}
              />
            </td>
            <td>
              <button className="btn" onClick={handleSearch} disabled={isLoading}>Search</button>
            </td>
            <td>
              <button className="btn" onClick={handleClear} disabled={isLoading}>Clear</button>
            </td>
            <td>
              <button className="btn" onClick={handleBack} disabled={isLoading}>Back</button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── 用户信息 ── */}
      {userData && (
        <div className="edb-info-section">
          <table className="edb-info-table">
            <thead>
              <tr>
                <th>Userid</th>
                <th>Responsible</th>
                <th>User Position</th>
                <th>E-mail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{userData.userId}</td>
                <td>{userData.username || '-'}</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EDBUserView;
