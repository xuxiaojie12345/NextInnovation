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
            <h3>What is HDoc?</h3>
            <p>HDoc is a document generation system for Homologation Documents. It allows users to generate, modify, and manage vehicle certification documents.</p>

            <h3>How to use</h3>
            <p>1. Enter the Chassis series and Chassis number.</p>
            <p>2. Select the Document type from the dropdown list.</p>
            <p>3. Click "Submit" to generate the document.</p>
            <p>4. Review the generated document and make any necessary modifications.</p>

            <h3>Contact Support</h3>
            <p>For assistance, please contact:</p>
            <p>
              <a href="mailto:Support.TPI@volvo.com" className="help-email">
                Support.TPI@volvo.com
              </a>
            </p>

            <div className="help-back">
              <button className="help-back-btn" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDocHelp;
