/**
 * GenerateHomologationDocument组件 - 生成认证文档输入页面
 * 
 * @description 提供生成认证文档的输入功能，用户通过输入底盘系列、底盘编号和选择文档类型来生成认证文档。
 *              严格按照詳細設計UD03.md中定义的画面项目（项番1-8）实现。
 * 
 * @features
 * - Chassis series输入框（必填，最大5字符，半角英字）
 * - Chassis no输入框（必填，最大10字符，半角数字）
 * - Document type下拉列表（必填，数据源HDOC_DOCUMENT_LIST表）
 * - Submit按钮：提交表单，跳转到Generate document画面（ID: 04）
 * - Reset按钮：清空所有输入内容
 * - Help按钮：跳转到帮助页面（ID: 24）
 * - Support Mail显示：HDoc support: support.tpi@xxx.com
 * - Error message area：显示错误信息
 * - 从后续画面返回时，默认显示上次输入的条件
 * 
 * @security
 * - 所有输入字段进行前端校验
 * - API调用使用HTTPS协议
 * - 统一的错误提示信息
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './GenerateHomologationDocument.css';

/**
 * 表单数据接口定义
 */
interface FormData {
  chassisSeries: string;
  chassisNo: string;
  documentType: string;
}

/**
 * Document type选项接口定义
 */
interface DocumentTypeOption {
  doctype: string;
  description: string;
}

/**
 * API响应成功数据结构
 */
interface DocumentListResponse {
  code: number;
  msg?: string;
  data: DocumentTypeOption[];
}

/**
 * API响应错误数据结构
 */
interface ErrorResponse {
  code: number;
  msg?: string;
  message?: string;
  errorCode?: string;
}

/**
 * GenerateHomologationDocument组件 - 生成认证文档输入页面
 * 
 * @component
 * @returns {JSX.Element} 生成认证文档页面组件
 * @description 根据詳細設計UD03.md实现完整的输入和提交功能
 */
