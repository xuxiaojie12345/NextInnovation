/**
 * VinPlate 组件 - VIN Plate页面（UD15）
 * 功能：查看和管理车辆底盘VIN Plate相关信息
 * 对应详细设计：详细设计/詳細設計UD15.md
 */
import React, { useState } from "react";
import axios from "axios";
import "./VinPlate.css";

/**
 * VIN Plate信息数据类型
 * 对应详细设计 2.1 控件属性表
 */
interface VinPlateInfo {
  chassisNumber: string;
  plateType: string;
  status: string;
  errorMessage: string;
  def: string;
  dataReady: string;
  sentToCabFactory: string;
  printItems: string;
  vpData: string;
}

/** 后端API基础地址 */
const API_BASE_URL = "http://localhost:8081";

/**
 * VinPlate 组件
 * 提供底盘号输入、查看VIN Plate信息、状态更新等功能
 * 五个按钮分别对应五种操作类型
 */
const VinPlate: React.FC = () => {
  // 底盘号输入
  const [chassisNumber, setChassisNumber] = useState<string>("");
  // VIN Plate详细信息
  const [vinInfo, setVinInfo] = useState<VinPlateInfo | null>(null);
  // 消息提示
  const [message, setMessage] = useState<string>("");
  // 消息类型：error / success
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  // 加载状态（防重复提交）
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * 通用API调用方法
   * 对应详细设计 3.1 所有按钮的共同前置处理
   * @param operation 操作类型
   */
  const callApi = async (operation: string) => {
    setMessage("");

    // 前置校验：Chassis number必填检查（对应详细设计 3.2 No.1）
    if (!chassisNumber || chassisNumber.trim() === "") {
      setMessage("Chassis number is required.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      // 获取当前登录用户ID
      let updateUser = '';
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          updateUser = userInfo.userid || userInfo.username || '';
        }
      } catch { /* ignore */ }

      const response = await axios.post(
        `${API_BASE_URL}/api/ud15/UD15SelecthdocsenddatavinplateApi`,
        {
          chassisNumber: chassisNumber.trim(),
          operation,
          updateUser
        }
      );

      if (response.data.code === 200) {
        if (operation === "viewInfo") {
          // ViewInfo成功：显示VIN Plate详细信息
          const data: VinPlateInfo = response.data.data;
          setVinInfo(data);
          setMessage("");
        } else {
          // 更新操作成功：显示成功消息
          setVinInfo(null);
          setMessage(response.data.message || "Operation successful.");
          setMessageType("success");
        }
      } else {
        // API返回非200
        handleApiError(response.data.message, operation);
      }
    } catch (err) {
      // 异常处理（对应详细设计 5. 异常处理）
      setMessage("System error. Please contact administrator.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理API返回的错误
   */
  const handleApiError = (errorMsg: string, operation: string) => {
    if (errorMsg && errorMsg.includes("not found")) {
      // 底盘号不存在（对应详细设计 3.2 No.2）
      setMessage(errorMsg);
    } else {
      setMessage(errorMsg || "System error. Please contact administrator.");
    }
    setMessageType("error");
    // ViewInfo失败时清空显示字段
    if (operation === "viewInfo") {
      setVinInfo(null);
    }
  };

  /**
   * View Info - 查看VIN Plate详细信息
   * 对应详细设计 3.1.1 View Info处理流程
   */
  const handleViewInfo = () => callApi("viewInfo");

  /**
   * Set Regenerate - 将底盘状态更新为"0"
   * 对应详细设计 3.1.2 Set Regenerate处理流程
   */
  const handleSetRegenerate = () => callApi("setRegenerate");

  /**
   * Set OK - 将底盘状态更新为"1"
   * 对应详细设计 3.1.3 Set OK处理流程
   */
  const handleSetOK = () => callApi("setOK");

  /**
   * Change to Basic Info - 将Status更新为"0"，Type更新为"1"
   * 对应详细设计 3.1.4 Change to Basic Info处理流程
   */
  const handleChangeToBasicInfo = () => callApi("changeToBasicInfo");

  /**
   * Change to Advanced Info - 将Status更新为"0"，Type更新为"2"
   * 对应详细设计 3.1.5 Change to Advanced Info处理流程
   */
  const handleChangeToAdvancedInfo = () => callApi("changeToAdvancedInfo");

  return (
    <div className="ud15-container">
      {/* 页面标题 */}
      <h1 className="ud15-title">Vin Plate</h1>

      {/* 消息提示区域 */}
      {message && (
        <div className={`ud15-message ${messageType}`}>{message}</div>
      )}

      {/* 加载状态 */}
      {loading && <div className="ud15-loading">Processing...</div>}

      {/* 表单区域 */}
      <div className="ud15-form">
        {/* Chassis number */}
        <div className="ud15-field">
          <label className="ud15-label">Chassis number</label>
          <input
            type="text"
            className="ud15-input"
            value={chassisNumber}
            onChange={(e) => {
              setChassisNumber(e.target.value);
              if (message) setMessage("");
            }}
            disabled={loading}
            maxLength={15}
            placeholder="例: JPCT-1234567890"
          />
        </div>
      </div>

      {/* 按钮组 */}
      <div className="ud15-btn-group">
        <button
          type="button"
          className="ud15-btn"
          onClick={handleViewInfo}
          disabled={loading}
        >
          View Info
        </button>
        <button
          type="button"
          className="ud15-btn"
          onClick={handleSetRegenerate}
          disabled={loading}
        >
          Set Regenerate
        </button>
        <button
          type="button"
          className="ud15-btn"
          onClick={handleSetOK}
          disabled={loading}
        >
          Set OK
        </button>
        <button
          type="button"
          className="ud15-btn"
          onClick={handleChangeToBasicInfo}
          disabled={loading}
        >
          Change to Basic Info
        </button>
        <button
          type="button"
          className="ud15-btn"
          onClick={handleChangeToAdvancedInfo}
          disabled={loading}
        >
          Change to Advanced Info
        </button>
      </div>

      {/* VIN Plate详细信息 - ViewInfo成功后显示 */}
      {vinInfo && !loading && (
        <div className="ud15-info-section">
          <h2 className="ud15-info-title">VIN Plate Information</h2>
          <table className="ud15-info-table">
            <tbody>
              <tr>
                <td className="ud15-info-label">Chassis number</td>
                <td className="ud15-info-value">{vinInfo.chassisNumber}</td>
              </tr>
              <tr>
                <td className="ud15-info-label">Plate type</td>
                <td className="ud15-info-value">
                  {vinInfo.plateType}
                  {vinInfo.plateType === "1" && " (basic)"}
                  {vinInfo.plateType === "2" && " (ADVANCED with weights)"}
                </td>
              </tr>
              <tr>
                <td className="ud15-info-label">Status</td>
                <td className="ud15-info-value">
                  {vinInfo.status}
                  {vinInfo.status === "0" && " (新規追加)"}
                  {vinInfo.status === "1" && " (xml doc 作成済み)"}
                </td>
              </tr>
              <tr>
                <td className="ud15-info-label">Def.</td>
                <td className="ud15-info-value">{vinInfo.def}</td>
              </tr>
              <tr>
                <td className="ud15-info-label">Data ready</td>
                <td className="ud15-info-value">{vinInfo.dataReady}</td>
              </tr>
              <tr>
                <td className="ud15-info-label">Sent to CAB factory</td>
                <td className="ud15-info-value">{vinInfo.sentToCabFactory}</td>
              </tr>
              <tr>
                <td className="ud15-info-label">Print items</td>
                <td className="ud15-info-value">{vinInfo.printItems}</td>
              </tr>
              <tr>
                <td className="ud15-info-label">VP Data</td>
                <td className="ud15-info-value">{vinInfo.vpData}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VinPlate;
