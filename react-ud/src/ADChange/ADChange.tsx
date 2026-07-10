/**
 * ADChange 组件 - AD Change页面（UD16）
 * 功能：对Serie-Chnr进行添加、删除和检查操作，管理ADCA变更信息
 * 对应详细设计：详细设计/詳細設計UD16.md
 */
import React, { useState } from "react";
import api, { API_BASE_URL } from "../config/api";
import "./ADChange.css";

/**
 * CHECK查询结果数据类型
 * 对应详细设计 4.1 Response Success
 */
interface CheckResult {
  serieChnr: string;
  desc: string;
  status: string;
}

/**
 * ADChange 组件
 * 提供ADCA变更记录的ADD、DELETE、CHECK操作
 */
const ADChange: React.FC = () => {
  // 输入字段
  const [serieChnr, setSerieChnr] = useState<string>("");
  const [desc, setDesc] = useState<string>("");

  // CHECK结果弹窗
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [checkMessage, setCheckMessage] = useState<string>("");
  const [showCheckModal, setShowCheckModal] = useState<boolean>(false);

  // 消息提示
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState<boolean>(false);

  /** 清空消息 */
  const clearMessage = () => setMessage("");

  /**
   * 校验Serie-Chnr是否为空（所有按钮共用前置处理）
   * 对应详细设计 3.1 共同前置处理
   */
  const validateSerieChnr = (): boolean => {
    if (!serieChnr || serieChnr.trim() === "") {
      return false;
    }
    return true;
  };

  /**
   * ADD操作 - 添加新的ADCA变更记录
   * 对应详细设计 3.1.2 ADD操作流程
   */
  const handleAdd = async () => {
    clearMessage();
    setCheckResult(null);

    // 校验Serie-Chnr为空（对应详细设计 3.2 No.1）
    if (!validateSerieChnr()) {
      setMessage("请输入Serie-Chnr");
      setMessageType("error");
      return;
    }

    // 校验Serie-Chnr长度（对应详细设计 3.2 No.2）
    if (serieChnr.trim().length > 15) {
      setMessage("Serie-Chnr长度不能超过15字符");
      setMessageType("error");
      return;
    }

    // 校验Desc长度（对应详细设计 3.2 No.3）
    if (desc.length > 4000) {
      setMessage("描述长度不能超过4000字符");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/adchange/process',
        {
          operation: "ADD",
          serieChnr: serieChnr.trim(),
          desc: desc.trim()
        }
      );

      if (response.data.code === 200) {
        // 添加成功
        setSerieChnr("");
        setDesc("");
        setMessage("添加成功");
        setMessageType("success");
      } else if (response.data.code === 409) {
        // 记录已存在（对应详细设计 3.2 No.4）
        setMessage("AFTER DEF CHANGE IS NOT ACTIVATED");
        setMessageType("error");
      } else {
        setMessage(response.data.message || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * DELETE操作 - 逻辑删除ADCA变更记录
   * 对应详细设计 3.1.3 DELETE操作流程
   */
  const handleDelete = async () => {
    clearMessage();
    setCheckResult(null);

    // 校验Serie-Chnr为空（对应详细设计 3.2 No.5）
    if (!validateSerieChnr()) {
      setMessage("请输入要删除的Serie-Chnr");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/adchange/process',
        {
          operation: "DELETE",
          serieChnr: serieChnr.trim(),
          user: "admin",
          process: "UD16"
        }
      );

      if (response.data.code === 200) {
        setSerieChnr("");
        setDesc("");
        setMessage("删除成功");
        setMessageType("success");
      } else {
        setMessage(response.data.message || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * CHECK操作 - 检查ADCA变更记录的存在性
   * 对应详细设计 3.1.4 CHECK操作流程
   */
  const handleCheck = async () => {
    clearMessage();
    setCheckResult(null);

    // 校验Serie-Chnr为空（对应详细设计 3.2 No.6）
    if (!validateSerieChnr()) {
      setMessage("请输入要检查的Serie-Chnr");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        '/api/adchange/process',
        {
          operation: "CHECK",
          serieChnr: serieChnr.trim()
        }
      );

      if (response.data.code === 200) {
        if (response.data.data) {
          // 记录存在（对应详细设计 3.2 No.7）
          const data: CheckResult = response.data.data;
          setCheckResult(data);
          setCheckMessage("");
        } else {
          // 记录不存在（对应详细设计 3.2 No.8）
          setCheckResult(null);
          setCheckMessage("数据不存在");
        }
        setShowCheckModal(true);
      } else {
        setMessage(response.data.message || "操作失败，请稍后重试");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 关闭CHECK结果弹窗
   */
  const closeCheckModal = () => {
    setShowCheckModal(false);
    setCheckResult(null);
    setCheckMessage("");
  };

  return (
    <div className="ud16-container">
      {/* 页面标题 */}
      <h1 className="ud16-title">EDB Engineering Database - AD Change</h1>

      {loading && <div className="ud16-loading">Processing...</div>}

      {/* 表单区域 */}
      <div className="ud16-form">
        <div className="ud16-field">
          <label className="ud16-label">Serie-Chnr</label>
          <input
            type="text"
            className="ud16-input"
            value={serieChnr}
            onChange={(e) => { setSerieChnr(e.target.value); if (message) clearMessage(); }}
            disabled={loading}
            maxLength={15}
            placeholder="Enter Serie-Chnr"
          />
        </div>
        <div className="ud16-field">
          <label className="ud16-label">Desc</label>
          <textarea
            className="ud16-textarea"
            value={desc}
            onChange={(e) => { setDesc(e.target.value); if (message) clearMessage(); }}
            disabled={loading}
            maxLength={4000}
            placeholder="Enter description"
            rows={4}
          />
        </div>

        {/* 消息提示 - Desc下方 */}
        {message && (
          <div className={`ud16-message ${messageType}`}>{message}</div>
        )}

        {/* 按钮组 */}
        <div className="ud16-btn-group">
          <button type="button" className="ud16-btn" onClick={handleAdd} disabled={loading}>ADD</button>
          <button type="button" className="ud16-btn" onClick={handleDelete} disabled={loading}>DELETE</button>
          <button type="button" className="ud16-btn" onClick={handleCheck} disabled={loading}>CHECK</button>
        </div>
      </div>

      {/* CHECK结果弹窗 - 对应详细设计 3.1.4 步骤5 */}
      {showCheckModal && (
        <div className="ud16-modal-overlay" onClick={closeCheckModal}>
          <div className="ud16-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ud16-modal-header">
              <h3>CHECK Result</h3>
              <button className="ud16-modal-close" onClick={closeCheckModal}>&times;</button>
            </div>
            <div className="ud16-modal-body">
              {checkResult ? (
                <table className="ud16-check-table">
                  <tbody>
                    <tr>
                      <td className="ud16-check-label">Serie-Chnr</td>
                      <td className="ud16-check-value">{checkResult.serieChnr}</td>
                    </tr>
                    <tr>
                      <td className="ud16-check-label">Desc</td>
                      <td className="ud16-check-value">{checkResult.desc}</td>
                    </tr>
                    <tr>
                      <td className="ud16-check-label">Status</td>
                      <td className="ud16-check-value">{checkResult.status}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="ud16-check-not-found">{checkMessage}</p>
              )}
            </div>
            <div className="ud16-modal-footer">
              <button type="button" className="ud16-btn" onClick={closeCheckModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ADChange;
