import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "./VehicleSpecification.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

interface VehicleSpecData {
  model: string;
  builtWeek: string;
  productType: string;
  vin: string;
  engineNo: string;
  countryOfOperation: string;
  symbolStr: string;
  description: string;
  sNoteNo: string;
}

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

const fetchVehicleSpec = async (
  chassisNo: string,
): Promise<ApiResponse<VehicleSpecData>> => {
  try {
    const response = await apiClient.get<ApiResponse<VehicleSpecData>>(
      "/api/ud07/vehiclespecification",
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
          message: "Network error. Please check your connection.",
        },
      };
    } else {
      throw { status: 500, data: { code: 500, message: "Unknown error" } };
    }
  }
};

/**
 * VehicleSpecification コンポーネント（UD07）
 * VDA - Vehicle Specification 画面
 */
const VehicleSpecification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as { chassisNo?: string }) || {};
  const fullChassisNo = state.chassisNo || "";
  const chassisSerie = fullChassisNo.replace(/[0-9]/g, "");
  const chassisNumber = fullChassisNo.replace(/[A-Za-z]/g, "");

  const [data, setData] = useState<VehicleSpecData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!fullChassisNo) {
        setErrorMessage("Vehicle data not found for this Chassis No.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetchVehicleSpec(fullChassisNo);
        if (response.code === 200 && response.data) {
          setData(response.data);
        } else {
          setErrorMessage(
            response.msg || "Vehicle data not found for this Chassis No.",
          );
        }
      } catch (error: any) {
        setErrorMessage(
          error?.data?.message || "System error. Please try again later.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fullChassisNo]);

  const handleBack = () => {
    navigate(-1);
  };

  // 分割 SYMBOL_STR 为单个代码数组
  const symbolCodes = data?.symbolStr
    ? data.symbolStr.split(" ").filter((s) => s.trim() !== "")
    : [];

  // 分割 S-Note NO 为多行（空格替换为换行）
  const sNoteLines = data?.sNoteNo
    ? data.sNoteNo.split(" ").filter((s) => s.trim() !== "")
    : [];

  if (isLoading) {
    return (
      <div className="vspec-page-wrapper">
        <div className="vspec-container">
          <h1 className="vspec-title">VDA - Vehicle Specification</h1>
          <div className="vspec-loading">Loading vehicle data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="vspec-page-wrapper">
      <div className="vspec-container">
        <h1 className="vspec-title">VDA - Vehicle Specification</h1>

        {errorMessage && (
          <div className="vspec-error" role="alert">
            {errorMessage}
          </div>
        )}

        {data && (
          <>
            {/* Row 1: Chassis no + Model */}
            <div className="vspec-row">
              <div className="vspec-field">
                <span className="vspec-label">Chassis no:</span>
                <span className="vspec-value">
                  {chassisSerie && chassisNumber
                    ? `${chassisSerie} ${chassisNumber}`
                    : fullChassisNo}
                </span>
              </div>
              <div className="vspec-field">
                <span className="vspec-label">Model:</span>
                <span className="vspec-value">{data.model}</span>
              </div>
            </div>

            {/* Row 2: Built week + Product type */}
            <div className="vspec-row">
              <div className="vspec-field">
                <span className="vspec-label">Built week:</span>
                <span className="vspec-value">{data.builtWeek}</span>
              </div>
              <div className="vspec-field">
                <span className="vspec-label">Product type:</span>
                <span className="vspec-value">{data.productType}</span>
              </div>
            </div>

            {/* Row 3: VIN + Engine no */}
            <div className="vspec-row">
              <div className="vspec-field">
                <span className="vspec-label">VIN:</span>
                <span className="vspec-value">{data.vin}</span>
              </div>
              <div className="vspec-field">
                <span className="vspec-label">Engine no:</span>
                <span className="vspec-value">{data.engineNo}</span>
              </div>
            </div>

            {/* Row 4: Country of Operation */}
            <div className="vspec-row" style={{ marginTop: "10px" }}>
              <div className="vspec-field">
                <span className="vspec-label">Country of Operation:</span>
                <span className="vspec-value">{data.countryOfOperation}</span>
              </div>
              <div className="vspec-field"></div>
            </div>

            {/* SYMBOL_STR - 变体代码列表 */}
            {symbolCodes.length > 0 && (
              <div className="vspec-symbol-section">
                <div className="vspec-symbol-grid">
                  {symbolCodes.map((code, index) => (
                    <span
                      key={index}
                      className="vspec-symbol-item"
                      onMouseEnter={() => setHoveredSymbol(code)}
                      onMouseLeave={() => setHoveredSymbol(null)}
                    >
                      {code}
                      {hoveredSymbol === code && data.description && (
                        <span className="vspec-tooltip">
                          {data.description}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* S-Note NO */}
            {sNoteLines.length > 0 && (
              <div className="vspec-snote-section">
                {sNoteLines.map((line, index) => (
                  <div key={index} className="vspec-snote-line">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleSpecification;
