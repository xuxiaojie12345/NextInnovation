import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal } from 'antd';
import { api } from "../services/api";
import "../common/css/common.css";
import "./ExistingHDocVariables.css";

type Operator = "=" | "!=" | ">" | "<";

const STORAGE_KEY = "ehv_conditions";

// 现有 HDoc 变量管理组件
const ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 搜索条件
  const [variable, setVariable] = useState("");
  const [variableOp, setVariableOp] = useState<Operator>("=");
  const [type, setType] = useState("");
  const [typeOp, setTypeOp] = useState<Operator>("=");
  const [description, setDescription] = useState("");
  const [descriptionOp, setDescriptionOp] = useState<Operator>("=");
  const [createdByUser, setCreatedByUser] = useState("");
  const [createdByUserOp, setCreatedByUserOp] = useState<Operator>("=");
  const [date, setDate] = useState("");
  const [dateOp, setDateOp] = useState<Operator>("=");

  // UI 状态
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 从结果列表返回时恢复选中记录或搜索条件
  useEffect(() => {
    const st = location.state as {
      conditions?: Record<string, string>;
      selectedRecords?: any[];
    } | null;

    // Select返回：选中记录回填表单
    if (st?.selectedRecords?.length) {
      const rec = st.selectedRecords[0];
      const toStr = (v: any): string => (v == null ? "" : String(v));
      setVariable(toStr(rec.variable));
      setVariableOp("=");
      setType(toStr(rec.type));
      setTypeOp("=");
      setDescription(toStr(rec.description));
      setDescriptionOp("=");
      setCreatedByUser(toStr(rec.registerUser));
      setCreatedByUserOp("=");
      setDate(toStr(rec.registerDatetime).substring(0, 10));
      setDateOp("=");
      window.history.replaceState({}, document.title);
      return;
    }

    // Back返回：从location.state恢复条件
    if (st?.conditions) {
      const c = st.conditions;
      setVariable(c.variable ?? "");
      setVariableOp((c.variableOp as Operator) ?? "=");
      setType(c.type ?? "");
      setTypeOp((c.typeOp as Operator) ?? "=");
      setDescription(c.description ?? "");
      setDescriptionOp((c.descriptionOp as Operator) ?? "=");
      setCreatedByUser(c.createdByUser ?? "");
      setCreatedByUserOp((c.createdByUserOp as Operator) ?? "=");
      setDate(c.date ?? "");
      setDateOp((c.dateOp as Operator) ?? "=");
      window.history.replaceState({}, document.title);
      return;
    }

    // 从sessionStorage恢复条件（首次访问）
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const c = JSON.parse(saved);
        setVariable(c.variable ?? "");
        setVariableOp(c.variableOp ?? "=");
        setType(c.type ?? "");
        setTypeOp(c.typeOp ?? "=");
        setDescription(c.description ?? "");
        setDescriptionOp(c.descriptionOp ?? "=");
        setCreatedByUser(c.createdByUser ?? "");
        setCreatedByUserOp(c.createdByUserOp ?? "=");
        setDate(c.date ?? "");
        setDateOp(c.dateOp ?? "=");
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [location.state]);

  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  // 重置表单
  const clearForm = (keepSuccess = false) => {
    setVariable("");
    setVariableOp("=");
    setType("");
    setTypeOp("=");
    setDescription("");
    setDescriptionOp("=");
    setCreatedByUser("");
    setCreatedByUserOp("=");
    setDate("");
    setDateOp("=");
    sessionStorage.removeItem(STORAGE_KEY);
    if (!keepSuccess) clearMessages();
  };

  // 搜索：保存条件并跳转结果列表
  const handleSearch = async () => {
    clearMessages();

    if (!variable && !type && !description && !createdByUser && !date) {
      setMessage("请输入至少一个搜索条件");
      return;
    }

    const conditions = {
      variable,
      variableOp,
      type,
      typeOp,
      description,
      descriptionOp,
      createdByUser,
      createdByUserOp,
      date,
      dateOp,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));
    navigate("/menu/existing-hdoc-vars/result", { state: { conditions } });
  };

  // 新增：注册新Variable（先查重）
  const handleAdd = async () => {
    clearMessages();

    if (!variable.trim()) {
      setMessage("Variable为必填项");
      return;
    }
    if (variable.length > 30) {
      setMessage("Variable长度不能超过30字符");
      return;
    }
    if (!/^[\x20-\x7E]*$/.test(variable)) {
      setMessage("Variable只能包含半角英数字和记号");
      return;
    }
    if (!type) {
      setMessage("请选择变量类型");
      return;
    }

    // 变量重名检查
    try {
      const checkRes = await api.post<{ exists: boolean }>(
        "/ud08/checkVariable",
        {
          variable: variable.trim(),
        },
      );
      if (checkRes.code === 200 && checkRes.data?.exists) {
        setMessage("Variant already exists. Please enter the correct content");
        return;
      }
    } catch {
      setMessage("System error. Please contact administrator.");
      return;
    }

    const currentUser =
      createdByUser.trim() || localStorage.getItem("userId") || "";
    setIsLoading(true);
    try {
      const res = await api.post("/variables/add", {
        variable: variable.trim(),
        type,
        description: description.trim(),
        currentUser,
      });
      if (res.code === 200) {
        setSuccessMessage("变量添加成功");
        clearForm(true);
      } else {
        setMessage(
          res.message ||
            "Variant already exists. Please enter the correct content",
        );
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // 更新：修改已有Variable（先校验存在性）
  const handleUpdate = async () => {
    clearMessages();

    if (!variable.trim()) {
      setMessage("Variable为必填项");
      return;
    }

    // Variable 存在性校验
    try {
      const checkRes = await api.post<{ exists: boolean }>(
        "/ud08/checkVariable",
        {
          variable: variable.trim(),
        },
      );
      if (checkRes.code === 200 && !checkRes.data?.exists) {
        setMessage("Variant does not exists. Please enter the correct content");
        return;
      }
    } catch {
      setMessage("System error. Please contact administrator.");
      return;
    }

    const currentUser =
      createdByUser.trim() || localStorage.getItem("userId") || "";
    setIsLoading(true);
    try {
      const res = await api.post("/variables/update", {
        variable: variable.trim(),
        type,
        description: description.trim(),
        currentUser,
      });
      if (res.code === 200) {
        setSuccessMessage("变量更新成功");
      } else {
        setMessage(
          res.message ||
            "Variant does not exists. Please enter the correct content",
        );
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除：确认后删除Variable
  const handleDelete = async () => {
    clearMessages();

    if (!variable.trim()) {
      setMessage("Variable为必填项");
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: 'Confirm',
        content: 'Do you really want to delete this variant?',
        okText: 'Yes',
        cancelText: 'No',
        transitionName: '',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;

    // Variable 存在性校验
    try {
      const checkRes = await api.post<{ exists: boolean }>(
        "/ud08/checkVariable",
        {
          variable: variable.trim(),
        },
      );
      if (checkRes.code === 200 && !checkRes.data?.exists) {
        setMessage("Variant does not exists. Please enter the correct content");
        return;
      }
    } catch {
      setMessage("System error. Please contact administrator.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/variables/delete", {
        variable: variable.trim(),
      });
      if (res.code === 200) {
        setSuccessMessage("变量删除成功");
        clearForm(true);
      } else {
        setMessage(
          res.message ||
            "Variant does not exists. Please enter the correct content",
        );
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/menu");
  };

  // 导出CSV：客户端生成文件并下载
  const handleExcel = () => {
    clearMessages();
    const now = new Date();
    const today = now
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, "")
      .replace("T", "");
    const fileName = `ExistingHDocVariables_${today}.csv`;

    const headers = [
      "Variable",
      "Type",
      "Description",
      "Created by user",
      "Date",
    ];
    const row = [variable, type, description, createdByUser, date];
    const csvContent = [
      headers.join(","),
      row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setSuccessMessage("CSV文件导出成功");
  };

  const isNumericField = (field: string): boolean => {
    return field === "Date";
  };

  const renderOpSelect = (
    field: string,
    op: Operator,
    onChange: (v: Operator) => void,
  ) => {
    const numericOps = ["=", ">", "<"] as Operator[];
    const nonNumericOps = ["=", "!="] as Operator[];
    const ops = isNumericField(field) ? numericOps : nonNumericOps;
    const currentOp = ops.includes(op) ? op : "=";
    return (
      <select
        className="ehv-op-select"
        value={currentOp}
        onChange={(e) => onChange(e.target.value as Operator)}
        disabled={isLoading}
      >
        {ops.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="ehv-container panel panel-w800">
      <div className="ehv-header panel-header">
        <h1>Existing HDoc Variables</h1>
      </div>

      {/* 操作按钮 */}
      <table className="btn-table">
        <tbody>
          <tr>
            <td className="btn-cell">
              <button
                className="btn btn-primary"
                onClick={handleSearch}
                disabled={isLoading}
              >
                Search
              </button>
              <button
                className="btn"
                onClick={() => clearForm()}
                disabled={isLoading}
              >
                Clear
              </button>
              <button className="btn" onClick={handleBack} disabled={isLoading}>
                Back
              </button>
              <button className="btn" onClick={handleAdd} disabled={isLoading}>
                Add
              </button>
              <button
                className="btn"
                onClick={handleUpdate}
                disabled={isLoading}
              >
                Update
              </button>
              <button
                className="btn"
                onClick={handleDelete}
                disabled={isLoading}
              >
                Delete
              </button>
              <button
                className="btn"
                onClick={handleExcel}
                disabled={isLoading}
              >
                Excel
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {message && <div className="ehv-error msg-error">{message}</div>}
      {successMessage && <div className="ehv-success msg-success">{successMessage}</div>}

      <div className="f-form">
        {/* Variable */}
        <div className="f-row">
          <span className="f-label required">Variable</span>
          {renderOpSelect("Variable", variableOp, setVariableOp)}
          <input
            type="text"
            className="f-input ehv-input-variable"
            value={variable}
            onChange={(e) => setVariable(e.target.value.replace(/[^\x20-\x7E]/g, ""))}
            maxLength={30}
            disabled={isLoading}
          />
        </div>

        {/* Type */}
        <div className="f-row">
          <span className="f-label required">Type</span>
          {renderOpSelect("Type", typeOp, setTypeOp)}
          <select
            className="f-input ehv-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isLoading}
          >
            <option value="">-- Select --</option>
            <option value="VDA">VDA</option>
            <option value="User Defined">User Defined</option>
          </select>
        </div>

        {/* Description */}
        <div className="f-row ehv-row-description">
          <span className="f-label">Description</span>
          {renderOpSelect("Description", descriptionOp, setDescriptionOp)}
          <input
            type="text"
            className="f-input ehv-input-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.replace(/[^\x20-\x7E]/g, ""))}
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        {/* Created by user */}
        <div className="f-row">
          <span className="f-label">Created by user</span>
          {renderOpSelect(
            "Created by user",
            createdByUserOp,
            setCreatedByUserOp,
          )}
          <input
            type="text"
            className="f-input ehv-input-created-by"
            value={createdByUser}
            onChange={(e) => setCreatedByUser(e.target.value.replace(/[^\x20-\x7E]/g, ""))}
            maxLength={16}
            disabled={isLoading}
          />
        </div>

        {/* Date */}
        <div className="f-row">
          <span className="f-label">Date</span>
          {renderOpSelect("Date", dateOp, setDateOp)}
          <input
            type="text"
            className="f-input ehv-input-date"
            value={date}
            onChange={(e) => setDate(e.target.value.replace(/[^0-9\-/]/g, ""))}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ExistingHDocVariables;
