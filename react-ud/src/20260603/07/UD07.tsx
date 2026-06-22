import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { documentApi } from "../../services/api";
import "./UD07.css";

// ===== 类型定义 =====

interface SymbolItem {
  symbol: string;
  description: string;
}

interface VehicleData {
  chassisNo: string;
  model: string;
  builtWeek: string;
  productType: string;
  vin: string;
  engineNo: string;
  countryOfOperation: string;
  symbols: SymbolItem[];
  sNotes: string[];
}

const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

const getCurrentUser = (): {
  userId: string;
  name: string;
  token: string;
} | null => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEY_USER);
    if (!userStr) return null;
    const userInfo = JSON.parse(userStr);
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    return {
      userId: userInfo.userId || "",
      name: userInfo.name || "",
      token: token || "",
    };
  } catch {
    return null;
  }
};

const UD07 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 从URL参数或state获取chassisNo
  const queryParams = new URLSearchParams(location.search);
  const chassisNoFromQuery = queryParams.get("chassisNo") || "";
  const stateData = location.state as { chassisNo?: string } | null;
  const chassisNo = chassisNoFromQuery || stateData?.chassisNo || "";

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }

    const initPage = async () => {
      if (!chassisNo) {
        setErrorMessage("无法加载数据，请检查输入");
        setIsLoading(false);
        return;
      }

      try {
        const result = await documentApi.getVehicleSpecification(chassisNo);

        console.log("--UD07-1----------------------------------" + chassisNo);
        console.log("--UD07-2----------------------------------" + result);
        console.log("--UD07-3----------------------------------" + result.data);

        if (result && result.data) {
          setVehicleData(result.data);
          setErrorMessage("");
        } else {
          setErrorMessage("数据加载失败，请稍后重试");
        }
      } catch {
        setErrorMessage("数据加载失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [navigate, chassisNo]);

  if (isLoading) {
    return (
      <div className="ud07-container">
        <div className="ud07-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud07-container">
      <header className="ud07-header">
        <div className="ud07-header-logo">VOLVO</div>
      </header>

      <main className="ud07-main">
        <div className="ud07-content-box">
          <h1 className="ud07-title">VDA - Vehicle Specification:</h1>

          {errorMessage && (
            <div className="ud07-error" role="alert">
              {errorMessage}
            </div>
          )}

          {vehicleData && (
            <>
              {/* 基本信息 */}
              <div className="ud07-info-section">
                <div className="ud07-info-row">
                  <span className="ud07-info-label">Chassis no:</span>
                  <span className="ud07-info-value">
                    {vehicleData.chassisNo}
                  </span>
                </div>
                <div className="ud07-info-row">
                  <span className="ud07-info-label">Model:</span>
                  <span className="ud07-info-value">{vehicleData.model}</span>
                </div>
                <div className="ud07-info-row">
                  <span className="ud07-info-label">Built week:</span>
                  <span className="ud07-info-value">
                    {vehicleData.builtWeek}
                  </span>
                </div>
                <div className="ud07-info-row">
                  <span className="ud07-info-label">Product type:</span>
                  <span className="ud07-info-value">
                    {vehicleData.productType}
                  </span>
                </div>
                <div className="ud07-info-row">
                  <span className="ud07-info-label">VIN:</span>
                  <span className="ud07-info-value">{vehicleData.vin}</span>
                </div>
                <div className="ud07-info-row">
                  <span className="ud07-info-label">Engine no:</span>
                  <span className="ud07-info-value">
                    {vehicleData.engineNo}
                  </span>
                </div>
                <div className="ud07-info-row">
                  <span className="ud07-info-label">Country of Operation:</span>
                  <span className="ud07-info-value">
                    {vehicleData.countryOfOperation}
                  </span>
                </div>
              </div>

              {/* Symbols（仅显示SYMBOL_STR，hover时Tooltip显示description） */}
              {vehicleData.symbols && vehicleData.symbols.length > 0 && (
                <div className="ud07-symbols-block">
                  {vehicleData.symbols.map((item, index) => (
                    <span
                      key={index}
                      className="ud07-symbol-item"
                      data-tip={item.description}
                    >
                      {item.symbol}
                    </span>
                  ))}
                </div>
              )}

              {/* S-Notes */}
              {vehicleData.sNotes && vehicleData.sNotes.length > 0 && (
                <div className="ud07-snotes-section">
                  {vehicleData.sNotes.map((note, index) => (
                    <div key={index} className="ud07-snote-item">
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD07;
