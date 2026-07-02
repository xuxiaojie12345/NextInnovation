// HdocTemplateCheck.tsx - UD13模块
import React, { useState } from "react";
import "./HdocTemplateCheck.css";

interface VariableInfo {
  name: string;
  position: number;
}

const HdocTemplateCheck = () => {
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

  // 检查模板文件功能
  const handleCheck = async () => {
    // 验证是否选择了文件
    if (!selectedFile) {
      setErrorMessage("ERROR: Unable to access file!");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setVariables([]);
    setCheckedFileUrl(null);

    try {
      console.log("Checking template file:", selectedFile.name);

      // 读取文件内容
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;

          if (!content) {
            setErrorMessage("ERROR: Unable to access file!");
            setIsLoading(false);
            return;
          }

          console.log("File content length:", content.length);

          // 解析变量
          const extractedVariables = parseRtfContent(content);

          console.log("Extracted variables:", extractedVariables);

          if (extractedVariables.length === 0) {
            // 没有找到任何变量
            setErrorMessage("ERROR: The file content is incorrect!");
          } else {
            // 成功找到变量
            setVariables(extractedVariables);
            setSuccessMessage(
              `Found ${extractedVariables.length} variable(s) in the template.`,
            );

            // 创建检查后的文件下载链接
            const blob = new Blob([content], { type: "application/rtf" });
            const url = URL.createObjectURL(blob);
            setCheckedFileUrl(url);
          }
        } catch (error) {
          console.error("Parse error:", error);
          setErrorMessage("ERROR: Unable to access file!");
        } finally {
          setIsLoading(false);
        }
      };

      reader.onerror = () => {
        console.error("File read error");
        setErrorMessage("ERROR: Unable to access file!");
        setIsLoading(false);
      };

      // 以文本方式读取文件
      reader.readAsText(selectedFile);
    } catch (error) {
      console.error("Check error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "System error. Please contact administrator.",
      );
      setIsLoading(false);
    }
  };

  // 下载检查后的模板文件
  const handleDownload = () => {
    if (!checkedFileUrl || !selectedFile) {
      return;
    }

    // 生成文件名
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const originalName = selectedFile.name.replace(".rtf", "");
    const fileName = `checked_${originalName}_${dateStr}.rtf`;

    // 创建下载链接
    const link = document.createElement("a");
    link.href = checkedFileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className='htc-container'>
        <div className='htc-loading'>Checking...</div>
      </div>
    );
  }

  return (
    <div className='htc-container'>
      {/* 消息显示 */}
      {errorMessage && <div className='htc-error-message'>{errorMessage}</div>}
      {successMessage && (
        <div className='htc-success-message'>
          {successMessage}
          {variables.length > 0 && (
            <div className='htc-variables-list'>
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
      <div className='htc-section'>
        <h2 className='htc-section-title'>HDoc Template Check</h2>

        <div className='htc-form-group'>
          <label className='htc-label'>Template File:</label>
          <input
            id='template-file-input'
            type='file'
            className='htc-file-input'
            onChange={handleFileSelect}
            accept='.rtf'
          />
        </div>

        <div className='htc-button-row'>
          <button
            className='htc-btn'
            onClick={handleCheck}
            disabled={isLoading}
          >
            Check
          </button>
        </div>
      </div>

      {/* 下载链接显示 */}
      {checkedFileUrl && (
        <div className='htc-download-row'>
          <a
            href='#'
            className='htc-link'
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

export default HdocTemplateCheck;
