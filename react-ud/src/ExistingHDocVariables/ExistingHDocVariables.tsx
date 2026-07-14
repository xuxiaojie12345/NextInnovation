import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Select, Modal } from 'antd';
import axios from 'axios';
import './ExistingHDocVariables.css';

const TYPE_OPTIONS = [
  { value: 'VDA', label: 'VDA' },
  { value: 'User Defined', label: 'User Defined' },
];

const ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [variable, setVariable] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [createdByUser, setCreatedByUser] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedRecord) {
      const r = state.selectedRecord;
      setVariable(r.variable);
      setType(r.type);
      setDescription(r.description);
      setCreatedByUser(r.createdByUser || '');
      setDate(r.createdDate || '');
    } else if (state?.backCriteria) {
      const c = state.backCriteria;
      if (c.variable) setVariable(c.variable);
      if (c.type) setType(c.type);
      if (c.description) setDescription(c.description);
      if (c.createdByUser) setCreatedByUser(c.createdByUser);
      if (c.date) setDate(c.date);
    }
    window.history.replaceState({}, '');
  }, [location.state]);

  const clearForm = useCallback(() => {
    setVariable('');
    setType('');
    setDescription('');
    setCreatedByUser('');
    setDate('');
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (variable) params.variable = variable;
    if (type) params.type = type;
    if (description) params.description = description;
    if (createdByUser) params.createdByUser = createdByUser;
    if (date) params.date = date;
    navigate('/existing-hdoc-variables-result-list', { state: { searchCriteria: params } });
  };

  const handleClear = () => {
    clearForm();
    setMessage('');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAdd = async () => {
    if (!variable.trim()) {
      showMessage('Variable is required.', 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD10Add',
        { variable: variable.trim(), type: type || '', description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        showMessage('Variable added successfully.', 'success');
        clearForm();
      } else {
        showMessage(response.data.message || 'Add failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          showMessage('Variant already exists. Please enter the correct content.', 'error');
        } else {
          showMessage(error.response.data?.message || 'Add failed.', 'error');
        }
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!variable.trim()) {
      showMessage('Variable is required.', 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD10Update',
        { variable: variable.trim(), type: type || '', description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        showMessage('Variable updated successfully.', 'success');
      } else {
        showMessage(response.data.message || 'Update failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          showMessage('Variant does not exist. Please enter the correct content.', 'error');
        } else {
          showMessage(error.response.data?.message || 'Update failed.', 'error');
        }
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!variable.trim()) {
      showMessage('Variable is required.', 'error');
      return;
    }

    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Are you sure you want to delete this variable?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        setIsLoading(true);
        setMessage('');
        try {
          const token = sessionStorage.getItem('userInfo');
          const response = await axios.post(
            '/api/UD10Delete',
            { variable: variable.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.status === 'success') {
            showMessage('Variable deleted successfully.', 'success');
            clearForm();
          } else {
            showMessage(response.data.message || 'Delete failed.', 'error');
          }
        } catch (error: any) {
          if (error.response) {
            if (error.response.status === 404) {
              showMessage('Variant does not exist. Please enter the correct content.', 'error');
            } else {
              showMessage(error.response.data?.message || 'Delete failed.', 'error');
            }
          } else {
            showMessage('Network connection failed. Please try again later.', 'error');
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <div className="ehv-container">
      <div className="ehv-header">
        <h1 className="ehv-header-title">HDoc - Existing HDoc Variables</h1>
      </div>

      <div className="ehv-content">
        <div className="ehv-card">
          {message && (
            <div className={`ehv-message ehv-message-${messageType}`}>{message}</div>
          )}

          <div className="ehv-form">
            <div className="ehv-form-row">
              <div className="ehv-field">
                <label className="ehv-label">Variable</label>
                <Input
                  className="ehv-input"
                  value={variable}
                  onChange={(e) => { setVariable(e.target.value); setMessage(''); }}
                  maxLength={30}
                />
              </div>
              <div className="ehv-field">
                <label className="ehv-label">Type</label>
                <Select
                  className="ehv-select"
                  placeholder=""
                  value={type || undefined}
                  onChange={(v) => { setType(v); setMessage(''); }}
                  options={TYPE_OPTIONS}
                  allowClear
                />
              </div>
              <div className="ehv-field">
                <label className="ehv-label">Description</label>
                <Input
                  className="ehv-input"
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setMessage(''); }}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="ehv-form-row">
              <div className="ehv-field">
                <label className="ehv-label">Created by user</label>
                <Input
                  className="ehv-input"
                  value={createdByUser}
                  onChange={(e) => { setCreatedByUser(e.target.value); setMessage(''); }}
                  maxLength={16}
                />
              </div>
              <div className="ehv-field">
                <label className="ehv-label">Date</label>
                <Input
                  className="ehv-input"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setMessage(''); }}
                  placeholder="YYYY-MM-DD"
                />
              </div>
              <div className="ehv-field" />
            </div>
          </div>

          <div className="ehv-buttons">
            <Button className="ehv-btn ehv-btn-search" onClick={handleSearch} loading={isLoading}>
              Search
            </Button>
            <Button className="ehv-btn ehv-btn-clear" onClick={handleClear}>
              Clear
            </Button>
            <Button className="ehv-btn ehv-btn-back" onClick={handleBack}>
              Back
            </Button>
            <Button className="ehv-btn ehv-btn-add" onClick={handleAdd} loading={isLoading}>
              Add
            </Button>
            <Button className="ehv-btn ehv-btn-update" onClick={handleUpdate} loading={isLoading}>
              Update
            </Button>
            <Button className="ehv-btn ehv-btn-delete" onClick={handleDelete} loading={isLoading}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="ehv-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="ehv-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default ExistingHDocVariables;
