import React, { useState } from 'react';
import { Checkbox } from 'antd';
import './DownloadAndPrintQuickGuides.css';

const DownloadAndPrintQuickGuides: React.FC = () => {
  const [showPrintInstructions, setShowPrintInstructions] = useState(false);
  const [showFoldInstructions, setShowFoldInstructions] = useState(false);

  return (
    <div className="qgd-container">
      <div className="qgd-header">
        <h1 className="qgd-header-title">HDoc - Download and Print Quick Guides</h1>
      </div>

      <div className="qgd-content">
        <div className="qgd-card">
          <div className="qgd-links">
            <a
              className="qgd-link"
              href="/quick-guides/hdoc-quick-guides.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download and Print Quick Guides
            </a>
            <br />
            <a
              className="qgd-link"
              href="/quick-guides/volvo-3p-quick-guides.pdf"
              download
            >
              Volvo 3P Quick Guides
            </a>
          </div>

          <div className="qgd-instructions-section">
            <Checkbox
              className="qgd-checkbox"
              checked={showPrintInstructions}
              onChange={(e) => setShowPrintInstructions(e.target.checked)}
            >
              To print do the following
            </Checkbox>

            {showPrintInstructions && (
              <div className="qgd-instruction-content">
                <ol className="qgd-steps">
                  <li>Open the downloaded PDF file.</li>
                  <li>Select <strong>File</strong> &gt; <strong>Print</strong> from the menu.</li>
                  <li>Set the printer to <strong>Actual Size</strong> (100% scaling).</li>
                  <li>Select <strong>Auto</strong> page orientation.</li>
                  <li>Click <strong>Print</strong> to start printing.</li>
                </ol>
              </div>
            )}
          </div>

          <div className="qgd-instructions-section">
            <Checkbox
              className="qgd-checkbox"
              checked={showFoldInstructions}
              onChange={(e) => setShowFoldInstructions(e.target.checked)}
            >
              To fold do the following
            </Checkbox>

            {showFoldInstructions && (
              <div className="qgd-instruction-content">
                <ol className="qgd-steps">
                  <li>Place the printed page face up on a flat surface.</li>
                  <li>Fold the left edge to the center crease line.</li>
                  <li>Fold the right edge to the center crease line, overlapping the left fold.</li>
                  <li>Fold the bottom edge up to align with the top edge.</li>
                  <li>Smooth out all creases to form the final booklet.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="qgd-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="qgd-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default DownloadAndPrintQuickGuides;
