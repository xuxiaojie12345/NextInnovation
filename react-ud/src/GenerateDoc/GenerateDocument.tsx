import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./GenerateDoc.css";

/**
 * 文档生成画面コンポーネント（Generate document）— 目标画面（待実装）
 *
 * 機能：
 * - 接收检索画面 [GenerateDoc] 通过 Submit 传递的数据（内部設計 4.2 / 5.2）
 * - 画面布局与详细逻辑后续按 [GenerateDocument_詳細設計] 实现，当前为占位画面
 */
interface GenerateDocumentLocationState {
  chassisSeries: string;
  chassisNo: string;
  documentType: string;
}

const GenerateDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as GenerateDocumentLocationState | null;

  return (
    <div className="generate-doc-container">
      <h2 className="generate-doc-title">Generate document</h2>

      <div className="generate-doc-form">
        {state ? (
          <>
            {/* 显示从检索画面传递过来的数据（内部設計 4.2：将数据传入 Generate document） */}
            <div className="form-row">
              <label className="form-label">Chassis series</label>
              <span className="form-value">{state.chassisSeries}</span>
            </div>
            <div className="form-row">
              <label className="form-label">Chassis no</label>
              <span className="form-value">{state.chassisNo}</span>
            </div>
            <div className="form-row">
              <label className="form-label">Document type</label>
              <span className="form-value">{state.documentType}</span>
            </div>
          </>
        ) : (
          <p className="content-placeholder">检索条件为空，请返回检索画面重新提交。</p>
        )}

        <div className="form-footer">
          <button
            type="button"
            className="footer-button"
            onClick={() => navigate("/Menu")}
          >
            返回 Menu
          </button>
        </div>
      </div>

      <p className="support-mail">HDoc support: support.tpi@volvo.com</p>
    </div>
  );
};

export default GenerateDocument;
