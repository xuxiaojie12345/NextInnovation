import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import axios from 'axios';
import './UserView.css';

interface UserInfo {
  userId: string;
  userName: string;
  responsible: string;
  userPosition: string;
  email: string;
}

const UserView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');

    if (!userId) {
      setMessage('UserID parameter is missing.');
      setMessageType('error');
      return;
    }

    fetchUserInfo(userId);
  }, [location]);

  const fetchUserInfo = async (userId: string) => {
    setIsLoading(true);
    setMessage('');
    setUserInfo(null);
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post('/api/authentication', { userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setUserInfo(response.data.data);
        setMessageType('success');
      } else {
        setMessage(response.data.message || 'User not found. Please try again.');
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        setMessage(error.response.data?.message || 'User not found. Please try again.');
      } else {
        setMessage('Network connection failed. Please try again later.');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUserInfo(null);
    setMessage('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="uev-container">
      <div className="uev-header">
        <h1 className="uev-header-title">HDoc - EDB User View</h1>
      </div>

      <div className="uev-content">
        <div className="uev-card">
          {message && (
            <div className={`uev-message uev-message-${messageType}`}>{message}</div>
          )}

          {isLoading ? (
            <div className="uev-loading">Loading user information...</div>
          ) : userInfo ? (
            <div className="uev-details">
              <div className="uev-info-row">
                <span className="uev-label">Userid:</span>
                <span className="uev-value">{userInfo.userId}</span>
              </div>
              <div className="uev-info-row">
                <span className="uev-label">Responsible:</span>
                <span className="uev-value">{userInfo.responsible}</span>
              </div>
              <div className="uev-info-row">
                <span className="uev-label">User Position:</span>
                <span className="uev-value">{userInfo.userPosition}</span>
              </div>
              <div className="uev-info-row">
                <span className="uev-label">E-mail:</span>
                <span className="uev-value">
                  <a className="uev-email-link" href={`mailto:${userInfo.email}`}>
                    {userInfo.email}
                  </a>
                </span>
              </div>
            </div>
          ) : (
            <div className="uev-no-data">
              {message ? '' : 'No user information available.'}
            </div>
          )}

          <div className="uev-buttons">
            <Button
              className="uev-btn uev-btn-clear"
              onClick={handleClear}
              disabled={isLoading || !userInfo}
            >
              Clear
            </Button>
            <Button
              className="uev-btn uev-btn-back"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="uev-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="uev-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default UserView;
