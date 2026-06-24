/**
 * HDocTemplateCheck 组件 - HDoc模板检查页面（UD13）
 * 功能：检查HDoc模板文件的格式和内容，解析$符号之间的变量
 * 对应详细设计：详细设计/詳細設計UD13.md
 *
 * 本模块不调用后端API，所有处理在前端完成
 */
import React, { useState } from "react";
import "./HDocTemplateCheck.css";

/**
 * 检查结果数据类型
 */
interface CheckResult {
  /** 提取到的变量列表 */
  variables: string[];
  /** 变量总数 */
  count: number;
}

/**
 * HDocTemplateCheck 组件
 * 提供rtf模板文件的选择、变量解析、结果展示和下载功能
 */
const HDocTemplateCheck: React.FC = () => {
  // 选择的文件
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 检查结果
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  // 检查后的文件内容（用于下载）
  const [checkedContent, setCheckedContent] = useState<string>("");
  // 错误消息
  const [error, setError] = useState<string>("");
  // 是否正在处理
  const [processing, setProcessing] = useState<boolean>(false);

  /**
   * 文件选择处理
   * 对应详细设计 2.1 Template File
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // 清除之前的检查结果和错误
      setCheckResult(null);
      setCheckedContent("");
      setError("");
    }
  };

  /**
   * Check按钮点击处理 - 文件检查
   * 对应详细设计 3.1.2 文件检查流程
   */
  const handleCheck = async () => {
    setError("");
    setCheckResult(null);
    setCheckedContent("");

    // 校验：是否选择了文件（对应详细设计 3.2 No.1）
    if (!selectedFile) {
      setError("ERROR: Unable to access file!");
      return;
    }

    setProcessing(true);

    try {
      // 使用FileReader API读取文件内容
      // 对应详细设计 4.1 文件读取和处理
      const content = await readFileContent(selectedFile);

      // 使用正则表达式匹配$...$格式的变量
      // 对应详细设计 6.3 变量解析
      const regex = /\$([^$]+)\$/g;
      const variables: string[] = [];
      let match;

      while ((match = regex.exec(content)) !== null) {
        // 去重
        const varName = match[1].trim();
        if (varName && !variables.includes(varName)) {
          variables.push(varName);
        }
      }

      // 结果处理（对应详细设计 3.2 No.2）
      if (variables.length === 0) {
        setError("ERROR: The file content is incorrect!");
      } else {
        setCheckResult({ variables, count: variables.length });
        // 保存文件内容供下载
        setCheckedContent(content);
      }
    } catch (err) {
      // 文件读取失败（对应详细设计 3.2 No.3）
      setError("ERROR: Unable to access file!");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * 使用FileReader读取文件内容
   */
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  /**
   * 下载检查后的模板文件
   * 对应详细设计 3.1.3 下载检查后的模板流程
   * 对应详细设计 4.2 文件下载
   */
  const handleDownload = () => {
    if (!checkedContent) return;

    // 生成文件名：checked_template_YYYYMMDD.rtf
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const filename = `checked_template_${dateStr}.rtf`;

    // 创建Blob对象并触发下载
    const blob = new Blob([checkedContent], { type: "application/rtf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="ud13-container">
      {/* 页面标题 */}
      <h1 className="ud13-title">EDB Engineering Database - HDoc Template Check</h1>

      {/* 按钮组 - 对应详细设计 2.1 Check */}
      <div className="ud13-btn-group">
        <button
          type="button"
          className="ud13-btn"
          onClick={handleCheck}
          disabled={processing}
        >
          Check
        </button>
      </div>

      {/* 加载状态 */}
      {processing && <div className="ud13-loading">Processing...</div>}

      {/* 错误消息区域 */}
      {error && !processing && <div className="ud13-error">{error}</div>}

      {/* 成功消息区域 */}
      {checkResult && !processing && (
        <div className="ud13-success">
          <p className="ud13-success-text">
            Variables found: {checkResult.count}
          </p>
          <div className="ud13-variable-list">
            <p className="ud13-variable-label">Variables:</p>
            <ul>
              {checkResult.variables.map((v, i) => (
                <li key={i} className="ud13-variable-item">${v}$</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 表单区域 */}
      <div className="ud13-form">
        <div className="ud13-field">
          <label className="ud13-label">Template File</label>
          <input
            type="file"
            className="ud13-file-input"
            onChange={handleFileChange}
            accept=".rtf"
          />
        </div>
      </div>

      {/* 下载链接 - 检查成功后显示 */}
      {checkResult && !processing && (
        <div className="ud13-link-section">
          <a
            href="#"
            className="ud13-link"
            onClick={(e) => {
              e.preventDefault();
              handleDownload();
            }}
          >
            Download checked template
          </a>
        </div>
      )}
    </div>
  );
};

export default HDocTemplateCheck;
