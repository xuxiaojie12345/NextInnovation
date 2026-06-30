import React, { useState } from 'react';
import axios from 'axios';
import './VinPlate.css';

/**
 * VinPlate组件 - 车辆识别码铭牌管理页面
 * 
 * @description VIN Plate（车辆识别码铭牌）管理页面，支持查询、状态更新、类型切换等操作，显示XML文档中的详细信息（Print Items和VP Data）
 * @props 无Props
 */
const VinPlate: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [chassisNumber, setChassisNumber] = useState<string>('');
  const [plateType, setPlateType] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [def, setDef] = useState<string>('');
  const [dataReady, setDataReady] = useState<string>('');
  const [sentToCabFactory, setSentToCabFactory] = useState<string>('');
  const [printItems, setPrintItems] = useState<any[]>([]);
  const [vpData, setVpData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

  /**
   * Status数字转文字映射 (对应设计书 2.1 控件属性表)
   */
  const statusMap: Record<number, string> = {
    0: '新規追加',
    1: 'xml doc 作成済み',
    2: '送信済み',
    9: 'エラー'
  };

  /**
   * Plate Type数字转文字映射 (对应设计书 2.1 控件属性表)
   */
  const plateTypeMap: Record<number, string> = {
    1: 'BASIC',
    2: 'ADVANCED (with weights)'
  };

  /**
   * 获取当前登录用户ID
   */
  const getCurrentUserId = (): string => {
    return sessionStorage.getItem('userId') || '';
  };

  /**
   * View Info按钮点击处理 - 查询底盘号详细信息
   * 对应设计书 3.2 View Info按钮押下 和 4.1.2 View Info按钮押下
   */
  const handleViewInfoClick = async () => {
    // 校验：底盘号不能为空
    if (!chassisNumber.trim()) {
      showMessage('请输入底盘号', 'error');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    setIsDetailVisible(false);
    
    try {
      // API请求 - 查询底盘号VinPlate信息 (对应设计书 5.1 API)
      const response = await axios.post('http://localhost:8081/api/ud15/viewinfo', {
        ChassisNumber: chassisNumber
      });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        
        // 设置基本信息
        setPlateType(plateTypeMap[parseInt(data.type)] || '');
        setStatus(statusMap[parseInt(data.status)] || '');
        setDef(data.registerDatetime || '');
        setDataReady(data.docReady || '');
        setSentToCabFactory(data.docSent || '');
        
        // 解析XML文档，提取Print items和VP Data
        if (data.xmlContent) {
          const parsed = parseXmlDocument(data.xmlContent);
          setPrintItems(parsed.printItems);
          setVpData(parsed.vpData);
        }
        
        setIsDetailVisible(true);
        showMessage('查询成功', 'success');
      } else {
        // 底盘号不存在
        showMessage(response.data.msg || `Chassis number ${chassisNumber} not found.`, 'error');
        setIsDetailVisible(false);
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
      setIsDetailVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 通用的Call Update API调用
   * 对应设计书 5.2-5.5 各更新API
   */
  const callUpdateApi = async (endpoint: string, statusValue: string, typeValue?: string) => {
    if (!chassisNumber.trim()) {
      showMessage('请输入底盘号', 'error');
      return;
    }
    setIsLoading(true);
    clearMessage();
    try {
      const requestData: any = {
        ChassisNumber: chassisNumber,
        Status: parseInt(statusValue),
        UpdateUser: getCurrentUserId(),
        UpdateDatetime: new Date().toISOString(),
        UpdateProcess: 'VinPlate'
      };
      if (typeValue !== undefined) {
        requestData.Type = parseInt(typeValue);
      }
      const response = await axios.post(`http://localhost:8081/api/ud15/${endpoint}`, requestData);
      if (response.data.code === 200) {
        showMessage('情报更新成功', 'success');
      } else {
        showMessage(response.data.msg || '更新失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRegenerateClick = () => callUpdateApi('setregenerate', '0');
  const handleSetOkClick = () => callUpdateApi('setok', '1');
  const handleChangeToBasicInfoClick = () => callUpdateApi('changetobasicinfo', '0', '1');
  const handleChangeToAdvancedInfoClick = () => callUpdateApi('changetoadvancedinfo', '0', '2');

  /**
   * 解析XML文档，提取PrintItemName和各Variant名/Value
   * 对应设计书 7. 实现注意事项 - XML解析
   * 
   * @param xmlString XML字符串
   * @returns 包含printItems和vpData的对象
   */
  const parseXmlDocument = (xmlString: string): { printItems: any[], vpData: any[] } => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // 提取PrintItemName项目值
    const printItemElements = xmlDoc.getElementsByTagName('PrintItemName');
    const printItemsArray: any[] = [];
    for (let i = 0; i < printItemElements.length; i++) {
      printItemsArray.push({
        name: printItemElements[i].textContent || ''
      });
    }
    
    // 提取各Variant名和Value的值
    const variantElements = xmlDoc.getElementsByTagName('Variant');
    const vpDataArray: any[] = [];
    for (let i = 0; i < variantElements.length; i++) {
      const variant = variantElements[i];
      const name = variant.getAttribute('name') || '';
      const value = variant.textContent || '';
      vpDataArray.push({
        name: name,
        value: value
      });
    }
    
    return {
      printItems: printItemsArray,
      vpData: vpDataArray
    };
  };

  return (
    <div className='vp-container'>
      <div className='vp-content'>
        {/* 标题区域 */}
        <h2 className='vp-title'>Vin Plate</h2>
        
        {/* Chassis number输入框区域 */}
        <div className='vp-input-section'>
          <label className='vp-label'>Chassis number</label>
          <input 
            type='text' 
            className='vp-input' 
            value={chassisNumber}
            onChange={(e) => setChassisNumber(e.target.value)}
            maxLength={15}
            disabled={isLoading}
          />
        </div>
        
        {/* 按钮区域 */}
        <div className='vp-button-row'>
          <button 
            className='vp-action-button' 
            onClick={handleViewInfoClick}
            disabled={isLoading}
          >
            View Info
          </button>
          <button 
            className='vp-action-button' 
            onClick={handleSetRegenerateClick}
            disabled={isLoading}
          >
            Set Regenerate
          </button>
          <button 
            className='vp-action-button' 
            onClick={handleSetOkClick}
            disabled={isLoading}
          >
            Set OK
          </button>
          <button 
            className='vp-action-button' 
            onClick={handleChangeToBasicInfoClick}
            disabled={isLoading}
          >
            Change to Basic Info
          </button>
          <button 
            className='vp-action-button' 
            onClick={handleChangeToAdvancedInfoClick}
            disabled={isLoading}
          >
            Change to Advanced Info
          </button>
          </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='vp-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
          </div>
        )}
        
        {/* 固定提示文本（仅在未显示详细信息时显示） */}
        {!isDetailVisible && !errorMessage && (
          <div className='vp-hint-text'>
            Please enter a chassis number.
          </div>
        )}
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='vp-loading'>
            加载中...
          </div>
        )}
        
        {/* 详细信息区域（根据isDetailVisible控制显示/隐藏） */}
        {isDetailVisible && (
          <div className='vp-detail-section'>
            {/* 基本信息区域 */}
            <div className='vp-info-group'>
              <div className='vp-info-item'>
                <span className='vp-info-label'>Chassis number:</span>
                <span className='vp-info-value'>{chassisNumber}</span>
              </div>
              <div className='vp-info-item'>
                <span className='vp-info-label'>Plate type:</span>
                <span className='vp-info-value'>{plateType}</span>
              </div>
              <div className='vp-info-item'>
                <span className='vp-info-label'>Status:</span>
                <span className='vp-info-value'>{status}</span>
              </div>
              <div className='vp-info-item'>
                <span className='vp-info-label'>Def.:</span>
                <span className='vp-info-value'>{def}</span>
              </div>
              <div className='vp-info-item'>
                <span className='vp-info-label'>Data ready:</span>
                <span className='vp-info-value'>{dataReady}</span>
              </div>
              <div className='vp-info-item'>
                <span className='vp-info-label'>Sent to CAB factory:</span>
                <span className='vp-info-value'>{sentToCabFactory}</span>
              </div>
            </div>
            
            {/* Print items区域 */}
            {printItems.length > 0 && (
              <div className='vp-subsection'>
                <h3 className='vp-subsection-title'>Print items</h3>
                <ul className='vp-list'>
                  {printItems.map((item, index) => (
                    <li key={index}>{item.name}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* VP Data区域 */}
            {vpData.length > 0 && (
              <div className='vp-subsection'>
                <h3 className='vp-subsection-title'>VP Data</h3>
                <table className='vp-data-table'>
                  <thead>
                    <tr>
                      <th>Variant Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vpData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VinPlate;
