import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ExistingHDocVariables.css";

const TYPE_OPTIONS = ["", "VDA", "User Defined"];

const ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");

  // Form fields
  const [variable, setVariable] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [createdByUser, setCreatedByUser] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);

    // 从检索结果画面回传时自动填充
    const state = location.state as any;
    if (state?.variable) setVariable(state.variable);
    if (state?.type) setType(state.type);
    if (state?.description) setDescription(state.description);
    if (state?.createdByUser) setCreatedByUser(state.createdByUser);
    if (state?.date) setDate(state.date);
  }, [navigate, location.state]);

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleFieldChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    maxLen?: number
  ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = maxLen ? e.target.value.slice(0, maxLen) : e.target.value;
      setter(val);
      clearMessages();
    };

  const handleSearch = () => {
    navigate("/existing-hdoc-variables-result", {
      state: { variable, type, description, createdByUser, date },
    });
  };

  const handleClear = () => {
    setVariable("");
    setType("");
    setDescription("");
    setCreatedByUser("");
    setDate("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleBack = () => {
    navigate(-1);
  };

  const validateVariable = (): boolean => {
    if (!variable.trim()) {
      setErrorMessage("Variable is required.");
      setSuccessMessage("");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateVariable()) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/hdoc/variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variable: variable.trim(),
          type,
          description,
          createdByUser,
          date,
        }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        setSuccessMessage("Variable added successfully");
        handleClear();
      } else {
        setErrorMessage(data.message || "Variant already exists. Please enter the correct content.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateVariable()) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/hdoc/variables/${encodeURIComponent(variable.trim())}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variable: variable.trim(),
          type,
          description,
          createdByUser,
          date,
        }),
      });
      const data = await response.json();
      if (response.ok || data.success) {
        setSuccessMessage("Variable updated successfully");
      } else {
        setErrorMessage(data.message || "Variant does not exists. Please enter the correct content.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!validateVariable()) return;
    if (!window.confirm("Are you sure you want to delete this variable?")) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/hdoc/variables/${encodeURIComponent(variable.trim())}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (response.ok || data.success) {
        setSuccessMessage("Variable deleted successfully");
        handleClear();
      } else {
        setErrorMessage(data.message || "Variant does not exists. Please enter the correct content.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcel = () => {
    window.open("/api/hdoc/variables/export", "_blank");
  };

  return (
    <div className="ehv-page">
      {/* 顶部导航栏 */}
      <header className="ehv-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="ehv-body">
        <div className="ehv-content">
          <h1 className="ehv-title">Existing HDoc Variables</h1>

          {/* 消息 */}
          {errorMessage && <div className="ehv-error">{errorMessage}</div>}
          {successMessage && <div className="ehv-success">{successMessage}</div>}

          {/* 表单 */}
          <div className="ehv-form">
            {/* 行1: Variable / Type */}
            <div className="ehv-row">
              <div className="ehv-field ehv-field-var">
                <label className="ehv-label">Variable</label>
                <input
                  type="text"
                  className="ehv-input"
                  value={variable}
                  onChange={handleFieldChange(setVariable, 30)}
                  disabled={isLoading}
                />
              </div>
              <div className="ehv-field ehv-field-type">
                <label className="ehv-label">Type</label>
                <select
                  className="ehv-select"
                  value={type}
                  onChange={(e) => { setType(e.target.value); clearMessages(); }}
                  disabled={isLoading}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 行2: Description */}
            <div className="ehv-row">
              <div className="ehv-field ehv-field-desc">
                <label className="ehv-label">Description</label>
                <input
                  type="text"
                  className="ehv-input"
                  value={description}
                  onChange={handleFieldChange(setDescription, 100)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 行3: Created by user / Date */}
            <div className="ehv-row">
              <div className="ehv-field ehv-field-user">
                <label className="ehv-label">Created by user</label>
                <input
                  type="text"
                  className="ehv-input"
                  value={createdByUser}
                  onChange={handleFieldChange(setCreatedByUser, 16)}
                  disabled={isLoading}
                />
              </div>
              <div className="ehv-field ehv-field-date">
                <label className="ehv-label">Date</label>
                <input
                  type="text"
                  className="ehv-input"
                  value={date}
                  onChange={handleFieldChange(setDate)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* 按钮行 */}
          <div className="ehv-buttons">
            <button className="ehv-btn" onClick={handleSearch} disabled={isLoading}>Search</button>
            <button className="ehv-btn" onClick={handleClear} disabled={isLoading}>Clear</button>
            <button className="ehv-btn" onClick={handleBack} disabled={isLoading}>Back</button>
            <button className="ehv-btn" onClick={handleAdd} disabled={isLoading}>Add</button>
            <button className="ehv-btn" onClick={handleUpdate} disabled={isLoading}>Update</button>
            <button className="ehv-btn" onClick={handleDelete} disabled={isLoading}>Delete</button>
            <button className="ehv-btn" onClick={handleExcel} disabled={isLoading}>Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExistingHDocVariables;
