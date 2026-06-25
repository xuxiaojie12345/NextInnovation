/**
 * HDocHelp 组件 - HDoc帮助页面（UD24）
 * 功能：提供系统功能导航链接，包含 HDoc Quick Guide、Document Types、Markets in HDoc
 *       Market Document Settings 等链接跳转，以及 Other Information 显示/隐藏控制
 * 对应详细设计：详细设计/詳細設計UD24.md
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HDocHelp.css";

/** 导航链接配置 */
interface NavLinkItem {
  label: string;
  route: string;
  description: string;
}

/** 导航链接列表（对应详细设计 2.1 控件属性表） */
const NAV_LINKS: NavLinkItem[] = [
  {
    label: "HDoc Quick Guide",
    route: "/Menu/DownloadAndPrintQuickGuides",
    description: "Download and Print Quick Guides"
  },
  {
    label: "List of document types.",
    route: "/Menu/DocumentTypes",
    description: "View all document types"
  },
  {
    label: "Markets in HDoc",
    route: "/Menu/MarketsInHDoc",
    description: "View market information in HDoc"
  },
  {
    label: "HDoc - Market Document Setting",
    route: "/Menu/MarketDocumentSettings",
    description: "Configure market document settings"
  },
  {
    label: "Describation",
    route: "",
    description: "Description link"
  }
];

/**
 * HDocHelp 组件
 * 提供系统功能的导航入口和帮助信息，无后端API调用
 */
const HDocHelp: React.FC = () => {
  const navigate = useNavigate();

  // -------- 状态管理（对应详细设计 2.1 - Other Information Checkbox）--------
  const [showOtherInfo, setShowOtherInfo] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  /** 清空消息 */
  const clearMessage = () => setMessage("");

  /**
   * 处理导航链接点击（对应详细设计 3.1.2 ~ 3.1.5 跳转流程）
   * 通过 React Router 跳转到对应路由
   */
  const handleNavigation = (route: string, label: string) => {
    clearMessage();
    try {
      if (route) {
        navigate(route);
      } else {
        // 路由为空时显示提示（对应详细设计 5. 异常处理）
        setMessage("目标页面不可用，请联系管理员");
      }
    } catch (err) {
      // 对应详细设计 5. 异常处理 - 链接跳转失败
      setMessage("目标页面不可用，请联系管理员");
    }
  };

  /**
   * 处理 Other Information Checkbox 变化
   * 控制 Other Information 区域的显示/隐藏
   */
  const handleOtherInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOtherInfo(e.target.checked);
    if (message) clearMessage();
  };

  return (
    <div className="ud24-container">
      {/* 页面标题 */}
      <h1 className="ud24-title">HDoc Help</h1>

      {/* 错误消息提示（对应详细设计 5. 异常处理） */}
      {message && <div className="ud24-message">{message}</div>}

      {/* 主导航区域 */}
      <div className="ud24-section">
        <h2 className="ud24-section-title">Quick Links</h2>
        <div className="ud24-link-list">
          {NAV_LINKS.map((link, index) => (
            <div
              key={index}
              className="ud24-link-item"
              onClick={() => handleNavigation(link.route, link.label)}
            >
              <span className="ud24-link-text">{link.label}</span>
              <span className="ud24-link-arrow">&rarr;</span>
            </div>
          ))}
        </div>
      </div>

      {/* Other Information 区域（对应详细设计 2.1 - Checkbox 控制显示/隐藏） */}
      <div className="ud24-section">
        <div className="ud24-checkbox-row">
          <label className="ud24-checkbox-label">
            <input
              type="checkbox"
              className="ud24-checkbox"
              checked={showOtherInfo}
              onChange={handleOtherInfoChange}
            />
            Other Information
          </label>
        </div>

        {showOtherInfo && (
          <div className="ud24-other-info">
            <div className="ud24-info-content">
              <p><strong>System Version:</strong> HDoc v1.0.0</p>
              <p><strong>Last Updated:</strong> 2026-05-20</p>
              <p><strong>Support Contact:</strong> Support TPI</p>
              <p>
                For support, authorization requests, or improvement suggestions,
                please send an email to Support TPI.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 底部固定信息 - 系统版本、版权等 */}
      <div className="ud24-footer">
        <div className="ud24-footer-row">
          <span className="ud24-footer-label">System Version</span>
          <span className="ud24-footer-value">HDoc v1.0.0</span>
        </div>
        <div className="ud24-footer-row">
          <span className="ud24-footer-label">Last Updated</span>
          <span className="ud24-footer-value">2026-05-20</span>
        </div>
        <div className="ud24-footer-row">
          <span className="ud24-footer-label">Support</span>
          <span className="ud24-footer-value">Support TPI</span>
        </div>
        <div className="ud24-footer-copyright">
          &copy; {new Date().getFullYear()} EDB Engineering Database. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default HDocHelp;
