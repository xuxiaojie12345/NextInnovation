import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import axios from 'axios';
import styles from '../assets/styles/HdocGenerateHomologationDocument.module.css';

// Zod校验schema定义 - 对应设计书 2.1 控件属性表
const formSchema = z.object({
  chassisSeries: z
    .string()
    .min(1, 'Chassis series is required') // 非空校验
    .max(5, 'Chassis series must be 5 characters or less') // 最大长度5
    .regex(/^[A-Za-z]+$/, 'Chassis series must contain only half-width alphabetic characters'), // 半角英字校验 [a-zA-Z]
  chassisNo: z
    .string()
    .min(1, 'Chassis no is required') // 非空校验
    .max(10, 'Chassis no must be 10 characters or less') // 最大长度10
    .regex(/^[0-9]+$/, 'Chassis no must contain only half-width numeric characters'), // 半角数字校验 [0-9]
  documentType: z
    .string()
    .min(1, 'Document type is required') // 非空校验
});

// Document type选项接口
interface DocumentTypeOption {
  value: string;
  label: string;
}

/**
 * HdocGenerateHomologationDocument组件 - 车辆认证文档生成页面
 * 
 * @description 用于生成车辆认证文档的核心功能页面，用户通过输入底盘号和选择文档类型提交请求
 */
