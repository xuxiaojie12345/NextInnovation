import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Select, Modal } from 'antd';
import axios from 'axios';
import './Upload&Deletetemplate.css';

interface MarketItem {
  code: string;
  description: string;
}

const ALLOWED_EXTENSIONS = ['.odt', '.rtf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const UploadDeletetemplate: React.FC = () => {
  const navigate = useNavigate();

  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [uploadMarket, setUploadMarket] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteMarket, setDeleteMarket] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templateList, setTemplateList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const token = sessionStorage.getItem('userInfo');
        const response = await axios.get('/api/UD12SelectMarket', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status === 'success') {
          setMarketList(response.data.data || []);
        } else {
          showMessage('Failed to load market list.', 'error');
        }
      } catch (error: any) {
        if (error.response) {
          if (error.response.status === 401 || error.response.status === 403) {
            sessionStorage.removeItem('userInfo');
            navigate('/');
            return;
          }
          showMessage(error.response.data?.message || 'Failed to load market list.', 'error');
        } else {
          showMessage('Network connection failed. Please try again later.', 'error');
        }
      }
    };
    fetchMarkets();
  }, [navigate]);

  useEffect(() => {
    if (deleteMarket) {
      fetchTemplatesByMarket(deleteMarket);
    } else {
      setTemplateList([]);
      setSelectedTemplate('');
    }
  }, [deleteMarket]);

  const fetchTemplatesByMarket = async (market: string) => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD12GetTemplatesByMarket', {
        params: { market },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setTemplateList(response.data.data || []);
      } else {
        showMessage('Failed to load template list.', 'error');
        setTemplateList([]);
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Failed to load template list.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
      setTemplateList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      showMessage(`File type not supported. Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed.`, 'error');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showMessage('File size exceeds the maximum allowed limit (10MB).', 'error');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage('NO FILE UPLOADED.', 'error');
      return;
    }
    if (!uploadMarket) {
      showMessage('Please select a Market.', 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('market', uploadMarket);

      const response = await axios.post('/api/UD12UploadFile', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.status === 'success') {
        showMessage(response.data.message, 'success');
        setSelectedFile(null);
        const fileInput = document.getElementById('udt-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        showMessage(response.data.message || 'Failed to upload file.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Failed to upload file.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!deleteMarket) {
      showMessage('Please select a Market.', 'error');
      return;
    }
    if (!selectedTemplate) {
      showMessage('Please select a template file to delete.', 'error');
      return;
    }

    Modal.confirm({
      title: 'Confirm Deletion',
      content: 'Do you really want to delete template?',
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        setIsLoading(true);
        setMessage('');
        try {
          const token = sessionStorage.getItem('userInfo');
          const response = await axios.post(
            '/api/UD12DeleteFile',
            { market: deleteMarket, fileName: selectedTemplate },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (response.data.status === 'success') {
            showMessage(response.data.message, 'success');
            setSelectedTemplate('');
            fetchTemplatesByMarket(deleteMarket);
          } else {
            showMessage(response.data.message || 'Failed to delete file.', 'error');
          }
        } catch (error: any) {
          if (error.response) {
            if (error.response.status === 401 || error.response.status === 403) {
              sessionStorage.removeItem('userInfo');
              navigate('/');
              return;
            }
            showMessage(error.response.data?.message || 'Failed to delete file.', 'error');
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
    <div className="udt-container">
      <div className="udt-header">
        <h1 className="udt-header-title">HDoc - Upload & Delete Template</h1>
      </div>

      <div className="udt-content">
        <div className="udt-card">
          {message && (
            <div className={`udt-message udt-message-${messageType}`}>{message}</div>
          )}

          <div className="udt-section udt-upload-section">
            <h2 className="udt-section-title">Upload Template</h2>
            <div className="udt-form-row">
              <div className="udt-field udt-field-file">
                <label className="udt-label">Template File</label>
                <input
                  id="udt-file-input"
                  className="udt-file-input"
                  type="file"
                  onChange={handleFileChange}
                  accept=".odt,.rtf"
                />
                {selectedFile && (
                  <span className="udt-file-name">{selectedFile.name}</span>
                )}
              </div>
              <div className="udt-field">
                <label className="udt-label">Market (Upload)</label>
                <Select
                  className="udt-select"
                  placeholder=""
                  value={uploadMarket || undefined}
                  onChange={(v) => { setUploadMarket(v); setMessage(''); }}
                  options={marketList.map((m) => ({
                    value: m.code,
                    label: `${m.code} - ${m.description}`,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="No data"
                />
              </div>
              <div className="udt-field udt-field-btn">
                <label className="udt-label">&nbsp;</label>
                <Button
                  className="udt-btn udt-btn-upload"
                  onClick={handleUpload}
                  loading={isLoading}
                >
                  Upload
                </Button>
              </div>
            </div>
          </div>

          <div className="udt-divider" />

          <div className="udt-section udt-delete-section">
            <h2 className="udt-section-title">Delete Template</h2>
            <div className="udt-form-row">
              <div className="udt-field">
                <label className="udt-label">Market (Delete)</label>
                <Select
                  className="udt-select"
                  placeholder=""
                  value={deleteMarket || undefined}
                  allowClear
                  onChange={(v) => { setDeleteMarket(v); setMessage(''); }}
                  options={marketList.map((m) => ({
                    value: m.code,
                    label: `${m.code} - ${m.description}`,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="No data"
                />
              </div>
              <div className="udt-field">
                <label className="udt-label">Templates</label>
                <Select
                  className="udt-select"
                  placeholder=""
                  value={selectedTemplate || undefined}
                  onChange={(v) => { setSelectedTemplate(v); setMessage(''); }}
                  options={templateList.map((t) => ({ value: t, label: t }))}
                  disabled={!deleteMarket}
                  notFoundContent={deleteMarket ? 'No templates found' : 'Select a market first'}
                />
              </div>
              <div className="udt-field udt-field-btn">
                <label className="udt-label">&nbsp;</label>
                <Button
                  className="udt-btn udt-btn-delete"
                  onClick={handleDelete}
                  loading={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>

          <div className="udt-check-link">
            <a
              href="/hdoc-template-check"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                try {
                  navigate('/hdoc-template-check');
                } catch {
                  showMessage('Failed to navigate to template check page.', 'error');
                }
              }}
            >
              Check Template (Only for rtf files)
            </a>
          </div>
        </div>
      </div>

      <div className="udt-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="udt-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default UploadDeletetemplate;
