import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MarketsInHDoc.css";

interface MarketRecord {
  market: string;
  description: string;
  weightsFromHdoc: string;
}

const MarketsInHDoc: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setSessionUserID(storedUserID);
    fetchMarkets();
  }, [navigate]);

  const fetchMarkets = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/ud21/getmarketslist");
      const data = await response.json();

      if (data.success && data.data) {
        setMarkets(data.data);
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
    <div className="mih-page">
      {/* 顶部导航栏 */}
      <header className="mih-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="mih-body">
        <div className="mih-content">
          <h1 className="mih-title">Markets in HDoc</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="mih-error">{errorMessage}</div>}

          {/* 加载中 */}
          {isLoading && <div className="mih-loading">Loading...</div>}

          {/* 表格 */}
          {!isLoading && (
            <div className="mih-table-wrapper">
              <table className="mih-table">
                <thead>
                  <tr>
                    <th className="mih-th-market">Market</th>
                    <th className="mih-th-desc">Description</th>
                    <th className="mih-th-weights">Weights from HDoc</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.length === 0 ? (
                    <tr>
                      <td className="mih-no-data" colSpan={3}>No data found.</td>
                    </tr>
                  ) : (
                    markets.map((row, idx) => (
                      <tr key={idx} className="mih-row">
                        <td className="mih-td">{row.market}</td>
                        <td className="mih-td">{row.description || "-"}</td>
                        <td className="mih-td">{row.weightsFromHdoc || "-"}</td>
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

export default MarketsInHDoc;
