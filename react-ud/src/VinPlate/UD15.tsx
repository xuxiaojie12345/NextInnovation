import React, { useState, useCallback } from "react";
import { vinPlateApi } from "../services/api";
import "./UD15.css";

interface VinPlateInfo {
  serie?: string;
  chnr?: string;
  chassisNumber?: string;
  type?: number;
  status?: number;
  msg?: string;
  registerDatetime?: string;
  docReady?: string;
  docSent?: string;
  printItems?: string[];
  xmlDoc?: string;
}

const UD15 = React.memo(() => {
  const [chassisInput, setChassisInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vinPlateInfo, setVinPlateInfo] = useState<VinPlateInfo | null>(null);

  const clearMessages = useCallback(() => {
    setErrorMessage("");
    setSuccessMessage("");
  }, []);

  const handleViewInfo = useCallback(async () => {
    clearMessages();
    const chassis = chassisInput.trim();
    if (!chassis) {
      setErrorMessage("Please enter a chassis number.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await vinPlateApi.viewInfo(chassis);
      if (result && result.code === 200 && result.data) {
        setVinPlateInfo(result.data as VinPlateInfo);
        setSuccessMessage("查询成功");
      } else {
        setErrorMessage(result?.msg || `Chassis number ${chassis} not found.`);
        setVinPlateInfo(null);
      }
    } catch {
      setErrorMessage("网络连接失败，请检查网络设置");
      setVinPlateInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, [chassisInput, clearMessages]);

  const executeAction = useCallback(
    async (action: (chassis: string) => Promise<any>, successMsg: string) => {
      clearMessages();
      const chassis = chassisInput.trim();
      if (!chassis) {
        setErrorMessage("Please enter a chassis number.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await action(chassis);
        if (result && result.code === 200) {
          setSuccessMessage(result.msg || successMsg);
          setChassisInput("");
        } else {
          setErrorMessage(result?.msg || "操作失败，请稍后重试");
        }
      } catch {
        setErrorMessage("网络连接失败，请检查网络设置");
      } finally {
        setIsLoading(false);
      }
    },
    [chassisInput, clearMessages],
  );

  const statusLabel = (status: number): string => {
    return status === 0 ? "新增" : "XML已生成";
  };

  const typeLabel = (type: number): string => {
    return type === 1 ? "基础版" : "高级版";
  };

  return (
    <div className="ud15-container">
      <header className="ud15-header">
        <div className="ud15-header-logo">VOLVO</div>
      </header>
      <main className="ud15-main">
        <div className="ud15-card">
          <h1 className="ud15-page-title">Vin Plate</h1>

          {errorMessage && (
            <div className="ud15-message ud15-error" role="alert">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="ud15-message ud15-success">{successMessage}</div>
          )}

          {/* Input Area */}
          <div className="ud15-section">
            <div className="ud15-field-row">
              <label className="ud15-label">Chassis number</label>
              <input
                className="ud15-input"
                type="text"
                maxLength={15}
                value={chassisInput}
                onChange={(e) => {
                  setChassisInput(e.target.value);
                  clearMessages();
                }}
              />
            </div>
            <div className="ud15-button-row">
              <button
                className="ud15-btn"
                onClick={handleViewInfo}
                disabled={isLoading}
              >
                View Info
              </button>
              <button
                className="ud15-btn"
                onClick={() =>
                  executeAction(
                    (c) => vinPlateApi.setRegenerate(c),
                    "状态已更新为新增",
                  )
                }
                disabled={isLoading}
              >
                Set Regenerate
              </button>
              <button
                className="ud15-btn"
                onClick={() =>
                  executeAction(
                    (c) => vinPlateApi.setOk(c),
                    "状态已更新为XML已生成",
                  )
                }
                disabled={isLoading}
              >
                Set OK
              </button>
              <button
                className="ud15-btn"
                onClick={() =>
                  executeAction(
                    (c) => vinPlateApi.changeToBasicInfo(c),
                    "切换到基础信息成功",
                  )
                }
                disabled={isLoading}
              >
                Change to Basic Info
              </button>
              <button
                className="ud15-btn"
                onClick={() =>
                  executeAction(
                    (c) => vinPlateApi.changeToAdvancedInfo(c),
                    "切换到高级信息成功",
                  )
                }
                disabled={isLoading}
              >
                Change to Advanced Info
              </button>
            </div>
          </div>

          {/* Detail Area - shown after View Info success */}
          {vinPlateInfo && (
            <div className="ud15-detail-section">
              <div className="ud15-detail-row">
                <span className="ud15-detail-label">Chassis number</span>
                <span className="ud15-detail-value">
                  {chassisInput.length >= 4
                    ? chassisInput.trim().substring(0, 4) +
                      "-" +
                      chassisInput.trim().substring(4).trim()
                    : chassisInput || "-"}
                </span>
              </div>
              <div className="ud15-detail-row">
                <span className="ud15-detail-label">Plate type</span>
                <span className="ud15-detail-value">
                  {vinPlateInfo.type != null ? vinPlateInfo.type : "-"}
                </span>
              </div>
              <div className="ud15-detail-row">
                <span className="ud15-detail-label">Status</span>
                <span className="ud15-detail-value">
                  {vinPlateInfo.status != null ? vinPlateInfo.status : "-"}
                </span>
              </div>
              <div className="ud15-detail-row">
                <span className="ud15-detail-label">Error Message</span>
                <span className="ud15-detail-value">
                  {vinPlateInfo.msg != null ? vinPlateInfo.msg : "-"}
                </span>
              </div>
              {vinPlateInfo.registerDatetime && (
                <div className="ud15-detail-row">
                  <span className="ud15-detail-label">Def.</span>
                  <span className="ud15-detail-value">
                    {vinPlateInfo.registerDatetime}
                  </span>
                </div>
              )}
              {vinPlateInfo.docReady != null && (
                <div className="ud15-detail-row">
                  <span className="ud15-detail-label">Data ready</span>
                  <span className="ud15-detail-value">
                    {vinPlateInfo.docReady}
                  </span>
                </div>
              )}
              {vinPlateInfo.docSent != null && (
                <div className="ud15-detail-row">
                  <span className="ud15-detail-label">Sent to CAB factory</span>
                  <span className="ud15-detail-value">
                    {vinPlateInfo.docSent}
                  </span>
                </div>
              )}
              <div className="ud15-detail-row">
                <span className="ud15-detail-label">Print items</span>
                <span className="ud15-detail-value">
                  {vinPlateInfo.printItems && vinPlateInfo.printItems.length > 0
                    ? vinPlateInfo.printItems.join(", ")
                    : "-"}
                </span>
              </div>
              {vinPlateInfo.xmlDoc != null && (
                <div className="ud15-detail-row">
                  <span className="ud15-detail-label">VP Data</span>
                  <span className="ud15-detail-value">
                    {vinPlateInfo.xmlDoc}
                  </span>
                </div>
              )}
            </div>
          )}

          {!vinPlateInfo && !errorMessage && (
            <p className="ud15-hint-text">Please enter a chassis number.</p>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD15;
