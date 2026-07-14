// SaveModifications.tsx - UD06模块
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import "./SaveModifications.css";

interface ModificationData {
  chassisSerie: string;
  chassisNumber: string;
  doctype: string;
  version: string;
  storingList: string[];
  foundUnreleasedVersion: string;
  message: string;
}

const SaveModifications: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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

      // 前端校验：与后端保持一致
      if (!chassisSerieParam || chassisSerieParam.trim() === "") {
        setErrorMessage("Chassis serie不能为空");
        setIsLoading(false);
        return;
      }

      if (chassisSerieParam.trim().length !== 4) {
        setErrorMessage("Chassis serie长度必须为4位");
        setIsLoading(false);
        return;
      }

      if (!chassisNumberParam || chassisNumberParam.trim() === "") {
        setErrorMessage("Chassis number不能为空");
        setIsLoading(false);
        return;
      }

      if (!/^[a-zA-Z0-9]+$/.test(chassisNumberParam.trim())) {
        setErrorMessage("Chassis number只能包含字母和数字");
        setIsLoading(false);
        return;
      }

      // 先从location state获取前画面传过来的修改变量列表
      const savedVars = (
        location.state as
          | { savedVariables?: Array<{ variable: string; newval: string }> }
          | undefined
      )?.savedVariables;

      // 使用URL参数设置基本信息
      const modificationInfo: ModificationData = {
        chassisSerie: chassisSerieParam,
        chassisNumber: chassisNumberParam,
        doctype: "-",
        version: "-",
        storingList: [],
        foundUnreleasedVersion: "0",
        message: "VERSION IS RELEASED",
      };

      // 始终调用API获取Doctype/Version等基本信息
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";
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

      if (data.code === 200 && data.data) {
        const list = data.data.modificationList || [];

        if (list.length > 0) {
          const firstRecord = list[0];
          modificationInfo.doctype =
            firstRecord.doctype ?? firstRecord.DOCTYPE ?? "-";
          modificationInfo.version =
            firstRecord.vers ?? firstRecord.VERS ?? "-";
          modificationInfo.foundUnreleasedVersion =
            firstRecord.vers ?? firstRecord.VERS ?? "0";

          // Storing列表：优先使用location state中的变量（从ModifyDocument画面传递过来的）
          // 这样只显示本次修改的记录，而非数据库中的所有记录
          if (savedVars && savedVars.length > 0) {
            modificationInfo.storingList = savedVars.map(
              (v) => `${v.variable} ${v.newval}`,
            );
          } else {
            // 无state时使用API返回的所有记录
            modificationInfo.storingList = list.map(
              (record: Record<string, unknown>) =>
                `${record.variable ?? record.VARIABLE ?? "-"} ${record.newval ?? record.NEWVAL ?? "-"}`,
            );
          }
        } else {
          console.warn("No modification records found for this chassis");
        }
      } else {
        throw new Error(data.msg || "Failed to load modification data");
      }

      setModificationData(modificationInfo);
    } catch (error) {
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
            <span className='sm-value sm-storing-list'>
              {modificationData?.storingList &&
              modificationData.storingList.length > 0
                ? modificationData.storingList.map((item, idx) => (
                    <div key={idx} className='sm-storing-item'>
                      {item}
                    </div>
                  ))
                : "-"}
            </span>
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
