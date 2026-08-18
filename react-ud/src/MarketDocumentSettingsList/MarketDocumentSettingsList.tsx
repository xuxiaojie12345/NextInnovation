import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MarketDocumentSettingsList.css";

interface DocRecord {
  doctype: string;
  registerUser: string;
  registerDatetime: string;
}

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setSessionUserID(storedUserID);
    fetchDocuments();
  }, [navigate]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/ud20/getdocumentlist");
      const data = await response.json();

      if (data.success && data.data) {
        setDocuments(data.data);
        if (!data.data || data.data.length === 0) {
          setErrorMessage("No data found");
        }
      } else {
        setErrorMessage(data.message || "No data found");
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

  const handleRowClick = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  const handleSelect = () => {
    if (selectedIndex === null) {
      setErrorMessage("No data found");
      return;
    }

    const row = documents[selectedIndex];
    navigate(-1 as any, {
      state: {
        selectedDocument: {
          documentType: row.doctype,
          businessUnit: "BU",
          user: row.registerUser,
          date: row.registerDatetime,
        },
        isFromSelection: true,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUserClick = (userName: string) => {
    navigate("/edb-user-view", { state: { userId: userName } });
  };

  return (
    <div className="mdsl-page">
      {/* 顶部导航栏 */}
      <header className="mdsl-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="mdsl-body">
        <div className="mdsl-content">
          <h1 className="mdsl-title">Market Document Settings List</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="mdsl-error">{errorMessage}</div>}

          {/* 加载中 */}
          {isLoading && <div className="mdsl-loading">Loading...</div>}

          {/* 表格区域 */}
          {!isLoading && (
            <>
              <div className="mdsl-table-wrapper">
                <table className="mdsl-table">
                  <thead>
                    <tr>
                      <th className="mdsl-th-sel"></th>
                      <th className="mdsl-th-doctype">Document type</th>
                      <th className="mdsl-th-bu">Business unit</th>
                      <th className="mdsl-th-user">User</th>
                      <th className="mdsl-th-date">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr>
                        <td className="mdsl-no-data" colSpan={5}>No data found</td>
                      </tr>
                    ) : (
                      documents.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`mdsl-row ${selectedIndex === idx ? "mdsl-row-selected" : ""}`}
                          onClick={() => handleRowClick(idx)}
                        >
                          <td className="mdsl-td-sel">
                            <input
                              type="radio"
                              name="mdsl-select"
                              className="mdsl-radio"
                              checked={selectedIndex === idx}
                              onChange={() => handleRowClick(idx)}
                            />
                          </td>
                          <td className="mdsl-td">{row.doctype}</td>
                          <td className="mdsl-td">BU</td>
                          <td className="mdsl-td">
                            <span
                              className="mdsl-user-link"
                              onClick={(e) => { e.stopPropagation(); handleUserClick(row.registerUser); }}
                            >
                              {row.registerUser || "-"}
                            </span>
                          </td>
                          <td className="mdsl-td">{row.registerDatetime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 按钮行 */}
              <div className="mdsl-buttons">
                <button className="mdsl-btn" onClick={handleSelect}>Select</button>
                <button className="mdsl-btn" onClick={handleBack}>Back</button>
                <button className="mdsl-btn" onClick={handlePrint}>Print</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
