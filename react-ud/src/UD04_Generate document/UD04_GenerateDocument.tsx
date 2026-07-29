import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './UD04_GenerateDocument.css';
import apiClient from '../api/config';

/**
 * Generate Document 页面组件接口定义
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
 * @component
 * @returns {JSX.Element} Generate Document页面元素
 */
const UD04_GenerateDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
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
   */
  useEffect(() => {
    // 对应设计书 5. 异常处理 - 用户未登录
    const userID = localStorage.getItem('userID');
    if (!userID) {
      navigate('/', { replace: true });
      return;
    }

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
        message: 'We can not get the data. Please try again.',
      }));
    }
  }, [navigate, location.state]);

  // ==================== API调用 ====================

  /**
   * 获取文档生成结果数据
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
        // 异常处理 - 数据不存在 / 业务错误
        setState(prev => ({
          ...prev,
          message: 'We can not get the data. Please try again.',
          isLoading: false,
        }));
      }
    } catch (error: any) {
      // ==================== 5. 异常处理 ====================
      // 对应设计书 5. 异常处理表
      let errorMessage: string;
      
      if (error.code === 'ECONNABORTED') {
        // 请求超时 — 超时异常
        errorMessage = 'Request timeout. Please check your network.';
      } else if (error.response) {
        // 服务器返回了错误状态码（4xx, 5xx）
        errorMessage = 'System error. Please try again later.';
      } else if (error.request) {
        // 请求已发出但没有收到响应 — 网络异常
        errorMessage = 'System error. Please try again later.';
      } else {
        // API取得异常等其他异常
        errorMessage = 'System error. Please try again later.';
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
   */
  const handleModifyDocClick = () => {
    // 从路由state获取参数
    const stateData = location.state as any;
    if (stateData) {
      try {
        //  异常处理 - 网络异常导致路由失败
        navigate('/UD05', {
          state: {
            chassisSeries: stateData.chassisSeries,
            chassisNo: stateData.chassisNo,
            market: state.market,
          },
        });
      } catch (error) {
        // 异常处理 - 画面迁移异常
        setState(prev => ({
          ...prev,
          message: 'System error. Please try again later.',
        }));
      }
    }
  };

  /**
   * 点击 Chassis no Link 跳转流程
   */
  const handleChassisNoClick = () => {
    // 从路由state获取参数
    const stateData = location.state as any;
    if (stateData) {
      try {
        //  异常处理 - 网络异常导致路由失败
        navigate('/UD07', {
          state: {
            chassisSeries: stateData.chassisSeries,
            chassisNo: stateData.chassisNo,
          },
        });
      } catch (error) {
        //  异常处理 - 画面迁移异常
        setState(prev => ({
          ...prev,
          message: 'System error. Please try again later.',
        }));
      }
    }
  };

  /**
   * 点击 Generated document Link 跳转流程
   * 点击可下载或查看生成的文档
   */
  const handleGeneratedDocClick = () => {
    // TODO: 实现文档下载或查看功能
    // 可以打开新窗口或触发下载
  };

  /**
   * 点击 Analyze Rules Link
   * 点击可分析规则（可选功能）
   */
  const handleAnalyzeRulesClick = () => {
    // TODO: 实现分析规则功能
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud04-container'>
      <div className='ud04-content'>
        {/* ページタイトル */}
        <h1 className='page-title'>Generate Document</h1>

        {/* エラーメッセージエリア */}
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
            <div className='result-item'>
              <label className='result-label-chassisNo'>Chassis no:</label>
              <span  className='result-value link-blue' onClick={handleChassisNoClick} style={{ cursor: 'pointer' }}>
                {state.chassisNo || '-'}
              </span>
            </div>

            {/* Ordernumber */}
            <div className='result-item'>
              <label className='result-label'>Ordernumber:</label>
              <span className='result-value'>{state.ordernumber || '-'}</span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>

            {/* Build week */}
            <div className='result-item'>
              <label className='result-label'>Build week:</label>
              <span className='result-value'>{state.buildWeek || '-'}</span>
            </div>

            {/* Spec week */}
            <div className='result-item'>
              <label className='result-label'>Spec week:</label>
              <span className='result-value'>{state.specWeek || '-'}</span>
            </div>

            {/* Market */}
            <div className='result-item'>
              <label className='result-label'>Market:</label>
              <span className='result-value'>{state.market || '-'}</span>
            </div>

            {/* Master Market */}
            <div className='result-item'>
              <label className='result-label'>Master Market:</label>
              <span className='result-value'>{state.masterMarket}</span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>

            {/* S-Note NO */}
            {state.sNoteNo && (
              <div className='result-item'>
                <label className='result-value'>{state.sNoteNo}</label>
              </div>
            )}

            {/* S-Note Message */}
            {state.sNoteMessage && (
              <div className='result-item s-note-message'>
                <span className='result-value'>{state.sNoteMessage}</span>
              </div>
            )}

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>
            
            {/* Load Index */}
            <div className='result-item'>
              <label className='result-label'>Load Index:</label>
              <span className='result-value'>{state.loadIndex || '-'}</span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>

            {/* Analyze Rules */}
            <div className='result-item'>
              <span  className='result-value link-blue' onClick={handleAnalyzeRulesClick} style={{ cursor: 'pointer' }} >
                Analyze Rules
              </span>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>

            {/* Modify Doc Link */}
            {state.act === 'Y' && (
              <div className='result-item'>
                <label className='result-label'>Modify Doc:</label>
                <span  className='result-value link-red' onClick={handleModifyDocClick} style={{ cursor: 'pointer' }} >
                  After def change detected. Document need to be modified.
                </span>
              </div>
            )}

            {/* Using template */}
            <div className='result-item'>
              <label className='result-label'>Using template:</label>
              <span className='result-value'>{state.usingTemplate}</span>
            </div>

            {/* Replacing parameters */}
            {state.replacingParameters && (
              <div className='result-item'>
                <label className='result-label-ReplacingParameters'>Replacing parameters:</label>
                <br></br>
                <span className='result-value'>{state.replacingParameters}</span>
              </div>
            )}

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>
            
            {/* Generated document */}
            <div className='result-item'>
              <label className='result-value-GeneratedDocument' onClick={handleGeneratedDocClick} style={{ cursor: 'pointer' }}>
                Generated document:
              </label>
            </div>

            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>
            
            {/* 空白行 */}
            <div className='result-item'>
              <label className='result-space'></label>
            </div>
            
            {/* Date */}
            <div className='result-item'>
              <label className='result-label'>Date:</label>
              <span className='result-value'>{state.date}</span>
            </div>

            {/* HDoc version */}
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
