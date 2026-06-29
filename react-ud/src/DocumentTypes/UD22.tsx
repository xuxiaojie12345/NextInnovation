import React, { useState, useEffect } from "react";
import { documentTypesApi } from "../services/api";
import "./UD22.css";

interface DocumentType {
  doctype: string;
  description: string;
}

const UD22 = React.memo(() => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await documentTypesApi.getDocumentTypes();
        if (result && (result.code === 200 || result.code === undefined)) {
          const data = result.data || result;
          setDocuments(Array.isArray(data) ? data : []);
        } else {
          setError("无法加载文档类型列表，请稍后重试");
        }
      } catch {
        setError("无法加载文档类型列表，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="ud22-container">
      <header className="ud22-header">
        <div className="ud22-header-logo">VOLVO</div>
      </header>
      <main className="ud22-main">
        <div className="ud22-card">
          <h1 className="ud22-page-title">Document Types</h1>

          {error && (
            <div className="ud22-msg ud22-error" role="alert">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="ud22-loading">Loading...</div>
          ) : (
            <div className="ud22-table-wrap">
              <table className="ud22-table">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, idx) => (
                    <tr key={idx}>
                      <td>{doc.doctype}</td>
                      <td>{doc.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD22;
