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

// 生成认证文档组件
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
    const savedSeries = localStorage.getItem('chassisSeries');
    const savedNo = localStorage.getItem('chassisNo');
    const savedDocType = localStorage.getItem('documentType');
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
            setErrorMessage('System error. Please contact administrator.');
          } else {
            setDocumentTypes(res.data);
          }
        } else {
          setErrorMessage('System error. Please contact administrator.');
        }
      } catch {
        setErrorMessage('System error. Please contact administrator.');
      } finally {
        setIsDocTypesLoading(false);
      }
    };
    loadDocumentTypes();
  }, []);

  // 保存输入条件到localStorage
  const saveInputs = useCallback(() => {
    localStorage.setItem('chassisSeries', chassisSeries);
    localStorage.setItem('chassisNo', chassisNo);
    localStorage.setItem('documentType', documentType);
  }, [chassisSeries, chassisNo, documentType]);

  const validate = (): boolean => {
    setErrorMessage('');
    
    // 数据类型check
    const seriesPattern = /^[a-zA-Z]{1,5}$/;
    const chassisNoPattern = /^[0-9]{1,10}$/;
    
    if (!chassisSeries.trim()) {
      setErrorMessage('Chassis series is required.');
      return false;
    }
    if (!seriesPattern.test(chassisSeries.trim())) {
      setErrorMessage('Chassis series must be 5 alphabetic characters.');
      return false;
    }
    if (!chassisNo.trim()) {
      setErrorMessage('Chassis no is required.');
      return false;
    }
    if (!chassisNoPattern.test(chassisNo.trim())) {
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
        if (res.message !== null) {
          setErrorMessage(res.message); 
        } else {
          setErrorMessage('System error. Please contact administrator.');
        }
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
    localStorage.removeItem('chassisSeries');
    localStorage.removeItem('chassisNo');
    localStorage.removeItem('documentType');
  };

  return (
    <div className="generate-doc-page">
      {/* 标题栏 */}
      <div className="gen-doc-header">
        <h1 className="gen-doc-header-title">HDoc - Generate Homologation Document</h1>
      </div>

      <div className="generate-doc-container">
        {/* 错误提示 */}
        {errorMessage && (
          <div className="msg-error" style={{marginTop:"-24px", marginLeft:"-24px" , marginRight:"-24px"}}>{errorMessage}</div>
        )}
        
        {/* 表单 */}
        <form onSubmit={handleSubmit} className="generate-doc-form">
          <div className="f-row" style={{gap:"12px",padding:"6px 0"}}>
            <label className="f-label required" style={{fontSize:"13px",color:"#444",minWidth:"140px",flexShrink:0}}>Chassis series</label>
            <input
              type="text"
              className="f-input" style={{width:"320px",padding:"9px 12px",border:"1px solid #acb7ee",borderRadius:"4px",fontSize:"14px",height:"auto"}}
              value={chassisSeries}
              onChange={(e) => setChassisSeries(e.target.value.replace(/[^a-zA-Z]/g, ""))}
              maxLength={5}
              disabled={isLoading}
            />
          </div>

          {/* Chassis no 项目 */}
          <div className="f-row" style={{gap:"12px",padding:"6px 0"}}>
            <label className="f-label required" style={{fontSize:"13px",color:"#444",minWidth:"140px",flexShrink:0}}>Chassis no</label>
            <input
              type="text"
              className="f-input" style={{width:"320px",padding:"9px 12px",border:"1px solid #acb7ee",borderRadius:"4px",fontSize:"14px",height:"auto"}}
              value={chassisNo}
              onChange={(e) => setChassisNo(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={10}
              disabled={isLoading}
            />
          </div>

          {/* Document type 项目 */}
          <div className="f-row" style={{gap:"12px",padding:"6px 0"}}>
            <label className="f-label required" style={{fontSize:"13px",color:"#444",minWidth:"140px",flexShrink:0}}>Document type</label>
            <select
              className="f-input" style={{width:"320px",padding:"9px 12px",border:"1px solid #acb7ee",borderRadius:"4px",fontSize:"14px",height:"auto"}}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              disabled={isLoading || isDocTypesLoading}
            >
              <option value="">-- Select Document Type --</option>
              {documentTypes.map((documentType) => (
                <option key={documentType.doctype} value={documentType.doctype}>
                  {documentType.description}
                </option>
              ))}
            </select>
          </div>

          {/* 底部按钮 */}
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
