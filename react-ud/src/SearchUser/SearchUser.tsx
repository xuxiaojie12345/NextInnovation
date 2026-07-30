import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchUser.css";

interface UserRecord {
  userId: string;
  userName: string;
  market: string;
}

const SearchUser: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [permissionType, setPermissionType] = useState<string>("");
  const [marketOptions, setMarketOptions] = useState<{ market: string; description: string }[]>([]);
  const [results, setResults] = useState<UserRecord[]>([]);
  const [count, setCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    try {
      const response = await fetch("/api/ud19/getmarketlist");
      const data = await response.json();
      if (data.success && data.data) {
        setMarketOptions(data.data);
      }
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
  };

  const handleRadioChange = (value: string) => {
    setPermissionType((prev) => (prev === value ? "" : value));
    clearMessages();
  };

  const handleSearch = async () => {
    // 校验：不能同时输入 Userid 和 User
    if (userId.trim() && userName.trim()) {
      setErrorMessage("Please enter either Userid or User, not both.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setResults([]);
    setCount(0);

    try {
      const response = await fetch("/api/ud19/searchusers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId.trim() || undefined,
          userName: userName.trim() || undefined,
          market: market || undefined,
          permissionType: permissionType || undefined,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setResults(data.data.users || []);
        setCount(data.data.count || 0);
        if (!data.data.users || data.data.users.length === 0) {
          setErrorMessage("No users found matching the search criteria.");
        }
      } else {
        setErrorMessage(data.message || "No users found matching the search criteria.");
      }
    } catch {
      setErrorMessage("Failed to connect to Saviynt system.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (uid: string) => {
    navigate("/edb-user-view", { state: { userId: uid } });
  };

  return (
    <div className="su-page">
      {/* 顶部导航栏 */}
      <header className="su-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="su-body">
        <div className="su-content">
          <h1 className="su-title">Search User</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="su-error">{errorMessage}</div>}

          {/* 搜索条件 */}
          <div className="su-search-section">
            <div className="su-search-row">
              <div className="su-field">
                <label className="su-label">Userid</label>
                <input
                  type="text"
                  className="su-input"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value.slice(0, 10)); clearMessages(); }}
                  disabled={isLoading}
                  maxLength={10}
                />
              </div>
              <div className="su-field su-field-user">
                <label className="su-label">User</label>
                <input
                  type="text"
                  className="su-input"
                  value={userName}
                  onChange={(e) => { setUserName(e.target.value.slice(0, 32)); clearMessages(); }}
                  disabled={isLoading}
                  maxLength={32}
                />
              </div>
              <div className="su-field su-field-market">
                <label className="su-label">Market</label>
                <select
                  className="su-select"
                  value={market}
                  onChange={(e) => { setMarket(e.target.value); clearMessages(); }}
                  disabled={isLoading}
                >
                  <option value=""></option>
                  {marketOptions.map((opt, idx) => (
                    <option key={idx} value={opt.market}>
                      {opt.description ? `${opt.market} - ${opt.description}` : opt.market}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Radio 按钮 */}
            <div className="su-radio-row">
              <label className="su-radio-item">
                <input
                  type="radio"
                  name="su-permission"
                  className="su-radio"
                  checked={permissionType === "notset"}
                  onChange={() => handleRadioChange("notset")}
                  disabled={isLoading}
                />
                <span className="su-radio-label">Not set</span>
              </label>
              <label className="su-radio-item">
                <input
                  type="radio"
                  name="su-permission"
                  className="su-radio"
                  checked={permissionType === "rule"}
                  onChange={() => handleRadioChange("rule")}
                  disabled={isLoading}
                />
                <span className="su-radio-label">Rule</span>
              </label>
              <label className="su-radio-item">
                <input
                  type="radio"
                  name="su-permission"
                  className="su-radio"
                  checked={permissionType === "template"}
                  onChange={() => handleRadioChange("template")}
                  disabled={isLoading}
                />
                <span className="su-radio-label">Template</span>
              </label>
            </div>

            {/* Search 按钮 */}
            <div className="su-search-btn-row">
              <button className="su-btn" onClick={handleSearch} disabled={isLoading}>Search</button>
            </div>
          </div>

          {/* 检索结果 */}
          <div className="su-result-section">
            <div className="su-count">COUNT: {count}</div>

            <div className="su-table-wrapper">
              <table className="su-table">
                <thead>
                  <tr>
                    <th className="su-th-id">Userid</th>
                    <th className="su-th-name">User</th>
                    <th className="su-th-mkt">Market</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr>
                      <td className="su-no-data" colSpan={3}>No results.</td>
                    </tr>
                  ) : (
                    results.map((row, idx) => (
                      <tr key={idx} className="su-row">
                        <td className="su-td">
                          <span className="su-user-link" onClick={() => handleUserClick(row.userId)}>
                            {row.userId}
                          </span>
                        </td>
                        <td className="su-td">{row.userName}</td>
                        <td className="su-td">{row.market}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchUser;
