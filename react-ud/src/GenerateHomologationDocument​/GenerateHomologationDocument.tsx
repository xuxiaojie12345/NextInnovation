import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GenerateHomologationDocument.css";

const GenerateHomologationDocument: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [userID, setUserID] = useState<string>("");
  const [chassisSeries, setChassisSeries] = useState<string>("");
  const [chassisNo, setChassisNo] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");
  const [documentTypes, setDocumentTypes] = useState<{ value: string; label: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 初始化
  useEffect(() => {
    const storedUserID = localStorage.getItem("userID") || "";
    if (!storedUserID) {
    //   navigate("/login");
    //   return;
    }
    setUserID(storedUserID);

    // 恢复上次搜索条件
    const savedSeries = localStorage.getItem("ghd_chassisSeries");
    const savedNo = localStorage.getItem("ghd_chassisNo");
    const savedType = localStorage.getItem("ghd_documentType");
    if (savedSeries) setChassisSeries(savedSeries);
    if (savedNo) setChassisNo(savedNo);
    if (savedType) setDocumentType(savedType);

    // 获取文档类型列表
    fetchDocumentTypes();
  }, [navigate]);

  // 获取文档类型
  const fetchDocumentTypes = async () => {
    try {
      const response = await fetch("/api/hdoc/document-types");
      const data = await response.json();
      if (data.code === 200 && data.data) {
        setDocumentTypes(data.data);
      }
    } catch {
      // 静默失败，下拉为空
    }
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  // Chassis series 输入
  const handleChassisSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5);
    setChassisSeries(val);
    if (errorMessage) setErrorMessage("");
  };

  // Chassis no 输入
  const handleChassisNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setChassisNo(val);
    if (errorMessage) setErrorMessage("");
  };

  // Document type 选择
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedSeries = chassisSeries.trim();
    const trimmedNo = chassisNo.trim();
    const trimmedType = documentType.trim();

    // 必填校验
    if (!trimmedSeries || !trimmedNo || !trimmedType) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    // 保存搜索条件
    localStorage.setItem("ghd_chassisSeries", trimmedSeries);
    localStorage.setItem("ghd_chassisNo", trimmedNo);
    localStorage.setItem("ghd_documentType", trimmedType);

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/hdoc/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chassisSeries: trimmedSeries,
          chassisNo: trimmedNo,
          documentType: trimmedType,
        }),
      });

      const data = await response.json();

      if (data.code === 200 && data.data) {
        // 跳转到 Generate document 画面
        navigate("/generate-document", {
          state: {
            chassisSeries: trimmedSeries,
            chassisNo: trimmedNo,
            documentType: trimmedType,
            documentId: data.data.documentId,
          },
        });
      } else if (data.code === 404) {
        setErrorMessage("Chassis no is not exists");
      } else {
        setErrorMessage("System error. Please try again later.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setChassisSeries("");
    setChassisNo("");
    setDocumentType("");
    setErrorMessage("");
  };

  // Help
  const handleHelp = () => {
    navigate("/hdoc-help");
  };

  return (
    <div className="ghd-page">
      {/* 顶部导航栏 */}
      <header className="ghd-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="ghd-body">
        <div className="ghd-content">
          <h1 className="ghd-title">HDoc - Generate Homologation Document</h1>

          <form onSubmit={handleSubmit} className="ghd-form">
            {/* Chassis series */}
            <div className="ghd-field">
              <label className="ghd-label">Chassis series</label>
              <input
                type="text"
                className="ghd-input"
                value={chassisSeries}
                onChange={handleChassisSeriesChange}
                placeholder=""
                maxLength={5}
                disabled={isLoading}
              />
            </div>

            {/* Chassis no */}
            <div className="ghd-field">
              <label className="ghd-label">Chassis no</label>
              <input
                type="text"
                className="ghd-input"
                value={chassisNo}
                onChange={handleChassisNoChange}
                placeholder=""
                maxLength={10}
                disabled={isLoading}
              />
            </div>

            {/* Document type */}
            <div className="ghd-field">
              <label className="ghd-label">Document type</label>
              <select
                className="ghd-select"
                value={documentType}
                onChange={handleDocumentTypeChange}
                disabled={isLoading}
              >
                <option value=""></option>
                {documentTypes.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 按钮行 */}
            <div className="ghd-buttons">
              <button type="submit" className="ghd-btn ghd-btn-submit" disabled={isLoading}>
                {isLoading ? "Submitting..." : "Submit"}
              </button>
              <button type="button" className="ghd-btn ghd-btn-reset" onClick={handleReset} disabled={isLoading}>
                Reset
              </button>
              <button type="button" className="ghd-btn ghd-btn-help" onClick={handleHelp}>
                Help
              </button>
            </div>
          </form>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="ghd-error">{errorMessage}</div>
          )}

          {/* 支持邮箱 */}
          <div className="ghd-support">
            support.tpi@volvo.com
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateHomologationDocument;
