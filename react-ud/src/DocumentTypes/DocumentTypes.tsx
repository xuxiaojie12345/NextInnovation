import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DocumentTypes.css';

/**
 * DocumentTypes组件 - 文档类型一览画面
 * 
 * @description 显示HDoc系统中可用的文档类型列表，展示文档类型的Key（DOCTYPE）和Description
 * @props 无Props
 */
const DocumentTypes: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [documentTypeList, setDocumentTypeList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 画面初期表示 - 调用API获取文档类型信息列表
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    fetchDocumentTypeList();
  }, []);

  /**
   * 调用UD03SelectHdocdocumentlistApi获取文档类型信息列表
   * 对应设计书 5.1 UD03SelectHdocdocumentlistApi
   */
  const fetchDocumentTypeList = async () => {
    setIsLoading(true);
    
    try {
      // API请求 - 查询文档类型信息 (对应设计书 5.1)
      const response = await axios.get('/api/UD03/select-hdoc-document-list');
      
      if (response.data.success) {
        const data = response.data.data || [];
        // 将查询到的Doctype和Description在画面上以列表的形式展示
        setDocumentTypeList(Array.isArray(data) ? data : [data]);
      } else {
        setDocumentTypeList([]);
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setDocumentTypeList([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='dt-container'>
      <div className='dt-content'>
        {/* 标题区域 */}
        <h2 className='dt-title'>Document Types</h2>
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='dt-loading'>
            加载中...
          </div>
        )}
        
        {/* DataTable区域 - 表格边框有两条线，严格按照图片生成 */}
        <div className='dt-table-container'>
          <table className='dt-table'>
            <thead>
              <tr>
                <th className='dt-th-key'>Key</th>
                <th className='dt-th-description'>Description</th>
              </tr>
            </thead>
            <tbody>
              {documentTypeList.length > 0 ? (
                documentTypeList.map((row, index) => (
                  <tr key={index}>
                    <td className='dt-td-key'>{row.doctype || ''}</td>
                    <td className='dt-td-description'>{row.description || ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className='dt-empty-message'>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentTypes;
