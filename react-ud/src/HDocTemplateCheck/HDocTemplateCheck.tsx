import React from "react";
import "../common/css/common.css";
import "./HDocTemplateCheck.css";

const HDocTemplateCheck: React.FC = () => {
  const handleCheck = () => {
    alert("机能未实装");
  };

  return (
    <div className="htc-container panel panel-w600">
      <div className="htc-header panel-header">
        <h1>HDoc Template Check</h1>
      </div>

      <div className="htc-form">
        <table className="htc-form-table">
          <tbody>
            <tr>
              <td className="htc-label">Template File：</td>
              <td className="htc-value">
                <input type="file" />
              </td>
            </tr>
            <tr className="btn-tr">
              <td className="htc-value">
                <button className="btn" onClick={handleCheck}>
                  Check
                </button>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HDocTemplateCheck;
