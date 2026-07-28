import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./HDocTemplateCheck.css";

interface CheckResult {
  isValid: boolean;
  variableCount: number;
  downloadUrl: string;
}

const HDocTemplateCheck: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userID, setUserID] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
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

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setErrorMessage("");
    setCheckResult(null);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCheck = async () => {
    setErrorMessage("");
    setCheckResult(null);

    if (!selectedFile) {
      setErrorMessage("ERROR: Unable to access file!");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/templates/check", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.code === 200 && data.data?.isValid) {
        setCheckResult(data.data);
      } else {
        setErrorMessage(data.message || "ERROR: The file content is incorrect!");
      }
    } catch {
      setErrorMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (checkResult?.downloadUrl) {
      window.open(checkResult.downloadUrl, "_blank");
    }
  };

  return (
    <div className="htc-page">
      {/* 顶部导航栏 */}
      <header className="htc-header">
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
      <div className="htc-body">
        <div className="htc-content">
          {/* HDoc Template Check 区域 */}
          <div className="htc-section">
            <h1 className="htc-title">HDoc Template Check</h1>

            {/* Form */}
            <div className="htc-form">
              <div className="htc-row">
                <label className="htc-label">Template File:</label>
                <div className="htc-file-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".rtf"
                    className="htc-file-input"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                    style={{ display: "none" }}
                  />
                  <button
                    className="htc-file-button"
                    onClick={handleFileButtonClick}
                    disabled={isLoading}
                  >
                    ファイルを選択
                  </button>
                  <span className="htc-file-name">
                    {selectedFile ? selectedFile.name : "選択されていません"}
                  </span>
                </div>
              </div>

              <div className="htc-row">
                <label className="htc-label"></label>
                <button
                  className="htc-btn htc-btn-check"
                  onClick={handleCheck}
                  disabled={isLoading}
                >
                  Check
                </button>
              </div>

              {/* Download Link */}
              {checkResult && checkResult.isValid && (
                <div className="htc-row">
                  <label className="htc-label"></label>
                  <a
                    className="htc-download-link"
                    onClick={handleDownload}
                    href="#"
                  >
                    Download checked template
                  </a>
                </div>
              )}
            </div>

            {/* 消息显示 */}
            {errorMessage && <div className="htc-error">{errorMessage}</div>}
            {checkResult && checkResult.isValid && (
              <div className="htc-success">
                Template check passed. Variables found: {checkResult.variableCount}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HDocTemplateCheck;
