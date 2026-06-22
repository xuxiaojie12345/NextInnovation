import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import './HdocHelp.css';

/**
 * HdocHelp组件 - 系统帮助页面
 * 
 * @description 提供Hdoc系统相关帮助文档的入口，包含快速指南、文档类型列表、市场信息、市场文档设置等功能链接
 * @props 无Props
 */
const HdocHelp: React.FC = () => {
  const navigate = useNavigate();

  /**
   * HDoc Quick Guide Link点击处理 - 跳转到快速指南下载页面
   * 对应设计书 3.2 HDoc Quick Guide Link押下
   */
  const handleQuickGuideClick = () => {
    navigate('/HdocMenu/DownloadAndPrintQuickGuides'); // 使用相对路径，作为HdocHelp的子路由
  };

  /**
   * List of document types Link点击处理 - 跳转到文档类型列表页面
   * 对应设计书 3.3 List of document types Link押下
   */
  const handleDocumentTypesClick = () => {
    navigate('/HdocMenu/DocumentTypes');
  };

  /**
   * Markets in Hdoc Link点击处理 - 跳转到市场信息页面
   * 对应設計書 3.4 Markets in HDoc Link押下
   */
  const handleMarketsInHdocClick = () => {
    navigate('/HdocMenu/MarketsInHdoc');
  };

  /**
   * HDoc - Market Document Setting Link点击处理 - 跳转到市场文档设置页面
   * 对应設計書 3.5 HDoc - Market Document Settings Link押下
   */
  const handleMarketDocumentSettingsClick = () => {
    navigate('/HdocMenu/MarketDocumentSettings'); 
  };

  return (
    <div className='hh-container'>
      <div className='hh-content'>
        {/* 标题区域 */}
        <h2 className='hh-title'>Hdoc Help</h2>
        
        {/* 帮助链接列表 */}
        <div className='hh-links-section'>
          <div className='hh-link-item' onClick={handleQuickGuideClick}>
            <span className='hh-link-text'>HDoc Quick Guide</span>
          </div>
          
          <div className='hh-link-item' onClick={handleDocumentTypesClick}>
            <span className='hh-link-text'>List of document types.</span>
          </div>
          
          <div className='hh-link-item' onClick={handleMarketsInHdocClick}>
            <span className='hh-link-text'>Markets in Hdoc</span>
          </div>
          
          <div className='hh-link-item' onClick={handleMarketDocumentSettingsClick}>
            <span className='hh-link-text'>HDoc - Market Document Setting</span>
          </div>
          
          {/* <div className='hh-link-item'>
            <span className='hh-link-text'>Describation</span>
          </div> */}
        </div>
        
        {/* Other Information复选框 */}
        {/* <div className='hh-other-info-section'>
          <label className='hh-checkbox-label'>
            <input 
              type='checkbox' 
              disabled
              readOnly
            />
            Other Information
          </label>
        </div> */}
        
        {/* Outlet用于显示子路由组件（如DownloadAndPrintQuickGuides） */}
        {/* <Outlet /> */}
      </div>
    </div>
  );
};

export default HdocHelp;
