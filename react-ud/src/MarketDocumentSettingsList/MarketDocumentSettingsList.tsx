import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../services/api";
import "../common/css/common.css";
import "./MarketDocumentSettingsList.css";

type Operator = "=" | "!=" | ">" | "<";

const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as {
    doctype?: string;
    registerUser?: string;
    registerDatetime?: string;
    doctypeOp?: string;
    registerUserOp?: string;
    registerDatetimeOp?: string;
  } | null;

  const [documentType, setDocumentType] = useState(state?.doctype || "");
  const [documentTypeOp, setDocumentTypeOp] = useState<Operator>(
    (state?.doctypeOp as Operator) || "=",
  );
  const [market, setMarket] = useState("-EU");
  const [marketOp, setMarketOp] = useState<Operator>("=");
  const [setting, setSetting] = useState("");
  const [settingOp, setSettingOp] = useState<Operator>("=");
  const [businessUnit, setBusinessUnit] = useState("BU");
  const [businessUnitOp, setBusinessUnitOp] = useState<Operator>("=");
  const [user, setUser] = useState(state?.registerUser || "");
  const [userOp, setUserOp] = useState<Operator>(
    (state?.registerUserOp as Operator) || "=",
  );
  const [date, setDate] = useState(state?.registerDatetime || "");
  const [dateOp, setDateOp] = useState<Operator>(
    (state?.registerDatetimeOp as Operator) || "=",
  );
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  const isNumericField = (label: string): boolean => {
    return label === "Date";
  };

  const renderOpSelect = (
    field: string,
    op: Operator,
    onChange: (v: Operator) => void,
  ) => {
    const numericOps = ["=", ">", "<"] as Operator[];
    const nonNumericOps = ["=", "!="] as Operator[];
    const ops = isNumericField(field) ? numericOps : nonNumericOps;
    const currentOp = ops.includes(op) ? op : "=";
    return (
      <select
        className="mdsl-op-select"
        value={currentOp}
        onChange={(e) => onChange(e.target.value as Operator)}
      >
        {ops.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  };

  const handleSearch = () => {
    clearMessages();
    navigate("/menu/market-document-setting/result", {
      state: {
        doctype: documentType,
        doctypeOp: documentTypeOp,
        registerUser: user,
        registerUserOp: userOp,
        registerDatetime: date,
        registerDatetimeOp: dateOp,
      },
    });
  };

  const handleClear = () => {
    setDocumentType("");
    setDocumentTypeOp("=");
    setMarket("-EU");
    setMarketOp("=");
    setSetting("");
    setSettingOp("=");
    setBusinessUnit("BU");
    setBusinessUnitOp("=");
    setUser("");
    setUserOp("=");
    setDate("");
    setDateOp("=");
    clearMessages();
  };

  const handleBack = () => {
    navigate("/menu/guide-user");
  };

  const handleUpdateMode = async () => {
    clearMessages();

    const trimmedDoctype = documentType.trim();
    const trimmedUser = user.trim();
    const trimmedDate = date.trim();

    if (!trimmedDoctype || !trimmedUser || !trimmedDate) {
      setMessage("Document type, User and Date are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/ud20/updateDocumentList", {
        doctype: trimmedDoctype,
        registerUser: trimmedUser,
        registerDatetime: trimmedDate,
        currentUser: trimmedUser,
      });

      if (res.code === 200) {
        setSuccessMessage(res.message);
      } else {
        setMessage(res.message);
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mdsl-container panel panel-w600">
      <div className="mdsl-header panel-header">
        <h1>HDoc - Market Document Setting</h1>
      </div>

      {message && <div className="mdsl-error msg-error">{message}</div>}
      {successMessage && <div className="mdsl-success msg-success">{successMessage}</div>}

      <div className="mdsl-bordered">
        {/* 按钮区域：在上方，有背景色 */}
        <div className="mdsl-btn-row">
          <button className="btn" onClick={handleSearch}>
            Search
          </button>
          <button className="btn" onClick={handleClear}>
            Clear
          </button>
          <button className="btn" onClick={handleBack}>
            Back
          </button>
          <button
            className="btn"
            onClick={handleUpdateMode}
            disabled={isLoading}
          >
            Update Mode
          </button>
        </div>

        {/* 检索条件区域 */}
        <div className="mdsl-form">
          <div className="mdsl-row">
            <span className="mdsl-label">Document type</span>
            {renderOpSelect("Document type", documentTypeOp, setDocumentTypeOp)}
            <input
              type="text"
              className="mdsl-input"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              maxLength={20}
            />
          </div>
          <div className="mdsl-row">
            <span className="mdsl-label">Market</span>
            {renderOpSelect("Market", marketOp, setMarketOp)}
            <input
              type="text"
              className="mdsl-input"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            />
          </div>
          <div className="mdsl-row">
            <span className="mdsl-label">Setting</span>
            {renderOpSelect("Setting", settingOp, setSettingOp)}
            <select
              className="mdsl-input mdsl-select"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="NO_VDA_CACHE">NO_VDA_CACHE</option>
            </select>
          </div>
          <div className="mdsl-row">
            <span className="mdsl-label">Business unit</span>
            {renderOpSelect("Business unit", businessUnitOp, setBusinessUnitOp)}
            <select
              className="mdsl-input mdsl-select"
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
            >
              <option value="BU">BU</option>
            </select>
          </div>
          <div className="mdsl-row">
            <span className="mdsl-label">User</span>
            {renderOpSelect("User", userOp, setUserOp)}
            <input
              type="text"
              className="mdsl-input"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              maxLength={16}
            />
          </div>
          <div className="mdsl-row">
            <span className="mdsl-label">Date</span>
            {renderOpSelect("Date", dateOp, setDateOp)}
            <input
              type="text"
              className="mdsl-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
