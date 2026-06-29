import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hdocVariablesApi } from "../services/api";
import "./UD10.css";

// ===== 类型定义 =====

const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

const TYPE_OPTIONS = ["VDA", "User Defined"];

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

// ===== 主组件 =====

const UD10 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // 各字段的运算符
  const [opVariable, setOpVariable] = useState<string>("=");
  const [opType, setOpType] = useState<string>("=");
  const [opDesc, setOpDesc] = useState<string>("=");
  const [opCreatedBy, setOpCreatedBy] = useState<string>("=");
  const [opDate, setOpDate] = useState<string>("=");

  const [variable, setVariable] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [createdByUser, setCreatedByUser] = useState<string>("");
  const [dateLabel, setDateLabel] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }
    setIsLoading(false);
  }, [navigate]);

  // ===== 接收从UD11返回的选择记录 =====
  useEffect(() => {
    const stateData = location.state as { selectedRecords?: any[] } | null;
    if (
      stateData &&
      stateData.selectedRecords &&
      stateData.selectedRecords.length > 0
    ) {
      const record = stateData.selectedRecords[0];
      setVariable(record.variable || "");
      setType(record.type || "");
      setDescription(record.description || "");
      setCreatedByUser(record.createdByUser || "");
      setDateLabel(record.date || "");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const OPERATOR_OPTIONS = ["=", "!=", ">", "<", ">=", "<=", "Like"];

  const renderOperatorSelect = (
    value: string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
  ) => (
    <select
      className="ud10-operator"
      value={value}
      onChange={onChange}
      disabled={isSubmitting}
    >
      {OPERATOR_OPTIONS.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  );

  const handleClear = useCallback(() => {
    setVariable("");
    setType("");
    setDescription("");
    setCreatedByUser("");
    setDateLabel("");
    setOpVariable("=");
    setOpType("=");
    setOpDesc("=");
    setOpCreatedBy("=");
    setOpDate("=");
    setErrorMessage("");
  }, []);

  const handleBack = useCallback(() => {
    navigate("/UD02");
  }, [navigate]);

  const handleAdd = useCallback(async () => {
    if (!variable.trim()) {
      setErrorMessage("Variable 是必填项");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");

    // 从 localStorage 获取登录用户的 userId
    const loginUserId = getCurrentUser()?.userId || "SYSTEM";
    try {
      const params = {
        variable: variable.trim(),
        type,
        description: description.trim(),
        createdByUser: createdByUser.trim() || loginUserId,
      };
      const result = await hdocVariablesApi.addVariable(params);
      if (result && result.code === 200) {
        handleClear();
        alert("添加成功");
      } else {
        setErrorMessage(result?.msg || "添加失败");
      }
    } catch {
      setErrorMessage("添加失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }, [variable, type, description, handleClear]);

  const handleUpdate = useCallback(async () => {
    if (!variable.trim()) {
      setErrorMessage("Variable 是必填项");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");

    const loginUserId = getCurrentUser()?.userId || "SYSTEM";
    try {
      const params = {
        variable: variable.trim(),
        type,
        description: description.trim(),
        createdByUser: createdByUser.trim() || loginUserId,
      };
      const result = await hdocVariablesApi.updateVariable(params);
      if (result && result.code === 200) {
        handleClear();
        alert("更新成功");
      } else {
        setErrorMessage(result?.msg || "更新失败");
      }
    } catch {
      setErrorMessage("更新失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }, [variable, type, description, handleClear]);

  const handleDelete = useCallback(async () => {
    if (!variable.trim()) {
      setErrorMessage("请选择要删除的记录");
      return;
    }
    if (!window.confirm("确定要删除该记录吗？")) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const result = await hdocVariablesApi.deleteVariable(variable.trim());
      if (result && result.code === 200) {
        handleClear();
        alert("删除成功");
      } else {
        setErrorMessage(result?.msg || "删除失败");
      }
    } catch {
      setErrorMessage("删除失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }, [variable, handleClear]);

  const handleExport = useCallback(() => {
    setErrorMessage("");
    const params = new URLSearchParams();
    if (variable.trim()) params.append("variable", variable.trim());
    if (type) params.append("type", type);
    window.open(`/api/HDOC_VARIABLES/export?${params.toString()}`, "_blank");
    // 实际的导出可能需要通过后端 API 下载，此处用 window.open 示意
    alert("导出功能开发中");
  }, [variable, type]);

  if (isLoading) {
    return (
      <div className="ud10-container">
        <div className="ud10-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud10-container">
      <header className="ud10-header">
        <div className="ud10-header-logo">VOLVO</div>
      </header>
      <main className="ud10-main">
        <div className="ud10-card">
          <h1 className="ud10-page-title">Existing HDoc Variables</h1>

          {errorMessage && (
            <div className="ud10-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 按钮行 */}
          <div className="ud10-button-row">
            <button
              className="ud10-btn"
              onClick={() =>
                navigate("/UD11", {
                  state: {
                    variable: variable.trim(),
                    type,
                    description: description.trim(),
                  },
                })
              }
            >
              Search
            </button>
            <button className="ud10-btn" onClick={handleClear}>
              Clear
            </button>
            <button className="ud10-btn" onClick={handleBack}>
              Back
            </button>
            <button
              className="ud10-btn"
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
            <button
              className="ud10-btn"
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
            <button
              className="ud10-btn"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </button>
            <button className="ud10-btn" onClick={handleExport}>
              Excel
            </button>
          </div>

          {/* 表单 */}
          <div className="ud10-form-area">
            {/* Variable */}
            <div className="ud10-field-row">
              <label className="ud10-label" htmlFor="ud10-variable">
                Variable <span className="ud10-required">*</span>
              </label>
              {renderOperatorSelect(opVariable, (e) =>
                setOpVariable(e.target.value),
              )}
              <div className="ud10-field-control">
                <input
                  id="ud10-variable"
                  className="ud10-input"
                  type="text"
                  value={variable}
                  onChange={(e) => {
                    setVariable(e.target.value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  maxLength={30}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {/* Type */}
            <div className="ud10-field-row">
              <label className="ud10-label" htmlFor="ud10-type">
                Type
              </label>
              {renderOperatorSelect(opType, (e) => setOpType(e.target.value))}
              <div className="ud10-field-control">
                <select
                  id="ud10-type"
                  className="ud10-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select --</option>
                  {TYPE_OPTIONS.map((opt, i) => (
                    <option key={i} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Description */}
            <div className="ud10-field-row">
              <label className="ud10-label" htmlFor="ud10-desc">
                Description
              </label>
              {renderOperatorSelect(opDesc, (e) => setOpDesc(e.target.value))}
              <div className="ud10-field-control">
                <input
                  id="ud10-desc"
                  className="ud10-input"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            {/* Created by user - 短入力框 + 右侧自动值 */}
            <div className="ud10-field-row">
              <label className="ud10-label">Created by user</label>
              {renderOperatorSelect(opCreatedBy, (e) =>
                setOpCreatedBy(e.target.value),
              )}
              <div className="ud10-field-control-short">
                <input
                  className="ud10-input"
                  type="text"
                  value={createdByUser}
                  onChange={(e) => setCreatedByUser(e.target.value)}
                  maxLength={16}
                  disabled={isSubmitting}
                />
              </div>
              <span className="ud10-auto-value">
                {createdByUser || "Automatic"}
              </span>
            </div>
            {/* Date - 短入力框 + 右侧自动值 */}
            <div className="ud10-field-row">
              <label className="ud10-label">Date</label>
              {renderOperatorSelect(opDate, (e) => setOpDate(e.target.value))}
              <div className="ud10-field-control-short">
                <input
                  className="ud10-input"
                  type="text"
                  value={dateLabel}
                  onChange={(e) => setDateLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <span className="ud10-auto-value">
                {dateLabel || "Automatic"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD10;
