import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./VehicleSpecification.css";

/**
 * 车辆规格数据类型
 * 对应详细设计 DES-VehicleSpecification-001 4.1 Response Success
 */
interface ChassisInfo {
  chassisNo: string;
  model: string;
  buildWeek: string;
  productType: string;
  vin: string;
  countryOfOperation: string;
}

interface EngineInfo {
  engineNo: string;
  description: string;
}

interface VehicleSpecificationData {
  chassisInfo: ChassisInfo;
  engineInfo: EngineInfo;
  sNoteNo: string;
}

/** 后端API基础地址 */
const API_BASE_URL = "http://localhost:8081";

/**
 * VehicleSpecification 组件 - 车辆规格信息展示页面（UD07）
 *
 * 功能说明：
 * 1. 接收前画面传递的底盘编号（serie + 半角空格 + chassisNo）
 * 2. 调用 UD07VehicleSpecificationApi 获取车辆规格信息
 * 3. 展示车辆基本信息、发动机信息、变体信息和S-Note信息
 *
 * 对应详细设计：DES-VehicleSpecification-001
 */
const VehicleSpecification: React.FC = () => {
  const location = useLocation();
  // 从路由参数获取底盘编号（格式：serie + 半角空格 + chassisNo）
  const chassisNo = (location.state as { chassisNo?: string })?.chassisNo || "";

  // 页面数据状态
  const [chassisInfo, setChassisInfo] = useState<ChassisInfo | null>(null);
  const [engineInfo, setEngineInfo] = useState<EngineInfo | null>(null);
  const [sNoteNo, setSNoteNo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  /**
   * 页面初始化 - 调用UD07VehicleSpecificationApi获取车辆规格信息
   * 对应详细设计 3.1.1 页面初始化流程
   */
  useEffect(() => {
    const fetchVehicleSpecification = async () => {
      // 前置处理：校验底盘编号是否为空
      if (!chassisNo) {
        setError("未指定Chassis编号");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // API调用：获取车辆规格信息
        // 对应详细设计 4.1 UD07VehicleSpecificationApi
        const response = await axios.get(
          `${API_BASE_URL}/api/v1/ud07/vehiclespecification`,
          {
            params: { chassisNo },
          }
        );

        if (response.data.code === 200 && response.data.data) {
          const data: VehicleSpecificationData = response.data.data;
          setChassisInfo(data.chassisInfo);
          setEngineInfo(data.engineInfo);
          setSNoteNo(data.sNoteNo || '');
        } else {
          // API返回非200或data为null，不清空数据，页面保持显示"-"
          setChassisInfo(null);
          setEngineInfo(null);
          setSNoteNo('');
        }
      } catch (err: any) {
        // 异常处理：API返回异常时不清除页面结构，数据字段显示"-"
        console.error("UD07 API error:", err);
        setChassisInfo(null);
        setEngineInfo(null);
        setSNoteNo('');
        if (err.response) {
          if (err.response.status === 400) {
            // 无数据时不是错误，页面显示空字段
            console.warn("No data found for chassisNo:", chassisNo);
          } else {
            setError("系统内部错误，请联系管理员");
          }
        } else if (err.request) {
          setError("网络连接失败，请检查网络设置");
        } else {
          setError("系统内部错误，请联系管理员");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSpecification();
  }, [chassisNo]);

  // 加载状态
  if (loading) {
    return (
      <div className="vehicle-specification-page">
        <div className="loading-container">
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="vehicle-specification-page">
        <div className="error-message-area">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 无数据提示
  const noData = !loading && !error && !chassisInfo;

  return (
    <div className="vehicle-specification-page">
      {/* 无数据时显示提示 */}
      {noData && (
        <div className="info-message-area">
          <p>没有找到相关车辆数据</p>
        </div>
      )}

      {/* 信息展示区 - 合并为一个整体，外层边框 */}
      <div className="info-section">
        <div className="section-content">
          {/* 页面标题 - 放在边框内 */}
          <div className="page-header-section">
            <h1 className="page-title">VDA - Vehicle Specification</h1>
          </div>
          <div className="info-row">
            <div className="info-field">
              <span className="info-label">Chassis no:</span>
              <span className="info-value">{chassisInfo?.chassisNo || chassisNo || '-'}</span>
            </div>
            <div className="info-field">
              <span className="info-label">Model:</span>
              <span className="info-value">{chassisInfo?.model || '-'}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-field">
              <span className="info-label">Built week:</span>
              <span className="info-value">{chassisInfo?.buildWeek || '-'}</span>
            </div>
            <div className="info-field">
              <span className="info-label">Product type:</span>
              <span className="info-value">{chassisInfo?.productType || '-'}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-field">
              <span className="info-label">VIN:</span>
              <span className="info-value">{chassisInfo?.vin || '-'}</span>
            </div>
            <div className="info-field">
              <span className="info-label">Engine no:</span>
              <span className="info-value">{engineInfo?.engineNo || '-'}</span>
            </div>
          </div>
          <div className="info-row">
            <div className="info-field">
              <span className="info-label">Country of operation:</span>
              <span className="info-value">{chassisInfo?.countryOfOperation || '-'}</span>
            </div>
          </div>
          {/* DESCRIPTION - 仅显示值，无值显示中划线 */}
          <div className="info-row">
            <div className="info-field" style={{ width: '100%', padding: '12px 6px' }}>
              <span className="info-value" style={{ paddingLeft: 20 }}>{engineInfo?.description || '-'}</span>
            </div>
          </div>

          {/* S-Note NO - 仅显示值，无值显示中划线 */}
          <div className="info-row">
            <div className="info-field" style={{ width: '100%', padding: '12px 6px' }}>
              <span className="info-value" style={{ paddingLeft: 20 }}>
                {sNoteNo || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleSpecification;
