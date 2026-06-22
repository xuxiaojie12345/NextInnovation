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
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false); // 控制详细信息区域显示/隐藏

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
    1: 'basic',
    2: 'ADVANCED (with weights)'
  };

  /**
   * 获取当前登录用户ID
   * TODO: 从JWT token或session中解析userId
   */
  const getCurrentUserId = (): string => {
    return localStorage.getItem('userId') || 'test_user';
  };

  /**
   * View Info按钮点击处理 - 查询底盘号详细信息
   * 对应设计书 3.2 View Info按钮押下 和 4.1.2 View Info按钮押下
   */
  const handleViewInfoClick = async () => {
    // 校验：底盘号不能为空
    if (!chassisNumber.trim()) {
      setErrorMessage('请输入底盘号');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 - 查询底盘号是否存在 (对应设计书 5.1 UD15SelectHdocSendDataVinPlateApi)
      const response = await axios.get('/api/UD15/select-hdoc-send-data-vin-plate', {
        params: { ChassisNumber: chassisNumber }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // 设置基本信息
        setPlateType(plateTypeMap[parseInt(data.type)] || '');
        setStatus(statusMap[parseInt(data.status)] || '');
        setDef(data.registerDatetime || '');
        setDataReady(data.docReady || '');
        setSentToCabFactory(data.docSent || '');
        
        // 解析XML文档，提取Print items和VP Data (对应设计书 7. 实现注意事项 - XML解析)
        if (data.xmlDoc) {
          const parsedXml = parseXmlDocument(data.xmlDoc);
          setPrintItems(parsedXml.printItems);
          setVpData(parsedXml.vpData);
        }
        
        // 显示详细信息区域，隐藏固定提示文本
        setIsDetailVisible(true);
      } else {
        // 底盘号不存在 (对应设计书 4.2 校验详细规格表 No.1)
        setErrorMessage(`Chassis number ${chassisNumber} not found.`);
        setIsDetailVisible(false);
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
      setIsDetailVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Set Regenerate按钮点击处理 - 更新Status为'0' (新規追加)
   * 对应设计书 3.3 Set Regenerate按钮押下 和 4.1.3 Set Regenerate按钮押下
   */
  const handleSetRegenerateClick = async () => {
    await updateVinPlateStatus('0', undefined);
  };

  /**
   * Set OK按钮点击处理 - 更新Status为'1' (xml doc 作成済み)
   * 对应设计书 3.4 Set OK按钮押下 和 4.1.4 Set OK按钮押下
   */
  const handleSetOkClick = async () => {
    await updateVinPlateStatus('1', undefined);
  };

  /**
   * Change to Basic Info按钮点击处理 - 更新Status为'0'，Type为'1' (basic)
   * 对应设计书 3.5 Change to Basic Info按钮押下 和 4.1.5 Change to Basic Info按钮押下
   */
  const handleChangeToBasicInfoClick = async () => {
    await updateVinPlateStatus('0', '1');
  };

  /**
   * Change to Advanced Info按钮点击处理 - 更新Status为'0'，Type为'2' (ADVANCED with weights)
   * 对应设计书 3.6 Change to Advanced Info按钮押下 和 4.1.6 Change to Advanced Info按钮押下
   */
  const handleChangeToAdvancedInfoClick = async () => {
    await updateVinPlateStatus('0', '2');
  };

  /**
   * 通用更新VIN Plate状态函数
   * @param statusValue 状态值 ('0' 或 '1')
   * @param typeValue 类型值 ('1' 或 '2'，可选)
   */
  const updateVinPlateStatus = async (statusValue: string, typeValue?: string) => {
    // 校验：底盘号不能为空
    if (!chassisNumber.trim()) {
      setErrorMessage('请输入底盘号');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 构建请求参数 (对应设计书 5.2 UD15UpdateHdocSendDataVinPlateApi)
      const requestData: any = {
        ChassisNumber: chassisNumber,
        Status: parseInt(statusValue),
        UpdateUser: getCurrentUserId(),
        UpdateDatetime: new Date().toISOString(),
        UpdateProcess: 'VinPlate' // 当前画面ID
      };
      
      // 如果有type值，添加到请求参数
      if (typeValue !== undefined) {
        requestData.Type = parseInt(typeValue);
      }
      
      // API请求 - 更新VIN Plate状态 (对应设计书 5.2 UD15UpdateHdocSendDataVinPlateApi)
      const response = await axios.put('/api/UD15/update-hdoc-send-data-vin-plate', requestData);
      
      if (response.data.success) {
        // 更新画面显示
        setStatus(statusMap[parseInt(statusValue)] || '');
        
        if (typeValue !== undefined) {
          setPlateType(plateTypeMap[parseInt(typeValue)] || '');
        }
        
        alert('更新成功');
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
        
        <div className='vp-hint-solide'>
          
       
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
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='vp-error-message'>
            {errorMessage}
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
