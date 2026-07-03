import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { documentApi } from "../services/api";
import "./UD04.css";

// ===== 类型定义 =====

interface VinPlateData {
  chassisNo: string;
  ordernumber: string;
  buildWeek: string;
  specWeek: string;
  market: string;
  masterMarket: string;
  snotes: string[];
  snotemessage: string;
  frontLoadIndex: string;
  frontSpeedIndex: string;
  driveLoadIndex: string;
  driveSpeedIndex: string;
  adChangeEnabled: boolean;
  adChangeMessage: string;
  templateName: string;
  replacedParams: string[];
  generatedFileUrl: string;
  date: string;
  hdocVersion: string;
}

/** 后端统一响应包装 */
interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
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

const UD04 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const [vinPlateData, setVinPlateData] = useState<VinPlateData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const stateData = location.state as {
    chassisSeries?: string;
    chassisNo?: string;
    documentType?: string;
  } | null;

  // ---- API 呼び出し ----
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }

    const initPage = async () => {
      const chassisSeries = stateData?.chassisSeries || "";
      const chassisNo = stateData?.chassisNo || "";
      const documentType = stateData?.documentType || "";

      if (!chassisSeries || !chassisNo || !documentType) {
        setErrorMessage("无法加载数据，请检查输入");
        setIsLoading(false);
        return;
      }

      try {
        const res: ApiResponse<VinPlateData> =
          await documentApi.getSelectGeneratedocument({
            chassisSeries,
            chassisNo,
            documentType,
          });

        if (res.code !== 200) {
          setErrorMessage(res.msg || "数据加载失败，请稍后重试");
          setIsLoading(false);
          return;
        }

        const result = res.data;

        // 校验1: 模板是否存在
        // if (!result.templateName) {
        //   setErrorMessage("Can not find template for doctype VIN-PLATE");
        //   setIsLoading(false);
        //   return;
        // }

        // 校验2: 替换参数是否存在
        if (!result.replacedParams || result.replacedParams.length === 0) {
          setErrorMessage("No template rule defined for this truck.");
          setIsLoading(false);
          return;
        }

        setVinPlateData(result);
        setErrorMessage("");
      } catch (err: any) {
        if (err.message && err.message.includes("Network")) {
          setErrorMessage("网络连接失败，请检查网络设置");
        } else {
          setErrorMessage("系统繁忙，请稍后再试");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [navigate, stateData]);

  // ---- イベントハンドラ ----
  const handleChassisNoClick = useCallback(() => {
    if (vinPlateData?.chassisNo) {
      navigate(`/UD07?chassisNo=${encodeURIComponent(vinPlateData.chassisNo)}`);
    }
  }, [navigate, vinPlateData]);

  const handleModifyDocClick = useCallback(() => {
    if (vinPlateData?.chassisNo) {
      navigate("/UD05", {
        state: {
          chassisNo: vinPlateData.chassisNo,
          market: vinPlateData.market,
        },
      });
    }
  }, [navigate, vinPlateData]);

  const handleDownloadDocument = useCallback(() => {
    if (vinPlateData?.generatedFileUrl) {
      const link = document.createElement("a");
      link.href = vinPlateData.generatedFileUrl;
      link.download = `VIN_Plate_${vinPlateData.chassisNo}.rtf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [vinPlateData]);

  // ---- ローディング中 ----
  if (isLoading) {
    return (
      <div className="ud04-container">
        <div className="ud04-loading">Loading...</div>
      </div>
    );
  }

  // ---- メイン描画 ----
  return (
    <div className="ud04-container">
      <header className="ud04-header">
        <div className="ud04-header-logo"></div>
      </header>

      <main className="ud04-main">
        <div className="ud04-content-box">
          <h1 className="ud04-page-title">Generate document</h1>

          {errorMessage && (
            <div className="ud04-error-area" role="alert">
              {errorMessage}
            </div>
          )}

          {vinPlateData && (
            <>
              {/* ── 基本情報 ── */}
              <div className="ud04-section">
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Chassis no:</span>
                  <span
                    className="ud04-info-value ud04-link"
                    onClick={handleChassisNoClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleChassisNoClick();
                    }}
                  >
                    {vinPlateData.chassisNo}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Ordernumber:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.ordernumber}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Build week:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.buildWeek}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Spec week:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.specWeek}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Market:</span>
                  <span className="ud04-info-value">{vinPlateData.market}</span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Master Market:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.masterMarket}
                  </span>
                </div>
              </div>

              {/* ── S-Notes ── */}
              {vinPlateData.snotes && vinPlateData.snotes.length > 0 && (
                <div className="ud04-snote-section">
                  {vinPlateData.snotes.map((note, index) => (
                    <div key={index} className="ud04-snote-item">
                      {note}
                    </div>
                  ))}
                  <div className="ud04-snote-warning">
                    {vinPlateData.snotemessage}
                  </div>
                </div>
              )}

              {/* ── S-Note 警告文言（S-Note存在时表示） ── */}
              {vinPlateData.snotes && vinPlateData.snotes.length > 0 && (
                <div className="ud04-snote-warning-text">
                  The S-Notes above can affect homologation documents.
                </div>
              )}

              {/* ── タイヤ指数 ── */}
              <div className="ud04-section">
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Front load index:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.frontLoadIndex}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Front speed index:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.frontSpeedIndex}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Drive load index:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.driveLoadIndex}
                  </span>
                </div>
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Drive speed index:</span>
                  <span className="ud04-info-value">
                    {vinPlateData.driveSpeedIndex}
                  </span>
                </div>
              </div>

              {/* ── AD Change ── */}
              {vinPlateData.adChangeEnabled && (
                <div className="ud04-adchange-section">
                  <span
                    className="ud04-adchange-link"
                    onClick={handleModifyDocClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleModifyDocClick();
                    }}
                  >
                    {vinPlateData.adChangeMessage ||
                      "After def change detected. Document need to be modified."}
                  </span>
                </div>
              )}

              {/* ── テンプレート情報 ── */}
              <div className="ud04-section">
                <div className="ud04-info-row">
                  <span className="ud04-info-label">Using template:</span>
                  <span className="ud04-info-value">
                    {/* {vinPlateData.templateName} */}
                    eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHILtf
                  </span>
                </div>
              </div>

              {/* ── 置換パラメータ ── */}
              {vinPlateData.replacedParams &&
                vinPlateData.replacedParams.length > 0 && (
                  <div className="ud04-replaced-section">
                    <div className="ud04-replaced-title">
                      Replacing parameters
                    </div>
                    {vinPlateData.replacedParams.map((param, index) => (
                      <div key={index} className="ud04-info-row">
                        <span className="ud04-info-label">
                          AD Change. Modifying:
                        </span>
                        <span className="ud04-info-value">{param}</span>
                      </div>
                    ))}
                  </div>
                )}

              {/* ── ダウンロードリンク ── */}
              <div className="ud04-section">
                <span
                  className="ud04-link-doc"
                  onClick={handleDownloadDocument}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleDownloadDocument();
                  }}
                >
                  Generated document
                </span>
              </div>

              {/* ── フッター ── */}
              <div className="ud04-footer">
                <span>Date: {vinPlateData.date}</span>
                <span>HDoc version: {vinPlateData.hdocVersion}</span>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD04;
