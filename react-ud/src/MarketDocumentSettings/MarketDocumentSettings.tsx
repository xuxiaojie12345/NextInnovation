import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './MarketDocumentSettings.css';

/**
 * MarketDocumentSettings组件 - 市场文档设置查询页面
 * 
 * @description 支持按Document type、Market、Setting、Business unit、User、Date等条件查询，跳转到MarketDocumentSettingsList画面显示检索结果
 * @props 无Props
 */
const MarketDocumentSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [documentType, setDocumentType] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [setting, setSetting] = useState<string>('');
  const [businessUnit, setBusinessUnit] = useState<string>('');
  const [user, setUser] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 获取当前登录用户ID
   * TODO: 从JWT token或session中解析userId
   */
  const getCurrentUserId = (): string => {
    return localStorage.getItem('userId') || 'test_user';
  };

  /**
   * 画面初期表示 - 接收前画面传递的参数
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    // 若迁移元画面是MarketDocumentSettingsList画面，初期画面项目显示的数据是从迁移元画面传递过来的参数
    if (location.state) {
      const state = location.state as any;
      if (state.documentType) setDocumentType(state.documentType);
      if (state.market) setMarket(state.market);
      if (state.setting) setSetting(state.setting);
      if (state.businessUnit) setBusinessUnit(state.businessUnit);
      if (state.user) setUser(state.user);
      if (state.date) setDate(state.date);
    }
    // 若迁移元画面是HDoc Help画面，入力框都是空白状态（默认值已为空）
  }, [location.state]);

  /**
   * Search按钮点击处理 - 跳转到MarketDocumentSettingsList画面
   * 对应设计书 3.2 Search按钮押下 和 4.1.2 Search按钮押下
   */
  const handleSearchClick = () => {
    // 将当前画面的UserID参数和Document type项目的值作为参数传递到下一个画面
    navigate('/MarketDocumentSettingsList', { 
      state: { 
        userId: getCurrentUserId(),
        doctype: documentType,
        market: market,
        setting: setting,
        businessUnit: businessUnit,
        user: user,
        date: date
      } 
    });
  };

  /**
   * Clear按钮点击处理 - 清空所有检索条件
   * 对应设计书 3.3 Clear按钮押下 和 4.1.3 Clear按钮押下
   */
  const handleClearClick = () => {
    setDocumentType('');
    setMarket('');
    setSetting('');
    setBusinessUnit('');
    setUser('');
    setDate('');
    setErrorMessage('');
  };

  /**
   * Back按钮点击处理 - 返回HDoc Help画面
   * 对应设计书 3.4 Back按钮押下
   */
  const handleBackClick = () => {
    navigate('/HdocHelp');
  };

  /**
   * Update Mode按钮点击处理 - 更新数据库中的数据
   * 对应设计书 3.5 Update Mode按钮押下 和 4.1.4 Update Mode按钮押下
   */
  const handleUpdateModeClick = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 构建请求参数 (对应设计书 5.1 UD20UpdateHdocDocumentListApi)
      const requestData = {
        doctype: documentType,
        registerUser: user || getCurrentUserId(),
        registerDatetime: date || new Date().toISOString(),
        registerProcess: 'MarketDocumentSettings', // 当前画面ID
        updateUser: getCurrentUserId(),
        updateDatetime: new Date().toISOString(),
        updateProcess: 'MarketDocumentSettings' // 当前画面ID
      };
      
      // API请求 - 更新文档list (对应设计书 5.1)
      const response = await axios.get('/api/UD20/update-hdoc-document-list', {
        params: requestData
      });
      
      if (response.data.success) {
        alert('数据更新成功');
      } else {
        setErrorMessage(response.data.message || '更新失败');
      }
    } catch (error: any) {
      console.error('更新失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mds-container'>
      <div className='mds-content'>
        {/* 标题区域 */}
        <h2 className='mds-title'>HDoc - Market Document Settings</h2>
        
        {/* 按钮区域 */}
        <div className='mds-button-row'>
          <button 
            className='mds-action-button' 
            onClick={handleSearchClick}
            disabled={isLoading}
          >
            Search
          </button>
          <button 
            className='mds-action-button' 
            onClick={handleClearClick}
            disabled={isLoading}
          >
            Clear
          </button>
          <button 
            className='mds-action-button' 
            onClick={handleBackClick}
            disabled={isLoading}
          >
            Back
          </button>
          <button 
            className='mds-action-button mds-update-button' 
            onClick={handleUpdateModeClick}
            disabled={isLoading}
          >
            Update Mode
          </button>
        </div>
        
        {/* 表单区域 */}
        <div className='mds-form-section'>
          {/* Document type行 */}
          <div className='mds-form-row'>
            <label className='mds-label'>Document type</label>
            <select className='mds-select-operator' disabled={isLoading}>
              <option value='='>=</option>
              <option value='!='>!=</option>
              <option value='>'>&gt;</option>
              <option value='<'>&lt;</option>
              <option value='&gt;='>&gt;=</option>
              <option value='&lt;='>&lt;=</option>
            </select>
            <input 
              type='text' 
              className='mds-input mds-input-document-type' 
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              maxLength={20}
              disabled={isLoading}
            />
          </div>
          
          {/* Market行 */}
          <div className='mds-form-row'>
            <label className='mds-label'>Market</label>
            <select className='mds-select-operator' disabled={isLoading}>
              <option value='='>=</option>
              <option value='!='>!=</option>
            </select>
            <input 
              type='text' 
              className='mds-input mds-input-market' 
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          {/* Setting行 */}
          <div className='mds-form-row'>
            <label className='mds-label'>Setting</label>
            <select className='mds-select-operator' disabled={isLoading}>
              <option value='='>=</option>
              <option value='!='>!=</option>
            </select>
            <select 
              className='mds-select mds-select-setting'
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              disabled={isLoading}
            >
              <option value=''>请选择</option>
              <option value='NO_VDA_CACHE'>NO_VDA_CACHE</option>
              <option value='VDA_CACHE'>VDA_CACHE</option>
            </select>
          </div>
          
          {/* Business unit行 */}
          <div className='mds-form-row'>
            <label className='mds-label'>Bussines unit</label>
            <select className='mds-select-operator' disabled={isLoading}>
              <option value='='>=</option>
              <option value='!='>!=</option>
            </select>
            <select 
              className='mds-select mds-select-business-unit'
              value={businessUnit}
              onChange={(e) => setBusinessUnit(e.target.value)}
              disabled={isLoading}
            >
              <option value=''>请选择</option>
              <option value='VTC'>VTC</option>
              <option value='BU'>BU</option>
            </select>
          </div>
          
          {/* User行 */}
          <div className='mds-form-row'>
            <label className='mds-label'>User</label>
            <select className='mds-select-operator' disabled={isLoading}>
              <option value='='>=</option>
              <option value='!='>!=</option>
            </select>
            <input 
              type='text' 
              className='mds-input mds-input-user' 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              maxLength={16}
              disabled={isLoading}
            />
          </div>
          
          {/* Date行 */}
          <div className='mds-form-row'>
            <label className='mds-label'>Date</label>
            <select className='mds-select-operator' disabled={isLoading}>
              <option value='='>=</option>
              <option value='!='>!=</option>
              <option value='>'>&gt;</option>
              <option value='<'>&lt;</option>
              <option value='&gt;='>&gt;=</option>
              <option value='&lt;='>&lt;=</option>
            </select>
            <input 
              type='text' 
              className='mds-input mds-input-date' 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='mds-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='mds-loading'>
            加载中...
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDocumentSettings;
