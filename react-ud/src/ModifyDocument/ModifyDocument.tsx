import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal } from "antd";
import { api } from "../services/api";
import "../common/css/common.css";
import "./ModifyDocument.css";

interface VariableItem {
  variable: string;
  description: string;
  newVal: string;
}

// 修改文档组件
const ModifyDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    serie: string;
    chnr: string;
    market?: string;
  } | null;

  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [modifiedValues, setModifiedValues] = useState<Record<string, string>>(
    {},
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const serie = state?.serie || "";
  const chnr = state?.chnr || "";
  const market = state?.market || "";

  useEffect(() => {
    if (!serie || !chnr) {
      setErrorMessage("Invalid chassis information.");
      setIsLoading(false);
      return;
    }

    const fetchVariables = async () => {
      setErrorMessage("");
      setIsLoading(true);
      try {
        const res = await api.post<VariableItem[]>("/modifydocument/select", {
          serie,
          chnr,
        });
        if (res.code === 200 && res.data) {
          setVariables(res.data);
          // Initialize modified values as empty
          const initial: Record<string, string> = {};
          res.data.forEach((v) => {
            initial[v.variable] = "";
          });
          setModifiedValues(initial);
        } else {
          setErrorMessage(res.message || "Vehicle data not found.");
        }
      } catch {
        setErrorMessage("System error. Please contact administrator.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVariables();
  }, [serie, chnr]);

  const handleValueChange = (variable: string, value: string) => {
    setModifiedValues((prev) => ({ ...prev, [variable]: value }));
  };

  const handleSave = async () => {
    // Collect only rows where the user actually entered a value
    const modifications = variables
      .filter((va) => modifiedValues[va.variable]?.trim())
      .map((va) => ({
        variable: va.variable,
        val: modifiedValues[va.variable],
      }));

    if (modifications.length === 0) {
      setErrorMessage("NO UNRELEASED VERSION EXISTS!");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const res = await api.post("/modifydocument/update", {
        serie,
        chnr,
        modifications,
        currentUser: localStorage.getItem("userId") || "",
      });

      if (res.code === 200) {
        navigate("/menu/save-modifications", {
          state: {
            serie,
            chnr,
            market,
            modifications,
          },
        });
      } else {
        let msg;
        if (res.message) {
          msg = res.message;
        } else {
          msg = "Failed to save modifications. Please try again.";
        }
        setErrorMessage(msg);
      }
    } catch {
      setErrorMessage("System error. Please contact administrator.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="modify-doc-loading">Loading...</div>;
  }

  if (errorMessage && variables.length === 0) {
    return (
      <div className="modify-doc-container">
        <div className="msg-error">{errorMessage}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="modify-doc-container">
      <h1 className="modify-doc-title">Modify Document</h1>

      {/* 车辆信息 */}
      <div className="modify-doc-info">
        <div className="modify-doc-info-item">
          <span className="info-label">Chassis no:</span>
          <span className="info-value">
            <strong>{serie}</strong>
            <strong
              className="modify-doc-chassis-link"
              onClick={() =>
                navigate("/menu/vehicle-specification", {
                  state: { serie, chnr },
                })
              }
            >
              {chnr}
            </strong>
          </span>
        </div>
        <div className="modify-doc-info-item">
          <span className="info-label" style={{ fontWeight: 500 }}>
            Market:
          </span>
          <span
            className="info-value"
            style={{ color: "#66707b", fontWeight: 500 }}
          >
            {market || "-"}
          </span>
        </div>
      </div>

      <div className="modify-doc-template">
        <span
          className="modify-doc-template-link"
          onClick={() => Modal.info({ title: "Info", content: "Template download not implemented.", transitionName: "" })}
        >
          Template:aus/Download Template File
        </span>
      </div>

      {errorMessage && (
      <div className="msg-error">{errorMessage}</div>
      )}

      {variables.length > 0 ? (
        <React.Fragment>
          <div className="modify-doc-save-bar">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="modify-doc-table-wrapper">
            <table className="modify-doc-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Description</th>
                  <th>Current value</th>
                  <th>Modified value</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((va) => (
                  <tr key={va.variable}>
                    <td className="td-desc">{va.variable}</td>
                    <td className="td-desc">{va.description}</td>
                    <td className="td-current">{va.newVal || "-"}</td>
                    <td className="td-modified">
                      <input
                        type="text"
                        className="modify-input"
                        value={modifiedValues[va.variable] || ""}
                        onChange={(e) =>
                          handleValueChange(va.variable, e.target.value)
                        }
                        maxLength={500}
                        disabled={isSaving}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </React.Fragment>
      ) : (
        <div className="modify-doc-empty">No variables found.</div>
      )}
    </div>
  );
};

export default ModifyDocument;
