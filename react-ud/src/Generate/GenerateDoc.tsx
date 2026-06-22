import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./GenerateDoc.css";

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

// 请求参数接口
interface GenerateDocumentRequest {
  chassisSeries: string;
  chassisNo: string;
}

// 替换参数接口
interface ReplacementParam {
  variable: string;
  newVal: string;
}

// 响应数据接口
interface GenerateDocumentData {
  orderNumber: string;
  buildWeek: string;
  specWeek: string;
  market: string;
  sNoteNo: string;
  loadIndex: string;
  adChangeActive: boolean;
  replacementParams: ReplacementParam[];
  date: string;
}

// 统一API响应接口定义
interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

/**
 * 获取生成文档数据API（GET方式）
 * @param request 请求参数（chassisSeries和chassisNo）
 * @returns Promise<ApiResponse<GenerateDocumentData>>
 */
const getGenerateDocumentApi = async (
  request: GenerateDocumentRequest,
): Promise<ApiResponse<GenerateDocumentData>> => {
  try {
    const response = await apiClient.get<ApiResponse<GenerateDocumentData>>(
      "/api/ud04/generatedocument",
      {
        params: {
          chassisSeries: request.chassisSeries,
          chassisNo: request.chassisNo,
        },
      },
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
            data?.msg || data?.message || "Failed to retrieve document data",
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

const GenerateDoc = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从路由参数中获取底盘系列和底盘号setDocumentData
  const { chassisSeries, chassisNo } = location.state || {};

  // 状态管理
  const [documentData, setDocumentData] = useState<GenerateDocumentData | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 页面初始化 - 加载时调用API获取数据
   */
  useEffect(() => {
    const initializePage = async () => {
      // 验证参数
      if (!chassisSeries || !chassisNo) {
        setErrorMessage(
          "Invalid chassis information. Please go back and select a valid chassis.",
        );
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        // 调用后端API获取生成文档数据
        const response = await getGenerateDocumentApi({
          chassisSeries,
          chassisNo,
        });

        // 结果处理 - 成功
        if (response.code === 200 && response.data) {
          setDocumentData(response.data);
          console.log(response.data);
        } else {
          // API返回失败
          const message =
            response.msg || response.message || "Failed to load document data";
          setErrorMessage(message);
          setDocumentData(null);
        }
      } catch (error: any) {
        // 结果处理 - 失败
        const status = error?.status;
        const message = error?.data?.message;

        if (status === 0) {
          // 网络错误
          setErrorMessage("System timeout, please try again later.");
        } else if (message?.includes("No data found")) {
          // 数据不存在
          setErrorMessage(
            `No data found for chassis: ${chassisSeries}${chassisNo}`,
          );
        } else {
          // 其他API错误
          setErrorMessage(
            message || "Failed to retrieve document data. Please try again.",
          );
        }

        setDocumentData(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [chassisSeries, chassisNo]);

  // 处理 Chassis no 链接点击 - 跳转到 MVDA - Vehicle Specification 画面
  const handleChassisNoClick = () => {
    navigate("/menu/mvda-vehicle-specification", {
      state: {
        chassisNo: `${chassisSeries}${chassisNo}`,
      },
    });
  };

  // 处理 Modify Doc Link 链接点击 - 跳转到 Modify Document 画面
  const handleModifyDoc = () => {
    navigate("/menu/modify-document", {
      state: {
        chassisNo: `${chassisSeries}${chassisNo}`,
        market: documentData?.market || "",
      },
    });
  };

  // 加载中状态
  if (isLoading) {
    return (
      <div className="gendoc-page-wrapper">
        <div className="gendoc-content-area">
          <h1 className="gendoc-main-title">HDoc - Generate Document</h1>
          <div className="gendoc-loading-msg">Loading document data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gendoc-page-wrapper">
      <div className="gendoc-content-area">
        <h1 className="gendoc-main-title">HDoc - Generate Document</h1>

        {/* 错误消息区域 */}
        {errorMessage && (
          <div className="gendoc-error-display" role="alert">
            {errorMessage}
          </div>
        )}

        {/* 信息展示区域 */}
        {documentData && (
          <div className="gendoc-info-block">
            {/* Chassis no - 可点击链接 */}
            <div className="gendoc-info-line">
              <span className="gendoc-label-text">Chassis no:</span>
              <span>{chassisSeries}&nbsp; - &nbsp;</span>
              <span
                className="gendoc-chassis-link"
                onClick={handleChassisNoClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleChassisNoClick();
                  }
                }}
              >
                {`${chassisNo}`}
              </span>
            </div>

            {/* Ordernumber */}
            <div className="gendoc-info-line">
              <span className="gendoc-label-text">Ordernumber:</span>
              <span className="gendoc-value-text">
                {documentData.orderNumber}
              </span>
            </div>

            {/* Build week */}
            <div className="gendoc-info-line">
              <span className="gendoc-label-text">Build week:</span>
              <span className="gendoc-value-text">
                {documentData.buildWeek}
              </span>
            </div>

            {/* Spec week */}
            <div className="gendoc-info-line">
              <span className="gendoc-label-text">Spec week:</span>
              <span className="gendoc-value-text">{documentData.specWeek}</span>
            </div>

            {/* Market */}
            <div className="gendoc-info-line">
              <span className="gendoc-label-text">Market:</span>
              <span className="gendoc-value-text">{documentData.market}</span>
            </div>

            {/* Master Market */}
            <div className="gendoc-info-line">
              <span className="gendoc-label-text">Master Market:</span>
              <span className="gendoc-value-text">-EU</span>
            </div>

            {/* S-Note NO - 独立一行，显示标签和值 */}
            <div className="gendoc-snote-no">
              <span className="gendoc-snote-value">
                {documentData.sNoteNo.replace(/ /g, "\n")}
              </span>
            </div>

            {/* S-Note Message - 红色(#ff0000) */}
            <div className="gendoc-snote-message">
              The S-Notes above can affect homologation documents.
            </div>

            {/* 轮胎信息区域 */}
            <div className="gendoc-tire-section">
              <div className="gendoc-tire-line">
                <span className="gendoc-tire-label">Front load index:</span>
                <span className="gendoc-tire-value">
                  {documentData.loadIndex}
                </span>
              </div>
              <div className="gendoc-tire-line">
                <span className="gendoc-tire-label">Front speed index:</span>
                <span className="gendoc-tire-value">FTSI-K</span>
              </div>
              <div className="gendoc-tire-line">
                <span className="gendoc-tire-label">Drive load index:</span>
                <span className="gendoc-tire-value">DTLI-147</span>
              </div>
              <div className="gendoc-tire-line">
                <span className="gendoc-tire-label">Drive speed index:</span>
                <span className="gendoc-tire-value">DTSI-K</span>
              </div>
            </div>

            {/* AD-Change警告 - 红色(#ff0000)，条件显示 */}
            {documentData.adChangeActive && (
              <div
                className="gendoc-adchange-warning"
                onClick={handleModifyDoc}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleModifyDoc();
                  }
                }}
              >
                After def change detected. Document need to be modified.
              </div>
            )}

            {/* Using template - 固定值 */}
            <div className="gendoc-template-block">
              <div className="gendoc-info-line">
                <span className="gendoc-label-text">Using template:</span>
                <span className="gendoc-value-text">
                  _eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf
                </span>
              </div>

              {/* Replacing parameters - 换行显示 */}
              {documentData.replacementParams &&
                documentData.replacementParams.length > 0 && (
                  <div className="gendoc-param-block">
                    <div className="gendoc-param-title">
                      Replacing parameters
                    </div>
                    <div className="gendoc-param-values">
                      {documentData.replacementParams.map(
                        (param: ReplacementParam, index: number) => (
                          <div key={index} className="gendoc-param-indented">
                            AD-Chang.Modifying {param.variable}: {param.newVal}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Generated document - 普通文本显示 */}
            <div className="gendoc-info-line">
              <a href="javascript:;">Generated document</a>
            </div>

            {/* Date/Version - 上边距40px */}
            <div className="gendoc-footer-section">
              <div className="gendoc-info-line">
                <span className="gendoc-label-text">Date:</span>
                <span className="gendoc-value-text">{documentData.date}</span>
              </div>

              <div className="gendoc-info-line">
                <span className="gendoc-label-text">HDoc version:</span>
                <span className="gendoc-value-text">4.2.1</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateDoc;
