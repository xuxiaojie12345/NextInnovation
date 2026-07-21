import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./SaveModifications.css";

interface ModificationInfo {
  chassisSerie: string;
  chassisNumber: string;
  doctype: string;
  version: string;
  storing: string;
  foundUnreleasedVersion: string;
  message: string;
}

const SaveModifications: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");
  const [info, setInfo] = useState<ModificationInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);

    const state = location.state as any;

    // 优先从 state 中获取（从 ModifyDocument 页面跳转过来）
    const chassisSerie = state?.chassisSerie || "";
    const chassisNumber = state?.chassisNumber || "";

    if (!chassisSerie && !chassisNumber) {
      setErrorMessage("No chassis information provided.");
      setIsLoading(false);
      return;
    }

    // 如果有 state 数据，直接使用
    if (state?.doctype || state?.version || state?.storing) {
      setInfo({
        chassisSerie,
        chassisNumber,
        doctype: state.doctype || "",
        version: state.version || "",
        storing: state.storing || "",
        foundUnreleasedVersion: state.foundUnreleasedVersion || "",
        message: "VERSION IS RELEASED",
      });
      setIsLoading(false);
    } else {
      // 否则调用 API
      fetchModificationInfo(chassisSerie, chassisNumber);
    }
  }, [navigate, location.state]);

  const fetchModificationInfo = async (serie: string, number: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/ud06/getmodificationinfo?chassisSerie=${encodeURIComponent(serie)}&chassisNumber=${encodeURIComponent(number)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setInfo({
          chassisSerie: data.data.chassisSerie || "",
          chassisNumber: data.data.chassisNumber || "",
          doctype: data.data.doctype || "",
          version: data.data.version || "",
          storing: data.data.storing || "",
          foundUnreleasedVersion: data.data.foundUnreleasedVersion || "",
          message: data.data.message || "VERSION IS RELEASED",
        });
      } else {
        setErrorMessage("No modification data found for this chassis.");
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

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="sm-page">
      {/* 顶部导航栏 */}
      <header className="sm-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="sm-body">
        <div className="sm-content">
          <h1 className="sm-title">Save Modifications</h1>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="sm-error">{errorMessage}</div>
          )}

          {/* 加载中 */}
          {isLoading && (
            <div className="sm-loading">Loading...</div>
          )}

          {/* 数据区域 */}
          {!isLoading && !errorMessage && info && (
            <div className="sm-info-panel">
              <div className="sm-field">
                <span className="sm-label">Chassis serie</span>
                <span className="sm-sep">:</span>
                <span className="sm-value">{info.chassisSerie || "-"}</span>
              </div>
              <div className="sm-field">
                <span className="sm-label">Chassis number</span>
                <span className="sm-sep">:</span>
                <span className="sm-value">{info.chassisNumber || "-"}</span>
              </div>
              <div className="sm-field">
                <span className="sm-label">Doctype</span>
                <span className="sm-sep">:</span>
                <span className="sm-value">{info.doctype || "-"}</span>
              </div>
              <div className="sm-field">
                <span className="sm-label">Version</span>
                <span className="sm-sep">:</span>
                <span className="sm-value">{info.version || "-"}</span>
              </div>
              <div className="sm-field">
                <span className="sm-label">Storing</span>
                <span className="sm-sep">:</span>
                <span className="sm-value">{info.storing || "-"}</span>
              </div>
              <div className="sm-field">
                <span className="sm-label">FOUND UNRELEASED VERSION</span>
                <span className="sm-sep">:</span>
                <span className="sm-value">{info.foundUnreleasedVersion || "-"}</span>
              </div>
              <div className="sm-field">
                <span className="sm-label">Message</span>
                <span className="sm-sep">:</span>
                <span className="sm-value sm-value-message">{info.message}</span>
              </div>

              {/* Close 按钮 */}
              <div className="sm-close-row">
                <button className="sm-btn-close" onClick={handleClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveModifications;
