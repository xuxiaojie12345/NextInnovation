/**
 * DownloadPrintQuickGuides 组件 - 下载打印快速指南页面（UD23）
 * 功能：展示快速指南链接及打印/折叠操作的指导说明
 * 通过 Checkbox 控制操作说明的展开/隐藏
 * 对应详细设计：详细设计/詳細設計UD23.md
 */
import React, { useState } from "react";
import "./DownloadPrintQuickGuides.css";

/**
 * DownloadPrintQuickGuides 组件
 * 展示快速指南链接和打印/折叠操作指导，纯画面展示
 */
const DownloadPrintQuickGuides: React.FC = () => {
  // -------- 状态管理（对应详细设计 2.1 控件属性表）--------
  const [showPrintGuide, setShowPrintGuide] = useState<boolean>(false);
  const [showFoldGuide, setShowFoldGuide] = useState<boolean>(false);

  /**
   * To print 复选框变化处理（对应详细设计 3.1.4 打印指导功能）
   */
  const handlePrintCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPrintGuide(e.target.checked);
  };

  /**
   * To fold 复选框变化处理（对应详细设计 3.1.5 折叠指导功能）
   */
  const handleFoldCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowFoldGuide(e.target.checked);
  };

  return (
    <div className="ud23-container">
      <main className="ud23-main">
        <div className="ud23-card">
          {/* 页面标题 */}
          <h1 className="ud23-page-title">Download and Print Quick Guides</h1>

          {/* 快速指南链接区域（仅画面展示，暂不实现下载功能） */}
          <div className="ud23-section">
            <h2 className="ud23-section-title">Quick Guides</h2>
            <div className="ud23-link-list">
              <div className="ud23-link-item">
                <span className="ud23-link-text">Download and Print Quick Guides</span>
              </div>
              <div className="ud23-link-item">
                <span className="ud23-link-text">Volvo 3P Quick Guides</span>
              </div>
            </div>
          </div>

          {/* To print 操作说明区域（对应详细设计 3.1.4） */}
          <div className="ud23-section">
            <div className="ud23-checkbox-row">
              <label className="ud23-checkbox-label">
                <input
                  type="checkbox"
                  className="ud23-checkbox"
                  checked={showPrintGuide}
                  onChange={handlePrintCheckChange}
                />
                To print do the following
              </label>
            </div>

            {showPrintGuide && (
              <div className="ud23-guide-content">
                <ol className="ud23-guide-list">
                  <li>Open the downloaded PDF file.</li>
                  <li>Select "Print" from the File menu or press Ctrl+P.</li>
                  <li>In the print dialog, select "Actual Size" or "100%" scale.</li>
                  <li>Select "Auto portrait/landscape" orientation.</li>
                  <li>Click "Print" to start printing.</li>
                  <li>Ensure the printed pages are collated correctly.</li>
                </ol>
              </div>
            )}
          </div>

          {/* To fold 操作说明区域（对应详细设计 3.1.5） */}
          <div className="ud23-section">
            <div className="ud23-checkbox-row">
              <label className="ud23-checkbox-label">
                <input
                  type="checkbox"
                  className="ud23-checkbox"
                  checked={showFoldGuide}
                  onChange={handleFoldCheckChange}
                />
                To fold do the following
              </label>
            </div>

            {showFoldGuide && (
              <div className="ud23-guide-content">
                <ol className="ud23-guide-list">
                  <li>Place the printed page face up on a flat surface.</li>
                  <li>Fold the page in half lengthwise, matching the edges.</li>
                  <li>Crease the fold firmly with your fingers.</li>
                  <li>Fold the page in half widthwise for the final size.</li>
                  <li>Ensure all panels are aligned correctly.</li>
                  <li>The guide is now ready for use.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DownloadPrintQuickGuides;
