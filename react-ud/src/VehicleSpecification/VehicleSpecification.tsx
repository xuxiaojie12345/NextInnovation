// VehicleSpecification.tsx - UD07模块
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./VehicleSpecification.css";

interface VehicleInfo {
  model: string;
  builtWeek: string;
  customerAdap: string;
  productType: string;
  vin: string;
  countryOfOperation: string;
  familyId: string;
  variantId: string;
}

interface VariantItem {
  symbol: string;
  description: string;
  functionGroup: string;
}

const VehicleSpecification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chassisNo, setChassisNo] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [variantList, setVariantList] = useState<VariantItem[]>([]);
  const [engineNo, setEngineNo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 页面初始化：获取参数并加载数据
  useEffect(() => {
    fetchVehicleData();
  }, []);

  // 获取车辆规格数据
  const fetchVehicleData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 从URL参数获取Chassis no
      const chassisNoParam = searchParams.get("chassisNo");

      console.log("Chassis no:", chassisNoParam);

      // 前端校验：检查参数是否为空
      if (!chassisNoParam || chassisNoParam.trim() === "") {
        setErrorMessage("未指定Chassis编号");
        setIsLoading(false);
        return;
      }

      setChassisNo(chassisNoParam);

      // 调用UD07 API
      const API_BASE_URL = "http://localhost:8081";
      const response = await fetch(
        `${API_BASE_URL}/api/UD07/vehicleSpecification?chassisNo=${encodeURIComponent(chassisNoParam)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("未找到对应的车辆信息");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("API response:", data);

      if (data.code === 200 && data.data) {
        // 设置车辆基本信息
        if (data.data.vehicleInfo) {
          setVehicleInfo(data.data.vehicleInfo);
        }

        // 设置变体列表
        if (data.data.variantInfo && data.data.variantInfo.list) {
          setVariantList(data.data.variantInfo.list);
        }

        // 设置发动机编号
        if (data.data.engineNo) {
          setEngineNo(data.data.engineNo);
        } else {
          setEngineNo("N/A");
        }
      } else {
        throw new Error(data.msg || "Failed to load vehicle data");
      }
    } catch (error) {
      console.error("Fetch vehicle data error:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("系统内部错误，请联系管理员");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='vs-container'>
        <div className='vs-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='vs-container'>
      {/* 边框容器 */}
      <div className='vs-border-box'>
        {/* 标题 */}
        <h1 className='vs-title'>VDA - Vehicle Specification:</h1>

        {/* 错误消息显示 */}
        {errorMessage && <div className='vs-error-message'>{errorMessage}</div>}

        {/* 基本信息区域 */}
        <div className='vs-info-section'>
          <div className='vs-info-row'>
            <div className='vs-info-col'>
              <span className='vs-label'>Chassis no:</span>
              <span className='vs-value'>{chassisNo}</span>
            </div>
            <div className='vs-info-col'>
              <span className='vs-label'>Model:</span>
              <span className='vs-value'>{vehicleInfo?.model || "-"}</span>
            </div>
          </div>
          <div className='vs-info-row'>
            <div className='vs-info-col'>
              <span className='vs-label'>Built week:</span>
              <span className='vs-value'>{vehicleInfo?.builtWeek || "-"}</span>
            </div>
            <div className='vs-info-col'>
              <span className='vs-label'>Product type:</span>
              <span className='vs-value'>{vehicleInfo?.productType || "-"}</span>
            </div>
          </div>
          <div className='vs-info-row'>
            <div className='vs-info-col'>
              <span className='vs-label'>VIN:</span>
              <span className='vs-value'>{vehicleInfo?.vin || "-"}</span>
            </div>
            <div className='vs-info-col'>
              <span className='vs-label'>Engine no:</span>
              <span className='vs-value'>{engineNo}</span>
            </div>
          </div>
          <div className='vs-info-row'>
            <div className='vs-info-col-full'>
              <span className='vs-label'>Country of Operation:</span>
              <span className='vs-value'>
                {vehicleInfo?.countryOfOperation || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* SYMBOL_STR表格区域 */}
        <div className='vs-variant-section'>
          <div className='vs-variant-grid'>
            {variantList.map((variant, index) => (
              <div key={index} className='vs-variant-item'>
                <span
                  className='vs-symbol'
                  title={variant.description} // tooltip显示DESCRIPTION
                >
                  {variant.symbol}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* S-Note NO区域 */}
        <div className='vs-snote-section'>
          <div className='vs-snote-content'>
            {vehicleInfo?.customerAdap || "-"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleSpecification;
