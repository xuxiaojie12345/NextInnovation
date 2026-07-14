import React, { useState, useEffect } from 'react';
import apiClient from '../api/config';
import './UD22_DocumentTypes.css';

/**
 * UD22_DocumentTypes 文档类型列表展示页面组件
 *
 * @component
 * @returns {JSX.Element} 文档类型列表页面元素
 */
const UD22_DocumentTypes: React.FC = () => {
  // ==================== 状态管理 ====================
  const [docTypes, setDocTypes] = useState<DocTypeItem[]>([]);  // 文档类型列表
  const [message, setMessage] = useState<string>('');             // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState<boolean>(false);    // 加载状态

  /** 文档类型项接口 */
  interface DocTypeItem {
    doctype: string;
    description?: string;
  }

  // ==================== 初期表示 ====================
  useEffect(() => {
    fetchDocTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 获取文档类型列表
   */
  const fetchDocTypes = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/ud20/getdocumentlist');
      // 后端返回格式：{ code: 200, message: "success", data: [{ documentType, ... }] }
      if (response.data?.code === 200 && Array.isArray(response.data?.data)) {
        const data = response.data.data;
        if (data.length === 0) {
          // 对应设计书 3.1.1 空值校验 - API返回空数组
          setMessage('当前没有可用的文档类型');
          setMessageType('success');
        }
        // 将后端数据映射为前端需要的格式
        const mapped: DocTypeItem[] = data.map((item: any) => ({
          doctype: item.documentType || item.doctype || '',
          description: item.description || '',
        }));
        setDocTypes(mapped);
      } else {
        setDocTypes([]);
        if (response.data?.code !== 200) {
          setMessage('获取文档类型列表失败');
          setMessageType('error');
        }
      }
    } catch (error) {
      // 对应设计书 5. 异常处理
      console.error('获取文档类型列表失败:', error);
      setMessage('获取文档类型列表失败，请稍后重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 渲染 ====================
  return (
    <div className="ud22-container">
      {/* 页面标题 */}
      <div className="ud22-title">Document Types</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud22-message ${messageType === 'success' ? 'ud22-message-success' : 'ud22-message-error'}`}>
          {message}
        </div>
      )}

      {/* 文档类型列表区域 */}
      <div className="ud22-content">
        <div className="ud22-table-wrapper">
          <table className="ud22-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={2} className="ud22-loading">加载中...</td>
                </tr>
              ) : docTypes.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={2} className="ud22-empty">
                    {message || '当前没有可用的文档类型'}
                  </td>
                </tr>
              ) : (
                docTypes.map((item, index) => (
                  <tr key={index}>
                    <td className="ud22-cell-key">{item.doctype}</td>
                    <td className="ud22-cell-desc">{item.description || '-'}</td>
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

export default UD22_DocumentTypes;
