import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ExistingHDocVariables.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

const ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();

  const [variable, setVariable] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [createdByUser, setCreatedByUser] = useState("");
  const [date, setDate] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(false);

  const typeOptions = ["", "VDA", "User Defined"];

  // 从结果页面返回时恢复检索条件或回填数据
  const savedParams = sessionStorage.getItem("hdoc_search_params");
  if (savedParams) {
    try {
      const restored = JSON.parse(savedParams);
      if (restored.variable !== undefined) setVariable(restored.variable);
      if (restored.type !== undefined) setType(restored.type);
      if (restored.description !== undefined)
        setDescription(restored.description);
      if (restored.createdByUser !== undefined)
        setCreatedByUser(restored.createdByUser);
      if (restored.date !== undefined) setDate(restored.date);
    } catch (_) {}
    sessionStorage.removeItem("hdoc_search_params");
  }

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const handleClear = () => {
    setVariable("");
    setType("");
    setDescription("");
    setCreatedByUser("");
    setDate("");
    clearMessage();
  };

  const handleSearch = () => {
    clearMessage();
    navigate("/menu/existing-hdoc-variables-result", {
      state: { variable, type, description, createdByUser, date },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const validateVariable = (): boolean => {
    if (!variable.trim()) {
      showMessage("Variable不能为空", "error");
      return false;
    }
    if (variable.length > 30) {
      showMessage("Variable长度不能超过30个字符", "error");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    clearMessage();
    if (!validateVariable()) return;
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse>(
        "/api/ud10hdocvariables/add",
        {
          variable: variable.trim(),
          type,
          description,
          userid: createdByUser,
          user: sessionStorage.getItem("userId") || "",
          date,
        },
      );
      if (res.data.code === 200) {
        showMessage("添加成功", "success");
      } else {
        showMessage(res.data.msg || res.data.message || "操作失败", "error");
      }
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "系统错误", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    clearMessage();
    if (!validateVariable()) return;
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse>(
        "/api/ud10hdocvariables/update",
        {
          variable: variable.trim(),
          type,
          description,
          userid: createdByUser,
          user: sessionStorage.getItem("userId") || "",
          date,
        },
      );
      if (res.data.code === 200) {
        showMessage("更新成功", "success");
      } else {
        showMessage(res.data.msg || res.data.message || "操作失败", "error");
      }
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "系统错误", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    clearMessage();
    if (!variable.trim()) {
      showMessage("无法删除，未指定要删除的记录", "error");
      return;
    }
    if (!window.confirm("确定要删除该记录吗？")) return;
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse>(
        "/api/ud10hdocvariables/delete",
        {
          variable: variable.trim(),
        },
      );
      if (res.data.code === 200) {
        showMessage("删除成功", "success");
        handleClear();
      } else {
        showMessage(res.data.msg || res.data.message || "操作失败", "error");
      }
    } catch (error: any) {
      showMessage(error?.response?.data?.message || "系统错误", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExcel = () => {
    // CSV 导出功能（暂未实现完整逻辑）
    showMessage("CSV导出功能", "success");
  };

  return (
    <div className="hdoc-vars-page-wrapper">
      <div className="hdoc-vars-container">
        <h1 className="hdoc-vars-title">Existing HDoc Variables</h1>

        {message && (
          <div className={`hdoc-vars-message hdoc-vars-message-${messageType}`}>
            {message}
          </div>
        )}

        <div className="hdoc-vars-button-row">
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            Search
          </button>
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </button>
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </button>
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleAdd}
            disabled={loading}
          >
            Add
          </button>
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleUpdate}
            disabled={loading}
          >
            Update
          </button>
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </button>
          <button
            type="button"
            className="hdoc-vars-btn"
            onClick={handleExcel}
            disabled={loading}
          >
            Excel
          </button>
        </div>

        <div className="hdoc-vars-form">
          <div className="hdoc-vars-field">
            <span className="hdoc-vars-label">
              <span className="hdoc-vars-required">*</span>Variable
            </span>
            <select className="hdoc-vars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hdoc-vars-input"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="hdoc-vars-field">
            <span className="hdoc-vars-label">Type</span>
            <select className="hdoc-vars-operator">
              <option value="=">=</option>
            </select>
            <select
              className="hdoc-vars-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="hdoc-vars-field">
            <span className="hdoc-vars-label">Description</span>
            <select className="hdoc-vars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hdoc-vars-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="hdoc-vars-field">
            <span className="hdoc-vars-label">Created by user</span>
            <select className="hdoc-vars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hdoc-vars-input"
              value={createdByUser}
              onChange={(e) => setCreatedByUser(e.target.value)}
              maxLength={16}
            />
            <span className="hdoc-vars-hint">Automatic</span>
          </div>

          <div className="hdoc-vars-field">
            <span className="hdoc-vars-label">Date</span>
            <select className="hdoc-vars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hdoc-vars-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <span className="hdoc-vars-hint">Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExistingHDocVariables;
