import React from "react";
import { useNavigate } from "react-router-dom";
import "./UD23.css";

interface GuideItem {
  label: string;
  file: string;
  version?: string;
}

const ACTIVE_GUIDES: GuideItem[] = [
  { label: "WIS Quick Guide", file: "picture1" },
  { label: "PERF Quick Guide", file: "picture2" },
  { label: "W8 Quick Guide", file: "picture3" },
  { label: "HDoc Quick Guide", file: "picture4" },
  { label: "EDB Quick Guide", file: "picture5" },
  { label: "COS Quick Guide", file: "picture6" },
  { label: "VBI Quick Guide", file: "picture7", version: "(Intranet version)" },
  { label: "VBI Quick Guide", file: "picture8", version: "(Internet version)" },
];

const DISABLED_GUIDES = [
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

const UD23 = React.memo(() => {
  const navigate = useNavigate();

  const handleDownload = (file: string, label: string) => {
    // 在实际环境中，这里会触发文件下载
    // 例如通过创建一个隐藏的 <a> 标签并点击
    const link = document.createElement("a");
    link.href = `/files/quick-guides/${file}.png`;
    link.download = `${label}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBack = () => {
    navigate("/UD24");
  };

  return (
    <div className="ud23-container">
      <header className="ud23-header">
        <div className="ud23-header-logo">VOLVO</div>
      </header>
      <main className="ud23-main">
        <div className="ud23-card">
          {/* Back link */}
          <button className="ud23-back" onClick={handleBack}>
            &laquo; Back
          </button>

          <h1 className="ud23-page-title">Download and Print Quick Guides</h1>

          {/* Active guides grid */}
          <div className="ud23-guide-grid">
            {ACTIVE_GUIDES.map((guide) => (
              <div className="ud23-guide-item" key={guide.file}>
                <div className="ud23-thumb-placeholder">{guide.file}</div>
                <button
                  className="ud23-guide-link"
                  onClick={() => handleDownload(guide.file, guide.label)}
                  title={`Download ${guide.label}`}
                >
                  {guide.label}
                </button>
                {guide.version && (
                  <span className="ud23-version">{guide.version}</span>
                )}
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="ud23-note">
            (Note that the font Volvo Broad is removed from the Quick Guides
            because of problems)
          </p>

          {/* Disabled guides */}
          <h2 className="ud23-subtitle">Volvo 3P Quick Guides</h2>
          <ul className="ud23-disabled-list">
            {DISABLED_GUIDES.map((label) => (
              <li key={label}>
                <button className="ud23-3p-link">{label}</button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
});

export default UD23;
