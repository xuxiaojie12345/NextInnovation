import React, { useEffect, useCallback } from "react";
import "./UD24.css";

interface UD24Props {
  visible: boolean;
  onClose: () => void;
}

const UD24: React.FC<UD24Props> = ({ visible, onClose }) => {
  // ESCキーで閉じる
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [visible, handleKeyDown]);

  if (!visible) return null;

  return (
    <div className="ud24-overlay" onClick={onClose}>
      <div className="ud24-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ud24-header">
          <h2 className="ud24-title">HDoc Help</h2>
        </div>
        <div className="ud24-body">
          <p className="ud24-message">UD24画面未作成</p>
        </div>
        <div className="ud24-footer">
          <button className="ud24-close-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default UD24;
