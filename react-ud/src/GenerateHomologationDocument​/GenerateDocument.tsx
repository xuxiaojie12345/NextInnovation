import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GenerateDocument.css";

interface DocumentResult {
  chassisNo: string;
  ordernumber: string;
  buildWeek: string;
  specWeek: string;
  market: string;
  masterMarket: string;
  frontIndex: string;
  driveIndex: string;
  afterDefChange: boolean;
  template: string;
  errors: { rule: string; message: string }[];
  generatedDocUrl: string;
  generatedDocTime: string;
  version: string;
}

const GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");
  const [result, setResult] = useState<DocumentResult | null>(null);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);

    // 从 location state 获取参数
    const state = location.state as any;
    if (state?.chassisSeries && state?.chassisNo) {
      // 模拟结果数据（实际应从 API 获取）
      setResult({
        chassisNo: `${state.chassisSeries} ${state.chassisNo}`,
        ordernumber: "19146492",
        buildWeek: "2020186",
        specWeek: "202018",
        market: "AUS",
        masterMarket: "-EU",
        frontIndex: "1 2 3 4 5 6 7 8",
        driveIndex: "1 2 3 4 5 6 7 8",
        afterDefChange: true,
        template: "aus/UD_TEST.odt",
        errors: [
          { rule: "RULE_EPC_4_8", message: "Error" },
        ],
        generatedDocUrl: "#",
        generatedDocTime: "2022-11-22 13:10:04",
        version: "4.2.1",
      });
    }
  }, [navigate, location.state]);

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleAnalyzeRules = () => {
    // 分析规则
  };

  const handleStartReplacing = () => {
    // 开始替换参数
  };

  if (!result) {
    return (
      <div className="gd-page">
        <header className="gd-header">
          <div className="header-left">
            <span className="volvo-logo">VOLVO</span>
          </div>
          <div className="header-right">
            <span className="welcome-text">Welcome, {userID || "---"}</span>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>
        <div className="gd-body">
          <p className="gd-no-data">No document data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gd-page">
      {/* 顶部导航栏 */}
      <header className="gd-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="gd-body">
        <div className="gd-content">
          <h1 className="gd-title">Generate document</h1>

          {/* Chassis no */}
          <p className="gd-chassis-no">Chassis no: {result.chassisNo}</p>

          {/* 信息表格 */}
          <table className="gd-info-table">
            <tbody>
              <tr>
                <td className="gd-info-label">ordernumber</td>
                <td className="gd-info-value">{result.ordernumber}</td>
                <td className="gd-info-label">build week</td>
                <td className="gd-info-value">{result.buildWeek}</td>
              </tr>
              <tr>
                <td className="gd-info-label">spec week</td>
                <td className="gd-info-value">{result.specWeek}</td>
                <td className="gd-info-label">Market</td>
                <td className="gd-info-value">{result.market}</td>
              </tr>
              <tr>
                <td className="gd-info-label">Master Market</td>
                <td className="gd-info-value">{result.masterMarket}</td>
                <td className="gd-info-label"></td>
                <td className="gd-info-value"></td>
              </tr>
              <tr>
                <td className="gd-info-label">Front index</td>
                <td className="gd-info-value">{result.frontIndex}</td>
                <td className="gd-info-label">Drive index</td>
                <td className="gd-info-value">{result.driveIndex}</td>
              </tr>
            </tbody>
          </table>

          {/* Analyze Rules 链接 */}
          <div className="gd-analyze-rules">
            <span className="gd-link" onClick={handleAnalyzeRules}>Analyze Rules</span>
          </div>

          {/* After def change 警告 */}
          {result.afterDefChange && (
            <p className="gd-warning">After def change detected. Document need to be modified.</p>
          )}

          {/* Template */}
          <p className="gd-template">Template: {result.template}</p>

          {/* Replacing parameters */}
          <div className="gd-section">
            <div className="gd-section-header">
              <span className="gd-section-title">Replacing parameters</span>
              <button className="gd-btn-start" onClick={handleStartReplacing}>Start</button>
            </div>
          </div>

          {/* 错误列表 */}
          {result.errors.length > 0 && (
            <div className="gd-section">
              <div className="gd-section-header">
                <span className="gd-section-title">Errors</span>
              </div>
              <table className="gd-errors-table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>State</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, idx) => (
                    <tr key={idx}>
                      <td className="gd-error-rule">{err.rule}</td>
                      <td className="gd-error-state">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Generated document */}
          <div className="gd-section">
            <div className="gd-section-header">
              <span className="gd-section-title">Generated document</span>
            </div>
            <p className="gd-generated-doc">
              <span className="gd-link">Document_{result.chassisNo.replace(" ", "_")}.pdf</span>
            </p>
          </div>

          {/* 底部信息 */}
          <div className="gd-footer">
            <span>{result.generatedDocTime}</span>
            <span className="gd-version">HDoc version {result.version}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateDocument;
