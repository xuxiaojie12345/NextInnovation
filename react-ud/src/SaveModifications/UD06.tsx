import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { documentApi } from "../services/api";
import "./UD06.css";

// ===== 类型定义 =====

interface ModStatusData {
  doctype: string;
  version: string;
  storing: string;
  foundUnreleasedVersion: number;
  message: string;
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

const UD06 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state as {
    chassisSerie?: string;
    chassisNumber?: string;
  } | null;

  const [modStatusData, setModStatusData] = useState<ModStatusData | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }

    const initPage = async () => {
      const chassisSerie = stateData?.chassisSerie || "";
      const chassisNumber = stateData?.chassisNumber || "";

      if (!chassisSerie || !chassisNumber) {
        setErrorMessage("无法加载修改状态，请重试");
        setIsLoading(false);
        return;
      }

      try {
        const response = await documentApi.getSelectHdocAdcaModification({
          chassisSerie,
          chassisNumber,
        });

        if (response && response.data) {
          const result = response.data;
          setModStatusData(result);
          setErrorMessage("");
        } else {
          setErrorMessage("无法加载修改状态，请重试");
        }
      } catch {
        setErrorMessage("无法加载修改状态，请重试");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [navigate, stateData]);

  const handleClose = useCallback(() => {
    // 返回UD05画面
    navigate("/UD05", {
      state: {
        chassisNo: stateData?.chassisSerie
          ? `${stateData.chassisSerie}_${stateData.chassisNumber || ""}`
          : "",
      },
    });
  }, [navigate, stateData]);

  if (isLoading) {
    return (
      <div className="ud06-container">
        <div className="ud06-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud06-container">
      <header className="ud06-header">
        <div className="ud06-header-logo">VOLVO</div>
      </header>

      <main className="ud06-main">
        <div className="ud06-dialog">
          <h1 className="ud06-title">Save Modifications</h1>

          {errorMessage && (
            <div className="ud06-error" role="alert">
              {errorMessage}
            </div>
          )}

          {modStatusData && (
            <>
              <div className="ud06-info-section">
                <div className="ud06-info-row">
                  <span className="ud06-info-label">Chassis serie:</span>
                  <span className="ud06-info-value">
                    {stateData?.chassisSerie || ""}
                  </span>
                </div>
                <div className="ud06-info-row">
                  <span className="ud06-info-label">Chassis number:</span>
                  <span className="ud06-info-value">
                    {stateData?.chassisNumber || ""}
                  </span>
                </div>
                <div className="ud06-info-row">
                  <span className="ud06-info-label">Doctype:</span>
                  <span className="ud06-info-value">
                    {modStatusData.doctype}
                  </span>
                </div>
                <div className="ud06-info-row">
                  <span className="ud06-info-label">Version:</span>
                  <span className="ud06-info-value">
                    {modStatusData.version}
                  </span>
                </div>
                <div className="ud06-info-row">
                  <span className="ud06-info-label">Storing:</span>
                  <span className="ud06-info-value">
                    {modStatusData.storing}
                  </span>
                </div>
                <div className="ud06-info-row">
                  <span className="ud06-info-label">
                    FOUND UNRELEASED VERSION:
                  </span>
                  <span className="ud06-info-value">
                    {modStatusData.foundUnreleasedVersion}
                  </span>
                </div>
              </div>

              <div className="ud06-message-section">
                <span className="ud06-message-released">
                  {modStatusData.message}
                </span>
              </div>

              <div className="ud06-button-row">
                <button className="ud06-btn" onClick={handleClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD06;
