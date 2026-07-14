import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD20_MarketDocumentSettings.css';

/**
 * UD20-1_MarketDocumentSettings 市场文档设置更新页面组件
 *
 * 功能说明：
 * - 维护HDOC_DOCUMENT_LIST表中的文档设置信息
 * - 提供Document type、Bussines unit(BU固定)、User、Date字段
 * - Search按钮跳转到UD20选择记录，返回后回填数据
 * - Update Mode按钮更新数据库记录
 *
 * @component
 * @returns {JSX.Element} 市场文档设置页面元素
 */
const UD20_MarketDocumentSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  const [documentType, setDocumentType] = useState<string>('');  // Document type（必填）
  const [businessUnit, setBusinessUnit] = useState<string>('BU');  // Bussines unit（默认BU）
  const [user, setUser] = useState<string>('');                   // User
  const [date, setDate] = useState<string>('');                   // Date
  const [message, setMessage] = useState<string>('');             // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState<boolean>(false);    // 加载状态

  // 下拉框比较运算符状态
  const [compareDocType, setCompareDocType] = useState<string>('=');
  const [compareBU, setCompareBU] = useState<string>('=');
  const [compareUser, setCompareUser] = useState<string>('=');
  const [compareDate, setCompareDate] = useState<string>('=');
  const [market, setMarket] = useState<string>('');                   // Market
  const [compareMarket, setCompareMarket] = useState<string>('=');    // Market运算符
  const [setting, setSetting] = useState<string>('');                 // Setting
  const [compareSetting, setCompareSetting] = useState<string>('=');  // Setting运算符

  // ==================== 接收UD20返回的数据 ====================
  useEffect(() => {
    const state = location.state as any;
    if (state?.backFormData) {
      // 从UD20 List点Back返回，恢复之前输入的值和运算符
      const back = state.backFormData;
      setDocumentType(back.documentType || '');
      setUser(back.user || '');
      setDate(back.date || '');
      setCompareDocType(back.compareDocType || '=');
      setCompareBU(back.compareBU || '=');
      setCompareUser(back.compareUser || '=');
      setCompareDate(back.compareDate || '=');
      setMarket(back.market || '');
      setCompareMarket(back.compareMarket || '=');
      setSetting(back.setting || '');
      setCompareSetting(back.compareSetting || '=');
      window.history.replaceState({}, document.title);
    } else if (state?.selectedRecord) {
      // 从UD20 Select按钮返回，回填选中记录
      const record = state.selectedRecord;
      setDocumentType(record.documentType || '');
      setUser(record.registerUser || '');
      setDate(record.registerDateTime || '');
      // 清除state防止刷新重复回填
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Search 按钮点击
   * 处理流程：
   * 1. 保存当前输入条件
   * 2. 跳转到UD20画面供用户选择记录
   */
  const handleSearch = useCallback(() => {
    const params: Record<string, string> = {};
    if (documentType.trim()) {
      params.doctype = documentType.trim();
      params.doctypeOp = compareDocType;
    }
    if (user.trim()) {
      params.registerUser = user.trim();
      params.registerUserOp = compareUser;
    }
    if (date.trim()) {
      params.registerDatetime = date.trim();
      params.registerDatetimeOp = compareDate;
    }
    if (market.trim()) {
      params.market = market.trim();
      params.marketOp = compareMarket;
    }
    if (setting.trim()) {
      params.setting = setting.trim();
      params.settingOp = compareSetting;
    }

    // 保存当前输入，用于从UD20返回时恢复
    navigate('/UD20', {
      state: {
        searchParams: params,
        formData: { documentType, user, date, market, setting, compareDocType, compareBU, compareUser, compareDate, compareMarket, compareSetting },
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, documentType, user, date, market, setting, compareDocType, compareUser, compareDate, compareMarket, compareSetting]);

  /**
   * 处理 Clear 按钮点击
   */
  const handleClear = useCallback(() => {
    setDocumentType('');
    setUser('');
    setDate('');
    setCompareDocType('=');
    setCompareBU('=');
    setCompareUser('=');
    setCompareDate('=');
    setMarket('');
    setCompareMarket('=');
    setSetting('');
    setCompareSetting('=');
    setMessage('');
  }, []);

  /**
   * 处理 Back 按钮点击
   * 对应设计书 3.1.3 - 返回前页面
   */
  const handleBack = useCallback(() => {
    navigate('/UD24');
  }, [navigate]);

  /**
   * 处理 Update Mode 按钮点击更新HDOC_DOCUMENT_LIST表
   *
   * 处理流程：
   * 1. 前端校验：Document type不能为空
   * 2. 查询Document type是否存在
   * 3. 调用API更新
   */
  const handleUpdateMode = useCallback(async () => {
    // 对应设计书 3.2 校验详细规格表 No.1
    if (!documentType.trim()) {
      setMessage('Document type不能为空');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 对应设计书 4.1 - POST /api/ud201/updatedocument
      const registerUser = localStorage.getItem('userID') || 'SYSTEM';
      const response = await apiClient.post('/api/ud201/updatedocument', {
        doctype: documentType.trim(),
        user: user.trim(),
        date: date.trim(),
        registerUser,
      });

      if (response.data?.code === 200) {
        // 成功
        setMessage('更新成功');
        setMessageType('success');
      } else if (response.data?.code === 404) {
        // 对应设计书 3.2 校验详细规格表 No.2 - Document type不存在
        setMessage('Document type does not exists. Please enter the correct content.');
        setMessageType('error');
      } else {
        setMessage(response.data?.msg || '更新失败');
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('更新失败:', error);
      if (error.response?.status === 404) {
        setMessage('Document type does not exists. Please enter the correct content.');
      } else {
        setMessage('更新失败');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, [documentType, user, date]);

  // ==================== 渲染 ====================
  return (
    <div className="ud201-container">
      {/* 页面标题 */}
      <div className="ud201-title">HDoc - Market Document Settings</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud201-message ${messageType === 'success' ? 'ud201-message-success' : 'ud201-message-error'}`}>
          {message}
        </div>
      )}

      {/* 按钮区域 */}
        <div className="ud201-button-row">
        <button className="ud201-btn" onClick={handleSearch} disabled={isLoading}>Search</button>
        <button className="ud201-btn" onClick={handleClear} disabled={isLoading}>Clear</button>
        <button className="ud201-btn" onClick={handleBack} disabled={isLoading}>Back</button>
        <button className="ud201-btn" onClick={handleUpdateMode} disabled={isLoading}>
          Update Mode
        </button>
      </div>

      {/* 表单区域 */}
      <div className="ud201-content">
        {/* Document type */}
        <div className="ud201-field-row">
          <span className="ud201-label">Document type</span>
          <select className="ud201-compare-select" value={compareDocType} onChange={(e) => setCompareDocType(e.target.value)}>
            <option value="=">=</option>
            <option value="!=">!=</option>
          </select>
          <input
            className="ud201-input"
            type="text"
            value={documentType}
            onChange={(e) => {
              if (e.target.value.length <= 20) {
                setDocumentType(e.target.value);
                if (message) setMessage('');
              }
            }}
            placeholder=""
            maxLength={20}
          />
        </div>

        {/* Market */}
        <div className="ud201-field-row">
          <span className="ud201-label">Market</span>
          <select className="ud201-compare-select" value={compareMarket} onChange={(e) => setCompareMarket(e.target.value)}>
            <option value="=">=</option>
            <option value="!=">!=</option>
          </select>
          <input
            className="ud201-input"
            type="text"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            placeholder=""
          />
        </div>

        {/* Setting */}
        <div className="ud201-field-row">
          <span className="ud201-label">Setting</span>
          <select className="ud201-compare-select" value={compareSetting} onChange={(e) => setCompareSetting(e.target.value)}>
            <option value="=">=</option>
            <option value="!=">!=</option>
          </select>
          <select
            className="ud201-input"
            value={setting}
            onChange={(e) => setSetting(e.target.value)}
          >
            <option value=""></option>
          </select>
        </div>

        {/* Bussines unit */}
        <div className="ud201-field-row">
          <span className="ud201-label">Bussines unit</span>
          <select className="ud201-compare-select" value={compareBU} onChange={(e) => setCompareBU(e.target.value)}>
            <option value="=">=</option>
            <option value="!=">!=</option>
          </select>
          <input
            className="ud201-input"
            type="text"
            value={businessUnit}
            onChange={(e) => setBusinessUnit(e.target.value)}
          />
        </div>

        {/* User */}
        <div className="ud201-field-row">
          <span className="ud201-label">User</span>
          <select className="ud201-compare-select" value={compareUser} onChange={(e) => setCompareUser(e.target.value)}>
            <option value="=">=</option>
            <option value="!=">!=</option>
          </select>
          <input
            className="ud201-input"
            type="text"
            value={user}
            onChange={(e) => {
              if (e.target.value.length <= 16) {
                setUser(e.target.value);
              }
            }}
            placeholder=""
            maxLength={16}
          />
        </div>

        {/* Date */}
        <div className="ud201-field-row">
          <span className="ud201-label">Date</span>
          <select className="ud201-compare-select" value={compareDate} onChange={(e) => setCompareDate(e.target.value)}>
            <option value="=">=</option>
            <option value="lt">&lt;</option>
            <option value="gt">&gt;</option>
          </select>
          <input
            className="ud201-input"
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder=""
          />
        </div>
      </div>
    </div>
  );
};

export default UD20_MarketDocumentSettings;
