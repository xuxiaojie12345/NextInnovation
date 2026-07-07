import React, { useState, useEffect, useRef } from 'react';
import './UD03_GenerateHomologationDocument.css';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/config';

/**
 * Generate Homologation Document 页面组件
 * 
 * 功能说明：
 * - 用户输入 Chassis series、Chassis no 和 Document type
 * - 提交后跳转到 UD04 Generate document 画面
 * - 支持 Reset 清空输入和 Help 跳转帮助页面
 * - 默认显示上次输入的条件（从localStorage读取）
 * 
 * @component
 * @returns {JSX.Element} Generate Homologation Document页面元素
 */
const UD03_GenerateHomologationDocument: React.FC = () => {
  const navigate = useNavigate();

  // ==================== 状态管理 ====================
  // 对应设计书 6.1 状态管理
  const [chassisSeries, setChassisSeries] = useState<string>('');       // Chassis series输入值
  const [chassisNo, setChassisNo] = useState<string>('');               // Chassis no输入值
  const [documentType, setDocumentType] = useState<string>('');         // Document type选择值
  const [documentTypeOptions, setDocumentTypeOptions] = useState<string[]>([]); // Document type选项列表
  const [message, setMessage] = useState<string>('');                   // 错误消息
  const [isLoading, setIsLoading] = useState<boolean>(false);           // 加载状态标识

  // ==================== Ref 定义 ====================
  const chassisSeriesRef = useRef<HTMLInputElement>(null);
  const chassisNoRef = useRef<HTMLInputElement>(null);
  const documentTypeRef = useRef<HTMLSelectElement>(null);

  // ==================== 常量定义 ====================
  // 输入校验正则表达式
  const CHASSIS_SERIES_REGEX = /^[a-zA-Z]*$/;    // 半角英字
  const CHASSIS_NO_REGEX = /^[0-9]*$/;           // 半角数字
  
  // 输入长度限制
  const MAX_CHASSIS_SERIES_LENGTH = 5;
  const MAX_CHASSIS_NO_LENGTH = 10;

  // ==================== 生命周期 ====================
  
  /**
   * 组件加载时初始化
   * 1. 从localStorage读取上次输入的条件
   * 2. 调用API获取Document type列表
   */
  useEffect(() => {
    // 从localStorage读取上次输入的条件
    const lastChassisSeries = localStorage.getItem('lastChassisSeries');
    const lastChassisNo = localStorage.getItem('lastChassisNo');
    const lastDocumentType = localStorage.getItem('lastDocumentType');
    
    if (lastChassisSeries) setChassisSeries(lastChassisSeries);
    if (lastChassisNo) setChassisNo(lastChassisNo);
    if (lastDocumentType) setDocumentType(lastDocumentType);
    
    // 调用API获取Document type列表
    fetchDocumentTypeList();
  }, []);

  // ==================== API调用 ====================

  /**
   * 获取Document type列表
   * 对应设计书 4.1 UD03SelectHdocdocumentlistApi
   * Method: GET, Endpoint: /api/ud03/getHdocDocumentList
   */
  const fetchDocumentTypeList = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/ud03/gethdocdocumentlist');
      
      if (response.data.code === 200 && response.data.data) {
        // data字段直接是字符串数组，不需要再访问doctype属性
        setDocumentTypeOptions(response.data.data);
      } else {
        setMessage('We can not get the data. Please try again.');
      }
    } catch (error: any) {
      console.error('获取Document type列表失败:', error);
      setMessage('System error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Chassis series 输入变化
   * 限制：只允许半角英字，最大长度5字符
   * 用户体验优化：用户重新输入时清空错误提示
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handleChassisSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：只允许半角英字，且不超过最大长度
    if (CHASSIS_SERIES_REGEX.test(val) && val.length <= MAX_CHASSIS_SERIES_LENGTH) {
      setChassisSeries(val);
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) setMessage('');
    }
  };

  /**
   * 处理 Chassis no 输入变化
   * 限制：只允许半角数字，最大长度10字符
   * 用户体验优化：用户重新输入时清空错误提示
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handleChassisNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：只允许半角数字，且不超过最大长度
    if (CHASSIS_NO_REGEX.test(val) && val.length <= MAX_CHASSIS_NO_LENGTH) {
      setChassisNo(val);
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) setMessage('');
    }
  };

  /**
   * 处理 Document type 选择变化
   * 
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 选择事件对象
   */
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
    // 用户体验优化：用户重新选择时清空错误提示
    if (message) setMessage('');
  };

  /**
   * 点击 Submit 按钮提交流程
   * 对应设计书 3.1.2 Submit 按钮处理流程
   * 
   * 处理流程：
   * 1. 前置处理：获取输入值并去除首尾空格
   * 2. 空值校验（前端校验）
   * 3. 结果处理：校验通过则缓存数据并跳转，校验失败显示错误
   */
  const handleSubmit = () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedChassisSeries = chassisSeries.trim();
    const trimmedChassisNo = chassisNo.trim();
    const trimmedDocumentType = documentType.trim();

    // 2. 空値校验（前端校验）
    // 对应设计书 3.2 校验詳細規格表 No.1
    if (!trimmedChassisSeries) {
      setMessage('Chassis series is required.');
      chassisSeriesRef.current?.focus();
      return;
    }

    // 对应設計書 3.2 校驗詳細規格表 No.2
    if (!trimmedChassisNo) {
      setMessage('Chassis no is required.');
      chassisNoRef.current?.focus();
      return;
    }

    // 对应設計書 3.2 校驗詳細規格表 No.3
    if (!trimmedDocumentType) {
      setMessage('Document type is required.');
      documentTypeRef.current?.focus();
      return;
    }

    // 3. 結果処理：校驗通過
    // キャッシュ入力の検索条件をlocalStorage
    localStorage.setItem('lastChassisSeries', trimmedChassisSeries);
    localStorage.setItem('lastChassisNo', trimmedChassisNo);
    localStorage.setItem('lastDocumentType', trimmedDocumentType);
    
    // クリアメッセージ提示
    setMessage('');
    
    // 画面遷移：UD04 Generate document 画面へ遷移し、パラメータを渡す
    navigate('/UD04', {
      state: {
        chassisSeries: trimmedChassisSeries,
        chassisNo: trimmedChassisNo,
        documentType: trimmedDocumentType,
      },
    });
  };

  /**
   * 点击 Reset 按钮重置流程
   * 对应设计书 3.1.3 Reset 按钮处理流程
   */
  const handleReset = () => {
    // 全ての入力フィールドをクリア
    setChassisSeries('');
    setChassisNo('');
    setDocumentType('');
    
    // エラーメッセージをクリア
    setMessage('');
  };

  /**
   * 点击 Help 按钮跳转帮助页面
   * 对应设计书 3.1.4 Help 按钮处理流程
   */
  const handleHelp = () => {
    // 画面遷移：UD24 HDoc Help 画面へ遷移
    navigate('/UD24');
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud03-container'>
      <div className='ud03-content'>
        {/* ページタイトル */}
        <h1 className='page-title'>HDoc - Generate Homologation Document</h1>

        {/* エラーメッセージエリア */}
        <div className='error-message-area'>
          {message}
        </div>

        {/* フォームエリア */}
        <div className='form-section'>
          {/* Chassis series 入力ボックス */}
          {/* 对应设计书 2.1 コントロール属性表 No.1 */}
          <div className='form-group'>
            <label htmlFor='chassisSeries'>Chassis series <span className='required'>*</span></label>
            <input
              id='chassisSeries'
              type='text'
              ref={chassisSeriesRef}
              value={chassisSeries}
              onChange={handleChassisSeriesChange}
              placeholder=''
              disabled={isLoading}
              maxLength={MAX_CHASSIS_SERIES_LENGTH}
              className='form-input'
            />
          </div>

          {/* Chassis no 入力ボックス */}
          {/* 对应設計書 2.1 コントロール属性表 No.2 */}
          <div className='form-group'>
            <label htmlFor='chassisNo'>Chassis no <span className='required'>*</span></label>
            <input
              id='chassisNo'
              type='text'
              ref={chassisNoRef}
              value={chassisNo}
              onChange={handleChassisNoChange}
              placeholder=''
              disabled={isLoading}
              maxLength={MAX_CHASSIS_NO_LENGTH}
              className='form-input'
            />
          </div>

          {/* Document type ドロップダウン */}
          {/* 对应設計書 2.1 コントロール属性表 No.3 */}
          <div className='form-group'>
            <label htmlFor='documentType'>Document type <span className='required'>*</span></label>
            <select
              id='documentType'
              ref={documentTypeRef}
              value={documentType}
              onChange={handleDocumentTypeChange}
              disabled={isLoading}
              className='form-select'
            >
              <option value=''>请选择Document type</option>
              {documentTypeOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* ボタングループ */}
        <div className='button-group'>
          {/* Submit ボタン */}
          {/* 对应設計書 2.1 コントロール属性表 No.4 */}
          <button 
            type='button' 
            className='btn btn-submit' 
            onClick={handleSubmit}
            disabled={isLoading}                      // ロード中はボタンを無効化
          >
            Submit
          </button>

          {/* Reset ボタン */}
          {/* 对应設計書 2.1 コントロール属性表 No.5 */}
          <button 
            type='button' 
            className='btn btn-reset' 
            onClick={handleReset}
            disabled={isLoading}                      // ロード中はボタンを無効化
          >
            Reset
          </button>

          {/* Help ボタン */}
          {/* 对应設計書 2.1 コントロール属性表 No.6 */}
          <button 
            type='button' 
            className='btn btn-help' 
            onClick={handleHelp}
            disabled={isLoading}                      // ロード中はボタンを無効化
          >
            Help
          </button>
        </div>

        {/* フッターサポート情報 */}
        <div className='support-info'>
          HDoc support: support.tpi@document.com
        </div>
      </div>
    </div>
  );
};

export default UD03_GenerateHomologationDocument;
