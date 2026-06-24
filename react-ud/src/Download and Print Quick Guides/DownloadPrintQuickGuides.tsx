/**
 * DownloadPrintQuickGuides组件 - 下载和打印快速指南页面
 * 
 * @description 提供HDoc系统和Deep 3P系统相关快速指南的下载功能，
 *              用户可以通过点击不同的链接下载所需的快速指南文档。
 *              严格按照詳細設計UD23.md中定义的画面项目（项番1-20）实现。
 * 
 * @features
 * - HDoc系统快速指南：WIS、PERF、W8、HDoc、EDB、COS、VBI(Intranet)、VBI(Internet)
 * - Deep 3P系统快速指南：EDB、KRS、CVM、AVP、KAX、CAE Homepage、BPP、SPC、WebFRAME
 * - Back按钮和标题在同一行
 * - HDoc系统快速指南横向排列，每个链接上方显示对应图片
 * - Deep 3P系统快速指南缩进显示，带黑点列表符号
 * - 仅已认证用户可以访问此页面
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 防止未授权用户直接访问受限文档资源
 * - 文件下载需进行权限验证
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DownloadPrintQuickGuides.css';

// 导入图片资源
import image1 from './wis-quick-guide.png';
import image2 from './perf-quick-guide.png';
import image3 from './w8-quick-guide.png';
import image4 from './hdoc-quick-guide.png';
import image5 from './edb-quick-guide.png';
import image6 from './cos-quick-guide.png';
import image7 from './vbi-quick-guide-intranet.png';
import image8 from './vbi-quick-guide-internet.png';

/**
 * 快速指南配置接口定义
 */
interface QuickGuide {
  label: string;
  fileName?: string;
  image?: string;
}

/**
 * DownloadPrintQuickGuides组件
 * 
 * @returns JSX.Element 渲染的快速指南下载页面
 */
const DownloadPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();

  /**
   * HDoc系统快速指南列表
   * 严格按照詳細設計UD23.md中定义的画面项目（项番2-9）
   * 布局样式参照UD23.png图片
   * 
   * 项番2: WIS Quick Guide (Link)
   * 项番3: PERF Quick Guide (Link)
   * 项番4: W8 Quick Guide (Link)
   * 项番5: HDoc Quick Guide (Link)
   * 项番6: EDB Quick Guide (Link)
   * 项番7: COS Quick Guide (Link)
   * 项番8: VBI Quick Guide (Intranet version) (Link)
   * 项番9: VBI Quick Guide (Internet version) (Link)
   */
  const hdocQuickGuides: QuickGuide[] = [
    // 项番2: WIS Quick Guide
    { label: 'WIS Quick Guide', fileName: 'wis-quick-guide.pdf', image: image1 },
    // 项番3: PERF Quick Guide
    { label: 'PERF Quick Guide', fileName: 'perf-quick-guide.pdf', image: image2 },
    // 项番4: W8 Quick Guide
    { label: 'W8 Quick Guide', fileName: 'w8-quick-guide.pdf', image: image3 },
    // 项番5: HDoc Quick Guide
    { label: 'HDoc Quick Guide', fileName: 'hdoc-quick-guide.pdf', image: image4 },
    // 项番6: EDB Quick Guide
    { label: 'EDB Quick Guide', fileName: 'edb-quick-guide.pdf', image: image5 },
    // 项番7: COS Quick Guide
    { label: 'COS Quick Guide', fileName: 'cos-quick-guide.pdf', image: image6 },
    // 项番8: VBI Quick Guide (Intranet version)
    { label: 'VBI Quick Guide (Intranet version)', fileName: 'vbi-quick-guide-intranet.pdf', image: image7 },
    // 项番9: VBI Quick Guide (Internet version)
    { label: 'VBI Quick Guide (Internet version)', fileName: 'vbi-quick-guide-internet.pdf', image: image8 }
  ];

  /**
   * Deep 3P系统快速指南列表
   * 严格按照詳細設計UD23.md中定义的画面项目（项番11-19）
   * 布局样式参照UD23.png图片
   * 
   * 项番11: EDB Quick Guide (Link)
   * 项番12: KRS Quick Guide (Link)
   * 项番13: CVM Quick Guide (Link)
   * 项番14: AVP Quick Guide (Link)
   * 项番15: KAX Quick Guide (Link)
   * 项番16: CAE Homepage Quick Guide (Link)
   * 项番17: BPP Quick Guide (Link)
   * 项番18: SPC Quick Guide (Link)
   * 项番19: WebFRAME Quick Guide (Link)
   */
  const deep3pQuickGuides: QuickGuide[] = [
    // 项番11: EDB Quick Guide
    { label: 'EDB Quick Guide', fileName: 'deep-edb-quick-guide.pdf' },
    // 项番12: KRS Quick Guide
    { label: 'KRS Quick Guide', fileName: 'krs-quick-guide.pdf' },
    // 项番13: CVM Quick Guide
    { label: 'CVM Quick Guide', fileName: 'cvm-quick-guide.pdf' },
    // 项番14: AVP Quick Guide
    { label: 'AVP Quick Guide', fileName: 'avp-quick-guide.pdf' },
    // 项番15: KAX Quick Guide
    { label: 'KAX Quick Guide', fileName: 'kax-quick-guide.pdf' },
    // 项番16: CAE Homepage Quick Guide
    { label: 'CAE Homepage Quick Guide', fileName: 'cae-homepage-quick-guide.pdf' },
    // 项番17: BPP Quick Guide
    { label: 'BPP Quick Guide', fileName: 'bpp-quick-guide.pdf' },
    // 项番18: SPC Quick Guide
    { label: 'SPC Quick Guide', fileName: 'spc-quick-guide.pdf' },
    // 项番19: WebFRAME Quick Guide
    { label: 'WebFRAME Quick Guide', fileName: 'webframe-quick-guide.pdf' }
  ];

  /**
   * 处理快速指南链接点击事件
   * 
   * @param guide - 被点击的快速指南
   * @description 触发文件下载
   *              实际项目中应该调用后端API获取文件并下载
   */
  const handleQuickGuideClick = (guide: QuickGuide): void => {
    if (guide.fileName) {
      // 模拟文件下载
      // 实际项目中应该调用后端API：GET /api/ud23/download/{fileName}
      console.log(`Downloading: ${guide.fileName}`);
      
      // 这里可以添加实际的下载逻辑
      // 例如：window.open(`/api/ud23/download/${guide.fileName}`, '_blank');
    }
  };

  /**
   * 处理Back按钮点击事件
   * 
   * @description 返回到User Guide页面（画面ID：24）
   */
  const handleBackClick = (): void => {
    navigate('/user-guide');
  };

  return (
    <div className="download-print-container">
      {/* 主内容区域 */}
      <main className="download-print-main">
        <div className="download-print-content">
          {/* 左侧内容区域 */}
          <aside className="download-print-sidebar">
            {/* 项番20: Back按钮 和 项番1: 标题在同一行 */}
            <div className="header-row">
              <button
                type="button"
                className="back-button"
                onClick={handleBackClick}
              >
                Back
              </button>
              <h1 className="page-title">Download and Print Quick Guides</h1>
            </div>

            {/* HDoc系统快速指南部分 - 横向排列 */}
            <div className="hdoc-guides-section">
              <div className="guides-grid">
                {hdocQuickGuides.map((guide, index) => (
                  <div key={index} className="guide-item">
                    {/* 图片显示 */}
                    {guide.image && (
                      <img
                        src={guide.image}
                        alt={guide.label}
                        className="guide-image"
                      />
                    )}
                    {/* 链接 */}
                    <button
                      type="button"
                      className="quick-guide-link"
                      onClick={() => handleQuickGuideClick(guide)}
                    >
                      {guide.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {/* 项番21: 固定文言 */}
            <p className="quick-guide-text">
              (Note that the font Deep Broad is removed from the Quick Guides because of problems)
            </p>
            {/* 项番10: Deep 3P Quick Guides标题 - 红色 */}
            <h2 className="section-title-red">Deep 3P Quick Guides</h2>

            {/* Deep 3P系统快速指南部分 - 缩进显示，带黑点 */}
            <div className="deep-guides-section">
              <ul className="deep-guide-list">
                {deep3pQuickGuides.map((guide, index) => (
                  <li key={index} className="deep-guide-item">
                    <button
                      type="button"
                      className="deep-guide-link"
                      onClick={() => handleQuickGuideClick(guide)}
                    >
                      {guide.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DownloadPrintQuickGuides;
