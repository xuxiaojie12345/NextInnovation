import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DownloadAndPrintQuickGuides.css';

/**
 * DownloadAndPrintQuickGuides组件 - 快速指南下载和打印页面
 * 
 * @description 提供各类快速指南（Quick Guides）的下载和打印功能，分为常用快速指南卡片展示区和Volvo 3P专业指南链接列表两部分
 * @props 无Props
 */
const DownloadAndPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * Back按钮点击处理 - 返回Hdoc Help画面
   * 对应设计书 3.2 Back按钮押下
   */
  const handleBackClick = () => {
    navigate('/HdocHelp'); // 返回Hdoc Help画面
  };

  /**
   * 快速指南Link点击处理 - 调用API下载文档
   * 对应设计书 3.3 快速指南Link点击 和 4.1.2 快速指南Link点击
   */
  const handleGuideClick = async (guideName: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 - 从文档系统读取文件 (对应设计书 5.1 UD23DownloadandPrintQuickGuidesApi)
      const response = await axios.get('/api/auth/download-quick-guide', {
        params: { guideName: guideName },
        responseType: 'blob' // 接收文件流
      });
      
      // 使用URL.createObjectURL()创建临时URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // 创建隐藏的<a>标签，设置href和download属性，触发下载
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${guideName}_Quick_Guide.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // 下载完成后释放URL对象
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('下载失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 常用快速指南列表（上部卡片展示区）
  const quickGuides = [
    { name: 'WIS', label: 'WIS Quick Guide' },
    { name: 'PERF', label: 'PERF Quick Guide' },
    { name: 'W8-Calc', label: 'W8 Quick Guide' },
    { name: 'HDoc', label: 'HDoc Quick Guide' },
    { name: 'EDB', label: 'EDB Quick Guide' },
    { name: 'COS', label: 'COS Quick Guide' },
    { name: 'VBI-Intranet', label: 'VBI Quick Guide (Intranet version)' },
    { name: 'VBI-Internet', label: 'VBI Quick Guide (Internet version)' }
  ];

  // Volvo 3P专业指南列表（下部链接列表）
  const volvo3pGuides = [
    'EDB Quick Guide',
    'KRS Quick Guide',
    'CVM Quick Guide',
    'AVP Quick Guide',
    'KAX Quick Guide',
    'CAE Homepage Quick Guide',
    'BPP Quick Guide',
    'SPC Quick Guide',
    'WebFRAME Quick Guide'
  ];

  return (
    <div className='dapg-container'>
      <div className='dapg-content'>
        {/* 顶部蓝色标题栏 */}
        <div className='dapg-header'>
         
        </div>
        <div className='dapg-title'>
          <button 
            className='dapg-back-button' 
            onClick={handleBackClick}
            disabled={isLoading}
          >
            Back
          </button>
          <h2 className='dapg-title'>Download and Print Quick Guides</h2>
        </div>
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='dapg-loading'>
            加载中...
          </div>
        )}
        
        {/* Quick Guides卡片展示区（上部） */}
        <div className='dapg-cards-section'>
          <div className='dapg-cards-grid'>
            {quickGuides.map((guide, index) => (
              <div key={index} className='dapg-card-item'>
                {/* 图片区域 - 留出图片位置 */}
                <div className='dapg-card-image'>
                  <img 
                    src={`/placeholder-${guide.name.toLowerCase()}.png`} 
                    alt={`${guide.name} Quick Guide Cover`}
                    onError={(e) => {
                      // 如果图片加载失败，显示占位符
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjE2MCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjYwIiB5PSI4MCIgZm9udC1zaXplPSIxMiIgZm9udC1mYW1pbHk9IkFyaWFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5RdWljayBHdWlkZTwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                </div>
                {/* Link区域 - 与图片位置上下对齐 */}
                <a 
                  href='#'
                  className='dapg-card-link'
                  onClick={(e) => {
                    e.preventDefault();
                    handleGuideClick(guide.name);
                  }}
                >
                  {guide.label}
                </a>
              </div>
            ))}
          </div>
        </div>
        
        {/* Note提示信息 */}
        <div className='dapg-note'>
          (Note that the font Volvo Broad is removed from the Quick Guides because of problems)
        </div>
        
        {/* Volvo 3P Quick Guides链接列表（下部） */}
        <div className='dapg-volvo3p-section'>
          <h3 className='dapg-volvo3p-title'>Volvo 3P Quick Guides</h3>
          <ul className='dapg-volvo3p-list'>
            {volvo3pGuides.map((guide, index) => (
              <li key={index}>
                <a 
                  href='#'
                  className='dapg-volvo3p-link'
                  onClick={(e) => {
                    e.preventDefault();
                    // 提取指南名称（去掉" Quick Guide"后缀）
                    const guideName = guide.replace(' Quick Guide', '');
                    handleGuideClick(guideName);
                  }}
                >
                  {guide}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DownloadAndPrintQuickGuides;
