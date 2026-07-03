import React from "react";
import { useNavigate } from "react-router-dom";
import "./UD24.css";

const UD24 = React.memo(() => {
  const navigate = useNavigate();

  const links = [
    { label: "HDoc Users Manual", path: "/docs/manual" },
    { label: "HDoc Users Manual (PDF file)", path: "/docs/manual-pdf" },
    { label: "HDoc Quick Guide", path: "/UD23" },
    { label: "Active directory login information", path: "/docs/ad-login" },
    { label: "Order CoC paper", path: "/docs/order-coc" },
  ];

  const handleNav = (path: string) => {
    try {
      navigate(path);
    } catch {
      // 路由跳转失败时静默处理
    }
  };

  return (
    <div className="ud24-container">
      <header className="ud24-page-header">
        <div className="ud24-page-header-logo"></div>
      </header>
      <main className="ud24-main">
        <div className="ud24-card">
          <h1 className="ud24-page-title">HDoc Help</h1>

          {/* Links */}
          <ul className="ud24-links">
            {links.map((link) => (
              <li key={link.path}>
                <button
                  className="ud24-link"
                  onClick={() => handleNav(link.path)}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Basic Introduction */}
          <div className="ud24-section">
            <h2>Basic Introduction</h2>
            <p>To generate a document do the following:</p>
            <ol className="ud24-ol">
              <li>Enter chassis series and chassis</li>
              <li>Select document type</li>
              <li>
                Select language. Note always German for Austria Noise document.
              </li>
              <li>Enter other information like document number etc.</li>
            </ol>
          </div>

          {/* Document Types */}
          <div className="ud24-section">
            <h2>Document Types</h2>
            <p>
              HDoc can generate a large number of different document types, for
              example VIN Plate, CEMT, Austria Noise etc.
            </p>
            <button className="ud24-link" onClick={() => handleNav("/UD22")}>
              List of document types.
            </button>
          </div>

          {/* Available Variables */}
          <div className="ud24-section">
            <h2>Available Variables</h2>
            <p>There are 5 different kind of variables in HDoc:</p>
            <ol className="ud24-ol">
              <li>Variables like VIN number komming directly from VDA.</li>
              <li>Input on the HDoc main form, like address filed etc.</li>
              <li>Calculated values in HDoc like weight</li>
              <li>Special variables for date etc.</li>
              <li>User defined variables, in the HDoc database.</li>
            </ol>
          </div>

          {/* Markets in Hdoc */}
          <div className="ud24-section">
            <h2>Markets in Hdoc</h2>
            <button className="ud24-link" onClick={() => handleNav("/UD21")}>
              Markets in Hdoc
            </button>
          </div>

          {/* HDoc - Market Document Setting */}
          <div className="ud24-section">
            <h2>HDoc - Market Document Setting</h2>
            <button className="ud24-link" onClick={() => handleNav("/UD20-1")}>
              HDoc - Market Document Setting
            </button>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD24;
