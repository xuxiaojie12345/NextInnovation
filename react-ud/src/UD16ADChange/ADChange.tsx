// ADChange.tsx - UD16模块
import React, { useState } from "react";
import "./ADChange.css";

const ADChange = () => {
  const [serieChnr, setSerieChnr] = useState("");
  const [desc, setDesc] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 处理Serie-Chnr输入变化
  const handleSerieChnrChange = (value: string) => {
    setSerieChnr(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // 处理Desc输入变化
  const handleDescChange = (value: string) => {
    setDesc(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // ADD功能：添加新的AD Change记录
  const handleAdd = async () => {
    // 验证Serie-Chnr是否为空
    if (!serieChnr.trim()) {
      setErrorMessage("Serie-Chnr不能为空");
      return;
    }

    // 验证Serie-Chnr长度
    if (serieChnr.length > 15) {
      setErrorMessage("Serie-Chnr长度不能超过15字符");
      return;
    }

    // 验证Desc长度
    if (desc.length > 4000) {
      setErrorMessage("Desc长度不能超过4000字符");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log("Adding AD Change:", { serieChnr, desc });

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(`${API_BASE_URL}/api/ud16/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serieChnr, desc, updateUser: currentUser }),
      });

      if (!response.ok) {
        throw new Error("系统错误，请稍后重试");
      }

      const result = await response.json();
      console.log("Add AD Change response:", result);

      if (result.code === 200) {
        setSuccessMessage("AD Change记录添加成功");
        // 清空输入框
        setSerieChnr("");
        setDesc("");
      } else {
        // 检查是否是警告消息（记录已存在且未激活）
        if (result.msg && result.msg.includes("NOT ACTIVATED")) {
          setErrorMessage(result.msg);
        } else {
          setErrorMessage(result.msg || "添加失败，请联系管理员");
        }
      }
    } catch (error: any) {
      console.error("Error adding AD Change:", error);
      setErrorMessage(error.message || "系统错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE功能：删除指定的AD Change记录
  const handleDelete = async () => {
    // 验证Serie-Chnr是否为空
    if (!serieChnr.trim()) {
      setErrorMessage("Serie-Chnr不能为空");
      return;
    }

    // 确认对话框
    const confirmed = window.confirm(
      "Do you really want to delete this AD Change record?",
    );
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log("Deleting AD Change:", serieChnr);

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(`${API_BASE_URL}/api/ud16/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serieChnr, updateUser: currentUser }),
      });

      if (!response.ok) {
        throw new Error("系统错误，请稍后重试");
      }

      const result = await response.json();
      console.log("Delete AD Change response:", result);

      if (result.code === 200) {
        setSuccessMessage("AD Change记录删除成功");
        // 清空Serie-Chnr输入框
        setSerieChnr("");
      } else {
        setErrorMessage(result.msg || "删除失败，请联系管理员");
      }
    } catch (error: any) {
      console.error("Error deleting AD Change:", error);
      setErrorMessage(error.message || "系统错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  // CHECK功能：检查AD Change记录状态
  const handleCheck = async () => {
    // 验证Serie-Chnr是否为空
    if (!serieChnr.trim()) {
      setErrorMessage("Serie-Chnr不能为空");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log("Checking AD Change:", serieChnr);

      const response = await fetch(
        `${API_BASE_URL}/api/ud16/check?serieChnr=${encodeURIComponent(serieChnr)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("系统错误，请稍后重试");
      }

      const result = await response.json();
      console.log("Check AD Change response:", result);

      if (result.code === 200) {
        // 检查是否有警告消息
        if (result.msg && result.msg.includes("NOT ACTIVATED")) {
          setErrorMessage(result.msg);
        } else {
          setSuccessMessage("记录存在且已激活");
        }
      } else if (result.code === 404) {
        setErrorMessage("记录不存在");
      } else {
        setErrorMessage(result.msg || "检查失败，请联系管理员");
      }
    } catch (error: any) {
      console.error("Error checking AD Change:", error);
      setErrorMessage(error.message || "系统错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='adc-container'>
      {/* 消息显示 */}
      {successMessage && (
        <div className='adc-success-message'>{successMessage}</div>
      )}
      {errorMessage && <div className='adc-error-message'>{errorMessage}</div>}

      {/* 画面标题 */}
      <h2 className='adc-section-title'>AD Change</h2>

      {/* 输入区域 */}
      <div className='adc-section'>
        {/* Serie-Chnr输入 */}
        <div className='adc-form-group'>
          <label className='adc-label'>Serie-Chnr</label>
          <input
            type='text'
            className='adc-input'
            value={serieChnr}
            onChange={(e) => handleSerieChnrChange(e.target.value)}
            placeholder='Enter Serie-Chnr'
            disabled={isLoading}
            maxLength={15}
          />
        </div>

        {/* Desc输入 */}
        <div className='adc-form-group'>
          <label className='adc-label'>Desc</label>
          <input
            type='text'
            className='adc-input-desc'
            value={desc}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder='Enter description'
            disabled={isLoading}
            maxLength={4000}
          />
        </div>

        {/* 按钮行 */}
        <div className='adc-button-row'>
          <button className='adc-btn' onClick={handleAdd} disabled={isLoading}>
            ADD
          </button>
          <button
            className='adc-btn'
            onClick={handleDelete}
            disabled={isLoading}
          >
            DELETE
          </button>
          <button
            className='adc-btn'
            onClick={handleCheck}
            disabled={isLoading}
          >
            CHECK
          </button>
        </div>
      </div>

      {/* 初始提示信息 */}
      {!errorMessage && !successMessage && !isLoading && (
        <p className='adc-initial-message'>
          Please enter a Serie-Chnr to add, delete or check an AD Change record.
        </p>
      )}
    </div>
  );
};

export default ADChange;
