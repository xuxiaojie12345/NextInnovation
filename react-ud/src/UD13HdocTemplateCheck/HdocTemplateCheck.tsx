import React, { useState } from "react";
import "./HdocTemplateCheck.css";

interface VariableInfo {
  name: string;
  position: number;
}

const HdocTemplateCheck: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [checkedFileUrl, setCheckedFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    // 验证文件类型（仅允许rtf文件）
    if (file && !file.name.toLowerCase().endsWith(".rtf")) {
      setErrorMessage("Please select an RTF file.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
    setSuccessMessage("");
    setVariables([]);
    setCheckedFileUrl(null);
  };

  // 解析RTF文件内容，提取$符号之间的变量
  const parseRtfContent = (content: string): VariableInfo[] => {
    const variableList: VariableInfo[] = [];
    // 使用正则表达式匹配$...$格式的变量
    const regex = /\$([^$]+)\$/g;
    let match;
    let position = 1;

    while ((match = regex.exec(content)) !== null) {
      const variableName = match[1].trim();
      if (variableName) {
        variableList.push({
          name: variableName,
          position: position++,
        });
      }
    }

    return variableList;
  };

  return (
    <div className="htc-container">
      {/* 消息显示 */}
      {errorMessage && <div className="htc-error-message">{errorMessage}</div>}
      {successMessage && (
        <div className="htc-success-message">
          {successMessage}
          {variables.length > 0 && (
            <div className="htc-variables-list">
              <strong>Variables found:</strong>
              <ul>
                {variables.map((variable, index) => (
                  <li key={index}>
                    {variable.position}. ${variable.name}$
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* HDoc Template Check区域 */}
      <div className="htc-section">
        <h2 className="htc-section-title">HDoc Template Check</h2>

        <div className="htc-form-group">
          <label className="htc-label">Template File:</label>
          <input
            id="template-file-input"
            type="file"
            className="htc-file-input"
            onChange={handleFileSelect}
            accept=".rtf"
          />
        </div>

        <div className="htc-button-row">
          <button className="htc-btn" disabled={isLoading}>
            Check
          </button>
        </div>
      </div>

      {/* 下载链接显示 */}
      {checkedFileUrl && (
        <div className="htc-download-row">
          <span className="htc-link" style={{ cursor: "pointer" }}>
            Download checked template
          </span>
        </div>
      )}
    </div>
  );
};

export default HdocTemplateCheck;