const HdocGenerateHomologationDocument: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [chassisSeries, setChassisSeries] = useState<string>('');
  const [chassisNo, setChassisNo] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('');
  const [documentTypeOptions, setDocumentTypeOptions] = useState<DocumentTypeOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>(''); // 错误信息区域默认隐藏
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 画面初期表示处理
   * 对应设计书 3.1 画面初期
   */
  useEffect(() => {
    loadSavedConditions(); // 从localStorage读取上次查询条件
    fetchDocumentTypes(); // 调用API获取Document type下拉列表
  }, []);

  /**
   * 从localStorage读取上次查询条件
   * 对应设计书 7. 实现注意事项第5点
   */
  const loadSavedConditions = () => {
    try {
      const savedChassisSeries = localStorage.getItem('chassisSeries');
      const savedChassisNo = localStorage.getItem('chassisNo');
      const savedDocumentType = localStorage.getItem('documentType');

      if (savedChassisSeries) setChassisSeries(savedChassisSeries);
      if (savedChassisNo) setChassisNo(savedChassisNo);
      if (savedDocumentType) setDocumentType(savedDocumentType);
    } catch (error) {
      console.error('Failed to load saved conditions:', error);
    }
  };

  /**
   * 调用UD03SelectHdocdocumentlistApi获取Document type下拉列表
   * 对应设计书 5.1 UD03SelectHdocdocumentlistApi
   */
  const fetchDocumentTypes = async () => {
    try {
      setIsLoading(true);
      
      // API请求 (对应设计书 5.1 UD03SelectHdocdocumentlistApi)
      const response = await axios.get('/api/UD03/SelectHdocdocumentlistApi');
      
      if (response.data.success) {
        // 映射返回的数据到下拉框选项
        const options: DocumentTypeOption[] = response.data.data.documentTypes.map((item: any) => ({
          value: item.doctype,
          label: item.description || item.doctype
        }));
        setDocumentTypeOptions(options);
      } else {
        // API返回失败 (对应设计书 6. 异常处理)
        setErrorMessage(response.data.message || '获取文档类型失败');
      }
    } catch (error: any) {
      // 捕获网络错误或服务器错误 (对应设计书 6. 异常处理)
      if (error.response) {
        setErrorMessage(error.response.data?.message || '获取文档类型失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('系统维护中，请稍后重试');
      }
      console.error('Failed to fetch document types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Submit按钮处理
   * 对应设计书 3.2 Submit按钮押下 和 4.1.2 点击[Submit]按钮
   */
  const handleSubmit = async () => {
    setErrorMessage(''); // 清除旧错误信息
    
    // 前端Zod校验 (对应设计书 4.1.2 步骤2)
    const validationResult = formSchema.safeParse({
      chassisSeries,
      chassisNo,
      documentType
    });

    if (!validationResult.success) {
      // 校验失败，显示第一个错误消息
      setErrorMessage(validationResult.error.errors[0].message);
      return;
    }

    try {
      setIsLoading(true);
      
      // TODO: 调用后端API校验Chassis no是否存在
      // 这里预留API调用位置，实际项目中需要实现
      
      // 保存查询条件到localStorage (对应设计书 7. 实现注意事项第5点)
      localStorage.setItem('chassisSeries', chassisSeries);
      localStorage.setItem('chassisNo', chassisNo);
      localStorage.setItem('documentType', documentType);

      // 跳转到GeneratedDocument画面，携带参数 (对应设计书 7. 实现注意事项第3点)
      navigate('/GeneratedDocument', {
        state: { 
          userId: getCurrentUserId(), // 当前登录的userId
          chassisSeries, 
          chassisNo 
        }
      });
    } catch (error: any) {
      // 异常处理 (对应设计书 6. 异常处理)
      if (error.response) {
        setErrorMessage(error.response.data?.message || '提交失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('系统维护中，请稍后重试');
      }
      console.error('Submit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取当前登录用户的userId
   * TODO: 实际项目中需要从认证上下文或API获取
   */
  const getCurrentUserId = (): string => {
    // 临时使用mock数据，实际项目中应从session或context获取
    return 'test_user_id';
  };

  /**
   * Reset按钮处理
   * 对应设计书 3.3 Reset按钮押下 和 4.1.3 点击[Reset]按钮
   */
  const handleReset = () => {
    // 清空所有输入字段
    setChassisSeries('');
    setChassisNo('');
    setDocumentType('');
    setErrorMessage(''); // 清除错误信息
    
    // 清除localStorage中保存的查询条件 (对应设计书 7. 实现注意事项第5点)
    localStorage.removeItem('chassisSeries');
    localStorage.removeItem('chassisNo');
    localStorage.removeItem('documentType');
  };

  /**
   * Help按钮处理
   * 对应设计书 3.4 Help按钮押下 和 4.1.4 点击[Help]按钮
   */
  const handleHelp = () => {
    // 跳转到Help画面
    navigate('/HdocHelp');
  };

  return (
    <div className={styles.container}>
      {/* 标题 */}
      <h2 className={styles.title}>HDoc - Generate Homologation Document</h2>
      
      {/* 错误信息区域 - 默认隐藏，仅在存在有效错误内容时显示 */}
      {errorMessage && (
        <div className={styles.errorMessageArea}>
          {errorMessage}
        </div>
      )}
      
      {/* 查询条件表单 */}
      <div className={styles.formContainer}>
        {/* Chassis series - 半角英字 [a-zA-Z], MaxLength 5 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Chassis series</label>
          <input
            type="text"
            className={styles.input}
            value={chassisSeries}
            onChange={(e) => setChassisSeries(e.target.value)}
            maxLength={5}
            placeholder="Enter chassis series"
          />
        </div>
        
        {/* Chassis no - 半角数字 [0-9], MaxLength 10 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Chassis no</label>
          <input
            type="text"
            className={styles.input}
            value={chassisNo}
            onChange={(e) => setChassisNo(e.target.value)}
            maxLength={10}
            placeholder="Enter chassis no"
          />
        </div>
        
        {/* Document type - 从HDOC_DOCUMENT_LIST表获取 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Document type</label>
          <select
            className={styles.select}
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={isLoading}
          >
            <option value="">-- Select Document Type --</option>
            {documentTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* 按钮组 - 根据图片布局：Submit、Reset在左侧，Help在中间偏右 */}
      <div className={styles.buttonGroup}>
        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          Submit
          {isLoading && <span className={styles.loading}></span>}
        </button>
        <button
          className={styles.button}
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </button>
        <button
          className={`${styles.button} ${styles.helpButton}`}
          onClick={handleHelp}
        >
          Help
        </button>
      </div>
      
      {/* Footer - Support Mail */}
      <div className={styles.footer}>
        HDoc support: support.tpi@volvo.com
      </div>
    </div>
  );
};

export default HdocGenerateHomologationDocument;
