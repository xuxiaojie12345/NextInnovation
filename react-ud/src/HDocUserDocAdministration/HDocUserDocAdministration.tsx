import React, { useState } from 'react';
import axios from 'axios';
import './HDocUserDocAdministration.css';

/**
 * HDocUserDocAdministration组件 - 用户文档权限管理页面
 * 
 * @description 支持查询用户信息、修改文档权限，通过Document下拉列表选择要授予的文档权限
 * @props 无Props
 */
const HDocUserDocAdministration: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [documentList, setDocumentList] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 获取当前登录用户ID
   * TODO: 从JWT token或session中解析userId
   */
  const getCurrentUserId = (): string => {
    return localStorage.getItem('userId') || 'test_user';
  };

  /**
   * User Info按钮点击处理 - 查询用户信息和权限
   * 对应设计书 3.2 User Info按钮押下 和 4.1.2 User Info按钮押下
   */
  const handleUserInfoClick = async () => {
    // 校验：UserID不能为空且只能输入半角英数字 (对应设计书 2.1 控件属性表 - UserID为必填项Y，许容文字：半角英数字)
    if (!userId.trim()) {
      setErrorMessage('请输入UserID');
      return;
    }

    // 验证UserID格式：只能包含半角英数字
    const userIdPattern = /^[a-zA-Z0-9]+$/;
    if (!userIdPattern.test(userId)) {
      setErrorMessage('UserID只能输入半角英数字');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 步骤1：查询用户名 (对应设计书 4.1.2 步骤2)
      const userResponse = await axios.get('/api/UD01/login', {
        params: { UserId: userId }
      });
      
      // 条件1：若用户userId不存在 (对应设计书 4.2 No.1)
      if (!userResponse.data.success) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        return;
      }
      
      // 条件2：若用户存在，显示用户名
      setUserName(userResponse.data.data.userName || '');
      
      // 步骤2：获取Document列表 (对应设计书 4.1.2 条件2-1)
      const docListResponse = await axios.get('/api/UD18/hdoc-document-list');
      
      if (docListResponse.data.success) {
        const docs = docListResponse.data.data.map((item: any) => item.description || item);
        setDocumentList(docs);
      }
      
      // 步骤3：获取用户已有权限 (对应设计书 4.1.2 条件2-2)
      const permissionsResponse = await axios.get('/api/UD18/select-hdoc-user-doc', {
        params: { UserId: userId }
      });
      
      if (permissionsResponse.data.success) {
        const permissions = permissionsResponse.data.data.doctype ? [permissionsResponse.data.data.doctype] : [];
        setUserPermissions(permissions);
        // 自动选中用户已有权限
        setSelectedDocuments(permissions);
      }
    } catch (error: any) {
      console.error('查询用户信息失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * UPDATE按钮点击处理 - 更新用户文档权限
   * 对应设计书 3.3 UPDATE按钮押下 和 4.1.3 Update按钮押下
   */
  const handleUpdateClick = async () => {
    // 校验：UserID不能为空
    if (!userId.trim()) {
      setErrorMessage('请输入UserID');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 步骤1：验证用户是否存在 (对应设计书 4.1.3 步骤2)
      const userResponse = await axios.get('/api/UD18/select-hdoc-function-auth', {
        params: { UserId: userId }
      });
      
      // 条件1：若用户userId不存在 (对应设计书 4.2 No.2)
      if (!userResponse.data.success) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        return;
      }
      
      // 条件2：若用户存在，执行权限更新操作
      
      // 步骤1：先删除所有旧权限 (对应设计书 4.1.3 条件2-1)
      for (const permission of userPermissions) {
        await axios.delete('/api/UD18/delete-hdoc-user-doc', {
          data: {
            userId: userId,
            doctype: permission
          }
        });
      }
      
      // 步骤2：保存新选中的权限 (对应设计书 4.1.3 条件2-2)
      for (const doc of selectedDocuments) {
        // 构建请求参数 (对应设计书 5.6 UD18CreateHdocUserDocApi)
        const requestData = {
          userId: userId,
          doctype: doc,
          registerUser: userName || getCurrentUserId(),
          registerDatetime: new Date().toISOString(),
          registerProcess: 'HDocUserDocAdministration', // 当前画面ID
          updateUser: userName || getCurrentUserId(),
          updateDatetime: new Date().toISOString(),
          updateProcess: 'HDocUserDocAdministration' // 当前画面ID
        };
        
        await axios.put('/api/UD18/create-hdoc-user-doc', requestData);
      }
      
      alert('权限更新成功');
      // 更新用户权限列表
      setUserPermissions(selectedDocuments);
    } catch (error: any) {
      console.error('更新权限失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理Document选择变化
   */
  const handleDocumentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(event.target.selectedOptions, opt => opt.value);
    setSelectedDocuments(selected);
  };

  return (
    <div className='huda-container'>
      <div className='huda-content'>
        {/* 标题区域 */}
        <h2 className='huda-title'>HDoc Document Authorization</h2>
        
        {/* UserID输入行 */}
        <div className='huda-form-row'>
          <label className='huda-label huda-required'>Userid:</label>
          <input 
            type='text' 
            className='huda-input huda-input-userid' 
            value={userId}
            onChange={(e) => {
              // 只允许输入半角英数字
              const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
              setUserId(value);
            }}
            maxLength={10}
            disabled={isLoading}
            required
            pattern='[a-zA-Z0-9]+'
            title='只能输入半角英数字'
          />
          <button 
            className='huda-info-button' 
            onClick={handleUserInfoClick}
            disabled={isLoading}
          >
            User Info
          </button>
        </div>
        
        {/* User显示行 */}
        <div className='huda-form-row'>
          <label className='huda-label'>User:</label>
          <span className='huda-user-name'>{userName}</span>
        </div>
        
        {/* Document多选下拉列表 */}
        <div className='huda-document-section'>
          <select 
            className='huda-select huda-select-document'
            multiple
            value={selectedDocuments}
            onChange={handleDocumentChange}
            disabled={isLoading || documentList.length === 0}
          >
            {documentList.map((doc, index) => (
              <option 
                key={index} 
                value={doc}
                className={userPermissions.includes(doc) ? 'huda-option-highlighted' : ''}
              >
                {doc}
              </option>
            ))}
          </select>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='huda-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='huda-loading'>
            加载中...
          </div>
        )}
        
        {/* 底部UPDATE按钮 */}
        <div className='huda-bottom-button'>
          <button 
            className='huda-update-button' 
            onClick={handleUpdateClick}
            // disabled={isLoading || !userName}
          >
            UPDATE
          </button>
        </div>
      </div>
    </div>
  );
};

export default HDocUserDocAdministration;
