/**
 * GenerateDocument组件 - 生成认证文档结果展示页面
 * 
 * @description 显示车辆认证相关的详细信息，包括底盘信息、订单信息、市场信息、S-Note信息、轮胎信息等。
 *              用户可以在该页面查看已生成的文档，并根据需要进行修改或下载操作。
 *              严格按照詳細設計UD04.md中定义的画面项目（项番1-16）实现。
 * 
 * @features
 * - Chassis no链接：点击跳转到VDA车辆规格页面（ID: 07）
 * - Ordernumber：显示订单号
 * - Build week：显示生产周次
 * - Spec week：显示规格周次
 * - Market：显示市场信息（CountryOfOperation from VDA）
 * - Master Market：固定显示'-EU'
 * - S-Note NO：显示S-Note编号
 * - S-Note Message：如有S-Note信息，显示固定提示
 * - Load Index：显示轮胎负载指数
 * - Modify Doc Link：当ACT值为Y时显示红色修改文档链接，点击跳转到Modify Document画面（ID: 05）
 * - Using template：显示使用的模板文件路径
 * - Replacing parameters：显示替换参数信息
 * - Generated document：提供已生成文档的下载链接
 * - Date：显示文档生成日期时间
 * - HDoc version：显示HDoc系统版本号
 * - Error message area：显示错误信息
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 敏感数据通过HTTPS加密传输
 * - 文件下载需进行权限验证
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './GenerateDocument.css';

/**
 * 文档数据接口定义
 */
interface DocumentData {
  chassisNo: string;
  ordernumber: string;
  buildWeek: string;
  specWeek: string;
  market: string;
  masterMarket: string;
  sNoteNo: string;
  loadIndex: string;
  modifyDocAct: string;
  usingTemplate: string;
  replacingParameters: Array<{
    variable: string;
    newval?: string;
  }>;
  date: string;
  hdocVersion: string;
}

/**
 * API响应成功数据结构
 */
