/**
 * HDocTemplateCheck 组件 - HDoc模板检查页面（UD13）
 * 对应详细设计：详细设计/詳細設計UD13.md
 *
 * 注意：Check功能暂不实现，按钮点击不做任何处理
 */
import React, { useState, useCallback } from "react";
import "./HDocTemplateCheck.css";

/**
 * HDocTemplateCheck 组件
 * 提供rtf模板文件的选择界面（检查功能未实现）
 */
const HDocTemplateCheck: React.FC = () => {
  // 选择的文件
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * 文件选择处理
   */
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setSelectedFile(e.target.files[0]);
      }
    },
    [],
  );

  /**
   * Check按钮点击处理 - 暂不实现
   */
  const handleCheck = useCallback(() => {
    // Check功能暂不实现，按钮点击不做任何处理
  }, []);

  return (
    <div className="ud13-container">
      <main className="ud13-main">
        <div className="ud13-card">
          <h1 className="ud13-page-title">HDoc Template Check</h1>

          {/* Template File */}
          <div className="ud13-section">
            <div className="ud13-field-row">
              <label className="ud13-label">Template File:</label>
              <input
                id="ud13-file-input"
                type="file"
                onChange={handleFileChange}
                accept=".rtf"
              />
            </div>
            <div className="ud13-field-row ud13-field-row-button">
              <label className="ud13-label"></label>
              <button className="ud13-btn">
                Check
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HDocTemplateCheck;
