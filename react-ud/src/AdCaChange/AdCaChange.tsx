import React, { useState } from "react";
import { api } from "../services/api";
import "../common/css/common.css";
import "./AdCaChange.css";

// AD/CA 变更管理组件
const AdCaChange: React.FC = () => {
  // 表单状态
  const [serieChnr, setSerieChnr] = useState("");
  const [desc, setDesc] = useState("");

  // UI 状态
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 清除消息
  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  // "FH-12345"形式をserieとchnrに分割（ダッシュ区切り）
  const parseSerieChnr = (value: string): { serie: string; chnr: string } => {
    const trimmed = value.trim();
    const parts = trimmed.split("-");
    if (parts.length >= 2) {
      return { serie: parts[0].trim(), chnr: parts.slice(1).join("-").trim() };
    }
    // If no dash, treat entire input as serie
    return { serie: trimmed, chnr: "" };
  };

  // 新增：检查存在性后注册（BU=UD, ACT=Y）
  const handleAdd = async () => {
    clearMessages();

    const trimmedValue = serieChnr.trim();

    const { serie, chnr } = parseSerieChnr(trimmedValue);

    if (!serie || !chnr) {
      setMessage('Please enter a valid Serie-Chnr (e.g. "FH-12345").');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Check existence
      const checkRes = await api.post<{
        serie: string;
        chnr: string;
        count: string;
        act: string;
      }>("/adca/select", {
        serie,
        chnr,
      });

      if (checkRes.code === 200 && checkRes.data) {
        const count = parseInt(checkRes.data.count, 10);
        if (count > 0) {
          // 记录已存在则无法新增
          setMessage("AFTER DEF CHANGE IS NOT ACTIVATED");
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Insert (BU fixed as "UD", ACT = 'Y' for active)
      const updateUser = localStorage.getItem("userId") || "";
      const res = await api.post("/adca/insert", {
        serie,
        chnr,
        act: "Y",
        bu: "UD",
        updateUser,
      });

      if (res.code === 200) {
        setSuccessMessage("Record added successfully.");
        setSerieChnr("");
        setDesc("");
      } else {
        setMessage(res.message || "Failed to add record.");
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除：调用API删除记录
  const handleDelete = async () => {
    clearMessages();

    const trimmedValue = serieChnr.trim();
    const { serie, chnr } = parseSerieChnr(trimmedValue);

    if (!serie || !chnr) {
      setMessage('Please enter a valid Serie-Chnr (e.g. "FH-12345").');
      return;
    }

    setIsLoading(true);
    try {
      const updateUser = localStorage.getItem("userId") || "";
      const res = await api.post("/adca/update", {
        serie,
        chnr,
        act: "N",
        updateUser,
      });

      if (res.code === 200) {
        setSuccessMessage("Record updated/deleted successfully.");
        setSerieChnr("");
      } else {
        setMessage(res.message || "Failed to delete record.");
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // 检查：确认记录是否存在及激活状态
  const handleCheck = async () => {
    clearMessages();

    const trimmedValue = serieChnr.trim();
    const { serie, chnr } = parseSerieChnr(trimmedValue);

    if (!serie || !chnr) {
      setMessage('Please enter a valid Serie-Chnr (e.g. "FH-12345").');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{
        serie: string;
        chnr: string;
        count: string;
        act: string;
      }>("/adca/select", {
        serie,
        chnr,
      });

      if (res.code === 200 && res.data) {
        const count = parseInt(res.data.count, 10);
        const act = res.data.act;
        if (count > 0) {
          // ACT=Yなら有効、それ以外は未活性化
          if (act === "Y") {
            setMessage("Record found and activated.");
          } else {
            setMessage("AFTER DEF CHANGE IS NOT ACTIVATED");
          }
        } else {
          setMessage("Record not found.");
        }
      } else {
        setMessage("Record not found.");
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="adca-container panel panel-w600">
      <div className="adca-header panel-header">
        <h1>AD/CA Change</h1>
      </div>

      <div className="adca-body">
        {message && <div className="msg-error">{message}</div>}
        {successMessage && <div className="msg-success">{successMessage}</div>}

        <div className="f-form">
          {/* 底盘编号 */}
          <div className="f-row">
            <span className="f-label">Serie-Chnr</span>
            <input
              type="text"
              className="f-input"
              value={serieChnr}
              onChange={(e) => setSerieChnr(e.target.value)}
              maxLength={15}
              placeholder="e.g. FH-12345"
              disabled={isLoading}
            />
          </div>

          {/* 描述 */}
          <div className="f-row">
            <span className="f-label">Desc</span>
            <input
              type="text"
              className="f-input adca-input-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              maxLength={4000}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="btn-row">
          <button className="btn" onClick={handleAdd} disabled={isLoading}>
            ADD
          </button>
          <button className="btn" onClick={handleDelete} disabled={isLoading}>
            DELETE
          </button>
          <button className="btn" onClick={handleCheck} disabled={isLoading}>
            CHECK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdCaChange;
