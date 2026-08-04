import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DownloadAndPrintQuickGuides.css";

const DownloadAndPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

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

  const handleDownload = () => {
    window.open("/api/ud23/downloadquickguide", "_blank");
  };

  return (
    <div className="dqg-page">
      {/* 顶部导航栏 */}
      <header className="dqg-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="dqg-body">
        <div className="dqg-content">
          <h1 className="dqg-title">Download and Print Quick Guides</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="dqg-error">{errorMessage}</div>}

          {/* 下载链接 */}
          <div className="dqg-download-section">
            <span className="dqg-link" onClick={handleDownload}>
              Volvo 3P Quick Guides
            </span>
          </div>

          {/* 打印方法 */}
          <div className="dqg-guide-section">
            <div className="dqg-guide-header">
              <input
                type="checkbox"
                className="dqg-checkbox"
                readOnly
                disabled
                tabIndex={-1}
              />
              <span className="dqg-guide-title">To print do the following</span>
            </div>
            <ol className="dqg-guide-list">
              <li>Open the downloaded Quick Guide file.</li>
              <li>Select "File" menu and choose "Print".</li>
              <li>Set the printer to "Actual size" (100%).</li>
              <li>Select the color option suitable for your printer.</li>
              <li>Click "Print" to print the document.</li>
            </ol>
          </div>

          {/* 折叠方法 */}
          <div className="dqg-guide-section">
            <div className="dqg-guide-header">
              <input
                type="checkbox"
                className="dqg-checkbox"
                readOnly
                disabled
                tabIndex={-1}
              />
              <span className="dqg-guide-title">To fold do the following</span>
            </div>
            <ol className="dqg-guide-list">
              <li>Fold the printed page in half along the center line.</li>
              <li>Align the edges neatly.</li>
              <li>Fold the top edge down to the marked line.</li>
              <li>Fold the bottom edge up to the marked line.</li>
              <li>The guide should now fold into a compact booklet.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadAndPrintQuickGuides;
