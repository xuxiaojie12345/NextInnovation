import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ADChange.css";

interface CheckResult {
  serieChnr: string;
  desc: string;
  isActive: boolean;
  createdDate: string;
  createdBy: string;
}

const ADChange: React.FC = () => {
  const navigate = useNavigate();

  const [sessionUserID, setSessionUserID] = useState<string>("");
  const [serieChnr, setSerieChnr] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleAdd = async () => {
    const trimmedSerie = serieChnr.trim();
    if (!trimmedSerie) {
      setErrorMessage("Serie-Chnr is required.");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCheckResult(null);

    try {
      const response = await fetch("/api/ud16/addadchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serieChnr: trimmedSerie, desc: desc.trim() }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage("AD change record added successfully");
        setSerieChnr("");
        setDesc("");
      } else {
        setErrorMessage(data.message || "AFTER DEF CHANGE IS NOT ACTIVATED");
      }
    } catch {
      setErrorMessage("Network connection failed. Please check your network settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const trimmedSerie = serieChnr.trim();
    if (!trimmedSerie) {
      setErrorMessage("Serie-Chnr is required for delete operation.");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCheckResult(null);

    try {
      const response = await fetch("/api/ud16/deleteadchange", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serieChnr: trimmedSerie }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMessage("AD change record deleted successfully");
        setSerieChnr("");
        setDesc("");
      } else {
        setErrorMessage(data.message || "Record does not exist.");
      }
    } catch {
      setErrorMessage("Network connection failed. Please check your network settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = async () => {
    const trimmedSerie = serieChnr.trim();
    if (!trimmedSerie) {
      setErrorMessage("Serie-Chnr is required for check operation.");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCheckResult(null);

    try {
      const response = await fetch(`/api/ud16/checkadchange?serieChnr=${encodeURIComponent(trimmedSerie)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setCheckResult(data.data);
        setSuccessMessage("Record found successfully.");
      } else {
        setErrorMessage(data.message || "Record does not exist.");
      }
    } catch {
      setErrorMessage("Network connection failed. Please check your network settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="adc-page">
      {/* 顶部导航栏 */}
      <header className="adc-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {sessionUserID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="adc-body">
        <div className="adc-content">
          <h1 className="adc-title">AD Change</h1>

          {/* 消息 */}
          {errorMessage && <div className="adc-error">{errorMessage}</div>}
          {successMessage && <div className="adc-success">{successMessage}</div>}

          {/* 表单 */}
          <div className="adc-form">
            <div className="adc-field">
              <label className="adc-label">Serie-Chnr</label>
              <input
                type="text"
                className="adc-input"
                value={serieChnr}
                onChange={(e) => { setSerieChnr(e.target.value.slice(0, 15)); clearMessages(); }}
                disabled={isLoading}
                maxLength={15}
              />
            </div>
            <div className="adc-field">
              <label className="adc-label">Desc</label>
              <textarea
                className="adc-textarea"
                value={desc}
                onChange={(e) => { setDesc(e.target.value.slice(0, 4000)); clearMessages(); }}
                disabled={isLoading}
                maxLength={4000}
                rows={4}
              />
            </div>
          </div>

          {/* 按钮行 */}
          <div className="adc-buttons">
            <button className="adc-btn" onClick={handleAdd} disabled={isLoading}>ADD</button>
            <button className="adc-btn" onClick={handleDelete} disabled={isLoading}>DELETE</button>
            <button className="adc-btn" onClick={handleCheck} disabled={isLoading}>CHECK</button>
          </div>

          {/* CHECK 结果 */}
          {checkResult && (
            <div className="adc-check-result">
              <h3 className="adc-check-title">Check Result</h3>
              <div className="adc-check-field">
                <span className="adc-check-label">Serie-Chnr</span>
                <span className="adc-check-value">{checkResult.serieChnr}</span>
              </div>
              <div className="adc-check-field">
                <span className="adc-check-label">Desc</span>
                <span className="adc-check-value">{checkResult.desc || "-"}</span>
              </div>
              <div className="adc-check-field">
                <span className="adc-check-label">Active</span>
                <span className={`adc-check-value ${checkResult.isActive ? "adc-active-yes" : "adc-active-no"}`}>
                  {checkResult.isActive ? "Yes" : "No"}
                </span>
              </div>
              <div className="adc-check-field">
                <span className="adc-check-label">Created Date</span>
                <span className="adc-check-value">{checkResult.createdDate || "-"}</span>
              </div>
              <div className="adc-check-field">
                <span className="adc-check-label">Created By</span>
                <span className="adc-check-value">{checkResult.createdBy || "-"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ADChange;
