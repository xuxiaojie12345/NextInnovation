/**
 * HDocUserDocAdministration组件 - HDoc用户文档管理页面
 * 
 * @description 提供HDoc用户文档管理功能，允许管理员通过输入UserID查询用户信息，
 *              并为用户分配或更新文档访问权限。系统支持查看用户当前拥有的文档权限列表，
 *              并可通过Update按钮批量更新用户的文档访问权限配置。
 *              严格按照詳細設計UD18.md中定义的画面项目实现。
 * 
 * @features
 * - UserID输入框：必填字段，最大长度10位，仅允许半角英数字
 * - User标签：显示从HDOC_USER_INFOR表获取的用户名
 * - Document下拉列表：从HDOC_DOCUMENT_LIST表动态加载文档描述信息（多选）
 * - User Info按钮：查询用户信息和当前权限
 * - Update按钮：批量更新用户的文档访问权限配置
 * 
 * @security
 * - UserID输入需进行格式校验，仅允许半角英数字
 * - 所有API调用需进行身份认证和权限验证
 * - 敏感操作需记录操作日志
 * - 数据传输过程使用HTTPS加密协议
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HDocUserDocAdministration.css';

/**
 * 文档列表项接口定义
 */
interface DocumentItem {
  description: string;
}

/**
 * 用户权限记录接口定义
 */
interface UserDocRecord {
  userId: string;
  docType: string;
}

/**
 * API响应数据结构
 */
interface ApiResponse<T = any> {
  code: number;
  data?: T;
  msg?: string;
}

/**
 * HDocUserDocAdministration组件 - HDoc用户文档管理页面
 * 
 * @component
 * @returns {JSX.Element} HDoc用户文档管理页面组件
 * @description 根据詳細設計UD18.md实现完整的用户文档管理功能
 */
