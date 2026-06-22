import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SaveModifications.css';

/**
 * SaveModifications组件 - 修改内容确认页面
 * 
 * @description 显示前画面修改内容的展示画面，用于确认用户在ModifyDocument画面中所做的修改内容，并提供关闭功能
 * @props 无Props，通过路由state接收参数
 */
const SaveModifications: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [chassisSerie, setChassisSerie] = useState<string>('');
  const [chassisNumber, setChassisNumber] = useState<string>('');
  const [doctype, setDoctype] = useState<string>('');
  const [version, setVersion] = useState<string>('');
  const [storing, setStoring] = useState<string>('');
  const [foundUnreleasedVersion, setFoundUnreleasedVersion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 画面初期表示 - 从路由state获取参数并调用API
   * 对应设计书 3.1 画面初期表示
   */
  useEffect(() => {
    // 从路由state中获取参数
    const state = location.state as any;
    if (state && state.chassisSerie && state.chassisNumber) {
      setChassisSerie(state.chassisSerie);
      setChassisNumber(state.chassisNumber);
      
      // 调用API获取数据
      fetchModificationData(state.chassisSerie, state.chassisNumber);
    } else {
      // 缺少必要参数，直接结束loading状态
      setIsLoading(false);
    }
  }, [location.state]);

  /**
   * 调用UD06SelectHdocAdcaModificationApi获取修改内容数据
   * 对应设计书 5.1 UD06SelectHdocAdcaModificationApi
   * 
   * @param serieParam 底盘系列
   * @param chnoParam 底盘号
   */
  const fetchModificationData = async (serieParam: string, chnoParam: string) => {
    setIsLoading(true);
    
    try {
      // API请求 (对应设计书 5.1 UD06SelectHdocAdcaModificationApi)
      const response = await axios.post('/api/UD06/SelectHdocAdcaModification', {
        serie: serieParam,
        chno: chnoParam
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // 映射返回的数据到对应的Label控件 (对应设计书 4.1.1 步骤1)
        setDoctype(data.doctype || '');
        setVersion(data.vers || '');
        
        // Storing: 将variable和newval组合显示 (对应设计书 7. 实现注意事项)
        const storingText = `${data.variable || ''} ${data.newval || ''}`;
        setStoring(storingText.trim());
        
        // FOUND UNRELEASED VERSION: 从VERS字段获取
        setFoundUnreleasedVersion(data.vers || '');
      }
      // Message区域固定显示"VERSION IS RELEASED"，无论API成功或失败都显示此文本
    } catch (error: any) {
      // 捕获网络错误或服务器错误
      // Message区域仍然固定显示"VERSION IS RELEASED"
      console.error('API调用失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Close按钮点击处理
   * 对应设计书 3.2 画面关闭功能
   */
  const handleCloseClick = () => {
    // 关闭当前画面，返回上一画面 (对应设计书 7. 实现注意事项)
    navigate(-1);
  };

  return (
    <div className='save-modifications-container'>
      <div className='save-modifications-content'>
        {/* 标题 */}
        <h2 className='page-title'>Save Modifications</h2>
        
        {/* Loading状态显示 */}
        {isLoading ? (
          <div className='loading-message'>加载中...</div>
        ) : (
          <>
            {/* Chassis serie */}
            <div className='info-row'>
              <span className='label'>Chassis serie:</span>
              <span className='value'>{chassisSerie}</span>
            </div>
            
            {/* Chassis number */}
            <div className='info-row'>
              <span className='label'>Chassis number:</span>
              <span className='value'>{chassisNumber}</span>
            </div>
            
            {/* Doctype */}
            <div className='info-row'>
              <span className='label'>Doctype:</span>
              <span className='value'>{doctype}</span>
            </div>
            
            {/* Version */}
            <div className='info-row'>
              <span className='label'>Version:</span>
              <span className='value'>{version}</span>
            </div>
            
            {/* Storing */}
            <div className='info-row'>
              <span className='label'>Storing:</span>
              <span className='value'>{storing}</span>
            </div>
            
            {/* FOUND UNRELEASED VERSION */}
            <div className='info-row'>
              <span className='label'>FOUND UNRELEASED VERSION:</span>
              <span className='value'>{foundUnreleasedVersion}</span>
            </div>
            
            {/* Message: 固定显示 "VERSION IS RELEASED" (对应设计书 7. 实现注意事项) */}
            <div className='message-area success-message'>
              VERSION IS RELEASED
            </div>
            
            {/* Close按钮 (对应设计书 3.2 画面关闭功能) */}
            <div className='button-container'>
              <button 
                className='close-button' 
                onClick={handleCloseClick}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SaveModifications;
