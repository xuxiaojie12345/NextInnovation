import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../common/css/common.css";
import "./SaveModifications.css";

interface SaveModMeta {
  doctype: string;
  version: string;
  hasUnreleasedVersion: boolean;
}

// 保存修改组件
const SaveModifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    serie: string;
    chnr: string;
    market?: string;
    modifications?: { variable: string; val: string }[];
  } | null;

  const serie = state?.serie || "";
  const chnr = state?.chnr || "";
  const market = state?.market || "";
  const modifications = state?.modifications || [];

  const [meta, setMeta] = useState<SaveModMeta | null>(null);
  const [, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!serie || !chnr) {
      setErrorMessage("Invalid chassis information.");
      setIsLoading(false);
      return;
    }
    const fetchMeta = async () => {
      try {
        const [s, c] = chnr.includes("-") ? chnr.split("-") : [serie, chnr];
        const res = await api.post<SaveModMeta>("/adcamodification", {
          serie: s,
          chno: c,
        });
        if (res.code === 200 && res.data) {
          setMeta(res.data);
        }
      } catch {
        // metadata fetch failure is non-critical
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeta();
  }, [serie, chnr]);

  const handleClose = () => {
    navigate("/menu/modify-document", {
      state: { serie, chnr, market },
    });
  };

  if (!serie || !chnr) {
    return (
      <div className="save-mod-container">
        <div className="save-mod-error">Invalid chassis information.</div>
        <button className="btn btn-secondary" onClick={handleClose}>
          Close
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="save-mod-container">
        <div className="loading-placeholder">Loading...</div>
      </div>
    );
  }

  return (
    <div className="save-mod-container">
      <h1 className="save-mod-title">Save Modifications</h1>

      <div className="save-mod-info">
        <div className="save-mod-info-row">
          <span className="info-label">Chassis serie:</span>
          <span className="info-value">{serie}</span>
        </div>
        <div className="save-mod-info-row">
          <span className="info-label">Chassis number:</span>
          <span className="info-value">{chnr}</span>
        </div>
        {meta && (
          <>
            <div className="save-mod-info-row">
              <span className="info-label">Doctype:</span>
              <span className="info-value">{meta.doctype}</span>
            </div>
            <div className="save-mod-info-row" style={{ marginTop: "30px" }}>
              <span className="info-label">Version:</span>
              <span className="info-value">{meta.version}</span>
            </div>
          </>
        )}
      </div>

      <div className="save-mod-version-row">
        <span className="info-label">Storing:</span>
        <span className="info-value">
          {modifications.map((mod, idx) => (
            <span key={idx}>
              {mod.variable} {mod.val}
              {idx < modifications.length - 1 ? ", " : ""}
            </span>
          ))}
        </span>
      </div>

      <div className="save-mod-info-row">
        <span className="info-label">FOUND UNRELEASED VERSION:</span>
        <span className="info-value">{meta?.version || ""}</span>
      </div>

      <div className="save-mod-message">VERSION IS RELEASED</div>

      <div className="save-mod-actions" style={{ marginTop: "20px" }}>
        <button className="btn btn-primary" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default SaveModifications;
