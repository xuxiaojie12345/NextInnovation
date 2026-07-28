import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadDeleteTemplate.css";

const MARKET_OPTIONS = ["", "JPN", "USA", "EU", "CHN", "KOR"];

const UploadDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userID, setUserID] = useState<string>("");

  // Upload section states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMarket, setUploadMarket] = useState<string>("");

  // Delete section states
  const [deleteMarket, setDeleteMarket] = useState<string>("");
  const [deleteTemplates, setDeleteTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // Message states
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [warningMessage, setWarningMessage] = useState<string>("");
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

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setWarningMessage("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    clearMessages();
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadMarket(e.target.value);
    clearMessages();
  };

  const handleUpload = async () => {
    clearMessages();

    if (!selectedFile) {
      setErrorMessage("NO FILE UPLOADED");
      return;
    }

    if (!uploadMarket) {
      setErrorMessage("Please select a market.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("market", uploadMarket);

      const response = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setSuccessMessage(
          `TEMPLATE ${selectedFile.name.toUpperCase()} WAS SUCCESSFULLY UPLOADED TO MARKET ${uploadMarket}`
        );
        setSelectedFile(null);
        setUploadMarket("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(
          data.message || "Operation failed. Please contact administrator."
        );
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMarketChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const market = e.target.value;
    setDeleteMarket(market);
    setSelectedTemplate("");
    clearMessages();

    if (market) {
      try {
        const response = await fetch(
          `/api/templates/list?market=${encodeURIComponent(market)}`
        );
        if (response.ok) {
          const data = await response.json();
          setDeleteTemplates(data.data || []);
        } else {
          setDeleteTemplates([]);
        }
      } catch {
        setDeleteTemplates([]);
      }
    } else {
      setDeleteTemplates([]);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    clearMessages();
  };

  const handleDelete = async () => {
    clearMessages();

    if (!deleteMarket) {
      setErrorMessage("Please select a market.");
      return;
    }
    if (!selectedTemplate) {
      setErrorMessage("Please select a template.");
      return;
    }

    setWarningMessage("Do you really want to delete template?");

    if (!window.confirm("Do you really want to delete template?")) {
      setWarningMessage("");
      return;
    }

    setWarningMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/templates/delete?market=${encodeURIComponent(
          deleteMarket
        )}&filename=${encodeURIComponent(selectedTemplate)}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setSuccessMessage(
          `TEMPLATE ${selectedTemplate.toUpperCase()} WAS SUCCESSFULLY DELETE FROM MARKET ${deleteMarket}`
        );
        setSelectedTemplate("");
        setDeleteTemplates((prev) =>
          prev.filter((t) => t !== selectedTemplate)
        );
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(
          data.message || "Operation failed. Please contact administrator."
        );
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    clearMessages();

    if (!deleteMarket) {
      setErrorMessage("Please select a market.");
      return;
    }
    if (!selectedTemplate) {
      setErrorMessage("Please select a template.");
      return;
    }

    setWarningMessage("Do you really want to archive template?");

    if (!window.confirm("Do you really want to archive template?")) {
      setWarningMessage("");
      return;
    }

    setWarningMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/templates/archive?market=${encodeURIComponent(
          deleteMarket
        )}&filename=${encodeURIComponent(selectedTemplate)}`,
        { method: "POST" }
      );

      if (response.ok) {
        setSuccessMessage(
          `TEMPLATE ${selectedTemplate.toUpperCase()} WAS SUCCESSFULLY ARCHIVED FROM MARKET ${deleteMarket}`
        );
        setSelectedTemplate("");
        setDeleteTemplates((prev) =>
          prev.filter((t) => t !== selectedTemplate)
        );
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(
          data.message || "Operation failed. Please contact administrator."
        );
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckTemplate = () => {
    navigate("/hdoc-template-check");
  };

  return (
    <div className="udt-page">
      {/* 顶部导航栏 */}
      <header className="udt-header">
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
      <div className="udt-body">
        <div className="udt-content">
          {/* HDoc Template Upload 区域 */}
          <div className="udt-section">
            <h1 className="udt-title">HDoc Template Upload</h1>

            {/* Upload Form */}
            <div className="udt-form">
              <div className="udt-row">
                <label className="udt-label">Template File:</label>
                <div className="udt-file-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".rtf,.docx"
                    className="udt-file-input"
                    onChange={handleFileSelect}
                    disabled={isLoading}
                    style={{ display: "none" }}
                  />
                  <button
                    className="udt-file-button"
                    onClick={handleFileButtonClick}
                    disabled={isLoading}
                  >
                    ファイルを選択
                  </button>
                  <span className="udt-file-name">
                    {selectedFile ? selectedFile.name : "選択されていません"}
                  </span>
                </div>
              </div>

              <div className="udt-row">
                <label className="udt-label">Market:</label>
                <select
                  className="udt-select udt-select-small"
                  value={uploadMarket}
                  onChange={handleUploadMarketChange}
                  disabled={isLoading}
                >
                  {MARKET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="udt-row">
                <label className="udt-label"></label>
                <button
                  className="udt-btn udt-btn-primary"
                  onClick={handleUpload}
                  disabled={isLoading}
                >
                  Upload file
                </button>
              </div>
            </div>

            {/* 提示文字 */}
            <div className="udt-notice">
              Before uploading new VIN plate templates, inform support.tpi@volvo.com,
              to make sure that the connection to the cab factory will work.
            </div>
          </div>

          {/* HDoc Template Delete/Archive 区域 */}
          <div className="udt-section">
            <h1 className="udt-title">HDoc Template Delete/Archive</h1>

            {/* 消息显示 */}
            {warningMessage && (
              <div className="udt-warning">{warningMessage}</div>
            )}

            {/* Delete Form */}
            <div className="udt-form">
              <div className="udt-row">
                <label className="udt-label">Market:</label>
                <select
                  className="udt-select"
                  value={deleteMarket}
                  onChange={handleDeleteMarketChange}
                  disabled={isLoading}
                >
                  {MARKET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="udt-row">
                <label className="udt-label">Templates:</label>
                <select
                  className="udt-select"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  disabled={isLoading || !deleteMarket}
                >
                  <option value=""></option>
                  {deleteTemplates.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="udt-row udt-row-buttons">
                <label className="udt-label"></label>
                <div className="udt-button-group">
                  <button
                    className="udt-btn"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                  <button
                    className="udt-btn"
                    onClick={handleArchive}
                    disabled={isLoading}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Check Template 区域 */}
          <div className="udt-section udt-section-check">
            <div className="udt-check-title">Check your rtf template</div>
            <div className="udt-check-desc">
              In case you have a rtf template you should run a check on it before uploading it.
              After check download the template to your desktop and then upload it to your template directory.
              Use the link below.
            </div>
            <a
              className="udt-check-link"
              onClick={handleCheckTemplate}
              href="#"
            >
              Check Template (Only for rtf files)
            </a>
          </div>

          {/* 消息显示 */}
          {errorMessage && <div className="udt-error">{errorMessage}</div>}
          {successMessage && <div className="udt-success">{successMessage}</div>}
        </div>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
