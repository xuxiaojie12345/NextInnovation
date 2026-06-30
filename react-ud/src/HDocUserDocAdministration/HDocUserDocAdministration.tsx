import React, { useState, useEffect } from 'react';
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
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

  /**
   * 获取当前登录用户ID
   * TODO: 从JWT token或session中解析userId
   */
  const getCurrentUserId = (): string => {
    return sessionStorage.getItem('userId') || '';
  };

  /**
   * 画面初期表示 - 获取Document列表
   */
  useEffect(() => {
    fetchDocumentList();
  }, []);

  /**
   * 获取Document下拉列表
   */
  const fetchDocumentList = async () => {
    try {
      const response = await axios.post('http://localhost:8081/api/ud18/hdocdocumentlist');
      if (response.data.code === 200) {
        const docs = response.data.data.map((item: any) => (item.description || item).toUpperCase());
        setDocumentList(docs);
      }
    } catch (error) {
      console.error('获取Document列表失败:', error);
    }
  };

  /**
   * User Info按钮点击处理 - 查询用户信息和权限
   * 对应设计书 3.2 User Info按钮押下 和 4.1.2 User Info按钮押下
   */
  const handleUserInfoClick = async () => {
    // 校验：UserID不能为空且只能输入半角英数字 (对应设计书 2.1 控件属性表 - UserID为必填项Y，许容文字：半角英数字)
    if (!userId.trim()) {
      showMessage('请输入UserID', 'error');
      return;
    }

    // 验证UserID格式：只能包含半角英数字
    const userIdPattern = /^[a-zA-Z0-9]+$/;
    if (!userIdPattern.test(userId)) {
      showMessage('UserID只能输入半角英数字', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // 步骤1：先调用UD18selecthdocfunctionauth检查userId是否存在
      const authResponse = await axios.post('http://localhost:8081/api/ud18/selecthdocfunctionauth', {
        UserId: userId
      });
      
      // 若用户不存在 (对应设计书 4.2 No.1)
      if (authResponse.data.code !== 200 || authResponse.data.data !== true) {
        showMessage("We didn't recognize the userid you entered. Please try again.", 'error');
        return;
      }
      
      // 步骤2：用户存在，查询用户名（单独try-catch，避免因该API报错影响后续数据获取）
      try {
        const userResponse = await axios.post('http://localhost:8081/api/ud01/login', {
          UserId: userId
        });
        if (userResponse.data.code === 200) {
          setUserName(userResponse.data.data?.username || '');
        }
      } catch (userErr: any) {
        // ud01/login失败不影响后续数据获取，仅打日志
        console.warn('获取用户名失败(用户可能在hdoc_user_infor中不存在):', userErr.response?.data?.msg || userErr.message);
      }
      
      // 步骤3：获取Document列表 (对应设计书 4.1.2 条件2-1) - 仅在初期没取到时刷新
      if (documentList.length === 0) {
        const docListResponse = await axios.post('http://localhost:8081/api/ud18/hdocdocumentlist');
        if (docListResponse.data.code === 200) {
          const docs = docListResponse.data.data.map((item: any) => (item.description || item).toUpperCase());
          setDocumentList(docs);
        }
      }
      
      // 步骤4：获取用户已有权限 (对应设计书 4.1.2 条件2-2)
      const permissionsResponse = await axios.post('http://localhost:8081/api/ud18/selecthdocuserdoc', {
        UserId: userId
      });
      
      if (permissionsResponse.data.code === 200) {
        const perms = permissionsResponse.data.data;
        // 统一转为大写进行比较 (DB数据可能大小写不一致)
        const normalize = (v: string) => (v || '').toUpperCase();
        const permList = Array.isArray(perms) ? perms.map((p: any) => normalize(p.doctype || p)) : [];
        setUserPermissions(permList);
        setSelectedDocuments(permList);
      }
    } catch (error: any) {
      // 网络层面的错误（非HTTP业务错误）
      console.error('HDocUserDocAdministration API调用异常:', error);
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
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
      showMessage('请输入UserID', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // 步骤1：验证用户是否存在
      const userResponse = await axios.post('http://localhost:8081/api/ud18/selecthdocfunctionauth', {
        UserId: userId
      });
      
      if (userResponse.data.code !== 200 || userResponse.data.data !== true) {
        showMessage("We didn't recognize the userid you entered. Please try again.", 'error');
        return;
      }
      
      // 步骤1：先删除该用户的所有旧权限
      const delRes = await axios.post('http://localhost:8081/api/ud18/deletehdocuserdoc', {
        userId: userId
      });
      if (delRes.data.code !== 200) {
        showMessage(delRes.data.msg || '删除旧权限失败', 'error');
        return;
      }
      
      // 步骤2：保存新选中的权限
      for (const doc of selectedDocuments) {
        // DOCTYPE字段varchar(16)，超长则截断
        const doctype = doc.length > 16 ? doc.substring(0, 16) : doc;
        const requestData = {
          userId: userId,
          doctype: doctype,
          registerUser: getCurrentUserId(),
          registerDatetime: new Date().toISOString(),
          registerProcess: 'HDocUserDocAdministration',
          updateUser: getCurrentUserId(),
          updateDatetime: new Date().toISOString(),
          updateProcess: 'HDocUserDocAdministration'
        };
        
        const insRes = await axios.post('http://localhost:8081/api/ud18/createhdocuserdoc', requestData);
        if (insRes.data.code !== 200) {
          showMessage(insRes.data.msg || '插入权限失败', 'error');
          return;
        }
      }
      
      showMessage('权限更新成功', 'success');
      setUserPermissions(selectedDocuments);
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
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
            disabled={isLoading}
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
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
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
