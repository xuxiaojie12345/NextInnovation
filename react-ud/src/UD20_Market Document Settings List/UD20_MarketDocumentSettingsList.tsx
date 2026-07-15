import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD20_MarketDocumentSettingsList.css';

/**
 * UD20_MarketDocumentSettingsList 市场文档设置列表页面组件
 *
 * @component
 * @returns {JSX.Element} 市场文档设置列表页面元素
 */
const UD20_MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  const [documents, setDocuments] = useState<DocumentItem[]>([]);   // 文档列表数据
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null); // 选中的文档类型
  const [message, setMessage] = useState<string>('');                // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState<boolean>(false);       // 加载状态

  /** 文档列表项接口 */
  interface DocumentItem {
    id: number;
    documentType: string;
    businessUnit: string;
    registerUser: string;
    registerDateTime: string;
  }

  // ==================== 初期表示 ====================
  useEffect(() => {
    // 从location.state获取从UD20-1传来的搜索参数
    const state = location.state as any;
    const searchParams = state?.searchParams || {};

    fetchDocumentList(searchParams);
  }, [location.state]);

  /**
   * 获取文档列表数据
   * 对应设计书 4.1 UD20GetDocumentListApi
   * GET /api/ud20/getdocumentlist
   *
   * @param params - 从UD20-1传来的搜索条件
   */
  const fetchDocumentList = async (params: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/ud20/getdocumentlist', { params });
      // 后端返回格式：{ code: 200, message: "success", data: [...] }
      if (response.data?.code === 200 && Array.isArray(response.data?.data)) {
        setDocuments(response.data.data);
      } else {
        // 无数据或响应异常
        setDocuments([]);
        if (response.data?.code !== 200) {
          setMessage(response.data?.message || '获取文档列表失败');
          setMessageType('error');
        }
      }
    } catch (error) {
      setMessage('获取文档列表失败，请稍后重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理表格行点击选择
   *
   * @param docType - 选中记录的文档类型（唯一标识）
   */
  const handleRowSelect = useCallback((docType: string) => {
    setSelectedDocType((prev) => (prev === docType ? null : docType));
  }, []);

  /**
   * 处理 Select 按钮点击
   * 将选中记录的数据传送到UD20-1画面
   */
  const handleSelect = useCallback(() => {
    if (selectedDocType === null) {
      setMessage('请先选择一条记录');
      setMessageType('error');
      return;
    }
    // 查找选中记录
    const selected = documents.find((doc) => doc.documentType === selectedDocType);
    if (selected) {
      // 携带选中数据跳转到UD20-1画面
      navigate('/UD201', { state: { selectedRecord: selected } });
    }
  }, [selectedDocType, documents, navigate]);

  /**
   * 处理 Back 按钮点击
   * 返回前一个画面
   */
  const handleBack = useCallback(() => {
    // 从location.state中取出UD201传来的formData，回传给UD201恢复输入数据
    const formData = (location.state as any)?.formData;
    navigate('/UD201', { state: { backFormData: formData } });
  }, [navigate, location.state]);

  /**
   * 处理 Print 按钮点击
   * 打印当前页面内容
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * 处理 User 链接点击跳转到UD25用户信息画面
   *
   * @param userId - 用户ID
   */
  const handleUserClick = useCallback((userId: string) => {
    navigate('/UD25', { state: { userId } });
  }, [navigate]);

  // ==================== 渲染 ====================
  return (
    <div className="ud20-container">
      {/* 页面标题 */}
      <div className="ud20-title">Market Document Settings List</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud20-message ${messageType === 'success' ? 'ud20-message-success' : 'ud20-message-error'}`}>
          {message}
        </div>
      )}

        {/* 按钮区域 */}
        <div className="ud20-button-row">
          <button className="ud20-btn" onClick={handleSelect} disabled={isLoading}>
            Select
          </button>
          <button className="ud20-btn" onClick={handleBack} disabled={isLoading}>
            Back
          </button>
          <button className="ud20-btn" onClick={handlePrint} disabled={isLoading}>
            Print
          </button>
        </div>  

      {/* 主内容区域 */}
      <div className="ud20-content">
        
        {/* 数据表格区域 */}
        <div className="ud20-table-wrapper">
          <table className="ud20-table">
            <thead>
              <tr>
                <th className="ud20-col-select"></th>
                <th className="ud20-col-doctype">Document type</th>
                <th className="ud20-col-bu">Bussines unit</th>
                <th className="ud20-col-user">User</th>
                <th className="ud20-col-date">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="ud20-loading">加载中...</td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ud20-empty">暂无数据</td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.documentType}
                    className={`ud20-row ${selectedDocType === doc.documentType ? 'ud20-row-selected' : ''}`}
                    onClick={() => handleRowSelect(doc.documentType)}
                  >
                    <td className="ud20-col-select">
                      <input type="radio" name="docSelect" checked={selectedDocType === doc.documentType}
                        readOnly
                      />
                    </td>
                    <td className="ud20-col-doctype">{doc.documentType}</td>
                    <td className="ud20-col-bu">BU</td>
                    <td className="ud20-col-user">
                      <span className="ud20-user-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(doc.registerUser);
                        }}
                      >
                        {doc.registerUser}
                      </span>
                    </td>
                    <td className="ud20-col-date">{doc.registerDateTime}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UD20_MarketDocumentSettingsList;
