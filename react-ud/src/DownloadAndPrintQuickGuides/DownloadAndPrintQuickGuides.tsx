import React, { useState } from 'react';
import '../common/css/common.css';
import './DownloadAndPrintQuickGuides.css';

const DownloadAndPrintQuickGuides: React.FC = () => {
  const [isPrintChecked, setIsPrintChecked] = useState(false);
  const [isFoldChecked, setIsFoldChecked] = useState(false);

  return (
    <div className="dpg-container">
      <div className="dpg-header">
        <h1>Download and Print Quick Guides</h1>
      </div>

      <div className="dpg-content">
        {/* Links */}
        <div className="dpg-link-section">
          <div className="dpg-link-item">
            <span className="dpg-link-arrow">»</span>
            <a
              className="dpg-link"
              href="/files/quick-guides.pdf"
              download
            >
              Download and Print Quick Guides
            </a>
          </div>
          <div className="dpg-link-item">
            <span className="dpg-link-arrow">»</span>
            <a
              className="dpg-link"
              href="/files/volvo-3p-quick-guides.pdf"
              download
            >
              Volvo 3P Quick Guides
            </a>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="dpg-checkbox-section">
          <div className="dpg-checkbox-item">
            <label className="dpg-checkbox-label">
              <input
                type="checkbox"
                checked={isPrintChecked}
                onChange={(e) => setIsPrintChecked(e.target.checked)}
              />
              <span>To print do the following</span>
            </label>
          </div>
          <div className="dpg-checkbox-item">
            <label className="dpg-checkbox-label">
              <input
                type="checkbox"
                checked={isFoldChecked}
                onChange={(e) => setIsFoldChecked(e.target.checked)}
              />
              <span>To fold do the following</span>
            </label>
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
