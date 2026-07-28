import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./VinPlate.css";

interface VinPlateData {
  chassisNumber: string;
  type: string;
  status: string;
  msg: string;
  registerDatetime: string;
  docReady: string;
  docSent: string;
  xmlDoc: string;
}

const VinPlate: React.FC = () => {
  const navigate = useNavigate();

  const [userID, setUserID] = useState<string>("");
  const [chassisInput, setChassisInput] = useState<string>("");
  const [vinData, setVinData] = useState<VinPlateData | null>(null);
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

  const parseXmlData = (xmlDoc: string) => {
    try {
      const parser = new DOMParser();
      const xmlDocParsed = parser.parseFromString(xmlDoc, "text/xml");

      const printItems: string[] = [];
      const printItemNodes = xmlDocParsed.getElementsByTagName("PrintItemName");
      for (let i = 0; i < printItemNodes.length; i++) {
        printItems.push(printItemNodes[i].textContent || "");
      }

      const variantData: string[] = [];
      const variantNodes = xmlDocParsed.getElementsByTagName("Variant");
      for (let i = 0; i < variantNodes.length; i++) {
        const name =
          variantNodes[i].getElementsByTagName("Name")[0]?.textContent || "";
        const value =
          variantNodes[i].getElementsByTagName("Value")[0]?.textContent || "";
        variantData.push(`${name} = ${value}`);
      }

      return { printItems, variantData };
    } catch {
      return { printItems: [], variantData: [] };
    }
  };

  const handleViewInfo = async () => {
    setErrorMessage("");

    if (!chassisInput.trim()) {
      setErrorMessage("Please enter a chassis number.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/vin-plate/${encodeURIComponent(chassisInput.trim())}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setVinData(data.data);
        } else {
          setErrorMessage(
            `Chassis number ${chassisInput.trim()} not found.`
          );
          setVinData(null);
        }
      } else if (response.status === 404) {
        setErrorMessage(
          `Chassis number ${chassisInput.trim()} not found.`
        );
        setVinData(null);
      } else {
        setErrorMessage("System error. Please contact administrator.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    status: string,
    type?: string
  ) => {
    setErrorMessage("");

    if (!chassisInput.trim()) {
      setErrorMessage("Please enter a chassis number.");
      return;
    }

    setIsLoading(true);
    try {
      const body: any = {
        chassisNumber: chassisInput.trim(),
        status,
      };
      if (type) {
        body.type = type;
      }

      const response = await fetch("/api/vin-plate/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await handleViewInfo();
      } else {
        setErrorMessage("System error. Please contact administrator.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    if (type === "1") return "Basic";
    if (type === "2") return "ADVANCED (with weights)";
    return "-";
  };

  const getStatusLabel = (status: string) => {
    if (status === "0") return "New";
    if (status === "1") return "XML Created";
    return "-";
  };

  const parsedXml = vinData ? parseXmlData(vinData.xmlDoc) : null;

  return (
    <div className="vp-page">
      {/* 顶部导航栏 */}
      <header className="vp-header">
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
      <div className="vp-body">
        <div className="vp-content">
          {/* Vin Plate 区域 */}
          <div className="vp-section">
            <h1 className="vp-title">Vin Plate</h1>

            {/* 输入区域 */}
            <div className="vp-input-row">
              <label className="vp-label">Chassis number</label>
              <input
                type="text"
                className="vp-input"
                value={chassisInput}
                onChange={(e) => setChassisInput(e.target.value)}
                disabled={isLoading}
                maxLength={15}
                placeholder=""
              />
            </div>

            {/* 按钮区域 */}
            <div className="vp-buttons">
              <button
                className="vp-btn"
                onClick={handleViewInfo}
                disabled={isLoading}
              >
                View Info
              </button>
              <button
                className="vp-btn"
                onClick={() => handleUpdateStatus("0")}
                disabled={isLoading}
              >
                Set Regenerate
              </button>
              <button
                className="vp-btn"
                onClick={() => handleUpdateStatus("1")}
                disabled={isLoading}
              >
                Set OK
              </button>
              <button
                className="vp-btn"
                onClick={() => handleUpdateStatus("0", "1")}
                disabled={isLoading}
              >
                Change to Basic Info
              </button>
              <button
                className="vp-btn"
                onClick={() => handleUpdateStatus("0", "2")}
                disabled={isLoading}
              >
                Change to Advanced Info
              </button>
            </div>

            {/* 错误消息 */}
            {errorMessage && (
              <div className="vp-error-message">{errorMessage}</div>
            )}

            {/* 详细信息区域 */}
            {vinData && (
              <div className="vp-details">
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Chassis number:</span>
                  <span className="vp-detail-value">
                    {vinData.chassisNumber}
                  </span>
                </div>
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Plate type:</span>
                  <span className="vp-detail-value">
                    {getTypeLabel(vinData.type)}
                  </span>
                </div>
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Status:</span>
                  <span className="vp-detail-value">
                    {getStatusLabel(vinData.status)}
                  </span>
                </div>
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Error Message:</span>
                  <span className="vp-detail-value">
                    {vinData.msg || "-"}
                  </span>
                </div>
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Def.:</span>
                  <span className="vp-detail-value">
                    {vinData.registerDatetime}
                  </span>
                </div>
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Data ready:</span>
                  <span className="vp-detail-value">{vinData.docReady}</span>
                </div>
                <div className="vp-detail-row">
                  <span className="vp-detail-label">Sent to CAB factory:</span>
                  <span className="vp-detail-value">{vinData.docSent}</span>
                </div>
                <div className="vp-detail-section">
                  <span className="vp-detail-label">Print items:</span>
                  <pre className="vp-pre">
                    {parsedXml?.printItems.join("\n") || "-"}
                  </pre>
                </div>
                <div className="vp-detail-section">
                  <span className="vp-detail-label">VP Data:</span>
                  <pre className="vp-pre">
                    {parsedXml?.variantData.join("\n") || "-"}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinPlate;
