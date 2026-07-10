import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../common/css/common.css";
import "./EDBUserView.css";

const OPERATORS = ["=", "!="];

interface UserData {
  userId: string;
  username: string;
  userPosition?: string;
  email?: string;
}

const EDBUserView: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { userid?: string } | null;

  const [filters, setFilters] = useState([
    { label: "Userid", operator: "=" as string, value: "" },
    { label: "Responsible", operator: "=" as string, value: "" },
    { label: "User Position", operator: "=" as string, value: "" },
    { label: "E-mail", operator: "=" as string, value: "" },
  ]);

  // 进入画面时获取用户信息并填入输入框
  useEffect(() => {
    const userId = state?.userid;
    if (!userId) return;

    (async () => {
      try {
        const res = await api.post<UserData>("/user/info", { userid: userId });
        if (res.code === 200 && res.data) {
          const d = res.data;
          setFilters([
            { label: "Userid", operator: "=", value: d.userId },
            { label: "Responsible", operator: "=", value: d.username || "" },
            {
              label: "User Position",
              operator: "=",
              value: d.userPosition || "",
            },
            { label: "E-mail", operator: "=", value: d.email || "" },
          ]);
        }
      } catch {
        // 静默失败
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilter = (
    index: number,
    field: "operator" | "value",
    val: string,
  ) => {
    setFilters((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleClear = () => {
    setFilters(filters.map((f) => ({ ...f, operator: "=", value: "" })));
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="edb-container">
      <div className="edb-header">
        <h1>EDB User View</h1>
      </div>

      {/* Clear / Back 在表单最上方 */}
      <div className="edb-btn-row">
        <button className="btn" onClick={handleClear}>
          Clear
        </button>
        <button className="btn" onClick={handleBack}>
          Back
        </button>
      </div>

      <div className="edb-filters">
        {filters.map((row, i) => (
          <div className="edb-filter-row" key={row.label}>
            <span className="edb-filter-label">{row.label}</span>
            <select
              className="edb-filter-operator"
              value={row.operator}
              onChange={(e) => updateFilter(i, "operator", e.target.value)}
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="edb-filter-input"
              value={row.value}
              onChange={(e) => updateFilter(i, "value", e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EDBUserView;
