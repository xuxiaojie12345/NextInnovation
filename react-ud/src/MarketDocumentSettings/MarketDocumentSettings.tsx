// MarketDocumentSettings.tsx - UD20模块主画面
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MarketDocumentSettings.css";

const MarketDocumentSettings = () => {
  const navigate = useNavigate();

  const [documentType, setDocumentType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 点击Search按钮：跳转到Market Document Settings List画面
  const handleSearch = () => {
    if (!documentType.trim()) {
      setErrorMessage("Please enter a document type.");
      return;
    }

    // 跳转到列表页面，传递搜索条件
    navigate("/market-document-settings-list", {
      state: {
        searchCriteria: {
          documentType: documentType.trim(),
        },
      },
    });
  };

  // 点击Clear按钮：清空输入框
  const handleClear = () => {
    setDocumentType("");
    setErrorMessage("");
  };

  // 点击Back按钮：返回前画面
  const handleBack = () => {
    navigate(-1);
  };

  // 输入框变化处理
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDocumentType(value);

    // 清除错误信息
    if (value.trim()) {
      setErrorMessage("");
    }
  };

  return (
    <div className='mds-container'>
      {/* 标题 */}
      <h1 className='mds-title'>HDoc - Market Document Settings</h1>

      {/* 错误消息 */}
      {errorMessage && <div className='mds-error-message'>{errorMessage}</div>}

      {/* 边框容器 */}
      <div className='mds-border-box'>
        {/* 表单区域 */}
        <div className='mds-form-section'>
          <div className='mds-form-row'>
            <label className='mds-label'>Document type:</label>
            <input
              type='text'
              id='documentType'
              name='documentType'
              value={documentType}
              onChange={handleDocumentTypeChange}
              placeholder='Enter document type'
              maxLength={20}
              className='mds-input-field'
            />
          </div>
        </div>

        {/* 按钮区域 */}
        <div className='mds-button-bar'>
          <button className='mds-btn' onClick={handleSearch}>
            Search
          </button>
          <button className='mds-btn' onClick={handleClear}>
            Clear
          </button>
          <button className='mds-btn' onClick={handleBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettings;
