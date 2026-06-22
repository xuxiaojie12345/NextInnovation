import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './VehicleSpecification.css';

/**
 * VehicleSpecification组件 - 车辆详细信息展示页面
 * 
 * @description 显示底盘号对应的完整车辆规格信息，支持复杂的数据关联查询和格式化显示
 * @props 无Props，通过路由state接收Chassis no参数
 */
const VehicleSpecification: React.FC = () => {
  const location = useLocation();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [chassisNo, setChassisNo] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [builtWeek, setBuiltWeek] = useState<string>('');
  const [productType, setProductType] = useState<string>('');
  const [vin, setVin] = useState<string>('');
  const [engineNo, setEngineNo] = useState<string>('');
  const [countryOfOperation, setCountryOfOperation] = useState<string>('');
  const [symbolStrList, setSymbolStrList] = useState<Array<{ symbol: string; functionGroup: string; description: string }>>([]);
  const [sNoteNo, setSNoteNo] = useState<string>('');

  /**
   * 画面初期表示 - 从路由state获取参数并调用API
   * 对应设计书 3.1 画面初期
   */
  useEffect(() => {
    // 从路由state中获取Chassis no参数
    const state = location.state as any;
    if (state && state.chassisNo) {
      setChassisNo(state.chassisNo);
      
      // 调用API获取数据
      fetchVehicleData(state.chassisNo);
    }
  }, [location.state]);

  /**
   * 调用UD07SelectHdocRecDataOmApi获取基础数据
   * 对应设计书 5.1 UD07SelectHdocRecDataOmApi
   * 
   * @param chassisNoParam 底盘号
   */
  const fetchVehicleData = async (chassisNoParam: string) => {
    try {
      // API请求 - 第一步：获取OM基础数据和variantId、functionId (对应设计书 4.1.1 步骤1)
      const response = await axios.post('/api/UD07/select-hdoc-rec-data-om', {
        chassisNo: chassisNoParam
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // 映射返回的基础数据到状态变量
        setModel(data.model || '');
        setBuiltWeek(data.build || '');
        setProductType(data.productType || '');
        setVin(data.vin || '');
        setEngineNo(data.symbol || '');
        setCountryOfOperation(data.countryOfOperation || '');
        setSNoteNo(data.customerAdap || '');
        
        // 如果存在variantId和functionId，继续调用第二个API获取SYMBOL_STR列表
        if (data.variantId && data.functionId) {
          await fetchVariantData(data.variantId, data.functionId);
        }
      }
    } catch (error: any) {
      console.error('API调用失败:', error);
    }
  };

  /**
   * 调用UD07SelectHdocRecDataVdaAndKolaVariantsApi获取SYMBOL_STR列表
   * 对应设计书 5.2 UD07SelectHdocRecDataVdaAndKolaVariantsApi
   * 
   * @param variantId 变体ID
   * @param functionId 功能ID
   */
  const fetchVariantData = async (variantId: string, functionId: string) => {
    try {
      // API请求 - 第二步：获取VDA和KOLA变体数据 (对应设计书 4.1.2 步骤2)
      const response = await axios.post('/api/UD07/select-hdoc-rec-data-vda-and-kola-variants', {
        variantId: variantId,
        functionId: functionId
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // 格式化SYMBOL_STR：截取前8个字符，不足8位时左侧补半角空格 (对应设计书 7. 实现注意事项)
        const formattedSymbol = (data.symbol || '').substring(0, 8).padStart(8, ' ');
        
        // 设置SYMBOL_STR列表（可能有多条记录）
        setSymbolStrList([{
          symbol: formattedSymbol,
          functionGroup: data.functionGroup || '',
          description: data.description || ''
        }]);
      } else {
        // 未找到对应的车辆变体数据
        console.warn('未找到对应的车辆变体数据');
      }
    } catch (error: any) {
      console.error('获取变体数据失败:', error);
    }
  };

  return (
    <div className='vehicle-specification-container'>
      <div className='vehicle-specification-content'>
        {/* 标题 */}
        <h2 className='page-title'>VDA - Vehicle Specification:</h2>
        
        {/* Chassis no 和 Model 在同一行 */}
        <div className='info-row-two-column'>
          <div className='info-item'>
            <span className='label'>Chassis no:</span>
            <span className='value'>{chassisNo}</span>
          </div>
          <div className='info-item'>
            <span className='label'>Model:</span>
            <span className='value'>{model}</span>
          </div>
        </div>
        
        {/* Built week 和 Product type 在同一行 */}
        <div className='info-row-two-column'>
          <div className='info-item'>
            <span className='label'>Built week:</span>
            <span className='value'>{builtWeek}</span>
          </div>
          <div className='info-item'>
            <span className='label'>Product type:</span>
            <span className='value'>{productType}</span>
          </div>
        </div>
        
        {/* VIN 和 Engine no 在同一行 */}
        <div className='info-row-two-column'>
          <div className='info-item'>
            <span className='label'>VIN:</span>
            <span className='value'>{vin}</span>
          </div>
          <div className='info-item'>
            <span className='label'>Engine no:</span>
            <span className='value'>{engineNo}</span>
          </div>
        </div>
        
        {/* Country of Operation 单独一行 */}
        <div className='info-row-single'>
          <span className='label'>Country of Operation:</span>
          <span className='value'>{countryOfOperation}</span>
        </div>
        
        {/* SYMBOL_STR 区域 - 多列网格显示 */}
        <div className='symbol-grid'>
          {symbolStrList.map((item, index) => (
            <div key={index} className='symbol-cell' title={item.description}>
              <span className='symbol-text'>{item.symbol}</span>
            </div>
          ))}
        </div>
        
        {/* S-Note NO (条件显示) */}
        {sNoteNo && (
          <div className='info-row-single'>
            <span className='label'>S-Note NO:</span>
            <span className='value'>{sNoteNo}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSpecification;
