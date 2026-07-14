import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserGuide.css";

interface HelpLink {
  label: string;
  path?: string;
  externalUrl?: string;
  disabled?: boolean;
  tooltip?: string;
}

const HELP_LINKS: HelpLink[] = [
  { label: "HDoc Quick Guide", path: "/menu/quick-guides" },
  { label: "List of document types.", path: "/menu/document-types" },
  { label: "Markets in Hdoc", path: "/menu/markets-in-hdoc" },
  {
    label: "HDoc - Market Document Setting",
    path: "/menu/market-document-setting",
  },
  { label: "Describation", externalUrl: "#description" },
];

// 用户指南组件
const UserGuide: React.FC = () => {
  const navigate = useNavigate();
  const [otherInfo, setOtherInfo] = useState(false);

  const handleLinkClick = (link: HelpLink) => {
    if (link.disabled) return;

    if (link.path) {
      navigate(link.path);
    } else if (link.externalUrl) {
      if (link.externalUrl.startsWith("#")) {
        // 锚点或内部操作，暂不实现
        return;
      }
      window.open(link.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="user-guide-page">
      <h1 className="user-guide-title">HDoc Help</h1>

      <div className="help-list">
        {HELP_LINKS.map((link) => (
          <div
            key={link.label}
            className={`help-link-item${link.disabled ? " disabled" : ""}`}
            onClick={() => handleLinkClick(link)}
            title={link.disabled ? link.tooltip : ""}
          >
            <span className="help-link-arrow">•</span>
            <span className="help-link-text">{link.label}</span>
          </div>
        ))}

        <div className="help-link-item checkbox-item">
          <label className="help-checkbox-label">
            <input
              type="checkbox"
              checked={otherInfo}
              onChange={(e) => setOtherInfo(e.target.checked)}
              className="help-checkbox"
            />
            <span className="help-link-text">Other Information</span>
          </label>
        </div>
      </div>

      {/* 额外信息 */}
      {otherInfo && (
        <div className="other-info-panel">
          <p>
            Additional reference materials and documentation can be found in the
            system documentation section.
          </p>
        </div>
      )}

      <div className="user-guide-footer">
        <p>
          For further assistance, please contact:{" "}
          <a href="mailto:support.tpi@123.com">support.tpi@123.com</a>
        </p>
      </div>
    </div>
  );
};

export default UserGuide;