const HDocUserDocAdministration: React.FC = () => {
  // UserID输入状态
  const [userId, setUserId] = useState<string>('');

  // 用户名显示状态
  const [userName, setUserName] = useState<string>('');

  // 文档列表状态
  const [documentList, setDocumentList] = useState<DocumentItem[]>([]);

  // 选中的文档列表状态
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // 用户当前持有的权限列表状态
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());

  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 初期表示 - 获取文档列表
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD18.md的API规范：
   *              - Method: GET
   *              - Endpoint: /api/ud18/document-list
   *              
   *              成功时（200）：设置文档列表
   *              失败时：显示错误消息
   */
  useEffect(() => {
    fetchDocumentList();
  }, []);

  /**
   * 获取文档列表
   * 
   * @async
   * @returns {Promise<void>}
   * @description 调用UD18HDocUserDocAdministrationApi的UD20SelectHdocDocumentList，
   *              取得Document列表数据
   */
  const fetchDocumentList = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 调用UD18HDocUserDocAdministrationApi获取文档列表
      // Endpoint: GET /api/ud18/document-list
      const response = await axios.get<ApiResponse<DocumentItem[]>>('/api/ud18/document-list');
      
      // 处理成功响应（200状态码）
      if (response.data.code === 200 && response.data.data) {
        setDocumentList(response.data.data);
      } else {
        setErrorMessage('系统错误，请稍后重试');
      }
    } catch (error: any) {
      // 处理API调用失败
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理API错误
   * 
   * @param {any} error - 错误对象
   */
  const handleApiError = (error: any): void => {
    if (error.response) {
      const errorData: ApiResponse = error.response.data;
      setErrorMessage(errorData.msg || '系统错误，请稍后重试');
    } else if (error.request) {
      setErrorMessage('网络连接失败，请检查网络设置');
    } else {
      setErrorMessage('请求超时，请稍后重试');
    }
  };

  /**
   * 处理UserID输入变化
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件
   * @description 实时过滤非法字符，仅允许半角英数字，最大长度10位
   */
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    
    // 只允许半角英数字
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    
    // 限制最大长度为10
    if (filteredValue.length <= 10) {
      setUserId(filteredValue);
    }
  };

  /**
   * 处理文档选择变化
   * 
   * @param {string} docDescription - 文档描述
   * @param {boolean} isSelected - 是否选中
   * @description 更新选中的文档集合
   */
  const handleDocSelection = (docDescription: string, isSelected: boolean): void => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(docDescription);
      } else {
        newSet.delete(docDescription);
      }
      return newSet;
    });
  };

  /**
   * 验证UserID格式
   * 
   * @returns {boolean} 是否有效
   * @description 检查UserID是否为空、是否包含非法字符、长度是否超过10
   */
  const validateUserId = (): boolean => {
    // 检查是否为空
    if (!userId || userId.trim() === '') {
      setErrorMessage('请输入UserID');
      return false;
    }
    
    // 检查是否包含非法字符（已经在输入时过滤，这里做双重验证）
    if (!/^[a-zA-Z0-9]+$/.test(userId)) {
      setErrorMessage('UserID只能包含半角英数字');
      return false;
    }
    
    // 检查长度
    if (userId.length > 10) {
      setErrorMessage('UserID长度不能超过10个字符');
      return false;
    }
    
    return true;
  };

  /**
   * 处理User Info按钮点击事件
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD18.md的处理流程：
   *              步骤1：验证用户功能权限
   *              步骤2：获取用户信息
   *              步骤3：获取用户所持权限
   *              步骤4：显示用户信息和权限，高亮显示已选中的权限
   */
  const handleUserInfoClick = async (): Promise<void> => {
    // 前端校验
    if (!validateUserId()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // 步骤1：调用UD18SelectHdocFunctionAuth验证用户功能权限
      // Endpoint: GET /api/ud18/function-auth/{userId}
      const authResponse = await axios.get<ApiResponse<{ functionAuthExistFlag: number; userId: string }>>(
        `/api/ud18/function-auth/${userId}`
      );
      
      if (authResponse.data.code !== 200) {
        setErrorMessage(authResponse.data.msg || '系统错误，请稍后重试');
        return;
      }
      
      const authData = authResponse.data.data;
      if (!authData || authData.functionAuthExistFlag === 0) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        setUserName('');
        setUserPermissions(new Set());
        return;
      }
      
      // 步骤2：调用AuthenticationApi获取用户信息
      // Endpoint: GET /api/ud18/authentication/{userId}
      const userResponse = await axios.get<ApiResponse<{ userId: string; userName: string }>>(
        `/api/ud18/authentication/${userId}`
      );
      
      if (userResponse.data.code !== 200 || !userResponse.data.data) {
        setErrorMessage(userResponse.data.msg || '系统错误，请稍后重试');
        return;
      }
      
      setUserName(userResponse.data.data.userName);
      
      // 步骤3：调用UD18SelectHdocUserDoc获取用户所持权限
      // Endpoint: GET /api/ud18/user-doc/{userId}
      const permResponse = await axios.get<ApiResponse<{ userDocExistFlag: number; records: UserDocRecord[] }>>(
        `/api/ud18/user-doc/${userId}`
      );
      
      if (permResponse.data.code !== 200) {
        setErrorMessage(permResponse.data.msg || '系统错误，请稍后重试');
        return;
      }
      
      const permData = permResponse.data.data;
      if (permData && permData.userDocExistFlag === 1 && permData.records) {
        // 将用户当前持有的权限转换为Set，用于高亮显示
        const permissionsSet = new Set<string>(
          permData.records.map(record => record.docType)
        );
        setUserPermissions(permissionsSet);
        
        // 同时将这些权限设置为选中状态
        setSelectedDocs(permissionsSet);
      } else {
        setUserPermissions(new Set());
        setSelectedDocs(new Set());
      }
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理Update按钮点击事件
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD18.md的处理流程：
   *              步骤1：验证用户功能权限
   *              步骤2：检查用户文档权限是否存在
   *              步骤3：如果存在则删除
   *              步骤4：创建新的用户文档权限
   */
  const handleUpdateClick = async (): Promise<void> => {
    // 前端校验
    if (!validateUserId()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // 步骤1：调用UD18SelectHdocFunctionAuth验证用户功能权限
      // Endpoint: GET /api/ud18/function-auth/{userId}
      const authResponse = await axios.get<ApiResponse<{ functionAuthExistFlag: number; userId: string }>>(
        `/api/ud18/function-auth/${userId}`
      );
      
      if (authResponse.data.code !== 200) {
        setErrorMessage(authResponse.data.msg || '系统错误，请稍后重试');
        return;
      }
      
      const authData = authResponse.data.data;
      if (!authData || authData.functionAuthExistFlag === 0) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        return;
      }
      
      // 步骤2：调用UD18SelectHdocUserDoc检查用户文档权限是否存在
      // Endpoint: GET /api/ud18/user-doc/{userId}
      const checkResponse = await axios.get<ApiResponse<{ userDocExistFlag: number; records: UserDocRecord[] }>>(
        `/api/ud18/user-doc/${userId}`
      );
      
      if (checkResponse.data.code !== 200) {
        setErrorMessage(checkResponse.data.msg || '系统错误，请稍后重试');
        return;
      }
      
      const checkData = checkResponse.data.data;
      
      // 步骤3：如果数据存在，先删除
      if (checkData && checkData.userDocExistFlag === 1) {
        // Endpoint: DELETE /api/ud18/user-doc/{userId}
        const deleteResponse = await axios.delete<ApiResponse<{ deleteUserDocFlag: number; userId: string }>>(
          `/api/ud18/user-doc/${userId}`
        );
        
        if (deleteResponse.data.code !== 200) {
          setErrorMessage(deleteResponse.data.msg || '系统错误，请稍后重试');
          return;
        }
      }
      
      // 步骤4：创建新的用户文档权限
      // Endpoint: POST /api/ud18/user-doc
      const createData = Array.from(selectedDocs).map(docType => ({
        userId: userId,
        docType: docType,
        user: userId // 使用当前登录用户ID
      }));
      
      const createResponse = await axios.post<ApiResponse>('/api/ud18/user-doc', createData);
      
      if (createResponse.data.code !== 200) {
        setErrorMessage(createResponse.data.msg || '系统错误，请稍后重试');
        return;
      }
      
      // 更新成功后，重新获取用户权限信息
      await handleUserInfoClick();
      
    } catch (error: any) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ud18-container">
        <div className="ud18-loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud18-container">
      {/* 页面标题 */}
      <h1 className="ud18-page-title">HDoc Document Authorization</h1>
      {/* 内容区域 */}
      <div className="ud18-content-area">        
        {/* 错误消息区域 */}
        {errorMessage && (
          <div className="ud18-error-message-area">
            <span className="ud18-error-text">{errorMessage}</span>
          </div>
        )}

        {/* UserID输入区域 */}
        <div className="ud18-input-row">
          <label className="ud18-label">Userid:</label>
          <input
            type="text"
            className="ud18-input"
            value={userId}
            onChange={handleUserIdChange}
            maxLength={10}
            placeholder="请输入UserID"
          />
          <button
            type="button"
            className="ud18-button ud18-user-info-button"
            onClick={handleUserInfoClick}
          >
            User Info
          </button>
        </div>

        {/* User显示区域 */}
        <div className="ud18-info-row">
          <label className="ud18-label">User:</label>
          <span className="ud18-value">{userName || '-'}</span>
        </div>

        {/* Document下拉列表区域 */}
        <div className="ud18-info-row">
          <select
            multiple
            className="ud18-select"
            value={Array.from(selectedDocs)}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedDocs(new Set(selectedOptions));
            }}
            size={10}
          >
            {documentList.map((doc, index) => (
              <option
                key={index}
                value={doc.description}
                className={userPermissions.has(doc.description) ? 'ud18-option-highlighted' : ''}
              >
                {doc.description}
              </option>
            ))}
          </select>
        </div>

        {/* Update按钮区域 - 左对齐 */}
        <div className="ud18-button-area-left">
          <button
            type="button"
            className="ud18-button ud18-update-button"
            onClick={handleUpdateClick}
          >
            UPDATE
          </button>
        </div>

      </div>
    </div>
  );
};

export default HDocUserDocAdministration;
