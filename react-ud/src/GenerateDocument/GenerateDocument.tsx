import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import './GenerateDocument.css';

// 替换参数项
interface ReplacingParameter {
  variable: string;
  newVal: string;
}

// API 返回的数据结构
interface DocumentData {
  chassisInfo: string;
  ordernumber: string;
  buildWeek: number | string;
  specWeek: number | string;
  sNoteNo: string;
  market: string;
  masterMarket: string;
  loadIndex: string;
  sNoteMessage: string;
  adChangeActive: boolean;
  modifyLinkText: string;
  usingTemplate: string;
  replacingParameters: ReplacingParameter[];
  generatedFileUrl: string;
  serverDate: string;
  hDocVersion: string;
}

const GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 画面状态
  const [data, setData] = useState<DocumentData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 从 API 获取文档数据
  const fetchDocumentData = useCallback(async (chassisNo: string, docType: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD04SelectGeneratedocumentApi', {
        headers: { Authorization: `Bearer ${token}` },
        params: { chassisNo, docType },
      });
      if (response.data.status === 'success' && response.data.data) {
        setData(response.data.data);
      } else {
        setErrorMessage(response.data.message || 'Failed to load document data.');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        } else if (error.response.status === 400) {
          setErrorMessage(`Invalid request: ${error.response.data?.message || 'Missing required parameters.'}`);
        } else if (error.response.status === 404) {
          setErrorMessage('No data found for the given chassis.');
        } else if (error.response.status >= 500) {
          setErrorMessage(`Batch processing failed: ${error.response.data?.message || 'Internal server error.'}`);
        } else {
          setErrorMessage('Failed to load document data. Please try again.');
        }
      } else if (error.request) {
        setErrorMessage('Failed to load document data. Please try again.');
      } else {
        setErrorMessage('Failed to load document data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // 组件初始化
  useEffect(() => {
    // 优先从 location.state 获取参数（前画面跳转传入）
    const state = location.state as { chassisSeries?: string; chassisNo?: string; documentType?: string } | null;
    const params = new URLSearchParams(location.search);
    const chassisNo = state?.chassisNo || params.get('chassisNo') || '';
    const docType = state?.documentType || params.get('docType') || 'VIN-PLATE';

    if (!chassisNo || !docType) {
      setErrorMessage('Invalid request. Missing required parameters.');
      setIsLoading(false);
      return;
    }

    fetchDocumentData(chassisNo, docType);
  }, [location.state, location.search, fetchDocumentData]);

  // 下载生成的文件
  const handleDownload = async () => {
    if (!data?.generatedFileUrl) return;
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get(data.generatedFileUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = data.generatedFileUrl.split('/').pop() || 'document.trf';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErrorMessage('Generated file not found or expired.');
      } else {
        setErrorMessage('Failed to download file. Please try again.');
      }
    }
  };

  // 跳转至 HDOC DEBUG 画面
  const handleAnalyzeRules = () => {
    window.open('/hdoc-debug', '_blank');
  };

  // 跳转至 Modify Document 画面
  const handleModifyDoc = () => {
    navigate('/modify-document', {
      state: {
        chassisNo: data?.chassisInfo || '',
      },
    });
  };

  // 重试
  const handleRetry = () => {
    const state = location.state as { chassisNo?: string; documentType?: string } | null;
    const chassisNo = state?.chassisNo || new URLSearchParams(location.search).get('chassisNo') || '';
    const docType = state?.documentType || new URLSearchParams(location.search).get('docType') || 'VIN-PLATE';
    if (chassisNo) {
      fetchDocumentData(chassisNo, docType);
    }
  };

  // 解析 S-Note 列表（以逗号或分号分隔）
  const parseSNoteList = (sNoteNo: string): string[] => {
    if (!sNoteNo) return [];
    return sNoteNo.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  };

  // 解析 Load Index 为结构化数据
  const parseLoadIndex = (loadIndex: string) => {
    if (!loadIndex) return null;
    // 期望格式如 "FTLI-150, FTSI-K, DTLI-147, DTSI-K"
    const parts = loadIndex.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 4) {
      return { frontTLI: parts[0], frontTSI: parts[1], driveTLI: parts[2], driveTSI: parts[3] };
    }
    return { raw: loadIndex };
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="gd-container">
        <div className="gd-header">
          <h1 className="gd-header-title">HDoc - Generate document</h1>
        </div>
        <div className="gd-content">
          <div className="gd-loading">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 36, color: '#003366' }} spin />} />
            <p className="gd-loading-text">Loading document data...</p>
          </div>
        </div>
        <div className="gd-footer">
          <span className="gd-footer-item">Loading...</span>
          <span className="gd-footer-item">Loading...</span>
        </div>
      </div>
    );
  }

  // 错误状态（参数缺失）
  if (errorMessage && !data) {
    return (
      <div className="gd-container">
        <div className="gd-header">
          <h1 className="gd-header-title">HDoc - Generate document</h1>
        </div>
        <div className="gd-content">
          <div className="gd-card">
            <div className="gd-error-message">{errorMessage}</div>
            <div className="gd-back-link" onClick={() => navigate('/GenerateHomologationDocument')}>
              &laquo; Back to Generate Homologation Document
            </div>
            <button className="gd-retry-button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const loadIndexParsed = data?.loadIndex ? parseLoadIndex(data.loadIndex) : null;

  return (
    <div className="gd-container">
      {/* 顶部标题栏 */}
      <div className="gd-header">
        <h1 className="gd-header-title">HDoc - Generate document</h1>
      </div>

      {/* 内容区域 */}
      <div className="gd-content">
        <div className="gd-card">
          {/* 错误消息 */}
          {errorMessage && (
            <div className="gd-error-message">{errorMessage}</div>
          )}

          {/* 基本信息区域 */}
          <div className="gd-section">
            <div className="gd-row">
              <span className="gd-label">Chassis no</span>
              <span className="gd-value">{data?.chassisInfo || '-'}</span>
            </div>
            <div className="gd-row">
              <span className="gd-label">Ordernumber</span>
              <span className="gd-value">{data?.ordernumber || '-'}</span>
            </div>
            <div className="gd-row">
              <span className="gd-label">Build week</span>
              <span className="gd-value">{data?.buildWeek != null ? String(data.buildWeek) : '-'}</span>
            </div>
            <div className="gd-row">
              <span className="gd-label">Spec week</span>
              <span className="gd-value">{data?.specWeek != null ? String(data.specWeek) : '-'}</span>
            </div>
            <div className="gd-row">
              <span className="gd-label">Market</span>
              <span className="gd-value">{data?.market || '-'}</span>
            </div>
            <div className="gd-row">
              <span className="gd-label">Master Market</span>
              <span className="gd-value">{data?.masterMarket || '-EU'}</span>
            </div>
          </div>

          {/* S-Note 区域 */}
          {data?.sNoteNo && (
            <div className="gd-section">
              {parseSNoteList(data.sNoteNo).map((note, index) => (
                <div className="gd-row" key={index}>
                  <span className="gd-label">S-Note</span>
                  <span className="gd-value">{note}</span>
                </div>
              ))}
              <div className="gd-row">
                <span className="gd-label"></span>
                <span className="gd-value gd-snote-message">
                  {data.sNoteMessage || 'The S-Notes above can affect homologation documents.'}
                </span>
              </div>
            </div>
          )}

          {/* Load Index 区域 */}
          {data?.loadIndex && (
            <div className="gd-section">
              {loadIndexParsed && 'frontTLI' in loadIndexParsed ? (
                <>
                  <div className="gd-row">
                    <span className="gd-label">Front TLI</span>
                    <span className="gd-value">{loadIndexParsed.frontTLI}</span>
                  </div>
                  <div className="gd-row">
                    <span className="gd-label">Front TSI</span>
                    <span className="gd-value">{loadIndexParsed.frontTSI}</span>
                  </div>
                  <div className="gd-row">
                    <span className="gd-label">Drive TLI</span>
                    <span className="gd-value">{loadIndexParsed.driveTLI}</span>
                  </div>
                  <div className="gd-row">
                    <span className="gd-label">Drive TSI</span>
                    <span className="gd-value">{loadIndexParsed.driveTSI}</span>
                  </div>
                </>
              ) : (
                <div className="gd-row">
                  <span className="gd-label">Load Index</span>
                  <span className="gd-value">{data.loadIndex}</span>
                </div>
              )}
            </div>
          )}

          {/* 操作链接区域 */}
          <div className="gd-section">
            <div className="gd-row">
              <span className="gd-label">Analyze Rules</span>
              <span className="gd-value">
                <a className="gd-link" onClick={handleAnalyzeRules} role="button" tabIndex={0}>
                  Analyze Rules
                </a>
              </span>
            </div>
            {/* AD-Change 激活时显示红色 Modify 链接 */}
            {data?.adChangeActive && (
              <div className="gd-row">
                <span className="gd-label">Modify Doc</span>
                <span className="gd-value">
                  <span className="gd-modify-warning">
                    After def change detected. Document need to be modified.
                  </span>
                  <br />
                  <a className="gd-link gd-link-modify" onClick={handleModifyDoc} role="button" tabIndex={0}>
                    {data.modifyLinkText || 'Modify'}
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* 文档信息区域 */}
          {data?.usingTemplate && (
            <div className="gd-section">
              <div className="gd-row">
                <span className="gd-label">Using template</span>
                <span className="gd-value">{data.usingTemplate}</span>
              </div>
              {data.replacingParameters && data.replacingParameters.length > 0 && (
                <div className="gd-row">
                  <span className="gd-label">Replacing parameters</span>
                  <span className="gd-value">
                    {data.replacingParameters.map((p, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {p.variable} = {p.newVal}
                      </span>
                    ))}
                  </span>
                </div>
              )}
              {/* 下载链接 */}
              {data.generatedFileUrl && (
                <div className="gd-row">
                  <span className="gd-label">Generated document</span>
                  <span className="gd-value">
                    <a className="gd-link" onClick={handleDownload} role="button" tabIndex={0}>
                      Generated document
                    </a>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 页脚：显示服务器时间和版本 */}
      <div className="gd-footer">
        <span className="gd-footer-item">Date: {data?.serverDate || '-'}</span>
        <span className="gd-footer-item">HDoc version: {data?.hDocVersion || '-'}</span>
      </div>
    </div>
  );
};

export default GenerateDocument;
