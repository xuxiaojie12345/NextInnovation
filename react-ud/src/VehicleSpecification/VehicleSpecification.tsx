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
      // API请求 - 调用UD07车辆规格接口（后端已合并两个查询）
      const response = await axios.post('http://localhost:8081/api/ud07/vehiclespecification', {
        chassisNo: chassisNoParam
      });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        
        // 映射返回的基础数据到状态变量
        setModel(data.model || '');
        setBuiltWeek(data.build || '');
        setProductType(data.productType || '');
        setVin(data.vin || '');
        setEngineNo(data.symbol || '');
        setCountryOfOperation(data.countryOfOperation || '');
        setSNoteNo(data.customerAdap || '');
        
        // 后端已合并KOLA Variant数据到symbol/description字段
        if (data.symbol || data.description) {
          const formattedSymbol = (data.symbol || '').substring(0, 8).padStart(8, ' ');
          setSymbolStrList([{
            symbol: formattedSymbol,
            functionGroup: '',
            description: data.description || ''
          }]);
        }
      }
    } catch (error: any) {
      console.error('API调用失败:', error);
    }
  };

  // 已移除 fetchVariantData，后端UD07Controller已合并两个查询

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
            {/* <span className='label'>S-Note NO:</span> */}
            <span className='value'>{sNoteNo}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSpecification;
