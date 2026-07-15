import React from "react";
import "./HdocTemplateCheck.css";

const HdocTemplateCheck: React.FC = () => {
  return (
    <div className='htc-container'>
      {/* HDoc Template Check区域 */}
      <div className='htc-section'>
        <h2 className='htc-section-title'>HDoc Template Check</h2>

        <div className='htc-form-group'>
          <label className='htc-label'>Template File:</label>
          <input
            id='template-file-input'
            type='file'
            className='htc-file-input'
            accept='.rtf'
          />
        </div>

        <div className='htc-button-row'>
          <button className='htc-btn'>Check</button>
        </div>
      </div>
    </div>
  );
};

export default HdocTemplateCheck;
