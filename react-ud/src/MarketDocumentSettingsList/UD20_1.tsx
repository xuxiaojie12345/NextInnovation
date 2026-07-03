import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { marketDocSettingsApi } from "../services/api";
import "./UD20_1.css";

const BUSINESS_UNITS = ["VTC", "UD", "BU1", "BU2"];

const UD20_1 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const [docType, setDocType] = useState("");
  const [businessUnit, setBusinessUnit] = useState("");
  const [user, setUser] = useState("");
  const [date, setDate] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isLoading, setIsLoading] = useState(false);

  // 从UD20选择的数据回填
  useEffect(() => {
    const selected = (location.state as any)?.selected;
    if (selected) {
      setDocType(selected.doctype || "");
      setBusinessUnit(selected.businessUnit || "");
      setUser(selected.registerUser || "");
      setDate(selected.registerDatetime || "");
    }
  }, [location.state]);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  const handleClear = useCallback(() => {
    setDocType("");
    setBusinessUnit("");
    setUser("");
    setDate("");
    clearMessage();
  }, [clearMessage]);

  const handleBack = useCallback(() => {
    navigate("/UD24");
  }, [navigate]);

  const handleSearch = useCallback(() => {
    // 跳转至 UD20 查询结果画面
    navigate("/UD20");
  }, [navigate]);

  const handleUpdate = useCallback(async () => {
    clearMessage();
    if (!docType.trim()) {
      setMessage("No data found");
      setMessageType("error");
      return;
    }
    setIsLoading(true);
    try {
      const result = await marketDocSettingsApi.updateDocSetting({
        documentType: docType.trim(),
        businessUnit,
        user: user.trim(),
        date: date.trim(),
      });
      if (result && result.code === 200) {
        setMessage(result.msg || "更新成功");
        setMessageType("success");
      } else {
        setMessage(result?.msg || "No data found");
        setMessageType("error");
      }
    } catch {
      setMessage("系统暂时不可用，请稍后再试");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [docType, businessUnit, user, date, clearMessage]);

  return (
    <div className="ud20-1-container">
      <header className="ud20-1-header">
        <div className="ud20-1-header-logo"></div>
      </header>
      <main className="ud20-1-main">
        <div className="ud20-1-card">
          <h1 className="ud20-1-page-title">HDoc - Market Document Settings</h1>

          {message && (
            <div className={`ud20-1-msg ud20-1-${messageType}`} role="alert">
              {message}
            </div>
          )}

          {/* Buttons */}
          <div className="ud20-1-btns">
            <button className="ud20-1-btn" onClick={handleSearch}>
              Search
            </button>
            <button className="ud20-1-btn" onClick={handleClear}>
              Clear
            </button>
            <button className="ud20-1-btn" onClick={handleBack}>
              Back
            </button>
            <button
              className="ud20-1-btn"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              Update Mode
            </button>
          </div>

          {/* Document type */}
          <div className="ud20-1-row">
            <label className="ud20-1-lbl">Document type</label>
            <span className="ud20-1-op">=</span>
            <input
              className="ud20-1-inp"
              type="text"
              maxLength={20}
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value);
                clearMessage();
              }}
              placeholder="Document type"
            />
          </div>

          {/* Business unit */}
          <div className="ud20-1-row">
            <label className="ud20-1-lbl">Bussines unit</label>
            <span className="ud20-1-op">=</span>
            <select
              className="ud20-1-sel"
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
            >
              <option value=""></option>
              {BUSINESS_UNITS.map((bu) => (
                <option key={bu} value={bu}>
                  {bu}
                </option>
              ))}
            </select>
          </div>

          {/* User */}
          <div className="ud20-1-row">
            <label className="ud20-1-lbl">User</label>
            <span className="ud20-1-op">=</span>
            <input
              className="ud20-1-inp"
              type="text"
              maxLength={16}
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                clearMessage();
              }}
              placeholder="User"
            />
          </div>

          {/* Date */}
          <div className="ud20-1-row">
            <label className="ud20-1-lbl">Date</label>
            <span className="ud20-1-op">=</span>
            <input
              className="ud20-1-inp"
              type="text"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                clearMessage();
              }}
              placeholder="Date"
            />
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD20_1;