const GenerateHomologationDocument: React.FC = () => {
  // 路由跳转hook
  const navigate = useNavigate();
  
  // 获取location对象用于接收参数
  const location = useLocation();

  // 表单数据状态
  const [formData, setFormData] = useState<FormData>({
    chassisSeries: '',
    chassisNo: '',
    documentType: ''
  });

  // Document type下拉列表选项
  const [documentTypeOptions, setDocumentTypeOptions] = useState<DocumentTypeOption[]>([]);

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 初期表示 - 获取Document type下拉列表
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD03.md的API规范：
   *              - Method: GET
   *              - Endpoint: /api/ud03/selecthdocdocumentlist
   *              
   *              成功时（200）：设置下拉列表选项
   *              失败时：显示错误消息
   */
  useEffect(() => {
    fetchDocumentTypeList();
    
    // 从location.state恢复上次输入的条件（如果存在）
    if (location.state) {
      const { chassisSeries, chassisNo, documentType } = location.state as FormData;
      if (chassisSeries || chassisNo || documentType) {
        setFormData({
          chassisSeries: chassisSeries || '',
          chassisNo: chassisNo || '',
          documentType: documentType || ''
        });
      }
    }
  }, [location.state]);

  /**
   * 获取Document type下拉列表
   * 
   * @async
   * @returns {Promise<void>}
   * @description 调用UD03SelectHdocdocumentlistApi获取HDOC_DOCUMENT_LIST表的DOCTYPE字段内容
   */
  const fetchDocumentTypeList = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 调用UD03SelectHdocdocumentlistApi获取下拉列表内容
      // Endpoint: GET /api/ud03/selecthdocdocumentlist
      const response = await apiClient.get<DocumentListResponse>('/api/ud03/selecthdocdocumentlist');
      
      // 处理成功响应（200状态码）
      if (response.data.code === 200) {
        setDocumentTypeOptions(response.data.data);
      } else {
        setErrorMessage(response.data.msg || 'Failed to load document types. Please refresh the page.');
      }
    } catch (error: any) {
      // 处理API调用失败
      if (error.response) {
        const errorData: ErrorResponse = error.response.data;
        setErrorMessage(errorData.message || 'Failed to load document types.');
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
   * 处理输入框变化事件
   * 
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - 输入框变化事件对象
   * @description 根据输入框的name属性更新对应的表单数据
   *              实时过滤不允许的字符：
   *              - Chassis series: 只允许半角英字（a-z, A-Z）
   *              - Chassis no: 只允许半角数字（0-9）
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;

    // Chassis series: 只允许半角英字（a-z, A-Z），最大5字符
    if (name === 'chassisSeries') {
      filteredValue = value.replace(/[^a-zA-Z]/g, '').substring(0, 5);
    }
    // Chassis no: 只允许半角数字（0-9），最大10字符
    else if (name === 'chassisNo') {
      filteredValue = value.replace(/[^0-9]/g, '').substring(0, 10);
    }

    // 更新表单数据
    setFormData(prevData => ({
      ...prevData,
      [name]: filteredValue
    }));

    // 清除之前的错误消息
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  /**
   * 前端表单校验 - 空值检查
   * 
   * @returns {boolean} 校验结果，true表示通过，false表示失败
   * @description 按照詳細設計UD03.md的校验规则：
   *              1. 检查Chassis series是否为空
   *              2. 检查Chassis no是否为空
   *              3. 检查Document type是否未选择
   *              校验失败时设置错误消息："All fields are required."
   */
  const validateForm = (): boolean => {
    // 校验Chassis series是否为空（No.1）
    if (!formData.chassisSeries.trim()) {
      setErrorMessage('All fields are required.');
      return false;
    }

    // 校验Chassis no是否为空（No.2）
    if (!formData.chassisNo.trim()) {
      setErrorMessage('All fields are required.');
      return false;
    }

    // 校验Document type是否未选择（No.3）
    if (!formData.documentType) {
      setErrorMessage('All fields are required.');
      return false;
    }

    return true;
  };

  /**
   * 处理Submit按钮点击事件
   * 
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - 表单提交事件对象
   * @description 按照詳細設計UD03.md的处理流程：
   *              1. 阻止表单默认提交行为
   *              2. 清空之前的错误消息
   *              3. 执行前端空值校验
   *              4. 校验通过后，将Chassis series和Chassis no拼接传参到Generate document画面（ID: 04）
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 阻止表单默认提交行为
    e.preventDefault();

    // 清空之前的错误消息
    setErrorMessage('');

    // 执行前端空值校验
    if (!validateForm()) {
      return;
    }

    // 校验通过，迁移到Generate document画面（画面ID：04）
    // 传递参数：Chassis series + Chassis no（拼接）
    const combinedParam = `${formData.chassisSeries}${formData.chassisNo}`;
    const query = new URLSearchParams({
      chassisSeries: formData.chassisSeries,
      chassisNo: formData.chassisNo
    }).toString();

    navigate(`/Menu/generate-document-result?${query}`, {
      state: {
        chassisSeries: formData.chassisSeries,
        chassisNo: formData.chassisNo,
        documentType: formData.documentType,
        combinedParam: combinedParam
      },
      replace: false
    });
  };

  /**
   * 处理Reset按钮点击事件
   * 
   * @description 按照詳細設計UD03.md的处理流程：
   *              1. 清空所有输入内容
   *              2. 清空错误消息
   *              3. 恢复初始状态
   */
  const handleReset = () => {
    // 清空所有输入内容
    setFormData({
      chassisSeries: '',
      chassisNo: '',
      documentType: ''
    });
    
    // 清空错误消息
    setErrorMessage('');
  };

  /**
   * 处理Help按钮点击事件
   * 
   * @description 按照詳細設計UD03.md的处理流程：
   *              迁移到HDoc Help画面（画面ID：24）
   */
  const handleHelp = () => {
    navigate('/Menu/user-guide');
  };

  return (
    <div className="ud03-generate-hdoc-container">
      {/* 页面标题 */}
      <h1 className="ud03-page-title">HDoc - Generate Homologation Document</h1>
      
      {/* 错误消息区域 */}
      <div className="ud03-error-message-area">
        {errorMessage && (
          <span className="ud03-error-text">{errorMessage}</span>
        )}
      </div>

      {/* 表单区域 */}
      <form className="ud03-form-container" onSubmit={handleSubmit}>
        {/* Chassis series输入框 */}
        <div className="ud03-form-group">
          <label htmlFor="chassisSeries" className="ud03-form-label">Chassis series</label>
          <input
            type="text"
            id="chassisSeries"
            name="chassisSeries"
            className="ud03-form-input"
            value={formData.chassisSeries}
            onChange={handleInputChange}
            maxLength={5}
            placeholder="Enter chassis series"
            disabled={isLoading}
          />
        </div>

        {/* Chassis no输入框 */}
        <div className="ud03-form-group">
          <label htmlFor="chassisNo" className="ud03-form-label">Chassis no</label>
          <input
            type="text"
            id="chassisNo"
            name="chassisNo"
            className="ud03-form-input"
            value={formData.chassisNo}
            onChange={handleInputChange}
            maxLength={10}
            placeholder="Enter chassis no"
            disabled={isLoading}
          />
        </div>

        {/* Document type下拉列表 */}
        <div className="ud03-form-group">
          <label htmlFor="documentType" className="ud03-form-label">Document type</label>
          <select
            id="documentType"
            name="documentType"
            className={`ud03-form-select ${!formData.documentType ? 'ud03-select-placeholder' : ''}`}
            value={formData.documentType}
            onChange={handleInputChange}
            disabled={isLoading}
          >
            <option value="">Select document type</option>
            {documentTypeOptions.map((option, index) => (
              <option key={index} value={option.doctype}>
                {option.description}
              </option>
            ))}
          </select>
        </div>

        {/* 底部按钮区域 */}
        <div className="ud03-button-area">
          {/* Submit按钮 */}
          <button
            type="submit"
            className="ud03-submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>

          {/* Reset按钮 */}
          <button
            type="button"
            className="ud03-reset-button"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </button>

          {/* Help按钮 */}
          <button
            type="button"
            className="ud03-help-button"
            onClick={handleHelp}
            disabled={isLoading}
          >
            Help
          </button>
        </div>
      </form>

      {/* Support信息 */}
      <div className="ud03-support-info">
        HDoc support: support.tpi@xxx.com
      </div>
    </div>
  );
};

export default GenerateHomologationDocument;
