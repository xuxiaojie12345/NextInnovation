import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './UD23_DownloadAndPrintQuickGuides.css';

/**
 * UD23_DownloadAndPrintQuickGuides 下载和打印快速指南页面组件
 *
 * @component
 * @returns {JSX.Element} 下载和打印快速指南页面元素
 */
const UD23_DownloadAndPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 处理 Back 按钮点击返回上一级画面UD24
   */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /** 快速指南配置 */
  interface GuideItem {
    id: string;
    title: string;
    imageLabel: string;
    imageSrc?: string;
    linkLabel: string;
    linkUrl: string;
    isIntranet?: boolean;
    isActive?: boolean;
  }

  /** 活性指南列表 */
  const activeGuides: GuideItem[] = [
    { id: 'wis', title: 'WIS Quick Guide', imageLabel: '', linkLabel: 'WIS Quick Guide', linkUrl: '/guides/wis-quick-guide.pdf' },
    { id: 'perf', title: 'PERF Quick Guide', imageLabel: '', linkLabel: 'PERF Quick Guide', linkUrl: '/guides/perf-quick-guide.pdf' },
    { id: 'w8', title: 'W8 Quick Guide', imageLabel: '', linkLabel: 'W8 Quick Guide', linkUrl: '/guides/w8-quick-guide.pdf' },
    { id: 'hdoc', title: 'HDoc Quick Guide', imageLabel: '', linkLabel: 'HDoc Quick Guide', linkUrl: '/guides/hdoc-quick-guide.pdf' },
    { id: 'edb', title: 'EDB Quick Guide', imageLabel: '', linkLabel: 'EDB Quick Guide', linkUrl: '/guides/edb-quick-guide.pdf' },
    { id: 'cos', title: 'COS Quick Guide', imageLabel: '', linkLabel: 'COS Quick Guide', linkUrl: '/guides/cos-quick-guide.pdf' },
    { id: 'vbi1', title: 'VBI Quick Guide(Intranet version)1', imageLabel: '', linkLabel: 'VBI Quick Guide(Intranet version)1', linkUrl: '/guides/vbi-quick-guide-1.pdf', isIntranet: true },
    { id: 'vbi2', title: 'VBI Quick Guide(Intranet version)2', imageLabel: '', linkLabel: 'VBI Quick Guide(Intranet version)2', linkUrl: '/guides/vbi-quick-guide-2.pdf', isIntranet: true },
  ];

  /** Volvo 3P 快速指南列表 */
  const volvo3pGuides: GuideItem[] = [
    { id: 'edb3p', title: 'EDB Quick Guide', imageLabel: '', linkLabel: 'EDB Quick Guide', linkUrl: '/guides/edb-3p-guide.pdf' },
    { id: 'krs', title: 'KRS Quick Guide', imageLabel: '', linkLabel: 'KRS Quick Guide', linkUrl: '/guides/krs-quick-guide.pdf' },
    { id: 'cvm', title: 'CVM Quick Guide', imageLabel: '', linkLabel: 'CVM Quick Guide', linkUrl: '/guides/cvm-quick-guide.pdf' },
    { id: 'avp', title: 'AVP Quick Guide', imageLabel: '', linkLabel: 'AVP Quick Guide', linkUrl: '/guides/avp-quick-guide.pdf' },
    { id: 'kax', title: 'KAX Quick Guide', imageLabel: '', linkLabel: 'KAX Quick Guide', linkUrl: '/guides/kax-quick-guide.pdf' },
    { id: 'cae', title: 'CAE Homepage Quick Guide', imageLabel: '', linkLabel: 'CAE Homepage Quick Guide', linkUrl: '/guides/cae-homepage-guide.pdf' },
    { id: 'bpp', title: 'BPP Quick Guide', imageLabel: '', linkLabel: 'BPP Quick Guide', linkUrl: '/guides/bpp-quick-guide.pdf' },
    { id: 'spc', title: 'SPC Quick Guide', imageLabel: '', linkLabel: 'SPC Quick Guide', linkUrl: '/guides/spc-quick-guide.pdf' },
    { id: 'webframe', title: 'WebFRAME Quick Guide', imageLabel: '', linkLabel: 'WebFRAME Quick Guide', linkUrl: '/guides/webframe-quick-guide.pdf' },
  ];

  /**
   * 处理文件下载
   *
   * @param url - 下载链接
   * @param filename - 文件名
   */
  const handleDownload = useCallback((url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // ==================== 渲染 ====================
  return (
    <div className="ud23-container">
      <div className="ud23-layout">
        {/* Back 按钮 - 左侧 */}
        <div className="ud23-sidebar">
          <button className="ud23-back-btn" onClick={handleBack}>
            « Back
          </button>
        </div>

        {/* 主内容区域 - 按钮右侧 */}
        <div className="ud23-main">
          {/* 页面标题 */}
          <div className="ud23-title">Download and Print Quick Guides</div>

          {/* 活性指南区域 */}
          <div className="ud23-section">
            {activeGuides.map((guide) => (
          <div key={guide.id} className="ud23-guide-item">
            {/* 图片预览区域 */}
            {/* 对应设计书 2.1 No.3/5/7/9/11/13/15/17 Image */}
            <div className="ud23-image-placeholder">
              <span className="ud23-image-label">{guide.imageLabel}</span>
              <div className="ud23-image-box">
                <span className="ud23-image-icon">🖼</span>
              </div>
            </div>
            {/* 下载链接 */}
            <div className="ud23-link-area">
              <a
                className="ud23-download-link"
                href={guide.linkUrl}
                onClick={(e) => {
                  e.preventDefault();
                  handleDownload(guide.linkUrl, `${guide.id}.pdf`);
                }}
              >
                {guide.linkLabel}
              </a>
              {guide.isIntranet && (
                <span className="ud23-intranet-badge">(Intranet version)</span>
              )}
            </div>
          </div>
        ))}
      </div>
        <span style = {{fontSize: '12px', color: '#666'}}>(Note that the font Volvo Broad is removed from the Quick Guides because of problems)</span>
      {/* Volvo 3P Quick Guides 区域 */}
      <div className="ud23-section ud23-volvo-section">
        <div className="ud23-volvo-title">Volvo 3P Quick Guides</div>
        <div className="ud23-volvo-links">
          {volvo3pGuides.map((guide) => (
            <div key={guide.id} className="ud23-volvo-item">
              <a
                className="ud23-download-link"
                href={guide.linkUrl}
                onClick={(e) => {
                  e.preventDefault();
                  handleDownload(guide.linkUrl, `${guide.id}.pdf`);
                }}
              >
               {guide.linkLabel}
              </a>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default UD23_DownloadAndPrintQuickGuides;
