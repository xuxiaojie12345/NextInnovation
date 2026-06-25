/**
 * MarketDocumentSettings 组件 - 市场文档设置页面（UD20-1）
 * 功能：提供市场文档的检索跳转、更新维护功能，支持跳转到列表画面选择记录并返回
 * 对应详细设计：详细设计/詳細設計UD20-1.md
 */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./MarketDocumentSettings.css";

/** 后端API基础地址 */
const API_BASE_URL = "http://localhost:8081";

/** 设置选项列表 */
const SETTING_OPTIONS = ["Option 1", "Option 2", "Option 3", "Option 4"];

/** 运算符类型 */
type Operator = "=" | "!=";

/**
 * MarketDocumentSettings 组件
 * 提供市场文档的检索、更新、清空和返回功能
 * 可接收从 MarketDocumentSettingsList 返回的选中数据
 */
const MarketDocumentSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // -------- 状态管理（对应详细设计 2.1 控件属性表）--------
  const [documentType, setDocumentType] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [setting, setSetting] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 各字段的 = / != 运算符状态
  const [ops, setOps] = useState<Record<string, Operator>>({
    documentType: "=", user: "=", date: "=", bussinesUnit: "=", market: "=", setting: "="
  });

  const setOp = (field: string, v: Operator) =>
    setOps((prev) => ({ ...prev, [field]: v }));

  /** 渲染运算符下拉框 */
  const renderOp = (field: string) => (
    <select value={ops[field]} onChange={(e) => setOp(field, e.target.value as Operator)} className="operator-select">
      <option value="=">=</option>
      <option value="!=">!=</option>
    </select>
  );

  const clearMessage = () => setMessage("");

  /**
   * 页面初始化处理（对应详细设计 3.1.1 初期表示流程）
   * 判断是从后画面（MarketDocumentSettingsList）返回还是首次加载
   */
  useEffect(() => {
    // 从后画面的Select返回时，接收选中数据
    const selectedData = (location.state as Record<string, any>)?.selectedData;
    if (selectedData) {
      setDocumentType(selectedData.documentType || "");
      setUser(selectedData.user || "");
      setDate(selectedData.date || "");
    }
    // 从URL参数接收检索条件（Search跳转时带入）
    const params = new URLSearchParams(location.search);
    if (params.get("documentType")) setDocumentType(params.get("documentType") || "");
    if (params.get("user")) setUser(params.get("user") || "");
    if (params.get("date")) setDate(params.get("date") || "");
  }, [location]);

  /**
   * Search 按钮处理（对应详细设计 3.1.2）
   */
  const handleSearch = () => {
    clearMessage();
    if (!documentType.trim() && !user.trim() && !date.trim()) {
      setMessage("Please enter at least one search condition.");
      setMessageType("error");
      return;
    }
    const params = new URLSearchParams();
    if (documentType.trim()) params.set("documentType", documentType.trim());
    if (user.trim()) params.set("user", user.trim());
    if (date.trim()) params.set("date", date.trim());
    navigate(`/Menu/MarketDocumentSettingsList?${params.toString()}`);
  };

  /**
   * Clear 按钮处理（对应详细设计 3.1.4）
   */
  const handleClear = () => {
    setDocumentType("");
    setMarket("");
    setSetting("");
    setUser("");
    setDate("");
    setOps({ documentType: "=", user: "=", date: "=", bussinesUnit: "=", market: "=", setting: "=" });
    clearMessage();
  };

  /**
   * Back 按钮处理（对应详细设计 3.1.3）
   */
  const handleBack = () => {
    clearMessage();
    navigate(-1);
  };

  /**
   * Update Mode 按钮处理（对应详细设计 3.1.5）
   */
  const handleUpdateMode = async () => {
    clearMessage();
    if (!documentType.trim()) {
      setMessage("Document type is required.");
      setMessageType("error");
      return;
    }
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/ud20-1/UpdateHdocDocumentList`,
        {
          operation: "UPDATE_HDOC_DOCUMENT_LIST",
          doctype: documentType.trim(),
          user: user.trim(),
          date: date.trim(),
          market: market.trim(),
          setting: setting.trim()
        }
      );

      if (response.data.code === 200) {
        // 更新成功
        setMessage("更新成功");
        setMessageType("success");
      } else if (response.data.code === 404) {
        // 对应详细设计 3.2 No.2 - Document type不存在
        setMessage(
          "Document type does not exists. Please enter the correct content."
        );
        setMessageType("error");
      } else {
        setMessage("更新失败");
        setMessageType("error");
      }
    } catch (err) {
      // 对应详细设计 5. 异常处理
      setMessage("系统错误，请稍后重试");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ud20-1-container">
      {/* 页面标题 */}
      <h1 className="ud20-1-title">HDoc - Market Document Settings</h1>

      {/* 工具栏按钮组 */}
      <div className="ud20-1-btn-group">
        <button type="button" className="action-button" onClick={handleSearch} disabled={isLoading}>Search</button>
        <button type="button" className="action-button" onClick={handleClear} disabled={isLoading}>Clear</button>
        <button type="button" className="action-button" onClick={handleBack} disabled={isLoading}>Back</button>
        <button type="button" className="action-button" onClick={handleUpdateMode} disabled={isLoading}>Update Mode</button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`ud20-1-message ${messageType === "error" ? "error" : "success"}`}>{message}</div>
      )}

      {isLoading && <div className="ud20-1-loading">Processing...</div>}

      {/* 表单区域 */}
      <div className="ud20-1-form">
        <div className="form-row">
          <label className="form-label">Document type</label>
          {renderOp("documentType")}
          <div className="form-control-wrapper">
            <input type="text" className="form-input" value={documentType}
              onChange={(e) => { setDocumentType(e.target.value); if (message) clearMessage(); }}
              disabled={isLoading} maxLength={20} placeholder="Enter Document Type" />
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">Market</label>
          {renderOp("market")}
          <div className="form-control-wrapper">
            <input type="text" className="form-input" value={market}
              onChange={(e) => { setMarket(e.target.value); if (message) clearMessage(); }}
              disabled={isLoading} placeholder="Enter Market" />
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">Setting</label>
          {renderOp("setting")}
          <div className="form-control-wrapper">
            <select className="form-select" value={setting}
              onChange={(e) => { setSetting(e.target.value); if (message) clearMessage(); }}
              disabled={isLoading}>
              <option value="">-- Select Setting --</option>
              {SETTING_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">Bussines unit</label>
          {renderOp("bussinesUnit")}
          <div className="form-control-wrapper">
            <span className="form-fixed-value">BU</span>
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">User</label>
          {renderOp("user")}
          <div className="form-control-wrapper">
            <input type="text" className="form-input" value={user}
              onChange={(e) => { setUser(e.target.value); if (message) clearMessage(); }}
              disabled={isLoading} maxLength={16} placeholder="Enter User" />
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">Date</label>
          {renderOp("date")}
          <div className="form-control-wrapper">
            <input type="text" className="form-input" value={date}
              onChange={(e) => { setDate(e.target.value); if (message) clearMessage(); }}
              disabled={isLoading} placeholder="Enter Date (YYYY-MM-DD)" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettings;