interface DocumentResponse {
  code: number;
  data: DocumentData;
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
 * GenerateDocument组件 - 生成认证文档结果展示页面
 * 
 * @component
 * @returns {JSX.Element} 生成认证文档页面组件
 * @description 根据詳細設計UD04.md实现完整的数据展示和交互功能
 */
const GenerateDocument: React.FC = () => {
  // 路由跳转hook
  const navigate = useNavigate();
  
  // 获取location对象用于接收参数
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 文档数据状态
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 初期表示 - 获取文档数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD04.md的API规范：
   *              - Method: GET
   *              - Endpoint: /api/ud04/selectgenerateddocument
   *              - Query Parameters: chassisSeries, chassisNo
   *              
   *              成功时（200）：设置文档数据
   *              失败时：显示错误消息
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const state = location.state as any;
        const paramsFromSearch = new URLSearchParams(location.search);
        const chassisSeries = state?.chassisSeries || searchParams.get('chassisSeries') || paramsFromSearch.get('chassisSeries') || '';
        const chassisNo = state?.chassisNo || searchParams.get('chassisNo') || paramsFromSearch.get('chassisNo') || '';

        if (!chassisSeries || !chassisNo) {
          setErrorMessage('Failed to load document data. Please try again.');
          return;
        }

        const response = await apiClient.get<DocumentResponse>('/api/ud04/selectgenerateddocument', {
          params: {
            chassisSeries: chassisSeries,
            chassisNo: chassisNo
          }
        });

        if (response.data.code === 200) {
          setDocumentData(response.data.data);
        } else {
          setErrorMessage('Failed to load document data. Please try again.');
        }
      } catch (error: any) {
        if (error.response) {
          const errorData: ErrorResponse = error.response.data;
          setErrorMessage(errorData.message || 'Failed to load document data. Please try again.');
        } else if (error.request) {
          setErrorMessage('Network error. Please check your connection and try again.');
        } else {
          setErrorMessage('Request timeout. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [location.search, location.state, searchParams]);

  /**
   * 处理Chassis no链接点击事件
   * 
   * @description 按照詳細設計UD04.md的处理流程：
   *              迁移到VDA - Vehicle Specification画面（画面ID：07）
   *              传递参数：Chassis no
   */
  const handleChassisNoClick = () => {
    if (documentData?.chassisNo) {
      navigate('/Menu/vda-vehicle-specification', {
        state: {
          chassisNo: documentData.chassisNo
        }
      });
    }
  };

  /**
   * 处理Modify Doc链接点击事件
   * 
   * @description 按照詳細設計UD04.md的处理流程：
   *              迁移到Modify Document画面（画面ID：05）
   *              传递参数：Chassis no、Market
   */
  const handleModifyDocClick = () => {
    if (documentData?.chassisNo && documentData?.market) {
      navigate('/Menu/modify-document', {
        state: {
          chassisNo: documentData.chassisNo,
          market: documentData.market
        }
      });
    }
  };

  /**
   * 处理Generated document链接点击事件
   * 
   * @description 按照詳細設計UD04.md的处理流程：
   *              下载「Vin Plate」的rtf文件（含值）
   */
  const handleDownloadDocument = async () => {
    try {
      if (!documentData?.chassisNo) {
        setErrorMessage('Failed to download document. Please try again.');
        return;
      }
      
      // 调用下载API
      const response = await apiClient.get('/api/ud04/download-vin-plate', {
        params: {
          chassisNo: documentData.chassisNo
        },
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `VIN_PLATE_${documentData.chassisNo}.rtf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // 处理下载失败
      setErrorMessage('Failed to download document. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="generate-document-container">
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="generate-document-container">
      {/* 页面标题 */}
      <h1 className="page-title">Generate document</h1>
      
      {/* 错误消息区域 */}
      <div className="error-message-area">
        {errorMessage && (
          <span className="error-text">{errorMessage}</span>
        )}
        {!errorMessage && (
          <span className="error-placeholder">エラーメッセージエリア</span>
        )}
      </div>

      {/* 内容区域 */}
      <div className="content-area">
        {/* 项番1: Chassis no */}
        <div className="info-item">
          <span className="label-bold">Chassis no: </span>
          <button type="button" className="link" onClick={handleChassisNoClick}>
            {documentData?.chassisNo || '-'}
          </button>
        </div>

        {/* 项番2: Ordernumber */}
        <div className="info-item">
          <span className="label">Ordernumber: </span>
          <span className="value">{documentData?.ordernumber || '-'}</span>
        </div>

        {/* 空行 */}
        <div className="info-item-empty"></div>

        {/* 项番3: Build week */}
        <div className="info-item">
          <span className="label">Build week: </span>
          <span className="value">{documentData?.buildWeek || '-'}</span>
        </div>

        {/* 项番4: Spec week */}
        <div className="info-item">
          <span className="label">Spec week: </span>
          <span className="value">{documentData?.specWeek || '-'}</span>
        </div>

        {/* 项番5: Market */}
        <div className="info-item">
          <span className="label">Market: </span>
          <span className="value">{documentData?.market || '-'}</span>
        </div>

        {/* 项番6: Master Market */}
        <div className="info-item">
          <span className="label">Master Market: </span>
          <span className="value">{documentData?.masterMarket || '-EU'}</span>
        </div>

        {/* 空行 */}
        <div className="info-item-empty"></div>

        {/* 项番7: S-Note NO */}
        {documentData?.sNoteNo && (
          <>
            <div className="info-item">
              <span className="value">{documentData.sNoteNo}</span>
            </div>
            
            {/* 项番8: S-Note Message */}
            <div className="info-item s-note-message">
              The S-Notes above can affect homologation documents.
            </div>
          </>
        )}

        {/* 空行 */}
        <div className="info-item-empty"></div>

        {/* 项番9: Load Index */}
        {documentData?.loadIndex && (
          <div className="info-item">
            <span className="label">Front load index: </span>
            <span className="value">{documentData.loadIndex}</span>
          </div>
        )}

        {/* 项番10: Modify Doc Link */}
        {documentData?.modifyDocAct === 'Y' && (
          <div className="info-item modify-doc-link">
            <button type="button" className="link" onClick={handleModifyDocClick}>
              After def change detected. Document need to be modified.
            </button>
          </div>
        )}

        {/* 空行 */}
        <div className="info-item-empty"></div>

        {/* 项番11: Using template */}
        <div className="info-item">
          <span className="label">Using template: </span>
          <span className="value">_eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf'</span>
        </div>

        {/* 项番12: Replacing parameters */}
        {documentData?.replacingParameters && documentData.replacingParameters.length > 0 && (
          <div className="info-item">
            <span className="label-bold">Replacing parameters</span>
            <div className="parameters-list">
              {documentData.replacingParameters.map((param, index) => (
                <div key={index} className="parameter-item">
                  AD Change. Modifying: {param.variable}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 项番13: Generated document */}
        <div className="info-item generated-document">
          <button type="button" className="link" onClick={handleDownloadDocument}>
            Generated document
          </button>
        </div>

        {/* 空行 */}
        <div className="info-item-empty"></div>
        <div className="info-item-empty"></div>
        <div className="info-item-empty"></div>

        {/* 项番14: Date */}
        <div className="info-item">
          <span className="label">Date: </span>
          <span className="value">{documentData?.date || '-'}</span>
        </div>

        {/* 项番15: HDoc version */}
        <div className="info-item">
          <span className="label">HDoc version: </span>
          <span className="value">4.2.1</span>
        </div>
      </div>
    </div>
  );
};

export default GenerateDocument;
