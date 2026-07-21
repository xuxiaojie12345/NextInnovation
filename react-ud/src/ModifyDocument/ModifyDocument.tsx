import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ModifyDocument.css";

interface VariableRow {
  variable: string;
  description: string;
  currentValue: string;
  modifiedValue: string;
}

const ModifyDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");
  const [chassisNo, setChassisNo] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [templateFile, setTemplateFile] = useState<string>("");
  const [variables, setVariables] = useState<VariableRow[]>([]);
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
    const chNo = state?.chassisNo || "";
    const mkt = state?.market || "";

    if (!chNo || !mkt) {
      setErrorMessage("No chassis or market information provided.");
      setIsLoading(false);
      return;
    }

    setChassisNo(chNo);
    setMarket(mkt);
    fetchModifyDocument(chNo, mkt);
  }, [navigate, location.state]);

  const fetchModifyDocument = async (chNo: string, mkt: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/ud05/getmodifydocument?chassisNo=${encodeURIComponent(chNo)}&market=${encodeURIComponent(mkt)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setTemplateFile(data.data.templateFile || "");
        setVariables(
          (data.data.variables || []).map((v: any) => ({
            variable: v.variable || "",
            description: v.description || "",
            currentValue: v.currentValue || "",
            modifiedValue: v.modifiedValue || "",
          }))
        );
      } else {
        setErrorMessage("No data found for this chassis.");
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

  const handleDownloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (templateFile) {
      window.open(`/api/ud05/downloadtemplate/${encodeURIComponent(templateFile)}`, "_blank");
    } else {
      setErrorMessage("Template file not found.");
    }
  };

  const handleChassisClick = () => {
    navigate("/vehicle-specification", { state: { chassisNo } });
  };

  const handleModifiedValueChange = (index: number, value: string) => {
    if (value.length > 500) return;
    setVariables((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], modifiedValue: value };
      return updated;
    });
    if (errorMessage) setErrorMessage("");
  };

  const handleSave = () => {
    const hasModifications = variables.some((v) => v.modifiedValue.trim() !== "");
    if (!hasModifications) {
      setErrorMessage("NO UNRELEASED VERSION EXISTS!");
      return;
    }

    const modifiedData = variables
      .filter((v) => v.modifiedValue.trim() !== "")
      .map((v) => ({
        variable: v.variable,
        currentValue: v.currentValue,
        modifiedValue: v.modifiedValue,
      }));

    const chassisParts = chassisNo.split("-");
    const chassisSerie = chassisParts[0] || "";
    const chassisNumber = chassisParts.slice(1).join("-") || "";

    const storing = modifiedData
      .map((m) => `${m.variable}=${m.modifiedValue}`)
      .join(", ");

    navigate("/save-modifications", {
      state: {
        chassisSerie,
        chassisNumber,
        doctype: templateFile.replace(/\.\w+$/, ""),
        version: "1.0",
        storing,
        modifications: modifiedData,
        market,
      },
    });
  };

  return (
    <div className="md-page">
      {/* 顶部导航栏 */}
      <header className="md-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="md-body">
        <div className="md-content">
          <h1 className="md-title">Modify Document</h1>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="md-error">{errorMessage}</div>
          )}

          {/* 加载中 */}
          {isLoading && (
            <div className="md-loading">Loading...</div>
          )}

          {/* 数据区域 */}
          {!isLoading && !errorMessage && (
            <>
              {/* 参数信息 */}
              <div className="md-info">
                <div className="md-info-row">
                  <span className="md-info-label">chassis no</span>
                  <span className="md-info-sep">:</span>
                  <span className="md-info-value-link" onClick={handleChassisClick}>{chassisNo}</span>
                </div>
                <div className="md-info-row">
                  <span className="md-info-label">Market</span>
                  <span className="md-info-sep">:</span>
                  <span className="md-info-value">{market}</span>
                </div>
                <div className="md-info-row">
                  <span className="md-info-label">Template</span>
                  <span className="md-info-sep">:</span>
                  <a href="#" className="md-info-value-link" onClick={handleDownloadTemplate}>{templateFile}</a>
                </div>
              </div>

              {/* 数据表格 */}
              <table className="md-table">
                <thead>
                  <tr>
                    <th className="md-th-var">Variable</th>
                    <th className="md-th-desc">Description</th>
                    <th className="md-th-cur">Current value</th>
                    <th className="md-th-mod">Modified value</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.length === 0 ? (
                    <tr>
                      <td className="md-no-data" colSpan={4}>No data found for this chassis.</td>
                    </tr>
                  ) : (
                    variables.map((row, idx) => (
                      <tr key={idx}>
                        <td className="md-td-var">{row.variable}</td>
                        <td className="md-td-desc">{row.description}</td>
                        <td className="md-td-cur">{row.currentValue}</td>
                        <td className="md-td-mod">
                          <input
                            type="text"
                            className="md-modified-input"
                            value={row.modifiedValue}
                            onChange={(e) => handleModifiedValueChange(idx, e.target.value)}
                            maxLength={500}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Save 按钮 */}
              <div className="md-save-row">
                <button className="md-btn-save" onClick={handleSave}>Save</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModifyDocument;
