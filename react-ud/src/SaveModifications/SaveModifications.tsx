// SaveModifications.tsx - UD06模块
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SaveModifications.css";

interface ModificationData {
  chassisSerie: string;
  chassisNumber: string;
  doctype: string;
  version: string;
  storing: string;
  foundUnreleasedVersion: string;
  message: string;
}

const SaveModifications = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [modificationData, setModificationData] =
    useState<ModificationData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 页面初始化：获取参数并加载数据
  useEffect(() => {
    fetchModificationData();
  }, []);

  // 获取修改内容数据
  const fetchModificationData = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 从URL参数获取Chassis serie和Chassis number
      const chassisSerieParam = searchParams.get("chassisSerie");
      const chassisNumberParam = searchParams.get("chassisNumber");

      console.log("Chassis serie:", chassisSerieParam);
      console.log("Chassis number:", chassisNumberParam);

      // 前端校验：检查参数是否为空
      if (!chassisSerieParam || chassisSerieParam.trim() === "") {
        setErrorMessage("Chassis serie不能为空");
        setIsLoading(false);
        return;
      }

      if (!chassisNumberParam || chassisNumberParam.trim() === "") {
        setErrorMessage("Chassis number不能为空");
        setIsLoading(false);
        return;
      }

      // 调用UD06 API
      const API_BASE_URL = "http://localhost:8081";
      const response = await fetch(
        `${API_BASE_URL}/api/UD06/saveModifications?chassisSerie=${encodeURIComponent(chassisSerieParam)}&chassisNumber=${encodeURIComponent(chassisNumberParam)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("未找到对应的修改记录");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("========== API Response Debug ==========");
      console.log("Full response:", JSON.stringify(data, null, 2));
      console.log("data.code:", data.code);
      console.log("data.data:", data.data);
      console.log("data.data.modificationList:", data.data?.modificationList);
      console.log("========================================");

      if (data.code === 200 && data.data) {
        // 处理返回的数据
        const modificationList = data.data.modificationList || [];
        console.log("modificationList length:", modificationList.length);

        // 即使没有数据，也设置基本信息（从URL参数获取）
        const modificationInfo: ModificationData = {
          chassisSerie: chassisSerieParam,
          chassisNumber: chassisNumberParam,
          doctype: "-",
          version: "-",
          storing: "-",
          foundUnreleasedVersion: "0",
          message: "VERSION IS RELEASED",
        };

        // 如果有数据，填充具体值
        if (modificationList.length > 0) {
          const firstRecord = modificationList[0];
          console.log("========== First Record Debug ==========");
          console.log("firstRecord:", JSON.stringify(firstRecord, null, 2));
          console.log("firstRecord.doctype:", firstRecord.doctype);
          console.log("firstRecord.vers:", firstRecord.vers);
          console.log("firstRecord.variable:", firstRecord.variable);
          console.log("firstRecord.newval:", firstRecord.newval);
          console.log("========================================");

          // 构建Storing字段：VARIABLE NEWVAL (注意：后端返回的是小写字段名，中间用空格分隔)
          const storingValue = `${firstRecord.variable} ${firstRecord.newval}`;

          modificationInfo.doctype = firstRecord.doctype || "-";
          modificationInfo.version = firstRecord.vers || "-";
          modificationInfo.storing = storingValue;
          modificationInfo.foundUnreleasedVersion = firstRecord.vers || "0";

          console.log(
            "Final modificationInfo:",
            JSON.stringify(modificationInfo, null, 2),
          );
        } else {
          console.warn("No modification records found for this chassis");
        }

        setModificationData(modificationInfo);
      } else {
        throw new Error(data.msg || "Failed to load modification data");
      }
    } catch (error) {
      console.error("Fetch modification data error:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("系统错误，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Close按钮处理
  const handleClose = () => {
    // 返回到前一个画面（使用浏览器历史）
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className='sm-container'>
        <div className='sm-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='sm-container'>
      {/* 边框容器 */}
      <div className='sm-border-box'>
        {/* 标题 */}
        <h1 className='sm-title'>Save Modifications</h1>

        {/* 基本信息区域 */}
        <div className='sm-info-section'>
          <div className='sm-info-row'>
            <span className='sm-label'>Chassis serie:</span>
            <span className='sm-value'>{modificationData?.chassisSerie}</span>
          </div>
          <div className='sm-info-row'>
            <span className='sm-label'>Chassis number:</span>
            <span className='sm-value'>{modificationData?.chassisNumber}</span>
          </div>
          <div className='sm-info-row'>
            <span className='sm-label'>Doctype:</span>
            <span className='sm-value'>{modificationData?.doctype}</span>
          </div>
          <div className='sm-info-row'>
            <span className='sm-label'>Version:</span>
            <span className='sm-value'>{modificationData?.version}</span>
          </div>
          <div className='sm-info-row sm-spacer'></div>
          <div className='sm-info-row'>
            <span className='sm-label'>Storing:</span>
            <span className='sm-value'>{modificationData?.storing}</span>
          </div>
          <div className='sm-info-row'>
            <span className='sm-label'>FOUND UNRELEASED VERSION:</span>
            <span className='sm-value'>
              {modificationData?.foundUnreleasedVersion}
            </span>
          </div>
          <div className='sm-info-row'>
            <span className='sm-message-highlight'>
              {modificationData?.message}
            </span>
          </div>
        </div>

        {/* 错误消息显示 */}
        {errorMessage && <div className='sm-error-message'>{errorMessage}</div>}

        {/* Close按钮 */}
        <div className='sm-button-bar'>
          <button
            type='button'
            onClick={handleClose}
            disabled={isLoading}
            className='sm-close-btn'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModifications;
