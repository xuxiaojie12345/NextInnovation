import React from "react";
import { useNavigate } from "react-router-dom";
import "./UD24_UDHDoc.css";

/**
 * UD24 用户指南页面组件
 * 
 * @component
 * @returns {JSX.Element} 用户指南页面元素
 */
const UD24_UDHDoc: React.FC = () => {
  const navigate = useNavigate();

  // ==================== 事件处理函数 ====================

  /**
   * 点击「HDoc Quick Guide」链接
   */
  const handleQuickGuideClick = () => {
    try {
      navigate("/UD23");
    } catch (error) {
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「List of document types.」链接
   */
  const handleDocumentTypesClick = () => {
    try {
      navigate("/UD22");
    } catch (error) {
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「Markets in HDoc」链接
   */
  const handleMarketsClick = () => {
    try {
      navigate("/UD21");
    } catch (error) {
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「HDoc - Market Document Settings」链接
   */
  const handleMarketSettingsClick = () => {
    try {
      navigate("/UD201");
    } catch (error) {
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「Describation」链接
   * 预留功能，当前未指定跳转目标
   */
  const handleDescriptionClick = () => {
    // TODO: 待实现具体跳转逻辑
  };

  // ==================== 渲染 ====================
  return (
    <div className="ud24-container">
      {/* 页面标题 */}
      <h1 className="ud24-title">HDoc Help</h1>

      {/* 帮助链接列表 */}
      <div className="ud24-link-list">
        {/* 链接项1: HDoc Quick Guide */}
        <div className="ud24-link-item" onClick={handleQuickGuideClick}>
          <span className="ud24-link-text">HDoc Quick Guide</span>
        </div>

        {/* 链接项2: List of document types. */}
        <div className="ud24-link-item" onClick={handleDocumentTypesClick}>
          <span className="ud24-link-text">List of document types.</span>
        </div>

        {/* 链接项3: Markets in HDoc */}
        <div className="ud24-link-item" onClick={handleMarketsClick}>
          <span className="ud24-link-text">Markets in HDoc</span>
        </div>

        {/* 链接项4: HDoc - Market Document Settings */}
        <div className="ud24-link-item" onClick={handleMarketSettingsClick}>
          <span className="ud24-link-text">HDoc - Market Document Settings</span>
        </div>

        {/* 链接项5: Describation */}
        <div className="ud24-link-item" onClick={handleDescriptionClick}>
          <span className="ud24-link-text">Describation</span>
        </div>
      </div>

      {/* 其他信息复选框（输出项） */}
      <div className="ud24-other-info">
        <label className="ud24-checkbox-label">
          <input type="checkbox" className="ud24-checkbox" />
          <span className="ud24-checkbox-text">Other Information</span>
        </label>
      </div>
    </div>
  );
};

export default UD24_UDHDoc;
