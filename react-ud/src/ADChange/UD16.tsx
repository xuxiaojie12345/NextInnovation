import React, { useState, useCallback } from "react";
import { adcaApi } from "../services/api";
import "./UD16.css";

const getCurrentUser = (): { userId: string; name: string } | null => {
  try {
    const userStr = localStorage.getItem("user_info");
    if (!userStr) return null;
    const userInfo = JSON.parse(userStr);
    return {
      userId: userInfo.userId || "",
      name: userInfo.name || "",
    };
  } catch {
    return null;
  }
};

const UD16 = React.memo(() => {
  const [serieChnr, setSerieChnr] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "warning" | ""
  >("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  const validateInput = useCallback((): boolean => {
    if (!serieChnr.trim()) {
      setMessage("Serie-Chnr 是必填项");
      setMessageType("error");
      return false;
    }
    return true;
  }, [serieChnr]);

  const handleAdd = useCallback(async () => {
    clearMessage();
    if (!validateInput()) return;
    const currentUser = getCurrentUser();
    setIsLoading(true);
    try {
      const result = await adcaApi.insertAdcaChange(
        serieChnr.trim(),
        desc.trim(),
        currentUser?.userId || "",
      );
      if (result && result.code === 200) {
        setMessage(result.msg || "新增成功");
        setMessageType("success");
        setDesc("");
      } else {
        setMessage(result?.msg || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [serieChnr, desc, clearMessage, validateInput]);

  const handleDelete = useCallback(async () => {
    clearMessage();
    if (!validateInput()) return;
    if (!window.confirm("确定要删除该记录吗？")) return;
    const currentUser = getCurrentUser();
    setIsLoading(true);
    try {
      const result = await adcaApi.deleteAdcaChange(
        serieChnr.trim(),
        currentUser?.userId || "",
      );
      if (result && result.code === 200) {
        setMessage(result.msg || "删除成功");
        setMessageType("success");
      } else {
        setMessage(result?.msg || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [serieChnr, clearMessage, validateInput]);

  const handleCheck = useCallback(async () => {
    clearMessage();
    if (!validateInput()) return;
    setIsLoading(true);
    try {
      const result = await adcaApi.selectAdcaChange(serieChnr.trim());
      if (result && result.code === 200) {
        setMessage(result.msg || "AFTER DEF CHANGE IS ACTIVATED");
        setMessageType("success");
      } else {
        setMessage(result?.msg || "AFTER DEF CHANGE IS NOT ACTIVATED");
        setMessageType("warning");
      }
    } catch {
      setMessage("网络连接失败，请检查网络设置");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [serieChnr, clearMessage, validateInput]);

  return (
    <div className="ud16-container">
      <main className="ud16-main">
        <div className="ud16-card">
          <h1 className="ud16-page-title">AD Change</h1>

          {message && (
            <div className={`ud16-message ud16-${messageType}`} role="alert">
              {message}
            </div>
          )}

          {/* Input Area */}
          <div className="ud16-section">
            <div className="ud16-field-row">
              <label className="ud16-label">Serie-Chnr</label>
              <input
                className="ud16-input"
                type="text"
                maxLength={15}
                value={serieChnr}
                onChange={(e) => {
                  setSerieChnr(e.target.value);
                  clearMessage();
                }}
              />
            </div>
            <div className="ud16-field-row">
              <label className="ud16-label">Desc</label>
              <input
                className="ud16-input ud16-input-desc"
                type="text"
                maxLength={4000}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  clearMessage();
                }}
              />
            </div>
            <div className="ud16-button-row">
              <button
                className="ud16-btn"
                onClick={handleAdd}
                disabled={isLoading}
              >
                ADD
              </button>
              <button
                className="ud16-btn"
                onClick={handleDelete}
                disabled={isLoading}
              >
                DELETE
              </button>
              <button
                className="ud16-btn"
                onClick={handleCheck}
                disabled={isLoading}
              >
                CHECK
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD16;
