import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './UD23_DownloadAndPrintQuickGuides.css';

/**
 * UD23_DownloadAndPrintQuickGuides 下载和打印快速指南页面组件
 *
 * 功能说明：
 * - 展示多个Quick Guide的图片预览和下载链接
 * - 区分可用指南（活性）和不可用指南（非活性）
 * - 提供Back按钮返回上一级画面
 * - 无需调用后端API，为静态页面
 *
 * @component
 * @returns {JSX.Element} 下载和打印快速指南页面元素
 */
const UD23_DownloadAndPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();

  /**
   * 处理 Back 按钮点击
   * 对应设计书 3.1.1 - 返回上一级画面UD24
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
    { id: 'wis', title: 'WIS Quick Guide', imageLabel: 'WIS Quick Guide picture1', linkLabel: 'WIS Quick Guide', linkUrl: '/guides/wis-quick-guide.pdf' },
    { id: 'perf', title: 'PERF Quick Guide', imageLabel: 'PERF Quick Guide picture', linkLabel: 'PERF Quick Guide', linkUrl: '/guides/perf-quick-guide.pdf' },
    { id: 'w8', title: 'W8 Quick Guide', imageLabel: 'W8 Quick Guide picture', linkLabel: 'W8 Quick Guide', linkUrl: '/guides/w8-quick-guide.pdf' },
    { id: 'hdoc', title: 'HDoc Quick Guide', imageLabel: 'HDoc Quick Guide picture', linkLabel: 'HDoc Quick Guide', linkUrl: '/guides/hdoc-quick-guide.pdf' },
    { id: 'edb', title: 'EDB Quick Guide', imageLabel: 'EDB Quick Guide picture', linkLabel: 'EDB Quick Guide', linkUrl: '/guides/edb-quick-guide.pdf' },
    { id: 'cos', title: 'COS Quick Guide', imageLabel: 'COS Quick Guide picture', linkLabel: 'COS Quick Guide', linkUrl: '/guides/cos-quick-guide.pdf' },
    { id: 'vbi1', title: 'VBI Quick Guide(Intranet version)1', imageLabel: 'VBI Quick Guide picture', linkLabel: 'VBI Quick Guide(Intranet version)1', linkUrl: '/guides/vbi-quick-guide-1.pdf', isIntranet: true },
    { id: 'vbi2', title: 'VBI Quick Guide(Intranet version)2', imageLabel: 'VBI Quick Guide picture', linkLabel: 'VBI Quick Guide(Intranet version)2', linkUrl: '/guides/vbi-quick-guide-2.pdf', isIntranet: true },
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
   * 对应设计书 6.3 文件下载 - 使用a标签download属性
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
      {/* Back 按钮 - 页面顶部 */}
      {/* 对应设计书 2.1 No.1 Back */}
      <button className="ud23-back-btn" onClick={handleBack}>
        « Back
      </button>

      {/* 页面标题 */}
      {/* 对应设计书 2.1 No.2 Download and Print Quick Guides */}
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
            {/* 对应设计书 2.1 No.4/6/8/10/12/14/16/18 Link */}
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

      {/* Volvo 3P Quick Guides 区域 */}
      {/* 对应设计书 2.1 No.19 Volvo 3P Quick Guides */}
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
  );
};

export default UD23_DownloadAndPrintQuickGuides;
