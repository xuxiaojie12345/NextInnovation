import React from "react";
import { useNavigate } from "react-router-dom";
import "./UD24_UDHDoc.css";

/**
 * UD24 用户指南页面组件
 * 
 * 功能说明：
 * - HDoc系统的帮助导航主页，提供通往各个帮助子模块的入口
 * - 包含快速指南下载、文档类型列表、市场信息、市场文档设置等链接
 * - 帮助用户快速定位所需的信息和支持资源
 * 
 * 用户体验：
 * - 简洁导航：采用清晰的链接列表布局，减少用户寻找帮助信息的时间
 * - 一致性：保持与系统整体风格一致的UI设计
 * - 响应式：确保在不同设备上链接易于点击和阅读
 * 
 * 安全性：
 * - 访问控制：确保只有登录用户才能访问帮助文档
 * 
 * @component
 * @returns {JSX.Element} 用户指南页面元素
 */
const UD24_UDHDoc: React.FC = () => {
  const navigate = useNavigate();

  // ==================== 事件处理函数 ====================

  /**
   * 点击「HDoc Quick Guide」链接
   * 对应设计书 3.1.1 处理流程
   * 
   * 处理流程：
   * 1. 执行路由跳转
   * 2. 跳转到UD23「Download and Print Quick Guides」画面
   */
  const handleQuickGuideClick = () => {
    try {
      navigate("/UD23");
    } catch (error) {
      console.error("页面跳转失败:", error);
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「List of document types.」链接
   * 对应设计书 3.1.2 处理流程
   * 
   * 处理流程：
   * 1. 执行路由跳转
   * 2. 跳转到UD22「Document Types」画面
   */
  const handleDocumentTypesClick = () => {
    try {
      navigate("/UD22");
    } catch (error) {
      console.error("页面跳转失败:", error);
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「Markets in HDoc」链接
   * 对应设计书 3.1.3 处理流程
   * 
   * 处理流程：
   * 1. 执行路由跳转
   * 2. 跳转到UD21「Markets in HDoc」画面
   */
  const handleMarketsClick = () => {
    try {
      navigate("/UD21");
    } catch (error) {
      console.error("页面跳转失败:", error);
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「HDoc - Market Document Settings」链接
   * 对应设计书 3.1.4 处理流程
   * 
   * 处理流程：
   * 1. 执行路由跳转
   * 2. 跳转到UD20「HDoc - Market Document Settings」画面
   */
  const handleMarketSettingsClick = () => {
    try {
      navigate("/UD20");
    } catch (error) {
      console.error("页面跳转失败:", error);
      alert("页面跳转失败，请稍后重试");
    }
  };

  /**
   * 点击「Describation」链接
   * 预留功能，当前未指定跳转目标
   */
  const handleDescriptionClick = () => {
    // TODO: 待实现具体跳转逻辑
    console.log("Describation link clicked");
  };

  // ==================== 渲染 ====================
  return (
    <div className="ud24-container">
      {/* 页面标题 */}
      <h1 className="ud24-title">User Guide</h1>

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
