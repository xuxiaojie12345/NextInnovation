import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UD04_GenerateDocument.css';
import apiClient from '../api/config';

/**
 * Generate Document 页面组件接口定义
 * 
 * 状态管理接口，包含所有需要显示的数据字段
 */
interface GenerateDocumentState {
  chassisNo: string;                    // Chassis no（从前画面传入）
  ordernumber: string;                  // 订单号
  buildWeek: string;                    // 构建周
  specWeek: string;                     // 规格周
  market: string;                       // 市场
  masterMarket: string;                 // 主市场（固定显示"-EU"）
  sNoteNo: string;                      // S-Note编号
  sNoteMessage: string;                 // S-Note消息
  loadIndex: string;                    // 负载指数
  act: string;                          // AD-Change状态（Y/N）
  newval: string;                       // 新值
  variable: string;                     // 变量
  usingTemplate: string;                // 使用的模板（固定值）
  replacingParameters: string;          // 替换参数
  date: string;                         // 日期
  hdocVersion: string;                  // HDoc版本（固定显示"4.2.1"）
  message: string;                      // 错误消息
  isLoading: boolean;                   // 加载状态
}

/**
 * Generate Document 页面组件
 * 
 * 功能说明：
 * - 根据前画面传入的Chassis series和Chassis no，展示VIN Plate生成的结果信息
 * - 显示车辆认证文档的生成结果，包括订单信息、构建信息、市场信息等
 * - 支持跳转到相关功能页面（Modify Document、Vehicle Specification等）
 * - 关键信息突出显示，条件性显示S-Note消息和Modify Doc链接
 * 
 * @component
 * @returns {JSX.Element} Generate Document页面元素
 */
