import React from "react";
import { useNavigate } from "react-router-dom";
import "./Help.css";

/**
 * Help 画面コンポーネント（HDoc Help）
 *
 * Props:
 * - onBack?: () => void —— 返回按钮回调；在 Menu 右侧内容区域显示时返回检索画面
 *   （GenerateDoc），未提供时（独立页面访问）跳转至 /Menu
 *
 * 機能：
 * - 检索画面 [GenerateDoc] 点击 Help 按钮后在本画面同一位置显示（内部設計 4.4 / 5.4）
 * - 画面式样参照 Help.png：白底・深蓝粗体标题・灰色下划线超链接・黑色粗体小节标题
 */
interface HelpProps {
  /** 返回按钮回调（在 Menu 右侧内容区域显示时返回检索画面） */
  onBack?: () => void;
}

const Help: React.FC<HelpProps> = ({ onBack }) => {
  const navigate = useNavigate();

  // 返回处理：嵌入 Menu 时返回检索画面，独立页面访问时返回 /Menu
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/Menu");
    }
  };

  return (
    <div className="help-container">
      {/* 标题（Help.png：深蓝・粗体・大字） */}
      <h1 className="help-title">HDoc Help</h1>

      {/* 手册/指南链接列表（Help.png：灰色下划线，Order CoC paper 为蓝色）
          使用 button 模拟链接样式，避免 href="#" 触发 a11y 警告 */}
      <ul className="help-links">
        <li>
          <button type="button" className="help-link help-link-gray">
            HDoc Users Manual
          </button>
        </li>
        <li>
          <button type="button" className="help-link help-link-gray">
            HDoc Users Manual (PDF file)
          </button>
        </li>
        <li>
          <button type="button" className="help-link help-link-gray">
            HDoc Quick Guide
          </button>
        </li>
        <li>
          <button type="button" className="help-link help-link-gray">
            Active directory login information
          </button>
        </li>
        <li>
          <button type="button" className="help-link help-link-blue">
            Order CoC paper
          </button>
        </li>
      </ul>

      {/* 小节标题（Help.png：黑色粗体） */}
      <h2 className="help-section-title">Basic Introduction</h2>
      <p className="help-text">To generate a document do the following:</p>
      <ol className="help-list">
        <li>Enter chassis series and chassis</li>
        <li>Select document type</li>
        <li>
          Select language. Note always German for Austria Noise document.
        </li>
        <li>Enter other information like document number etc.</li>
      </ol>

      <h2 className="help-section-title">Document Types</h2>
      <p className="help-text">
        HDoc can generate a large number of different document types, for
        example VIN Plate, CEMT, Austria Noise etc.
      </p>
      <p>
        <button type="button" className="help-link help-link-gray">
          List of document types.
        </button>
      </p>

      {/* 返回导航（返回检索画面或 /Menu） */}
      <div className="help-back">
        <button type="button" className="footer-button" onClick={handleBack}>
          返回
        </button>
      </div>
    </div>
  );
};

export default Help;
