import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SaveModifications.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

interface ModificationDetail {
  doctype: string;
  version: string;
  storingInfo: string;
  foundUnreleasedVersion: string;
}

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

const fetchModificationDetails = async (
  chassisNo: string,
): Promise<ApiResponse<ModificationDetail>> => {
  try {
    const response = await apiClient.get<ApiResponse<ModificationDetail>>(
      "/api/ud06/selectmodificationdetails",
      { params: { chassisNo } },
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const { status, data } = error.response;
      throw {
        status,
        data: { code: status, message: data?.msg || "API call failed" },
      };
    } else if (error.request) {
      throw {
        status: 0,
        data: {
          code: 0,
          message:
            "System error: Unable to connect to server. Please try again later.",
        },
      };
    } else {
      throw { status: 500, data: { code: 500, message: "Unknown error" } };
    }
  }
};

/**
 * SaveModifications コンポーネント（UD06）
 * ModifyDocument 保存後に Menu 右侧显示修改内容摘要
 */
function SaveModifications() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as { chassisNo?: string }) || {};
  const fullChassisNo = state.chassisNo || "";

  // 分割 Chassis serie 和 Chassis number
  const chassisSerie = fullChassisNo.replace(/[0-9]/g, "");
  const chassisNumber = fullChassisNo.replace(/[A-Za-z]/g, "");

  const [detail, setDetail] = useState<ModificationDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!fullChassisNo) {
        setErrorMessage("Invalid Chassis Number format.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetchModificationDetails(fullChassisNo);
        if (response.code === 200 && response.data) {
          setDetail(response.data);
        } else {
          setErrorMessage(
            response.msg || "Failed to load modification details.",
          );
        }
      } catch (error: any) {
        setErrorMessage(
          error?.data?.message || "Failed to load modification details.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fullChassisNo]);

  const handleClose = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="svmod-page-wrapper">
        <div className="svmod-page-content">
          <h1 className="svmod-page-title">Save Modifications</h1>
          <div className="svmod-loading">Loading modification details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="svmod-page-wrapper">
      <div className="svmod-page-content">
        <h1 className="svmod-page-title">Save Modifications</h1>

        {errorMessage && (
          <div className="svmod-error" role="alert">
            {errorMessage}
          </div>
        )}

        {detail && (
          <div className="svmod-content">
            <div className="svmod-field">
              <span className="svmod-label">Chassis serie:</span>
              <span className="svmod-value">{chassisSerie}</span>
            </div>
            <div className="svmod-field">
              <span className="svmod-label">Chassis number:</span>
              <span className="svmod-value">{chassisNumber}</span>
            </div>
            <div className="svmod-field">
              <span className="svmod-label">Doctype:</span>
              <span className="svmod-value">{detail.doctype}</span>
            </div>
            <div className="svmod-field">
              <span className="svmod-label">Version:</span>
              <span className="svmod-value">{detail.version}</span>
            </div>
            <div className="svmod-field">
              <span className="svmod-label">Storing:</span>
              <span className="svmod-value">{detail.storingInfo}</span>
            </div>
            <div className="svmod-field">
              <span className="svmod-label">FOUND UNRELEASED VERSION:</span>
              <span className="svmod-value">
                {detail.foundUnreleasedVersion}
              </span>
            </div>
            <div className="svmod-message">VERSION IS RELEASED</div>
          </div>
        )}

        <div className="svmod-button-row">
          <button
            type="button"
            className="svmod-btn-close"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveModifications;
