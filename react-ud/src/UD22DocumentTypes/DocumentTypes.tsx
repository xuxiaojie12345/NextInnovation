import React, { useState, useEffect } from "react";
import "./DocumentTypes.css";

// 定义文档类型数据结构
interface DocumentType {
  doctype: string;
  description: string;
}

const API_BASE_URL = "http://localhost:8081";

const DocumentTypes: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 获取文档类型列表
  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      console.log("开始获取文档类型列表...");

      const response = await fetch(`${API_BASE_URL}/api/ud20/getdocumentlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("API响应:", result);

      if (result.code === 200 && result.data) {
        // 按Key（doctype）字母顺序排序
        const sortedData = [...result.data].sort(
          (a: DocumentType, b: DocumentType) =>
            a.doctype.localeCompare(b.doctype),
        );
        setDocumentTypes(sortedData);
      } else {
        setErrorMessage(result.msg || "无法获取文档类型信息");
      }
    } catch (error) {
      console.error("获取文档类型失败:", error);
      setErrorMessage("系统错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='document-types-container'>
      <h2 className='page-title'>Document Types</h2>

      {/* 错误消息 */}
      {errorMessage && <div className='error-message'>{errorMessage}</div>}

      {/* 加载状态 */}
      {isLoading ? (
        <div className='loading-message'>加载中...</div>
      ) : (
        /* 数据表格 */
        <div className='table-container'>
          <table className='document-types-table'>
            <thead>
              <tr>
                <th className='key-column'>Key</th>
                <th className='description-column'>Description</th>
              </tr>
            </thead>
            <tbody>
              {documentTypes.length > 0 ? (
                documentTypes.map((doc, index) => (
                  <tr key={index}>
                    <td className='key-cell'>{doc.doctype}</td>
                    <td className='description-cell'>{doc.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className='no-data-cell'>
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentTypes;