const UD04_GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  // 对应设计文档 6.1 状态管理
  const [state, setState] = useState<GenerateDocumentState>({
    chassisNo: '',
    ordernumber: '',
    buildWeek: '',
    specWeek: '',
    market: '',
    masterMarket: '-EU',                // 固定显示"-EU"
    sNoteNo: '',
    sNoteMessage: '',
    loadIndex: '',
    act: '',
    newval: '',
    variable: '',
    usingTemplate: '_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf',  // 固定显示
    replacingParameters: '',
    date: '',
    hdocVersion: '4.2.1',              // 固定显示"4.2.1"
    message: '',
    isLoading: false,
  });

  // ==================== 生命周期 ====================

  /**
   * 组件加载时初始化
   * 1. 从路由参数获取Chassis series和Chassis no
   * 2. 调用API获取文档生成结果数据
   */
  useEffect(() => {
    // 从路由state获取前画面传来的参数
    const stateData = location.state as any;
    if (stateData && stateData.chassisSeries && stateData.chassisNo) {
      // 构造Chassis no显示格式："Chassis series Chassis no"
      const chassisNoDisplay = `${stateData.chassisSeries} ${stateData.chassisNo}`;
      
      // 调用API获取数据
      fetchDocumentData(stateData.chassisSeries, stateData.chassisNo, chassisNoDisplay);
    } else {
      // 如果没有参数，显示错误消息
      setState(prev => ({
        ...prev,
        message: '未找到相关数据',
      }));
    }
  }, [location.state]);

  // ==================== API调用 ====================

  /**
   * 获取文档生成结果数据
   * 对应设计文档 4.1 UD04SelectGeneratedocumentApi
   * Method: GET, Endpoint: /api/ud04/getdocumentdata
   * 
   * @param {string} chassisSerie - Chassis series
   * @param {string} chassisNo - Chassis no
   * @param {string} chassisNoDisplay - 显示的Chassis no格式
   */
  const fetchDocumentData = async (chassisSerie: string, chassisNo: string, chassisNoDisplay: string) => {
    setState(prev => ({ ...prev, isLoading: true, message: '' }));
    
    try {
      // 使用URL参数传递（GET请求）
      const response = await apiClient.get('/api/ud04/getdocumentdata', {
        params: {
          chassisSerie: chassisSerie,
          chassisNo: chassisNo,
        },
      });
      
      if (response.data.code === 200 && response.data.data) {
        const data = response.data.data;
        
        // 解析返回数据并填充各个字段
        setState(prev => ({
          ...prev,
          chassisNo: chassisNoDisplay,
          ordernumber: data.ordernumber || '',
          buildWeek: data.build || '',
          specWeek: data.spec || '',
          market: data.countryOfOperation || '',
          loadIndex: data.loadIndex || '',
          act: data.act || '',
          newval: data.newval || '',
          variable: data.variable || '',
          // 条件处理：根据ACT值决定是否显示Modify Doc Link
          // S-Note NO 应该来自数据库字段 CUSTOMER_ADAP
          sNoteNo: data.customerAdap || '',
          sNoteMessage: data.customerAdap ? 'The S-Notes above can affect homologation documents.' : '',
          // 设置replacingParameters
          replacingParameters: data.variable ? `AD Change. Modifying:${data.variable}` : '',
          // 设置服务器日期
          date: new Date().toLocaleString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
          }).replace(/\//g, '-'),
          isLoading: false,
        }));
      } else {
        // API返回失败
        setState(prev => ({
          ...prev,
          message: 'We can not get the data. Please try again.',
          isLoading: false,
        }));
      }
    } catch (error: any) {
      console.error('获取文档数据失败:', error);
      
      // 错误处理：根据错误类型显示不同的消息
      let errorMessage = 'System error. Please try again later.';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = '未授权，请重新登录';
            break;
          case 404:
            errorMessage = '请求的资源不存在';
            break;
          case 500:
            errorMessage = '服务器内部错误';
            break;
          default:
            errorMessage = `请求失败: ${error.response.status}`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your network.';
      }
      
      setState(prev => ({
        ...prev,
        message: errorMessage,
        isLoading: false,
      }));
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 点击 Modify Doc Link 跳转流程
   * 对应设计文档 3.1.2 Modify Doc Link 点击流程
   * 
   * 处理流程：
   * 1. 获取Chassis series、Chassis no和Market
   * 2. 将参数传递给下个画面
   * 3. 画面迁移：跳转到UD05 Modify Document画面
   */
  const handleModifyDocClick = () => {
    // 从路由state获取参数
    const stateData = location.state as any;
    if (stateData) {
      // 跳转到UD05 Modify Document画面，传递必要参数
      navigate('/UD05', {
        state: {
          chassisSeries: stateData.chassisSeries,
          chassisNo: stateData.chassisNo,
          market: state.market,
        },
      });
    }
  };

  /**
   * 点击 Chassis no Link 跳转流程
   * 对应设计文档 3.1.3 Chassis no Link 点击流程
   * 
   * 处理流程：
   * 1. 获取Chassis no
   * 2. 将Chassis no作为参数传给下个画面
   * 3. 打开UD07 VDA - Vehicle Specification画面
   */
  const handleChassisNoClick = () => {
    // 从路由state获取参数
    const stateData = location.state as any;
    if (stateData) {
      // 跳转到UD07 VDA - Vehicle Specification画面
      navigate('/UD07', {
        state: {
          chassisSeries: stateData.chassisSeries,
          chassisNo: stateData.chassisNo,
        },
      });
    }
  };

  /**
   * 点击 Generated document Link 跳转流程
   * 点击可下载或查看生成的文档
   */
  const handleGeneratedDocClick = () => {
    // TODO: 实现文档下载或查看功能
    console.log('下载或查看生成的文档');
    // 可以打开新窗口或触发下载
  };

  /**
   * 点击 Analyze Rules Link
   * 点击可分析规则（可选功能）
   */
  const handleAnalyzeRulesClick = () => {
    // TODO: 实现分析规则功能
    console.log('分析规则');
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud04-container'>
      <div className='ud04-content'>
        {/* ページタイトル */}
        <h1 className='page-title'>Generate Document</h1>

        {/* エラーメッセージエリア */}
        {/* 对应设计文档 2.1 控件属性表 No.17 */}
        {state.message && (
          <div className='error-message-area'>
            {state.message}
          </div>
        )}

        {/* Loading状态显示 */}
        {state.isLoading && (
          <div className='loading-indicator'>
            加载中...
          </div>
        )}

        {/* 结果展示区域 */}
        {!state.isLoading && (
          <div className='result-section'>
            {/* Chassis no */}
            {/* 对应设计文档 2.1 控件属性表 No.1 */}
            <div className='result-item'>
              <label className='result-label-chassisNo'>Chassis no:</label>
              <span 
                className='result-value link-blue'
                onClick={handleChassisNoClick}
                style={{ cursor: 'pointer' }}
              >
                {state.chassisNo || '-'}
              </span>
            </div>

            {/* Ordernumber */}
            {/* 对应设计文档 2.1 控件属性表 No.2 */}
            <div className='result-item'>
              <label className='result-label'>Ordernumber:</label>
              <span className='result-value'>{state.ordernumber || '-'}</span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>

            {/* Build week */}
            {/* 对应设计文档 2.1 控件属性表 No.3 */}
            <div className='result-item'>
              <label className='result-label'>Build week:</label>
              <span className='result-value'>{state.buildWeek || '-'}</span>
            </div>

            {/* Spec week */}
            {/* 对应设计文档 2.1 控件属性表 No.4 */}
            <div className='result-item'>
              <label className='result-label'>Spec week:</label>
              <span className='result-value'>{state.specWeek || '-'}</span>
            </div>

            {/* Market */}
            {/* 对应设计文档 2.1 控件属性表 No.5 */}
            <div className='result-item'>
              <label className='result-label'>Market:</label>
              <span className='result-value'>{state.market || '-'}</span>
            </div>

            {/* Master Market */}
            {/* 对应设计文档 2.1 控件属性表 No.6 */}
            <div className='result-item'>
              <label className='result-label'>Master Market:</label>
              <span className='result-value'>{state.masterMarket}</span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>

            {/* S-Note NO */}
            {/* 对应设计文档 2.1 控件属性表 No.7 */}
            {state.sNoteNo && (
              <div className='result-item'>
                {/* <label className='result-label'>S-Note NO:</label> */}
                <label className='result-value'>{state.sNoteNo}</label>
                {/* <span className='result-value'>{state.sNoteNo}</span> */}
              </div>
            )}

            {/* S-Note Message */}
            {/* 对应设计文档 2.1 控件属性表 No.8 - 条件显示 */}
            {state.sNoteMessage && (
              <div className='result-item s-note-message'>
                <span className='result-value'>{state.sNoteMessage}</span>
              </div>
            )}

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>
            
            {/* Load Index */}
            {/* 对应设计文档 2.1 控件属性表 No.9 */}
            <div className='result-item'>
              <label className='result-label'>Load Index:</label>
              <span className='result-value'>{state.loadIndex || '-'}</span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>

            {/* Analyze Rules */}
            {/* 对应设计文档 2.1 控件属性表 No.10 */}
            <div className='result-item'>
              <label className='result-label'>Analyze Rules:</label>
              <span 
                className='result-value link-blue'
                onClick={handleAnalyzeRulesClick}
                style={{ cursor: 'pointer' }}
              >
                Analyze Rules
              </span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>

            {/* Modify Doc Link */}
            {/* 对应设计文档 2.1 控件属性表 No.11 - 条件显示（仅当ACT="Y"时显示） */}
            {state.act === 'Y' && (
              <div className='result-item'>
                <label className='result-label'>Modify Doc:</label>
                <span 
                  className='result-value link-red'
                  onClick={handleModifyDocClick}
                  style={{ cursor: 'pointer' }}
                >
                  After def change detected. Document need to be modified.
                </span>
              </div>
            )}

            {/* Using template */}
            {/* 对应设计文档 2.1 控件属性表 No.12 */}
            <div className='result-item'>
              <label className='result-label'>Using template:</label>
              <span className='result-value'>{state.usingTemplate}</span>
            </div>

            {/* Replacing parameters */}
            {/* 对应设计文档 2.1 控件属性表 No.13 */}
            {state.replacingParameters && (
              <div className='result-item'>
                <label className='result-label'>Replacing parameters:</label>
                <span className='result-value'>{state.replacingParameters}</span>
              </div>
            )}

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>
            
            {/* Generated document */}
            {/* 对应设计文档 2.1 控件属性表 No.14 */}
            <div className='result-item'>
              {/* <label className='result-label'>Generated document:</label> */}
              <label className='result-value link-blue'
                onClick={handleGeneratedDocClick}
                style={{ cursor: 'pointer' }}>Generated document:</label>
              {/* <span 
                className='result-value link-blue'
                onClick={handleGeneratedDocClick}
                style={{ cursor: 'pointer' }}
              >
                Download/View Document
              </span> */}
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>
            
            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-label'></label>
            </div>
            
            {/* Date */}
            {/* 对应设计文档 2.1 控件属性表 No.15 */}
            <div className='result-item'>
              <label className='result-label'>Date:</label>
              <span className='result-value'>{state.date}</span>
            </div>

            {/* HDoc version */}
            {/* 对应设计文档 2.1 控件属性表 No.16 */}
            <div className='result-item'>
              <label className='result-label'>HDoc version:</label>
              <span className='result-value'>{state.hdocVersion}</span>
            </div>
          </div>
        )}

        {/* フッターサポート情報 */}
        <div className='support-info'>
          HDoc support: support.tpi@document.com
        </div>
      </div>
    </div>
  );
};

export default UD04_GenerateDocument;
