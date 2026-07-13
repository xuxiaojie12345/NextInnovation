import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import "../common/css/common.css";
import "./DocumentTypes.css";

interface DocumentType {
  doctype: string;
  description: string;
}

const DocumentTypes: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<DocumentType[]>("/document/types");
        if (res.code === 200 && res.data) {
          setDocumentTypes(res.data);
        } else {
          setMessage("无法获取文档类型信息");
        }
      } catch {
        setMessage("系统暂时不可用，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="dt-container panel panel-w800">
      <div className="dt-header panel-header">
        <h1>Document Types</h1>
      </div>

      {message && <div className="dt-error msg-error">{message}</div>}

      {isLoading ? (
        <div className="dt-loading">Loading...</div>
      ) : documentTypes.length > 0 ? (
        <div className="dt-table-section">
          <table className="dt-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {documentTypes.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.doctype}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="dt-empty">No document types found.</div>
      )}
    </div>
  );
};

export default DocumentTypes;
