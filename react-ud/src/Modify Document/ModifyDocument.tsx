/**
 * ModifyDocument组件 - 文档修改功能核心页面
 * 
 * @description 显示和编辑文档模板中的变量值，用户可以查看当前值并在Modified value字段中输入新值。
 *              该页面支持下载无值版的模板文件，并提供保存修改内容的功能。
 *              严格按照详细设计UD05.md中定义的画面项目（项番1-8）实现。
 * 
 * @features
 * - Chassis no链接：点击跳转到VDA车辆规格页面（ID: 07）
 * - Market：显示市场信息
 * - Template文件链接：点击下载无值版Vin Plate rtf文件
 * - Variable表格：显示变量名称列表
 * - Description表格：显示变量的描述信息
 * - Current value表格：显示变量的当前值
 * - Modified value输入框：用户输入修改后的值（最大500字符）
 * - Save按钮：保存修改内容并跳转到Save Modifications画面（ID: 06）
 * 
 * @security
 * - 仅已认证用户可以访问此页面
 * - 敏感数据通过HTTPS加密传输
 * - 修改操作需进行权限验证
 * - 输入内容进行长度校验（最大500字符）
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ModifyDocument.css';

/**
 * 变量数据接口定义
 */
interface VariableData {
  variable: string;
  description: string;
  newval: string;
}

/**
 * API响应成功数据结构
 */
