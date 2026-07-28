import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ListAvailableTemplates.css";

const MARKET_OPTIONS = ["", "JPN", "USA", "EU", "CHN", "KOR"];

interface TemplateItem {
  filename: string;
  usedBy: string | null;
  lastModified: string;
  size: string;
}

const ListAvailableTemplates: React.FC = () => {
  const navigate = useNavigate();

  const [userID, setUserID] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [templateData, setTemplateData] = useState<TemplateItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);
  }, [navigate]);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedMarket) {
        setTemplateData([]);
        setErrorMessage("");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/templates/list?market=${encodeURIComponent(selectedMarket)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            setTemplateData(data.data);
          } else {
            setTemplateData([]);
            setErrorMessage("No templates found for this market.");
          }
        } else {
          setTemplateData([]);
          setErrorMessage("System error. Please contact administrator.");
        }
      } catch {
        setTemplateData([]);
        setErrorMessage("Network error. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedMarket) {
      loadTemplates();
    }
  }, [selectedMarket]);

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarket(e.target.value);
    setErrorMessage("");
  };

  const handleDownload = (filename: string) => {
    if (!selectedMarket) return;
    const url = `/api/templates/download?market=${encodeURIComponent(
      selectedMarket
    )}&filename=${encodeURIComponent(filename)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="lat-page">
      {/* 顶部导航栏 */}
      <header className="lat-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="lat-body">
        <div className="lat-content">
          {/* List Templates 区域 */}
          <div className="lat-section">
            <h1 className="lat-title">List Templates</h1>

            {/* Market Selection */}
            <div className="lat-filter">
              <label className="lat-label">Select Market:</label>
              <select
                className="lat-select"
                value={selectedMarket}
                onChange={handleMarketChange}
                disabled={isLoading}
              >
                {MARKET_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* 消息显示 */}
            {errorMessage && (
              <div className="lat-message">{errorMessage}</div>
            )}

            {/* 表格 */}
            {templateData.length > 0 && (
              <div className="lat-table-container">
                <table className="lat-table">
                  <thead>
                    <tr>
                      <th className="lat-th">Filename</th>
                      <th className="lat-th">Used</th>
                      <th className="lat-th">Last Mod.</th>
                      <th className="lat-th lat-th-right">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateData.map((item, index) => (
                      <tr
                        key={item.filename}
                        className={index % 2 === 0 ? "lat-row-even" : "lat-row-odd"}
                      >
                        <td className="lat-td">
                          <a
                            className="lat-link"
                            onClick={() => handleDownload(item.filename)}
                            href="#"
                            title="Download"
                          >
                            {item.filename}
                          </a>
                        </td>
                        <td className="lat-td">
                          {item.usedBy || "-"}
                        </td>
                        <td className="lat-td">{item.lastModified}</td>
                        <td className="lat-td lat-td-right">{item.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Loading */}
            {isLoading && <div className="lat-loading">Loading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListAvailableTemplates;
