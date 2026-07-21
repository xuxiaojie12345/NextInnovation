import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "antd";
import "../common/css/common.css";
import "./DownloadAndPrintQuickGuides.css";

const QUICK_GUIDES = [
  "WIS Quick Guide",
  "PERF Quick Guide",
  "W8-Calc Quick Guide",
  "HDoc Quick Guide",
  "EDB Quick Guide",
  "COS Quick Guide",
  "VBI Quick Guide (Intranet version)",
  "VBI Quick Guide (Internet version)",
];

const VOLVO_3P_GUIDES = [
  "KBS Quick Guide",
  "CVM Quick Guide",
  "AVP Quick Guide",
  "KAX Quick Guide",
  "C&E Homepage Quick Guide",
  "RPD Quick Guide",
  "SPC Quick Guide",
  "WebFRAME Quick Guide",
];

// 快速指南下载打印组件
const DownloadAndPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();
  const [isPrintChecked, setIsPrintChecked] = useState(false);
  const [isFoldChecked, setIsFoldChecked] = useState(false);

  const handleBack = () => {
    navigate("/menu/guide-user");
  };

  return (
    <div className="dpg-container panel panel-w700">
      <div className="dpg-header panel-header">
        <h1>Download and Print Quick Guides</h1>
      </div>

      <div className="dpg-content">
        <div className="dpg-body">
          {/* Back 单独一列在左侧 */}
          <div className="dpg-back-column">
            <div className="dpg-link-item dpg-back-link" onClick={handleBack}>
              <span className="dpg-link">Back</span>
            </div>
          </div>

          {/* 列表区域在右侧 */}
          <div className="dpg-list-column">
            {/* Quick Guides 卡片展示区（上部） */}
            <div className="dpg-link-section">
              <div className="dpg-link-item">
                <span className="dpg-link">
                  Download and Print Quick Guides
                </span>
              </div>
              {QUICK_GUIDES.map((name) => (
                <div className="dpg-link-item" key={name}>
                  <span className="dpg-link-arrow">•</span>
                  <span
                    className="dpg-link"
                    onClick={() => Modal.info({ title: "Info", content: name + " 文件暂时不支持下载", transitionName: "" })}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>

            {/* Volvo 3P Quick Guides 链接列表（下部） */}
            <div className="dpg-link-section dpg-volvo-section">
              <div className="dpg-link-item">
                <span className="dpg-link">Volvo 3P Quick Guides</span>
              </div>
              {VOLVO_3P_GUIDES.map((name) => (
                <div className="dpg-link-item" key={name}>
                  <span className="dpg-link-arrow">•</span>
                  <span
                    className="dpg-link"
                    onClick={() => Modal.info({ title: "Info", content: name + " 文件暂时不支持下载", transitionName: "" })}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>

            {/* 复选框区域 */}
            <div className="dpg-checkbox-section">
              <div className="dpg-checkbox-item">
                <div className="dpg-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrintChecked}
                    onChange={(e) => setIsPrintChecked(e.target.checked)}
                  />
                  <span>To print do the following</span>
                </div>
              </div>
              <div className="dpg-checkbox-item">
                <div className="dpg-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isFoldChecked}
                    onChange={(e) => setIsFoldChecked(e.target.checked)}
                  />
                  <span>To fold do the following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Print Instructions */}
        {isPrintChecked && (
          <div className="dpg-instruction-panel">
            <h3>Print Instructions</h3>
            <ol>
              <li>Open the Quick Guides file.</li>
              <li>Select File &gt; Print.</li>
              <li>Choose your printer and print settings.</li>
              <li>Click Print.</li>
            </ol>
          </div>
        )}

        {/* Fold Instructions */}
        {isFoldChecked && (
          <div className="dpg-instruction-panel">
            <h3>Fold Instructions</h3>
            <ol>
              <li>Fold the printed page along the dashed lines.</li>
              <li>Align the edges carefully.</li>
              <li>Crease firmly along each fold line.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadAndPrintQuickGuides;
