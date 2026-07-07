import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HDocHelp.css";

const HDocHelp: React.FC = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState<string>("");

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  return (
    <div className="help-page">
      {/* 顶部导航栏 */}
      <header className="help-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="help-body">
        <div className="help-content">
          <h1 className="help-title">HDoc Help</h1>
          <div className="help-text">
            <p>Welcome to the HDoc Help page.</p>
            <p>For assistance, please contact support:</p>
            <p>
              <a href="mailto:Support.TPI@volvo.com" className="help-email">
                Support.TPI@volvo.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDocHelp;
