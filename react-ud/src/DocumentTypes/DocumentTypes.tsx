import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DocumentTypes.css";

interface DocTypeRecord {
  key: string;
  description: string;
}

const DocumentTypes: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [docTypes, setDocTypes] = useState<DocTypeRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setSessionUserID(storedUserID);
    fetchDocumentTypes();
  }, [navigate]);

  const fetchDocumentTypes = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/ud22/getdocumenttypes");
      const data = await response.json();

      if (data.success && data.data) {
        setDocTypes(data.data);
        if (!data.data || data.data.length === 0) {
          setErrorMessage("No data found.");
        }
      } else {
        setErrorMessage(data.message || "No data found.");
      }
    } catch {
      setErrorMessage("Network connection failed. Please check your network settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  return (
    <div className="dt-page">
      {/* 顶部导航栏 */}
      <header className="dt-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="dt-body">
        <div className="dt-content">
          <h1 className="dt-title">Document Types</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="dt-error">{errorMessage}</div>}

          {/* 加载中 */}
          {isLoading && <div className="dt-loading">Loading...</div>}

          {/* 表格 */}
          {!isLoading && (
            <div className="dt-table-wrapper">
              <table className="dt-table">
                <thead>
                  <tr>
                    <th className="dt-th-key">Key</th>
                    <th className="dt-th-desc">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {docTypes.length === 0 ? (
                    <tr>
                      <td className="dt-no-data" colSpan={2}>No data found.</td>
                    </tr>
                  ) : (
                    docTypes.map((row, idx) => (
                      <tr key={idx} className="dt-row">
                        <td className="dt-td">{row.key}</td>
                        <td className="dt-td">{row.description || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentTypes;
