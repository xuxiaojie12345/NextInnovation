import React from "react";
import { useNavigate } from "react-router-dom";
import "./DownloadAndPrintQuickGuides.css";

// 安全加载图片，不存在时返回占位图
const getGuideImage = (filename: string): string => {
  try {
    return require(`./image/quick-guides/${filename}`);
  } catch {
    return "/image/placeholder-guide.png";
  }
};

const DownloadAndPrintQuickGuides: React.FC = () => {
  const navigate = useNavigate();

  // 快速指南数据
  const quickGuides = [
    {
      id: "wis",
      name: "WIS Quick Guide",
      image: getGuideImage("wis.png"),
    },
    {
      id: "perf",
      name: "PERF Quick Guide",
      image: getGuideImage("perf.png"),
    },
    {
      id: "w8",
      name: "W8 Quick Guide",
      image: getGuideImage("w8.png"),
    },
    {
      id: "hdoc",
      name: "HDoc Quick Guide",
      image: getGuideImage("hdoc.png"),
    },
    {
      id: "edb",
      name: "EDB Quick Guide",
      image: getGuideImage("edb.png"),
    },
    {
      id: "cos",
      name: "COS Quick Guide",
      image: getGuideImage("cos.png"),
    },
    {
      id: "vbi-intranet",
      name: "VBI Quick Guide (Intranet version)",
      image: getGuideImage("vbi-intranet.png"),
    },
    {
      id: "vbi-internet",
      name: "VBI Quick Guide (Internet version)",
      image: getGuideImage("vbi-internet.png"),
    },
  ];

  // Volvo 3P Quick Guides列表
  const volvo3PGuides = [
    "EDB Quick Guide",
    "KRS Quick Guide",
    "CVM Quick Guide",
    "AVP Quick Guide",
    "KAX Quick Guide",
    "CAE Homepage Quick Guide",
    "BPP Quick Guide",
    "SPC Quick Guide",
    "WebFRAME Quick Guide",
  ];

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className='download-quick-guides-container'>
      {/* VOLVO Header */}
      <div className='volvo-header'>
        <img src='/image/volvo-logo.png' alt='VOLVO' className='volvo-logo' />
      </div>

      {/* Main Content */}
      <div className='main-content'>
        {/* Back Link and Title */}
        <div className='header-section'>
          <button onClick={handleBack} className='back-link'>
            Back
          </button>
          <h2 className='page-title'>Download and Print Quick Guides</h2>
        </div>

        {/* Quick Guides Grid */}
        <div className='guides-grid'>
          {quickGuides.map((guide) => (
            <div key={guide.id} className='guide-item'>
              <div className='guide-image-container'>
                <img
                  src={guide.image}
                  alt={guide.name}
                  className='guide-thumbnail'
                  onError={(e) => {
                    // 如果图片加载失败，显示占位符
                    e.currentTarget.src = "/image/placeholder-guide.png";
                  }}
                />
              </div>
              <a
                href='#'
                className='guide-link'
                onClick={(e) => e.preventDefault()}
              >
                {guide.name}
              </a>
            </div>
          ))}
        </div>

        {/* Note Section */}
        <div className='note-section'>
          <p className='note-text'>
            (Note that the font Volvo Broad is removed from the Quick Guides
            because of problems)
          </p>
        </div>

        {/* Volvo 3P Quick Guides Section */}
        <div className='volvo-3p-section'>
          <h3 className='volvo-3p-title'>Volvo 3P Quick Guides</h3>
          <ul className='volvo-3p-list'>
            {volvo3PGuides.map((guide, index) => (
              <li key={index}>
                <a
                  href='#'
                  className='volvo-3p-link'
                  onClick={(e) => e.preventDefault()}
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
