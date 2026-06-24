/**
 * VehicleSpecification组件 - 车辆规格详细信息展示页面
 * 
 * @description 显示车辆的完整技术规格信息，包括底盘号、车型、生产周次、产品类型、VIN码、
 *              发动机号、运营国家、符号字符串以及S-Note信息等。该页面从Generate document画面跳转而来。
 *              严格按照詳細設計UD07.md中定义的画面项目（项番1-9）实现。
 * 
 * @features
 * - Chassis no：显示底盘编号（来自前画面）
 * - Model：显示车型信息（来自HDOC_REC_DATA_OM表）
 * - Built week：显示生产周次（来自HDOC_REC_DATA_OM表）
 * - Product type：显示产品类型（来自HDOC_REC_DATA_VDA_GENERAL表）
 * - VIN：显示车辆识别码（来自HDOC_REC_DATA_VDA_GENERAL表）
 * - Engine no：显示发动机号（固定值：428328）
 * - Country of Operation：显示运营国家（来自HDOC_REC_DATA_VDA_GENERAL表）
 * - SYMBOL_STR：显示符号字符串列表（多表关联查询结果）
 * - DESCRIPTION：鼠标悬停时显示描述信息的工具提示
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 敏感车辆数据通过HTTPS加密传输
 * - 防止未授权用户直接访问受限车辆数据
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './VehicleSpecification.css';

/**
 * 符号字符串数据接口定义
 */
interface SymbolData {
  symbol: string;
  functionGroup: string;
  familyId: string;
  variantId: string;
  description: string;
}

/**
 * 车辆规格数据接口定义
 */
interface VehicleSpecData {
  chassisNo: string;
  model: string;
  builtWeek: string;
  productType: string;
  vin: string;
  countryOfOperation: string;
  symbolStrList: SymbolData[];
}

/**
 * API响应成功数据结构
 */
interface VehicleSpecResponse {
  code: number;
  data: VehicleSpecData;
}

/**
 * API响应错误数据结构
 */
interface ErrorResponse {
  code: number;
  message: string;
  errorCode?: string;
}

/**
 * VehicleSpecification组件 - 车辆规格详细信息展示页面
 * 
 * @component
 * @returns {JSX.Element} 车辆规格页面组件
 * @description 根据詳細設計UD07.md实现完整的数据展示功能
 */
const VehicleSpecification: React.FC = () => {
  // 获取location对象用于接收参数
  const location = useLocation();

  // 车辆规格数据状态
  const [vehicleData, setVehicleData] = useState<VehicleSpecData | null>(null);

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 初期表示 - 获取车辆规格数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD07.md的API规范：
   *              - Method: GET
   *              - Endpoint: /api/ud07/vehicle-specification
   *              - Query Parameters: chassisSeries, chassisNo
   *              
   *              成功时（200）：设置车辆规格数据
   *              失败时：显示错误消息
   */
  useEffect(() => {
    fetchVehicleSpecData();
  }, []);

  /**
   * 获取车辆规格数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 调用UD07VehicleSpecificationApi获取以下表的数据：
   *              - HDOC_REC_DATA_OM
   *              - HDOC_REC_DATA_VDA_GENERAL
   *              - HDOC_REC_DATA_VDA_VARIANTS
   *              - HDOC_REC_DATA_KOLA_VARIANT
   */
  const fetchVehicleSpecData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 从location.state获取前画面传递的参数
      const state = location.state as any;
      const chassisSeries = state?.chassisSeries || '';
      const chassisNo = state?.chassisNo || '';
      
      if (!chassisSeries || !chassisNo) {
        setErrorMessage('Failed to load vehicle specification data. Please try again.');
        return;
      }
      
      // 调用UD07VehicleSpecificationApi获取车辆规格数据
      // Endpoint: GET /api/ud07/vehicle-specification
      // Query Parameters: chassisSeries, chassisNo
      const response = await axios.get<VehicleSpecResponse>('/api/ud07/vehicle-specification', {
        params: {
          chassisSeries: chassisSeries,
          chassisNo: chassisNo
        }
      });
      
      // 处理成功响应（200状态码）
      if (response.data.code === 200) {
        setVehicleData(response.data.data);
      } else {
        setErrorMessage('Failed to load vehicle specification data. Please try again.');
      }
    } catch (error: any) {
      // 处理API调用失败
      if (error.response) {
        const errorData: ErrorResponse = error.response.data;
        setErrorMessage(errorData.message || 'Failed to load vehicle specification data. Please try again.');
      } else if (error.request) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage('Request timeout. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ud07-vehicle-specification-container">
        <div className="ud07-loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud07-vehicle-specification-container">
      {/* 内容区域 */}
      <div className="ud07-content-area">
        {/* 页面标题 */}
        <h1 className="ud07-page-title">VDA - Vehicle Specification:</h1>
        
        {/* 错误消息区域 */}
        {errorMessage && (
          <div className="ud07-error-message-area">
            <span className="ud07-error-text">{errorMessage}</span>
          </div>
        )}

        {/* 项番1: Chassis no */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">Chassis no: </span>
          <span className="ud07-value">{vehicleData?.chassisNo || '-'}</span>
        </div>

        {/* 项番2: Model */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">Model: </span>
          <span className="ud07-value">{vehicleData?.model || '-'}</span>
        </div>

        {/* 项番3: Built week */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">Built week: </span>
          <span className="ud07-value">{vehicleData?.builtWeek || '-'}</span>
        </div>

        {/* 项番4: Product type */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">Product type: </span>
          <span className="ud07-value">{vehicleData?.productType || '-'}</span>
        </div>

        {/* 项番5: VIN */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">VIN: </span>
          <span className="ud07-value">{vehicleData?.vin || '-'}</span>
        </div>

        {/* 项番6: Engine no */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">Engine no: </span>
          <span className="ud07-value">428328</span>
        </div>

        {/* 项番7: Country of Operation */}
        <div className="ud07-info-row">
          <span className="ud07-label-bold">Country of Operation: </span>
          <span className="ud07-value">{vehicleData?.countryOfOperation || '-'}</span>
        </div>

        {/* 空行 */}
        <div className="ud07-info-item-empty"></div>

        {/* 项番8: SYMBOL_STR列表 */}
        {vehicleData?.symbolStrList && vehicleData.symbolStrList.length > 0 && (
          <div className="ud07-symbol-section">
            {vehicleData.symbolStrList.map((item, index) => (
              <div key={index} className="ud07-symbol-item">
                <span className="ud07-symbol-text" title={item.description}>
                  {item.symbol}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSpecification;
