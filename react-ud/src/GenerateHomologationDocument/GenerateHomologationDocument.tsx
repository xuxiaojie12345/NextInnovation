import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GenerateHomologationDocument.css';

// 文档类型接口
// 后端实体 DocumentType 返回字段：doctype（文档类型代码）、description（描述）
interface DocumentType {
  doctype: string;
  description: string;
}

// 搜索条件接口
interface SearchCondition {
  chassisSeries: string;
  chassisNo: string;
  documentType: string;
}

const GenerateHomologationDocument: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [chassisSeries, setChassisSeries] = useState<string>('');
  const [chassisNo, setChassisNo] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [documentTypeList, setDocumentTypeList] = useState<DocumentType[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());

  /**
   * 初始化处理
   * 加载上次搜索条件并获取文档类型列表
   */
  useEffect(() => {
    initializeComponent();
  }, []);

  const initializeComponent = async () => {
    try {
      // 从本地存储加载上次搜索条件
      loadPreviousCondition();
      
      // 获取文档类型列表
      await fetchDocumentTypeList();
    } catch (error) {
      setMessage('System error occurred. Please contact the administrator.');
    }
  };

  /**
   * 加载上次搜索条件
   */
  const loadPreviousCondition = () => {
    try {
      const savedCondition = localStorage.getItem('homologationSearchCondition');
      if (savedCondition) {
        const condition: SearchCondition = JSON.parse(savedCondition);
        setChassisSeries(condition.chassisSeries || '');
        setChassisNo(condition.chassisNo || '');
        setDocumentType(condition.documentType || '');
      }
    } catch (error) {
      setMessage('Failed to load search conditions.');
    }
  };

  /**
   * 获取文档类型列表
   * API: UD03SelectHdocdocumentlistApi
   * 后端直接返回 DocumentType 数组，无需解析 code/data 包装
   */
  const fetchDocumentTypeList = async () => {
    try {
      setIsLoading(true);
      
      // 调用后端API - 直接返回数组
      const response = await fetch('http://localhost:8081/api/documenttypes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch document types');
      }

      const data: DocumentType[] = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        setDocumentTypeList(data);
      } else {
        throw new Error('Failed to get document types');
      }
    } catch (error) {
      setMessage('Document type acquisition failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Chassis series 输入处理 - 输入时限制
   */
  const handleChassisSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 仅允许半角英文字母，最大5字符
    if (/^[a-zA-Z]*$/.test(value) && value.length <= 5) {
      setChassisSeries(value);
      clearFieldError('chassisSeries');
    }
  };

  /**
   * Chassis no 输入处理 - 输入时限制
   */
  const handleChassisNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 仅允许半角数字，最大10字符
    if (/^[0-9]*$/.test(value) && value.length <= 10) {
      setChassisNo(value);
      clearFieldError('chassisNo');
    }
  };

  /**
   * Document type 选择处理
   */
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
    clearFieldError('documentType');
  };

  /**
   * 清除字段错误提示
   */
  const clearFieldError = (fieldName: string) => {
    if (hasError) {
      const newErrorFields = new Set(errorFields);
      newErrorFields.delete(fieldName);
      setErrorFields(newErrorFields);
      if (newErrorFields.size === 0) {
        setMessage('');
        setHasError(false);
      }
    }
  };

  /**
   * 表单校验处理 - 仅必填项检查
   */
  const validate = (): boolean => {
    const errors: string[] = [];
    const newErrorFields = new Set<string>();

    // Chassis series 必填检查
    if (!chassisSeries || chassisSeries.trim() === '') {
      errors.push('Chassis series is required.');
      newErrorFields.add('chassisSeries');
    }

    // Chassis no 必填检查
    if (!chassisNo || chassisNo.trim() === '') {
      errors.push('Chassis no is required.');
      newErrorFields.add('chassisNo');
    }

    // Document type 必填检查
    if (!documentType || documentType.trim() === '') {
      errors.push('Please select a Document type.');
      newErrorFields.add('documentType');
    }

    if (errors.length > 0) {
      setMessage(errors[0]); // 仅显示第一个错误
      setErrorFields(newErrorFields);
      setHasError(true);
      return false;
    }

    return true;
  };

  /**
   * Submit 按钮点击处理
   */
  const handleSubmit = async () => {
    setMessage('');
    setHasError(false);
    setErrorFields(new Set());

    // 表单校验
    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      // 保存搜索条件（下次初始化时使用）
      saveSearchCondition();

      // 跳转到 Generate Document 页面（传递三个参数）
      // 对应详细设计 3.1.2 步骤4：不调用API，直接跳转到UD04页面
      // 底盘号存在性校验由UD04页面在初始化时调用 UD04SelectGeneratedocumentApi 完成
      // 请求参数包含 chassisSeries、chassisNo 和 documentType
      navigate(`/Menu/GenerateDocument/${chassisNo.trim()}`, {
        state: {
          chassisSeries: chassisSeries.trim(),
          chassisNo: chassisNo.trim(),
          documentType: documentType.trim()
        }
      });
      
    } catch (error) {
      setMessage('System error occurred. Please contact the administrator.');
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存搜索条件到本地存储
   */
  const saveSearchCondition = () => {
    try {
      const condition: SearchCondition = {
        chassisSeries,
        chassisNo,
        documentType
      };
      localStorage.setItem('homologationSearchCondition', JSON.stringify(condition));
    } catch (error) {
      console.error('保存搜索条件失败:', error);
    }
  };

  /**
   * Reset 按钮点击处理
   */
  const handleReset = () => {
    setChassisSeries('');
    setChassisNo('');
    setDocumentType('');
    setMessage('');
    setHasError(false);
    setErrorFields(new Set());
  };

  /**
   * Help 按钮点击处理
   */
  const handleHelp = () => {
    // TODO: 跳转到帮助页面
    alert('请实现帮助页面跳转处理');
  };

  return (
    <div className='generate-homologation-container'>
      {/* 页面标题区域 */}
      <div className='page-header'>
        <h1 className='page-title'>HDoc - Generate Homologation Document</h1>
        {message && (
          <div className={`error-message ${hasError ? 'error' : 'warning'}`}>
            {message}
          </div>
        )}
      </div>

      {/* 表单区域 */}
      <div className='form-container'>
        {/* Chassis series */}
        <div className='form-group'>
          <label htmlFor='chassisSeries'>Chassis series</label>
          <input
            id='chassisSeries'
            type='text'
            value={chassisSeries}
            onChange={handleChassisSeriesChange}
            maxLength={5}
            disabled={isLoading}
            className={errorFields.has('chassisSeries') ? 'input-error' : ''}
            placeholder='例: JPCT'
          />
        </div>

        {/* Chassis no */}
        <div className='form-group'>
          <label htmlFor='chassisNo'>Chassis no</label>
          <input
            id='chassisNo'
            type='text'
            value={chassisNo}
            onChange={handleChassisNoChange}
            maxLength={10}
            disabled={isLoading}
            className={errorFields.has('chassisNo') ? 'input-error' : ''}
            placeholder='例: 028321'
          />
        </div>

        {/* Document type */}
        <div className='form-group'>
          <label htmlFor='documentType'>Document type</label>
          <select
            id='documentType'
            value={documentType}
            onChange={handleDocumentTypeChange}
            disabled={isLoading}
            className={errorFields.has('documentType') ? 'input-error' : ''}
          >
            <option value=''>-- 选择文档类型 --</option>
            {documentTypeList
              .map((doc) => (
                <option key={doc.doctype} value={doc.doctype}>
                  {doc.doctype}
                  {doc.description ? ` - ${doc.description}` : ""}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* 按钮区域 */}
      <div className='button-area'>
        <button
          type='button'
          className='btn-submit'
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? '处理中...' : 'Submit'}
        </button>
        <button
          type='button'
          className='btn-reset'
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </button>
        <button
          type='button'
          className='btn-help'
          onClick={handleHelp}
          disabled={isLoading}
        >
          Help
        </button>
      </div>

      {/* 支持邮箱信息 */}
      <div className='support-info'>
        <p>HDoc support: support.tpi@volvo.com</p>
      </div>
    </div>
  );
};

export default GenerateHomologationDocument;
