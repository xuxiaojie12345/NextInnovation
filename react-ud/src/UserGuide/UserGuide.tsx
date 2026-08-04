import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UserGuide.css";

const UserGuide: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [otherInfoChecked, setOtherInfoChecked] = useState<boolean>(false);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setSessionUserID(storedUserID);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  return (
    <div className="ug-page">
      {/* 顶部导航栏 */}
      <header className="ug-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="ug-body">
        <div className="ug-content">
          <h1 className="ug-title">User Guide</h1>

          {/* 链接列表 */}
          <div className="ug-links">
            <div className="ug-link-row">
              <span
                className="ug-link"
                onClick={() => navigate("/download-and-print-quick-guides")}
              >
                HDoc Quick Guide
              </span>
            </div>
            <div className="ug-link-row">
              <span
                className="ug-link"
                onClick={() => navigate("/document-types")}
              >
                List of document types.
              </span>
            </div>
            <div className="ug-link-row">
              <span
                className="ug-link"
                onClick={() => navigate("/markets-in-hdoc")}
              >
                Markets in HDoc
              </span>
            </div>
            <div className="ug-link-row">
              <span
                className="ug-link"
                onClick={() => navigate("/market-document-settings-list")}
              >
                HDoc - Market Document Setting
              </span>
            </div>
            <div className="ug-link-row">
              <span
                className="ug-link"
                onClick={() => navigate("/search-user")}
              >
                Describation
              </span>
            </div>
          </div>

          {/* Other Information 复选框 */}
          <div className="ug-other-info">
            <label className="ug-checkbox-item">
              <input
                type="checkbox"
                className="ug-checkbox"
                checked={otherInfoChecked}
                onChange={(e) => setOtherInfoChecked(e.target.checked)}
              />
              <span className="ug-checkbox-label">Other Information</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
