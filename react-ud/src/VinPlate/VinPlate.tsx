import React, { useState } from "react";
import { api } from "../services/api";
import "../common/css/common.css";
import "./VinPlate.css";

interface VinPlateInfo {
  type: string;
  status: string;
  msg: string;
  registerDatetime: string;
  docReady: string;
  docSent: string;
  xmlDoc: string;
}

interface PrintItem {
  name: string;
  value: string;
}

interface VpDataItem {
  variantName: string;
  value: string;
}

// Vin Plate 面板组件
const VinPlate: React.FC = () => {
  // 表单状态
  const [chassisNumber, setChassisNumber] = useState("");

  // 查询结果
  const [vinPlateInfo, setVinPlateInfo] = useState<VinPlateInfo | null>(null);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);
  const [vpData, setVpData] = useState<VpDataItem[]>([]);

  // UI 状态
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 清除消息
  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  // "FH 12345"または"FH-12345"をserieとchnrに分割
  const parseChassis = (value: string): { serie: string; chnr: string } => {
    const trimmed = value.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return { serie: parts[0], chnr: parts.slice(1).join(" ") };
    }
    // If only one part, try splitting by dash
    const dashParts = trimmed.split("-");
    if (dashParts.length >= 2) {
      return { serie: dashParts[0], chnr: dashParts.slice(1).join("-") };
    }
    return { serie: trimmed, chnr: "" };
  };

  // XML_DOCを解析：JSON→XMLの順にパースを試行
  const parseXmlDoc = (rawStr: string) => {
    const items: PrintItem[] = [];
    const vpDataItems: VpDataItem[] = [];

    try {
      // First try JSON parse (data is stored as JSON)
      const json = JSON.parse(rawStr);

      // Parse "Print items" array
      if (json["Print items"] && Array.isArray(json["Print items"])) {
        json["Print items"].forEach((pi: any) => {
          items.push({
            name: pi.PrintItemName || "",
            value: pi.value || "",
          });
        });
      }

      // Parse "VP Data" object
      if (json["VP Data"]) {
        Object.entries(json["VP Data"]).forEach(([key, val]) => {
          vpDataItems.push({
            variantName: key,
            value: String(val ?? ""),
          });
        });
      }
    } catch {
      // Fallback: try XML parse
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rawStr, "text/xml");

        const printItemElements = xmlDoc.getElementsByTagName("PrintItemName");
        for (let i = 0; i < printItemElements.length; i++) {
          const el = printItemElements[i];
          items.push({
            name: el.textContent || "",
            value: el.getAttribute("value") || "",
          });
        }

        const variantElements = xmlDoc.getElementsByTagName("Variant");
        for (let i = 0; i < variantElements.length; i++) {
          const el = variantElements[i];
          vpDataItems.push({
            variantName: el.getAttribute("name") || "",
            value: el.textContent || "",
          });
        }
      } catch {
        items.push({ name: "Raw Data", value: rawStr });
      }
    }

    setPrintItems(items);
    setVpData(vpDataItems);
  };

  // 查看信息：获取底盘信息并展示
  const handleViewInfo = async () => {
    clearMessages();

    if (!chassisNumber.trim()) {
      setMessage("Chassis number is required.");
      return;
    }

    const { serie, chnr } = parseChassis(chassisNumber);

    setIsLoading(true);
    setHasSearched(true);
    setVinPlateInfo(null);
    setPrintItems([]);
    setVpData([]);

    try {
      const res = await api.post<VinPlateInfo>("/ud15/viewInfo", {
        serie,
        chnr,
      });

      if (res.code === 200 && res.data) {
        setVinPlateInfo(res.data);
        // Parse XML_DOC if present
        if (res.data.xmlDoc) {
          parseXmlDoc(res.data.xmlDoc);
        }
      } else if (res.code === 500) {
        setMessage("System error. Please contact administrator.");
      } else {
        setMessage(`Chassis number ${chassisNumber.trim()} not found.`);
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // 通用操作（Regenerate/OK/Basic/Advanced切换）
  const executeAction = async (endpoint: string, successMsg: string) => {
    clearMessages();

    if (!chassisNumber.trim()) {
      setMessage("Chassis number is required.");
      return;
    }

    const { serie, chnr } = parseChassis(chassisNumber);
    const currentUser = localStorage.getItem("userId") || "";

    setIsLoading(true);
    try {
      const res = await api.post(endpoint, { serie, chnr, currentUser });

      if (res.code === 200) {
        await handleViewInfo();
        setSuccessMessage(successMsg);

      } else {
        setMessage(res.message || "Operation failed.");
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRegenerate = () =>
    executeAction("/ud15/setRegenerate", "Status updated to regenerate.");
  const handleSetOk = () =>
    executeAction("/ud15/setOK", "Status updated to OK.");
  const handleChangeToBasic = () =>
    executeAction("/ud15/changeToBasicInfo", "Type changed to Basic Info.");
  const handleChangeToAdvanced = () =>
    executeAction(
      "/ud15/changeToAdvancedInfo",
      "Type changed to Advanced Info.",
    );

  return (
    <div className="vp-container panel panel-w900">
      <div className="vp-header panel-header">
        <h1>Vin Plate</h1>
      </div>

      {message && <div className="vp-error msg-error">{message}</div>}
      {successMessage && <div className="vp-success msg-success">{successMessage}</div>}

      <div className="vp-input-section">
        <div className="f-row" style={{padding:"6px 0"}}>
          <span className="f-label">Chassis number</span>
          <input
            type="text"
            className="f-input"
            value={chassisNumber}
            onChange={(e) => setChassisNumber(e.target.value)}
            maxLength={15}
            placeholder="e.g. FH 123456"
            disabled={isLoading}
          />
        </div>

        {/* 操作按钮 */}
        <div className="btn-row">
          <button className="btn" onClick={handleViewInfo} disabled={isLoading}>
            View Info
          </button>
          <button
            className="btn"
            onClick={handleSetRegenerate}
            disabled={isLoading}
          >
            Set Regenerate
          </button>
          <button className="btn" onClick={handleSetOk} disabled={isLoading}>
            Set OK
          </button>
          <button
            className="btn"
            onClick={handleChangeToBasic}
            disabled={isLoading}
          >
            Change to Basic Info
          </button>
          <button
            className="btn"
            onClick={handleChangeToAdvanced}
            disabled={isLoading}
          >
            Change to Advanced Info
          </button>
        </div>
      </div>

      {/* 查询结果信息 */}
      {hasSearched && vinPlateInfo && (
        <div className="vp-info-section">
          <table className="vp-info-table">
            <tbody>
              <tr>
                <td className="vp-info-label">Chassis number</td>
                <td className="vp-info-value">{chassisNumber.trim()}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Plate type</td>
                <td className="vp-info-value">
                  {vinPlateInfo.type != null ? String(vinPlateInfo.type) : "-"}
                </td>
              </tr>
              <tr>
                <td className="vp-info-label">Status</td>
                <td className="vp-info-value">
                  {vinPlateInfo.status != null
                    ? String(vinPlateInfo.status)
                    : "-"}
                </td>
              </tr>
              <tr>
                <td className="vp-info-label">Error Message</td>
                <td className="vp-info-value">{vinPlateInfo.msg || "-"}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Def.</td>
                <td className="vp-info-value">
                  {vinPlateInfo.registerDatetime
                    ? vinPlateInfo.registerDatetime
                        .replace("T", " ")
                        .substring(0, 16)
                    : "-"}
                </td>
              </tr>
              <tr>
                <td className="vp-info-label">Data ready</td>
                <td className="vp-info-value">
                  {vinPlateInfo.docReady || "-"}
                </td>
              </tr>
              <tr>
                <td className="vp-info-label">Sent to CAB factory</td>
                <td className="vp-info-value">{vinPlateInfo.docSent || "-"}</td>
              </tr>
            </tbody>
          </table>

          {printItems.length > 0 && (
            <div className="vp-xml-section">
              <h3 className="vp-xml-title">Print items</h3>
              <div className="vp-xml-list">
                {printItems.map((item, idx) => (
                  <div className="vp-xml-item" key={idx}>
                    <span className="vp-xml-item-name">{item.name}</span>
                    <span className="vp-xml-item-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vpData.length > 0 && (
            <div className="vp-xml-section">
              <h3 className="vp-xml-title">VP Data</h3>
              <div className="vp-xml-list">
                {vpData.map((item, idx) => (
                  <div className="vp-xml-item" key={idx}>
                    <span className="vp-xml-item-name">{item.variantName}</span>
                    <span className="vp-xml-item-value">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {hasSearched && !vinPlateInfo && !isLoading && (
        <div className="vp-no-data">Chassis record not found.</div>
      )}
    </div>
  );
};

export default VinPlate;
