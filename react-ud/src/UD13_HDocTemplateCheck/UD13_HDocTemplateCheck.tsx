import React, { useState } from "react";
import "./UD13_HDocTemplateCheck.css";

/**
 * HDoc Template Check 页面组件
 * 
 * 功能说明：
 * - 提供 RTF 模板文件的上传和选择功能
 * - Check 按钮用于执行模板检查（当前版本机能不实装）
 * - Download checked template 链接用于下载检查后的文件（当前版本机能不实装）
 * - 显示变量计数等检查结果信息
 * 
 * 对应设计书：HDoc Template Check 模块详细设计说明书
 * 
 * @component
 * @returns {JSX.Element} HDoc Template Check 页面元素
 */
const UD13_HDocTemplateCheck: React.FC = () => {
  // ==================== 状态管理 ====================
  // 对应设计书 6.1 状态管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 选择的文件
  const [isChecked, setIsChecked] = useState<boolean>(false);         // 是否已执行检查
  const [isLoading, setIsLoading] = useState<boolean>(false);         // 加载状态
  const [message, setMessage] = useState<string>("");                 // 消息文本
  const [messageType, setMessageType] = useState<"success" | "error" | "">(""); // 消息级别
  const [variableCount, setVariableCount] = useState<number>(0);      // 发现的变量数量

  // ==================== 常量定义 ====================
  const ALLOWED_FILE_EXTENSION = ".rtf";
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // ==================== 事件处理函数 ====================

  /**
   * 清空消息
   */
  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  /**
   * 处理文件选择
   * 对应设计书 3.1.1 初始显示流程 - 文件格式校验
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 文件选择事件对象
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileName = file.name.toLowerCase();

      // 校验文件格式：仅支持RTF
      // 对应设计书 5. 异常处理 - 文件格式错误
      if (!fileName.endsWith(ALLOWED_FILE_EXTENSION)) {
        setMessage("只支持RTF格式文件");
        setMessageType("error");
        setSelectedFile(null);
        // 清空文件输入框
        e.target.value = "";
        return;
      }

      // 校验文件大小
      if (file.size > MAX_FILE_SIZE) {
        setMessage("文件大小超过限制（最大10MB）");
        setMessageType("error");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
      // 重新选择文件后重置检查状态
      setIsChecked(false);
      setVariableCount(0);
      clearMessage();
    } else {
      setSelectedFile(null);
    }
  };

  /**
   * 点击 Check 按钮执行模板检查
   * 对应设计书 3.1.2 Check按钮处理流程
   * 
   * 注意：当前版本机能不实装，仅做文件选择校验和占位处理
   */
  const handleCheck = async () => {
    // 1. 空值校验（前端校验）
    if (!selectedFile) {
      setMessage("NO FILE UPLOADED");
      setMessageType("error");
      return;
    }

    // 当前版本 Check 机能不实装
    // 对应设计书 3.1.2：机能不实装
    setMessage("Check 机能未实装（当前版本暂不支持）");
    setMessageType("error");
    setIsChecked(false);
  };

  /**
   * 点击 Download checked template 链接
   * 对应设计书 3.1.3 Download checked template 链接点击流程
   * 
   * 注意：当前版本机能不实装
   */
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    // 当前版本 Download 机能不实装
    // 对应设计书 3.1.3：机能不实装
    setMessage("Download 机能未实装（当前版本暂不支持）");
    setMessageType("error");
  };

  return (
    <div className="ud13-container">
      {/* ==================== 页面标题 ==================== */}
      <h1 className="ud13-page-title">HDoc Template Check</h1>

      <div className="ud13-content-wrapper">
        {/* ==================== 主区域 ==================== */}
        <div className="ud13-main-section">
          {/* <div className="ud13-section-header">
            <h2 className="ud13-section-title">Template File Check</h2>
          </div> */}

          <div className="ud13-form-body">
            {/* 文件选择 */}
            <div className="ud13-form-group">
              <label className="ud13-label">Template File</label>
              <div className="ud13-blue-border-box">
                <input
                  id="ud13TemplateFileInput"
                  type="file"
                  className="ud13-file-input"
                  accept=".rtf"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 检查结果显示区域 */}
            {isChecked && (
              <div className="ud13-result-section">
                <div className="ud13-result-item">
                  <span className="ud13-result-label">Variables found:</span>
                  <span className="ud13-result-value">{variableCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Check 按钮（表单外部） */}
          <div className="ud13-btn-outer">
            <div className="ud13-blue-border-box ud13-btn-box">
              <button
                className="ud13-btn ud13-btn-check"
                onClick={handleCheck}
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? "Checking..." : "Check"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== Download 区域 ==================== */}
      <div className="ud13-download-section">
        <a
          href="#!"
          className={`ud13-download-link ${isChecked ? "ud13-download-active" : "ud13-download-disabled"}`}
          onClick={handleDownload}
        >
          Download checked template
        </a>
      </div>

      {/* ==================== 消息显示区域 ==================== */}
      {message && (
        <div className={`ud13-message ud13-message-${messageType}`}>
          {message}
        </div>
      )}

      {/* ==================== 返回按钮 ==================== */}
      <div className="ud13-back-section">
        <button
          className="ud13-btn ud13-btn-back"
          onClick={() => window.history.back()}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default UD13_HDocTemplateCheck;
