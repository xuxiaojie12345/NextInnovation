import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './GenerateHomologationDoc.css';

interface DocumentType {
  doctype: string;
  description: string;
}

interface GenerateDocData {
  ordernumber: string;
  buildWeek: string;
  specWeek: string;
  market: string;
  noteNo: string;
  loadIndex: string;
  modifyDocLink: boolean;
  replacingParameters: {
    variable: string;
  };
}

const GenerateHomologationDoc: React.FC = () => {
  const navigate = useNavigate();

  const [chassisSeries, setChassisSeries] = useState('');
  const [chassisNo, setChassisNo] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDocTypesLoading, setIsDocTypesLoading] = useState(false);

  // 恢复上次输入的条件
  useEffect(() => {
    const savedSeries = localStorage.getItem('generate_chassisSeries');
    const savedNo = localStorage.getItem('generate_chassisNo');
    const savedDocType = localStorage.getItem('generate_documentType');
    if (savedSeries) setChassisSeries(savedSeries);
    if (savedNo) setChassisNo(savedNo);
    if (savedDocType) setDocumentType(savedDocType);
  }, []);

  // 加载文档类型列表
  useEffect(() => {
    const loadDocumentTypes = async () => {
      setIsDocTypesLoading(true);
      try {
        const res = await api.get<DocumentType[]>('/document/types');
        if (res.code === 200 && res.data) {
          if (res.data.length === 0) {
            setDocumentTypes([]);
            setErrorMessage('Failed to load document types. Please try again.');
          } else {
            setDocumentTypes(res.data);
          }
        } else {
          setErrorMessage('Failed to load document types. Please try again.');
        }
      } catch {
        setErrorMessage('Failed to load document types. Please try again.');
      } finally {
        setIsDocTypesLoading(false);
      }
    };
    loadDocumentTypes();
  }, []);

  // 保存输入条件到 localStorage
  const saveInputs = useCallback(() => {
    localStorage.setItem('generate_chassisSeries', chassisSeries);
    localStorage.setItem('generate_chassisNo', chassisNo);
    localStorage.setItem('generate_documentType', documentType);
  }, [chassisSeries, chassisNo, documentType]);

  const validate = (): boolean => {
    setErrorMessage('');

    if (!chassisSeries.trim()) {
      setErrorMessage('Chassis series is required.');
      return false;
    }
    if (!/^[a-zA-Z]+$/.test(chassisSeries.trim()) || chassisSeries.trim().length > 5) {
      setErrorMessage('Chassis series must be 5 alphabetic characters.');
      return false;
    }
    if (!chassisNo.trim()) {
      setErrorMessage('Chassis no is required.');
      return false;
    }
    if (!/^[0-9]+$/.test(chassisNo.trim()) || chassisNo.trim().length > 10) {
      setErrorMessage('Chassis no must be up to 10 digits.');
      return false;
    }
    if (!documentType) {
      setErrorMessage('Document type is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    saveInputs();

    try {
      const res = await api.post<GenerateDocData>('/generatedocument', {
        serie: chassisSeries.trim(),
        chnr: chassisNo.trim(),
        doctype: documentType,
      });

      if (res.code === 200 && res.data) {
        // 跳转到 Generate Document 页面（在 Menu 布局内）
        navigate('/menu/generate-document/result', {
          state: {
            serie: chassisSeries.trim(),
            chnr: chassisNo.trim(),
            doctype: documentType,
          },
        });
      } else {
        setErrorMessage(res.message || 'System error. Please contact administrator.');
      }
    } catch {
      setErrorMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setChassisSeries('');
    setChassisNo('');
    setDocumentType('');
    setErrorMessage('');
    localStorage.removeItem('generate_chassisSeries');
    localStorage.removeItem('generate_chassisNo');
    localStorage.removeItem('generate_documentType');
  };

  return (
    <div className="generate-doc-page">
      {/* 顶部标题栏 */}
      <div className="gen-doc-header">
        <h1 className="gen-doc-header-title">HDoc - Generate Homologation Document</h1>
      </div>

      <div className="generate-doc-container">
        {/* 错误信息 */}
        {errorMessage && (
          <div className="generate-doc-error">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="generate-doc-form">
          <div className="form-row">
            <label className="form-label required">Chassis series</label>
            <input
              type="text"
              className="form-input"
              value={chassisSeries}
              onChange={(e) => setChassisSeries(e.target.value)}
              maxLength={5}
              placeholder="e.g. ABCDE"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <label className="form-label required">Chassis no</label>
            <input
              type="text"
              className="form-input"
              value={chassisNo}
              onChange={(e) => setChassisNo(e.target.value)}
              maxLength={10}
              placeholder="e.g. 1234567890"
              disabled={isLoading}
            />
          </div>

          <div className="form-row">
            <label className="form-label required">Document type</label>
            <select
              className="form-select"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isLoading || isDocTypesLoading}
            >
              <option value="">-- Select Document Type --</option>
              {documentTypes.map((dt) => (
                <option key={dt.doctype} value={dt.doctype}>
                  {dt.description}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions-wrapper">
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn btn-help"
                onClick={() => navigate('/menu/guide-user')}
              >
                Help
              </button>
            </div>
          </div>
        </form>

        {/* 底部支持信息 */}
        <div className="gen-doc-support">
          HDoc support: <a href="mailto:support.tpi@123.com">support.tpi@123.com</a>
        </div>
      </div>
    </div>
  );
};

export default GenerateHomologationDoc;
