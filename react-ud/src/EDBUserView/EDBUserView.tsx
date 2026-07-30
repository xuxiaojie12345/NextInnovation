import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./EDBUserView.css";

const EDBUserView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [responsible, setResponsible] = useState<string>("");
  const [userPosition, setUserPosition] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setSessionUserID(storedUserID);

    const state = location.state as any;
    const targetUserId = state?.userId || "";

    if (!targetUserId) {
      setErrorMessage("No user ID provided.");
      return;
    }

    fetchUserInfo(targetUserId);
  }, [navigate, location.state]);

  const fetchUserInfo = async (targetUserId: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/ud25/getuserfromsaviynt?userId=${encodeURIComponent(targetUserId)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setUserId(data.data.userId || "");
        setResponsible(data.data.responsible || "");
        setUserPosition(data.data.userPosition || "");
        setEmail(data.data.email || "");
      } else {
        setErrorMessage("User not found in Saviynt system.");
      }
    } catch {
      setErrorMessage("Failed to connect to Saviynt system.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleClear = () => {
    setUserId("");
    setResponsible("");
    setUserPosition("");
    setEmail("");
    setErrorMessage("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="euv-page">
      {/* 顶部导航栏 */}
      <header className="euv-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="euv-body">
        <div className="euv-content">
          <h1 className="euv-title">EDB User View</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="euv-error">{errorMessage}</div>}

          {/* 加载中 */}
          {isLoading && <div className="euv-loading">Loading...</div>}

          {/* 表单 */}
          {!isLoading && (
            <div className="euv-form">
              <div className="euv-field">
                <label className="euv-label">Userid</label>
                <input
                  type="text"
                  className="euv-input"
                  value={userId}
                  readOnly
                  disabled
                />
              </div>
              <div className="euv-field">
                <label className="euv-label">Responsible</label>
                <input
                  type="text"
                  className="euv-input"
                  value={responsible}
                  readOnly
                  disabled
                />
              </div>
              <div className="euv-field">
                <label className="euv-label">User Position</label>
                <input
                  type="text"
                  className="euv-input"
                  value={userPosition}
                  readOnly
                  disabled
                />
              </div>
              <div className="euv-field">
                <label className="euv-label">E-mail</label>
                <input
                  type="text"
                  className="euv-input"
                  value={email}
                  readOnly
                  disabled
                />
              </div>

              {/* 按钮行 */}
              <div className="euv-buttons">
                <button className="euv-btn" onClick={handleClear} disabled={isLoading}>Clear</button>
                <button className="euv-btn" onClick={handleBack} disabled={isLoading}>Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EDBUserView;
