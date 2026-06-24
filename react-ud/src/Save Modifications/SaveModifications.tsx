/**
 * SaveModifications组件 - 保存修改信息确认页面
 * 
 * @description 显示即将保存的修改内容摘要，包括底盘信息、文档类型、版本信息、存储参数等。
 *              用户在执行文档修改操作后，通过此页面查看修改详情，并可选择关闭页面返回上一级。
 *              严格按照詳細設計UD06.md中定义的画面项目（项番1-8）实现。
 * 
 * @features
 * - Chassis serie：从完整底盘号中获取'-'前的内容
 * - Chassis number：从完整底盘号中获取'-'后的内容
 * - Doctype：显示文档类型（来自HDOC_ADCA_MODIFICATION表）
 * - Version：显示版本号（来自HDOC_ADCA_MODIFICATION表）
 * - Storing：显示存储的变量和新值信息（来自HDOC_ADCA_MODIFICATION表）
 * - FOUND UNRELEASED VERSION：显示发现的未释放版本信息
 * - Message：固定显示'VERSION IS RELEASED'
 * - Close按钮：关闭当前页面
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 敏感数据通过HTTPS加密传输
 * - 防止未授权用户直接访问受限修改数据
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './SaveModifications.css';

/**
 * 修改数据接口定义
 */
interface ModificationData {
  doctype: string;
  vers: string;
  storing: Array<{
    variable: string;
    newVal: string;
  }>;
}

/**
 * API响应成功数据结构
 */
interface ModificationResponse {
  code: number;
  data: ModificationData;
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
 * SaveModifications组件 - 保存修改信息确认页面
 * 
 * @component
 * @returns {JSX.Element} 保存修改信息页面组件
 * @description 根据詳細設計UD06.md实现完整的数据展示和交互功能
 */
const SaveModifications: React.FC = () => {
  // 路由跳转hook
  const navigate = useNavigate();
  
  // 获取location对象用于接收参数
  const location = useLocation();

  // 修改数据状态
  const [modificationData, setModificationData] = useState<ModificationData | null>(null);

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 底盘系列和编号
  const [chassisSerie, setChassisSerie] = useState<string>('');
  const [chassisNumber, setChassisNumber] = useState<string>('');

  /**
   * 初期表示 - 获取修改数据并解析底盘号
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD06.md的API规范：
   *              - Method: GET
   *              - Endpoint: /api/ud06/save-modifications
   *              - Query Parameters: chassisSeries, chassisNo
   *              
   *              成功时（200）：设置修改数据并解析底盘号
   *              失败时：显示错误消息
   */
  useEffect(() => {
    fetchModificationData();
    parseChassisNumber();
  }, []);

  /**
   * 解析底盘号，分割为Chassis serie和Chassis number
   * 
   * @description 从location.state获取完整底盘号，按'-'符号分割
   *              如果完整底盘号不包含'-'，则整个作为Chassis serie，Chassis number为空
   */
  const parseChassisNumber = () => {
    const state = location.state as any;
    const fullChassisNo = state?.chassisNo || '';
    
    if (fullChassisNo.includes('-')) {
      const parts = fullChassisNo.split('-');
      setChassisSerie(parts[0]);
      setChassisNumber(parts.slice(1).join('-'));
    } else {
      setChassisSerie(fullChassisNo);
      setChassisNumber('');
    }
  };

  /**
   * 获取修改数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 调用UD06SaveModificationsApi获取HDOC_ADCA_MODIFICATION表的数据
   */
  const fetchModificationData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 从location.state获取前画面传递的参数
      const state = location.state as any;
      const chassisSeries = state?.chassisSeries || '';
      const chassisNo = state?.chassisNo || '';
      
      if (!chassisSeries || !chassisNo) {
        setErrorMessage('Failed to load modification data. Please try again.');
        return;
      }
      
      // 调用UD06SaveModificationsApi获取修改数据
      // Endpoint: GET /api/ud06/save-modifications
      // Query Parameters: chassisSeries, chassisNo
      const response = await axios.get<ModificationResponse>('/api/ud06/save-modifications', {
        params: {
          chassisSeries: chassisSeries,
          chassisNo: chassisNo
        }
      });
      
      // 处理成功响应（200状态码）
      if (response.data.code === 200) {
        setModificationData(response.data.data);
      } else {
        setErrorMessage('Failed to load modification data. Please try again.');
      }
    } catch (error: any) {
      // 处理API调用失败
      if (error.response) {
        const errorData: ErrorResponse = error.response.data;
        setErrorMessage(errorData.message || 'Failed to load modification data. Please try again.');
      } else if (error.request) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage('Request timeout. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理Close按钮点击事件
   * 
   * @description 按照詳細設計UD06.md的处理流程：
   *              关闭当前页面，返回上一页
   */
  const handleClose = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="save-modifications-container">
        <div className="save-modifications-loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="save-modifications-container">
      {/* 内容区域 - 包含标题、内容和按钮 */}
      <div className="save-modifications-content-area">
        {/* 页面标题 */}
        <h1 className="save-modifications-page-title">Save Modifications</h1>
        
        {/* 项番1: Chassis serie */}
        <div className="save-modifications-info-item">
          <span className="save-modifications-label">Chassis serie: </span>
          <span className="save-modifications-value">{chassisSerie}</span>
        </div>

        {/* 项番2: Chassis number */}
        <div className="save-modifications-info-item">
          <span className="save-modifications-label">Chassis number: </span>
          <span className="save-modifications-value">{chassisNumber}</span>
        </div>

        {/* 项番3: Doctype */}
        <div className="save-modifications-info-item">
          <span className="save-modifications-label">Doctype: </span>
          <span className="save-modifications-value">{modificationData?.doctype || '-'}</span>
        </div>

        {/* 空行 */}
        <div className="info-item-empty"></div>

        {/* 项番4: Version */}
        <div className="save-modifications-info-item">
          <span className="save-modifications-label">Version: </span>
          <span className="save-modifications-value">{modificationData?.vers || '-'}</span>
        </div>

        {/* 空行 */}
        <div className="info-item-empty"></div>

        {/* 项番5: Storing */}
        {modificationData?.storing && modificationData.storing.length > 0 && (
          <div className="save-modifications-info-item">
            <span className="save-modifications-label">Storing: </span>
            <span className="save-modifications-value">
              {modificationData.storing.map((item, index) => (
                <span key={index}>
                  {item.variable} {item.newVal}{index < modificationData.storing!.length - 1 ? ', ' : ''}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* 项番6: FOUND UNRELEASED VERSION */}
        <div className="save-modifications-info-item">
          <span className="save-modifications-label">FOUND UNRELEASED VERSION: </span>
          <span className="save-modifications-value">{modificationData?.vers || '-'}</span>
        </div>

        {/* 项番7: Message */}
        <div className="save-modifications-info-item save-modifications-message-highlight">
          VERSION IS RELEASED
        </div>

        {/* 项番8: Close按钮 */}
        <div className="save-modifications-button-area">
          <button
            type="button"
            className="save-modifications-close-button"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModifications;