interface VariableResponse {
  code: number;
  data: {
    variables: VariableData[];
  };
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
 * ModifyDocument组件 - 文档修改功能核心页面
 * 
 * @component
 * @returns {JSX.Element} 文档修改页面组件
 * @description 遵循详细设计UD05.md实现完整的数据显示和交互功能
 */
const ModifyDocument: React.FC = () => {
  // 路由跳转hook
  const navigate = useNavigate();
  
  // 获取location对象以接收参数
  const location = useLocation();

  // 变量数据状态
  const [variables, setVariables] = useState<VariableData[]>([]);

  // 修改值状态
  const [modifiedValues, setModifiedValues] = useState<{[key: string]: string}>({});

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 底盘号和市场的信息
  const [chassisNo, setChassisNo] = useState<string>('');
  const [market, setMarket] = useState<string>('');

  /**
   * 初始化显示 - 获取变量数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 遵循详细设计UD05.md的API规范：
   *              - 方法: GET
   *              - 端点: /api/ud05/select-variable-modification
   *              - 查询参数: chassisSeries, chassisNo
   *              
   *              成功时（200）：设置变量数据
   *              失败时：显示错误消息
   */
  useEffect(() => {
    fetchVariableData();
    parseLocationParams();
  }, []);

  /**
   * 解析location参数
   * 
   * @description 从location.state获取从前一页面接收到的chassis no和market
   */
  const parseLocationParams = () => {
    const state = location.state as any;
    setChassisNo(state?.chassisNo || '');
    setMarket(state?.market || '');
  };

  /**
   * 获取变量数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 调用UD05SelectVariableModification获取以下表的数据：
   *              - HDOC_ADCA_MODIFICATION
   *              - HDOC_VARIABLES
   */
  const fetchVariableData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 从location.state获取从前一页面接收到的参数
      const state = location.state as any;
      const chassisSeries = state?.chassisSeries || '';
      const chassisNo = state?.chassisNo || '';
      
      if (!chassisSeries || !chassisNo) {
        setErrorMessage('Failed to load modification data. Please try again.');
        return;
      }
      
      // 调用UD05SelectVariableModification获取变量数据
      // 端点: GET /api/ud05/select-variable-modification
      // 查询参数: chassisSeries, chassisNo
      const response = await axios.get<VariableResponse>('/api/ud05/select-variable-modification', {
        params: {
          chassisSeries: chassisSeries,
          chassisNo: chassisNo
        }
      });
      
      // 处理成功响应（200状态码）
      if (response.data.code === 200) {
        setVariables(response.data.data.variables);
        
        // 初始化modifiedValues为空对象
        const initialModifiedValues: {[key: string]: string} = {};
        response.data.data.variables.forEach((item: VariableData) => {
          initialModifiedValues[item.variable] = '';
        });
        setModifiedValues(initialModifiedValues);
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
   * Modified value输入框变更事件处理
   * 
   * @param {string} variable - 变量名
   * @param {string} value - 输入的值
   * @description 实时更新modifiedValues状态，并进行长度检查（最大500字符）
   */
  const handleModifiedValueChange = (variable: string, value: string) => {
    // 长度检查：最大500字符
    if (value.length > 500) {
      setErrorMessage('Input exceeds maximum length of 500 characters.');
      return;
    }
    
    // 清除之前的错误消息
    setErrorMessage('');
    
    // 更新modifiedValues状态
    setModifiedValues(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  /**
   * Save按钮点击事件处理
   * 
   * @async
   * @returns {Promise<void>}
   * @description 遵循详细设计UD05.md的处理流程：
   *              1. 前端检查：检查所有Modified value字段是否为空
   *              2. 如果全部为空，显示“NO UNRELEASED VERSION EXISTS!”并结束
   *              3. 调用UD05UpdateHdocAdcaModification API保存修改
   *              4. 成功后，跳转到Save Modifications画面（ID: 06）
   */
  const handleSave = async () => {
    // 前端检查：检查是否有修改值
    const hasModifications = Object.values(modifiedValues).some(value => value.trim() !== '');
    
    if (!hasModifications) {
      setErrorMessage('NO UNRELEASED VERSION EXISTS!');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // 构建修改数据
      const modifiedData = Object.keys(modifiedValues)
        .filter(key => modifiedValues[key].trim() !== '')
        .map(key => ({
          variable: key,
          newValue: modifiedValues[key]
        }));
      
      // 调用UD05UpdateHdocAdcaModification保存修改
      // 端点: PUT /api/ud05/update-hdoc-adca-modification
      const response = await axios.put('/api/ud05/update-hdoc-adca-modification', {
        modifiedValue: modifiedData
      });
      
      // 处理成功响应
      if (response.data.code === 200) {
        // 跳转到Save Modifications画面（ID: 06）
        navigate('/save-modifications', {
          state: {
            chassisSeries: chassisNo.split('-')[0],
            chassisNo: chassisNo
          }
        });
      } else {
        setErrorMessage('Failed to save modifications. Please try again.');
      }
    } catch (error: any) {
      // 处理API调用失败
      if (error.response) {
        const errorData: ErrorResponse = error.response.data;
        setErrorMessage(errorData.message || 'Failed to save modifications. Please try again.');
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
   * Chassis no链接点击事件处理
   * 
   * @description 遵循详细设计UD05.md的处理流程：
   *              跳转到VDA - Vehicle Specification画面（画面ID：07）
   *              传递参数：Chassis no
   */
  const handleChassisNoClick = () => {
    if (chassisNo) {
      navigate('/vda-vehicle-specification', {
        state: {
          chassisNo: chassisNo
        }
      });
    }
  };

  /**
   * Template文件链接点击事件处理
   * 
   * @async
   * @returns {Promise<void>}
   * @description 遵循详细设计UD05.md的处理流程：
   *              下载“Vin Plate”rtf文件（无值版）
   */
  const handleDownloadTemplate = async () => {
    try {
      // 调用下载API
      const response = await axios.get('/api/ud05/download-template', {
        responseType: 'blob'
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'VIN_PLATE_TEMPLATE.rtf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      // 处理下载失败
      setErrorMessage('Failed to download template file. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="ud05-modify-document-container">
        <div className="ud05-loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud05-modify-document-container">
      {/* 内容区域 */}
      <div className="ud05-content-area">
        {/* 页面标题 */}
        <h1 className="ud05-page-title">Modify Document</h1>
        
        {/* 错误消息区域 */}
        {errorMessage && (
          <div className="ud05-error-message-area">
            <span className="ud05-error-text">{errorMessage}</span>
          </div>
        )}

        {/* 项番1: Chassis no */}
        <div className="ud05-info-item">
          <span className="ud05-label-bold">Chassis no: </span>
          <a href="#" className="ud05-link" onClick={(e) => { e.preventDefault(); handleChassisNoClick(); }}>
            {chassisNo}
          </a>
        </div>

        {/* 项番2: Market */}
        <div className="ud05-info-item">
          <span className="ud05-label">Market: </span>
          <span className="ud05-value">{market}</span>
        </div>

        {/* 空行 */}
        <div className="ud05-info-item-empty"></div>

        {/* 项番3: Template文件 */}
        <div className="ud05-info-item">
          <span className="ud05-label">Template: </span>
          <a href="#" className="ud05-link" onClick={(e) => { e.preventDefault(); handleDownloadTemplate(); }}>
            aus/UD_TEST.odt
          </a>
        </div>

        {/* 空行 */}
        <div className="ud05-info-item-empty"></div>

        {/* 表格区域 */}
        <div className="ud05-table-container">
          <table className="ud05-data-table">
            {/* 项番8: Save按钮 */}
            <thead>
              <tr>
                <th colSpan={4}>
                  <button
                    type="button"
                    className="ud05-save-button"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </th>
              </tr>
            </thead>            
            <thead>
              <tr>
                <th className="ud05-col-variable">Variable</th>
                <th className="ud05-col-description">Description</th>
                <th className="ud05-col-current">Current value</th>
                <th className="ud05-col-modified">Modified value</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((item, index) => (
                <tr key={index}>
                  {/* 项番4: Variable */}
                  <td className="ud05-col-variable">{item.variable}</td>
                  
                  {/* 项番5: Description */}
                  <td className="ud05-col-description">{item.description}</td>
                  
                  {/* 项番6: Current value */}
                  <td className="ud05-col-current">{item.newval}</td>
                  
                  {/* 项番7: Modified value */}
                  <td className="ud05-col-modified">
                    <input
                      type="text"
                      className="ud05-modified-input"
                      value={modifiedValues[item.variable] || ''}
                      onChange={(e) => handleModifiedValueChange(item.variable, e.target.value)}
                      maxLength={500}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModifyDocument;
