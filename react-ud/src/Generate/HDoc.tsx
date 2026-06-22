import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HDoc.css";

// API基础URL配置
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

// 文档类型接口定义
interface DocumentType {
  doctype: string;
}

// 统一API响应接口定义
interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

/**
 * 获取文档类型列表API (UD03SelectHdocdocumentlistApi)
 * @returns Promise<ApiResponse<DocumentType[]>>
 */
const getDoctypeListApi = async (): Promise<ApiResponse<DocumentType[]>> => {
  try {
    const response = await apiClient.get<ApiResponse<DocumentType[]>>(
      "/api/UD03/selecthdocdocumentlist",
    );

    return response.data;
  } catch (error: any) {
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response;

      throw {
        status,
        data: {
          code: status,
          message:
            data?.msg || data?.message || "Failed to fetch document types",
        },
      };
    } else if (error.request) {
      // 网络错误或超时
      throw {
        status: 0,
        data: {
          code: 0,
          message: "Network error. Please check your connection.",
        },
      };
    } else {
      // 其他错误
      throw {
        status: 500,
        data: {
          code: 500,
          message: "Unknown error",
        },
      };
    }
  }
};

const Generate: React.FC = () => {
  const [chassisSeries, setChassisSeries] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 页面初始化
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);

      try {
        // 从本地存储读取上次的检索条件
        const lastChassisSeries =
          localStorage.getItem("lastChassisSeries") || "";
        const lastChassisNo = localStorage.getItem("lastChassisNo") || "";
        const lastDocumentType = localStorage.getItem("lastDocumentType") || "";

        setChassisSeries(lastChassisSeries);
        setChassisNo(lastChassisNo);

        // 调用后端 API 获取文档类型列表
        const response = await getDoctypeListApi();

        if (
          response.code === 200 &&
          response.data &&
          response.data.length > 0
        ) {
          setDocumentTypes(response.data);

          // 如果上次选择的值在列表中，则保持选中；否则选中第一项
          const lastTypeExists = response.data.some(
            (item) => item.doctype === lastDocumentType,
          );
          if (lastTypeExists) {
            setDocumentType(lastDocumentType);
          } else {
            setDocumentType(response.data[0].doctype);
          }

          setErrorMessage("");
        } else {
          // API 返回数据为空（0件）
          setErrorMessage("Chassis no is not exists");
          setDocumentTypes([]);
          setDocumentType("");
        }
      } catch (error: any) {
        // 网络错误或系统错误
        setErrorMessage("Network error. Please try again.");
        setDocumentTypes([]);
        setDocumentType("");
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, []);

  // 前端校验
  const validateForm = (): boolean => {
    // 空值校验
    if (!chassisSeries.trim()) {
      setErrorMessage("Chassis series is required.");
      return false;
    }

    if (!chassisNo.trim()) {
      setErrorMessage("Chassis no is required.");
      return false;
    }

    if (!documentType) {
      setErrorMessage("Document type is required.");
      return false;
    }

    // 格式校验（半角英文）
    const chassisSeriesRegex = /^[a-zA-Z]+$/;
    if (!chassisSeriesRegex.test(chassisSeries.trim())) {
      setErrorMessage("Invalid format for Chassis series.");
      return false;
    }

    // 格式校验（半角数字）
    const chassisNoRegex = /^[0-9]+$/;
    if (!chassisNoRegex.test(chassisNo.trim())) {
      setErrorMessage("Invalid format for Chassis no.");
      return false;
    }

    return true;
  };

  // 提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    // 保存当前输入到本地存储
    localStorage.setItem("lastChassisSeries", chassisSeries.trim());
    localStorage.setItem("lastChassisNo", chassisNo.trim());
    localStorage.setItem("lastDocumentType", documentType);

    // 跳转到 Generate document 画面
    navigate("/menu/GenerateDoc", {
      state: {
        chassisSeries: chassisSeries.trim(),
        chassisNo: chassisNo.trim(),
        documentType: documentType,
      },
    });
  };

  // 重置处理
  const handleReset = () => {
    setChassisSeries("");
    setChassisNo("");
    setDocumentType("");
    setErrorMessage("");

    // 清除本地存储
    localStorage.removeItem("lastChassisSeries");
    localStorage.removeItem("lastChassisNo");
    localStorage.removeItem("lastDocumentType");
  };

  // 帮助按钮处理
  const handleHelp = () => {
    navigate("/help");
  };

  return (
    <div className="generate-container">
      <div className="generate-content">
        <h1 className="page-title">HDoc - Generate Homologation Document</h1>

        <form onSubmit={handleSubmit}>
          {/* 错误消息区域 */}
          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}
          <div className="generate-form">
            <div className="form-group">
              <label htmlFor="chassisSeries">Chassis series</label>
              <input
                type="text"
                id="chassisSeries"
                value={chassisSeries}
                onChange={(e) => setChassisSeries(e.target.value)}
                maxLength={5}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="chassisNo">Chassis no</label>
              <input
                type="text"
                id="chassisNo"
                value={chassisNo}
                onChange={(e) => setChassisNo(e.target.value)}
                maxLength={10}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="documentType">Document type</label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="form-select"
                disabled={isLoading || documentTypes.length === 0}
              >
                {documentTypes.map((item) => (
                  <option key={item.doctype} value={item.doctype}>
                    {item.doctype}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 按钮组 */}
          <div className="button-group">
            <button
              type="submit"
              className="btn1 btn-submit"
              disabled={isLoading}
            >
              Submit
            </button>
            <button
              type="button"
              className="btn1 btn-reset"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </button>
            <button
              type="button"
              className="btn1 btn-help"
              onClick={handleHelp}
              disabled={isLoading}
            >
              Help
            </button>
          </div>
        </form>
        {/* 支持邮箱信息 */}
        <div className="support-info">
          <p>HDoc Support: support.tpi@example.com</p>
        </div>
      </div>
    </div>
  );
};

export default Generate;
