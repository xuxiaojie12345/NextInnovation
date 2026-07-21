import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./VehicleSpecification.css";

interface VehicleSpec {
  chassisNo: string;
  model: string;
  builtWeek: string;
  productType: string;
  vin: string;
  engineNo: string;
  countryOfOperation: string;
  symbols: { symbolStr: string; description: string }[];
  sNoteNo: string;
  sNoteDesc: string;
}

const VehicleSpecification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");
  const [spec, setSpec] = useState<VehicleSpec | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);

    const state = location.state as any;
    const chNo = state?.chassisNo || "";

    if (!chNo) {
      setErrorMessage("No chassis number provided.");
      setIsLoading(false);
      return;
    }

    fetchVehicleSpec(chNo);
  }, [navigate, location.state]);

  const fetchVehicleSpec = async (chNo: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/ud07/getvehiclespec?chassisNo=${encodeURIComponent(chNo)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success && data.data) {
        const d = data.data;
        const symbols = d.symbols || (d.symbolStr ? [{ symbolStr: d.symbolStr, description: d.description || "" }] : []);
        setSpec({
          chassisNo: d.chassisNo || "",
          model: d.model || "",
          builtWeek: d.builtWeek || "",
          productType: d.productType || "",
          vin: d.vin || "",
          engineNo: d.engineNo || "",
          countryOfOperation: d.countryOfOperation || "",
          symbols,
          sNoteNo: d.sNoteNo || "",
          sNoteDesc: d.sNoteDesc || "",
        });
      } else {
        setErrorMessage("No data found for this chassis.");
      }
    } catch {
      setErrorMessage("Network connection failed. Please check your network settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleSymbolMouseEnter = (desc: string, e: React.MouseEvent) => {
    if (desc) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltip({
        text: desc,
        x: rect.left,
        y: rect.bottom + 6,
      });
    }
  };

  const handleSymbolMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="vs-page">
      {/* 顶部导航栏 */}
      <header className="vs-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="vs-body">
        <div className="vs-content">
          <h1 className="vs-title">Vehicle Specification</h1>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="vs-error">{errorMessage}</div>
          )}

          {/* 加载中 */}
          {isLoading && (
            <div className="vs-loading">Loading...</div>
          )}

          {/* 数据区域 */}
          {!isLoading && !errorMessage && spec && (
            <div className="vs-info-panel">
              <div className="vs-field">
                <span className="vs-label">Chassis no</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.chassisNo || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">Model</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.model || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">Built week</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.builtWeek || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">Product type</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.productType || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">VIN</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.vin || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">Engine no</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.engineNo || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">Country of Operation</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.countryOfOperation || "-"}</span>
              </div>

              {/* SYMBOL_STR */}
              <div className="vs-field">
                <span className="vs-label">SYMBOL_STR</span>
                <span className="vs-sep">:</span>
                <span className="vs-value vs-symbols">
                  {spec.symbols.length > 0 ? (
                    spec.symbols.map((s, idx) => (
                      <span
                        key={idx}
                        className="vs-symbol-item"
                        onMouseEnter={(e) => handleSymbolMouseEnter(s.description, e)}
                        onMouseLeave={handleSymbolMouseLeave}
                      >
                        {s.symbolStr}
                      </span>
                    ))
                  ) : (
                    "-"
                  )}
                </span>
              </div>

              <div className="vs-field">
                <span className="vs-label">S-Note NO</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.sNoteNo || "-"}</span>
              </div>
              <div className="vs-field">
                <span className="vs-label">S-Note Desc</span>
                <span className="vs-sep">:</span>
                <span className="vs-value">{spec.sNoteDesc || "-"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="vs-tooltip"
          ref={tooltipRef}
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};

export default VehicleSpecification;
