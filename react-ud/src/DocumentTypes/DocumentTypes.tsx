/**
 * DocumentTypes 组件 - 文档类型列表页面（UD22）
 * 功能：展示HDoc系统中所有可用的文档类型，包含键值（Key）和描述（Description）
 * 数据为只读展示，页面加载时自动获取
 * 对应详细设计：详细设计/詳細設計UD22.md
 */
import React, { useState, useEffect } from "react";
import api, { API_BASE_URL } from "../config/api";
import "./DocumentTypes.css";

/** 文档类型数据类型 */
interface DocTypeItem {
  key: string;
  description: string;
}

/**
 * DocumentTypes 组件
 * 以表格形式展示所有文档类型信息，纯展示页面，无用户输入操作
 */
// DocumentTypes

const DocumentTypes: React.FC = () => {
  // -------- 状态管理（对应详细设计 2.1 控件属性表）--------
  const [docTypeList, setDocTypeList] = useState<DocTypeItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 页面初始化 - 获取文档类型列表（对应详细设计 3.1.1 页面初始化流程）
   * 调用 UD20SelectHdocDocumentList（GET /api/ud22/getdocumenttypes）
   */
  useEffect(() => {
    // fetchDocTypes

    const fetchDocTypes = async () => {
      setIsLoading(true);
      try {
        // response

        const response = await api.get(
          '/api/ud22/getdocumenttypes'
        );

        if (response.data.code === 200 && Array.isArray(response.data.data)) {
          // 标准化列名（后端返回的列名大小写不确定）
          const list = response.data.data.map((item: Record<string, any>) => ({
            key: item.Key || item.key || item.DOCTYPE || item.doctype || "",
            description: item.Description || item.description || ""
          }));

          // 按Key字母顺序排序（对应详细设计 6. 实现注意事项 - 数据排序）
          list.sort((a: DocTypeItem, b: DocTypeItem) =>
            a.key.localeCompare(b.key)
          );

          setDocTypeList(list);

          if (list.length === 0) {
            // 对应详细设计 5. 异常处理
            setMessage("无法获取文档类型信息");
          }
        } else {
          setMessage("无法获取文档类型信息");
        }
      } catch (err) {
        // 对应详细设计 5. 异常处理 - API调用失败
        setMessage("系统错误，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocTypes();
  }, []);

  return (
    <div className="ud22-container">
      {/* 页面标题 */}
      <h1 className="ud22-title">Document Types</h1>

      {/* 消息提示（对应详细设计 5. 异常处理） */}
      {message && <div className="ud22-message">{message}</div>}

      {isLoading && <div className="ud22-loading">Loading...</div>}

      {/* 数据表格（对应详细设计 2.1 DataTable） */}
      {!isLoading && (
        <div className="ud22-table-wrapper">
          <table className="ud22-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {docTypeList.length > 0 ? (
                docTypeList.map((item, index) => (
                  <tr key={index}>
                    <td>{item.key}</td>
                    <td>{item.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="ud22-empty-row">
                    No data found
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

// DocumentTypes

export default DocumentTypes;
