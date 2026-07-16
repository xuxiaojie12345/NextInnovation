import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox } from 'antd';
import axios from 'axios';
import './HDocUserDocAdministration.css';

interface DocumentItem {
  doctype: string;
  businessUnit: string;
  user: string;
  date: string;
}

const HDocUserDocAdministration: React.FC = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [documentList, setDocumentList] = useState<DocumentItem[]>([]);
  const [selectedDoctypes, setSelectedDoctypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    fetchDocumentList();
  }, []);

  const fetchDocumentList = async () => {
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD20SelectHdocDocumentList', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setDocumentList(response.data.data.records || []);
      } else {
        setDocumentList([]);
      }
    } catch {
      setDocumentList([]);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleCheckboxChange = (doctype: string, checked: boolean) => {
    setMessage('');
    if (checked) {
      setSelectedDoctypes((prev) => [...prev, doctype]);
    } else {
      setSelectedDoctypes((prev) => prev.filter((d) => d !== doctype));
    }
  };

  const handleUserInfoClick = async () => {
    const trimmedId = userId.trim();
    if (!trimmedId) {
      showMessage('UserID is required.', 'error');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const authRes = await axios.post('/api/UD18SelectHdocFunctionAuth', { userId: trimmedId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (authRes.data.status !== 'success') {
        setUserName('');
        setSelectedDoctypes([]);
        showMessage(authRes.data.message || "We didn't recognize the userid you entered. Please try again.", 'error');
        setIsLoading(false);
        return;
      }
      const docRes = await axios.post('/api/UD18SelectHdocUserDoc', { userId: trimmedId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (docRes.data.status === 'success') {
        setUserName(docRes.data.data.userName || '');
        setSelectedDoctypes(docRes.data.data.doctypes || []);
        showMessage(docRes.data.message || 'Success', 'success');
      } else {
        setUserName('');
        setSelectedDoctypes([]);
        showMessage(docRes.data.message || "We didn't recognize the userid you entered. Please try again.", 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || "We didn't recognize the userid you entered. Please try again.", 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
      setUserName('');
      setSelectedDoctypes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClick = async () => {
    const trimmedId = userId.trim();
    if (!trimmedId) {
      showMessage('Please enter a UserID and click User Info first.', 'error');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      await axios.post('/api/UD18DeleteHdocUserDoc', { userId: trimmedId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedDoctypes.length > 0) {
        const createRes = await axios.post('/api/UD18CreateHdocUserDoc', {
          userId: trimmedId,
          doctypes: selectedDoctypes,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (createRes.data.status === 'success') {
          showMessage(createRes.data.message || 'User document permissions updated successfully.', 'success');
        } else {
          showMessage(createRes.data.message || 'Failed to create user document permissions.', 'error');
        }
      } else {
        showMessage('User document permissions updated successfully.', 'success');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Failed to update user document permissions.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hud-container">
      <div className="hud-header">
        <h1 className="hud-header-title">HDoc - User Doc Administration</h1>
      </div>

      <div className="hud-content">
        <div className="hud-card">
          {message && (
            <div className={`hud-message hud-message-${messageType}`}>{message}</div>
          )}

          <div className="hud-input-row">
            <div className="hud-field">
              <label className="hud-label">UserID</label>
              <div className="hud-input-group">
                <Input
                  className="hud-input"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setMessage(''); }}
                  maxLength={10}
                  placeholder="Enter user ID"
                />
                <Button
                  className="hud-btn hud-btn-info"
                  onClick={handleUserInfoClick}
                  loading={isLoading}
                >
                  User Info
                </Button>
              </div>
            </div>
          </div>

          <div className="hud-user-row">
            <span className="hud-user-label">User:</span>
            <span className={`hud-user-value ${userName ? '' : 'hud-user-placeholder'}`}>
              {userName || '---'}
            </span>
          </div>

          <div className="hud-doc-section">
            <div className="hud-doc-header-row">
              <span className="hud-doc-col-check">Document</span>
              <span className="hud-doc-col-bu">Business Unit</span>
              <span className="hud-doc-col-user">User</span>
              <span className="hud-doc-col-date">Date</span>
            </div>
            <div className="hud-doc-list">
              {documentList.length === 0 ? (
                <div className="hud-doc-empty">No documents available.</div>
              ) : (
                documentList.map((doc) => (
                  <div key={doc.doctype} className="hud-doc-row">
                    <span className="hud-doc-col-check">
                      <Checkbox
                        checked={selectedDoctypes.includes(doc.doctype)}
                        onChange={(e) => handleCheckboxChange(doc.doctype, e.target.checked)}
                      >
                        {doc.doctype}
                      </Checkbox>
                    </span>
                    <span className="hud-doc-col-bu">{doc.businessUnit}</span>
                    <span className="hud-doc-col-user">{doc.user}</span>
                    <span className="hud-doc-col-date">{doc.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="hud-buttons">
            <Button
              className="hud-btn hud-btn-update"
              onClick={handleUpdateClick}
              loading={isLoading}
            >
              Update
            </Button>
          </div>
        </div>
      </div>

      <div className="hud-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="hud-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default HDocUserDocAdministration;
