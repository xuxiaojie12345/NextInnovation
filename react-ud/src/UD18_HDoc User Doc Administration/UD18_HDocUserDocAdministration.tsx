import React, { useState, useEffect } from 'react';
import './UD18_HDocUserDocAdministration.css';
import apiClient from '../api/config';

/* ============================================================
   类型定义
   ============================================================ */

/** 文档列表项 */
interface DocumentItem {
  id: number;
  documentType: string;
  businessUnit: string;
  registerUser: string;
  registerDateTime: string;
}

/* ============================================================
   UD18_HDocUserDocAdministration 组件
   HDoc User Doc Administration - 用户文档权限管理页面

   功能说明：
   - 通过UserID查询用户是否存在并从Saviynt获取用户名
   - 查看用户当前拥有的文档权限
   - 更新用户的文档权限配置（先删后增）

   对应设计书：DES-UD18-001
   ============================================================ */
const UD18_HDocUserDocAdministration: React.FC = () => {

  // ==================== 状态管理 ====================
  const [userID, setUserID] = useState<string>('');                    // UserID输入值
  const [userName, setUserName] = useState<string>('');                // 用户名（查询后显示）
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);      // 选中的文档类型列表（多选）
  const [message, setMessage] = useState<string>('');                  // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success'); // 消息类型
  const [isLoading, setIsLoading] = useState<boolean>(false);          // 加载状态
  const [isQueried, setIsQueried] = useState<boolean>(false);          // 是否已查询用户信息
  const [documentList, setDocumentList] = useState<DocumentItem[]>([]); // 文档下拉列表

  // ==================== 常量定义 ====================
  const USER_ID_REGEX = /^[a-zA-Z0-9]*$/;           // 半角英数字
  const MAX_USER_ID_LENGTH = 10;

  // ==================== 初期表示 ====================
  // 对应设计书 3.1.1 初期显示处理流程
  useEffect(() => {
    fetchDocumentList();
  }, []);

  /**
   * 获取文档下拉列表数据
   * 对应设计书 3.1.1 - 调用 UD20GetDocumentListApi 获取文档列表
   * 对应设计书 4.1 UD20GetDocumentListApi
   */
  const fetchDocumentList = async () => {
    try {
      const response = await apiClient.get('/api/ud20/getdocumentlist');
      console.log('UD18 文档列表原始响应:', JSON.stringify(response.data));
      // 对应设计书 4.1 UD20GetDocumentListApi
      // 后端返回格式：{ code: 200, message: "success", data: [...] }
      if (response.data?.code === 200 && Array.isArray(response.data?.data)) {
        setDocumentList(response.data.data);
        console.log('UD18 文档列表加载成功, 数量:', response.data.data.length);
      } else {
        console.warn('UD18 文档列表响应格式异常:', response.data);
      }
    } catch (error) {
      console.error('获取文档列表失败:', error);
      setMessageType('error');
      setMessage('获取文档列表失败');
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 UserID 输入变化
   * 限制：只允许半角英数字，最大长度10字符
   */
  const handleUserIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (USER_ID_REGEX.test(val) && val.length <= MAX_USER_ID_LENGTH) {
      setUserID(val);
      if (message) {
        setMessage('');
      }
    }
  };

  /**
   * 处理 Document 多选变化
   * 支持Ctrl/Command多选
   *
   * @param e - 选择事件对象
   */
  const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedDocs(selected);
  };

  // ==================== API 调用 ====================

  /**
   * 查询用户信息
   * 对应设计书 3.1.2 User Info按钮处理流程
   *
   * 处理流程：
   * 1. 前置处理：获取UserID并去除首尾空格
   * 2. 空值校验（前端校验）
   * 3. 调用UD18CheckAuthApi检查用户是否存在
   * 4. 若存在，调用AuthenticationApi获取用户名
   * 5. 调用UD18GetUserDocApi查询用户当前文档权限
   * 6. 结果处理
   */
  const handleUserInfo = async () => {
    // 1. 前置处理：去除首尾空格
    const trimmedUserID = userID.trim();

    // 2. 空值校验（前端校验）
    // 对应设计书 3.2 校验详细规格表 No.1
    if (!trimmedUserID) {
      setMessageType('error');
      setMessage('请输入UserID');
      return;
    }
    // 对应设计书 3.2 校验详细规格表 No.2
    if (!USER_ID_REGEX.test(trimmedUserID)) {
      setMessageType('error');
      setMessage('UserID只能包含半角英数字');
      return;
    }
    // 对应设计书 3.2 校验详细规格表 No.3
    if (trimmedUserID.length > MAX_USER_ID_LENGTH) {
      setMessageType('error');
      setMessage('UserID最大长度为10字符');
      return;
    }

    // 3. API调用
    setIsLoading(true);
    setMessage('');
    setUserName('');
    setSelectedDocs([]);
    setIsQueried(false);

    try {
      // 步骤1：调用UD18CheckAuthApi检查用户是否存在
      // 对应设计书 4.2 - GET /api/ud18/checkauth?userId=xxx
      const authResponse = await apiClient.get('/api/ud18/checkauth', {
        params: { userId: trimmedUserID },
      });

      const exists = authResponse.data?.data?.exists === true;

      // 步骤2：若不存在，显示错误消息并终止
      // 对应设计书 3.2 校验详细规格表 No.4
      if (!exists) {
        setMessageType('error');
        setMessage("We didn't recognize the userid you entered. Please try again.");
        setIsLoading(false);
        return;
      }

      // 步骤3：若存在，调用AuthenticationApi获取用户名
      // 对应设计书 4.3 - GET /api/ud01/authentication
      let displayName = trimmedUserID;
      try {
        const authUserResponse = await apiClient.get('/api/ud01/authentication', {
          params: { userId: trimmedUserID },
        });
        if (authUserResponse.data?.status === 'success' && authUserResponse.data?.data?.name) {
          displayName = authUserResponse.data.data.name;
        }
      } catch (authErr) {
        // Saviynt服务不可用时，使用UserID作为显示名
        console.warn('Saviynt服务不可用，使用UserID作为显示名:', authErr);
      }

      // 步骤4：调用UD18GetUserDocApi查询用户当前文档权限（返回doctypes列表）
      // 对应设计书 4.4 - GET /api/ud18/getuserdoc?userId=xxx
      let currentDocs: string[] = [];
      try {
        const docResponse = await apiClient.get('/api/ud18/getuserdoc', {
          params: { userId: trimmedUserID },
        });
        if (docResponse.data?.code === 200 && Array.isArray(docResponse.data?.data?.doctypes)) {
          currentDocs = docResponse.data.data.doctypes;
        }
      } catch (docErr) {
        // 无文档权限时忽略
        console.warn('查询用户文档权限失败:', docErr);
      }

      // 5. 结果处理 - 多个文档权限全部高亮
      setUserName(displayName);
      setSelectedDocs(currentDocs);
      setIsQueried(true);
      setMessageType('success');
      setMessage('');

    } catch (error: any) {
      // 异常处理
      console.error('查询用户信息失败:', error);

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        if (statusCode >= 500) {
          setMessageType('error');
          setMessage('服务器内部错误，请联系管理员');
        } else {
          setMessageType('error');
          setMessage(errorMsg || "We didn't recognize the userid you entered. Please try again.");
        }
      } else if (error.code === 'ECONNABORTED') {
        setMessageType('error');
        setMessage('网络连接失败，请检查网络设置');
      } else {
        setMessageType('error');
        setMessage('数据库查询失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 更新用户文档权限
   * 对应设计书 3.1.3 Update按钮处理流程
   *
   * 处理流程：
   * 1. 空值校验（前端校验）
   * 2. 检查用户是否存在
   * 3. 检查文档权限是否已存在
   * 4. 不存在则新增，存在则先删后增
   * 5. 结果处理
   */
  const handleUpdate = async () => {
    const trimmedUserID = userID.trim();

    // 对应设计书 3.2 校验详细规格表 No.5
    if (!trimmedUserID) {
      setMessageType('error');
      setMessage('请输入UserID');
      return;
    }

    // 对应设计书 3.2 校验详细规格表 No.6
    if (!isQueried) {
      setMessageType('error');
      setMessage('请先查询用户信息');
      return;
    }

    if (selectedDocs.length === 0) {
      setMessageType('error');
      setMessage('请选择至少一个文档权限');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 步骤1：检查用户是否存在
      // 对应设计书 4.2 - GET /api/ud18/checkauth
      const authResponse = await apiClient.get('/api/ud18/checkauth', {
        params: { userId: trimmedUserID },
      });

      if (authResponse.data?.data?.exists !== true) {
        // 对应设计书 3.2 校验详细规格表 No.7
        setMessageType('error');
        setMessage("We didn't recognize the userid you entered. Please try again.");
        setIsLoading(false);
        return;
      }

      // 步骤2：获取用户当前所有文档权限
      let existingDocs: string[] = [];
      try {
        const docResponse = await apiClient.get('/api/ud18/getuserdoc', {
          params: { userId: trimmedUserID },
        });
        if (docResponse.data?.code === 200 && Array.isArray(docResponse.data?.data?.doctypes)) {
          existingDocs = docResponse.data.data.doctypes;
        }
      } catch {
        existingDocs = [];
      }

      // 步骤3：计算需要删除和新增的权限
      // 需要删除：现有中存在但新选中的不存在
      const docsToDelete = existingDocs.filter((d) => !selectedDocs.includes(d));
      // 需要新增：新选中但现有中不存在的
      const docsToCreate = selectedDocs.filter((d) => !existingDocs.includes(d));

      // 步骤4：删除不再需要的权限
      for (const doc of docsToDelete) {
        const deleteResponse = await apiClient.post('/api/ud18/deleteedoc', {
          userId: trimmedUserID,
          doctype: doc,
        });
        if (deleteResponse.data?.code !== 200) {
          setMessageType('error');
          setMessage(`权限删除失败: ${doc}`);
          setIsLoading(false);
          return;
        }
      }

      // 步骤5：新增需要的权限
      for (const doc of docsToCreate) {
        const createResponse = await apiClient.post('/api/ud18/createdoc', {
          userId: trimmedUserID,
          doctype: doc,
        });
        if (createResponse.data?.code !== 200) {
          setMessageType('error');
          setMessage(`权限新增失败: ${doc}`);
          setIsLoading(false);
          return;
        }
      }

      // 成功
      setMessageType('success');
      setMessage('');
    } catch (error: any) {
      // 异常处理
      console.error('更新用户文档权限失败:', error);
      setMessageType('error');

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        if (statusCode === 404) {
          setMessage(errorMsg || "We didn't recognize the userid you entered. Please try again.");
        } else if (statusCode >= 500) {
          setMessage('服务器内部错误，请联系管理员');
        } else {
          setMessage(errorMsg || '权限更新失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        setMessage('网络连接失败，请检查网络设置');
      } else {
        setMessage('数据库更新失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud18-container'>
      {/* 页面标题 - 参照UD17样式 */}
      <div className='ud18-title'>HDoc User Doc Administration</div>

      {/* 消息显示区域 - 在标题下方 */}
      {/* 对应设计书 2.1 控件属性表 No.6 Message */}
      {message && (
        <div
          className={`ud18-message ${
            messageType === 'success' ? 'ud18-message-success' : 'ud18-message-error'
          }`}
        >
          {message}
        </div>
      )}

      {/* 表单区域 */}
      <div className='ud18-form-section'>
        {/* 第一行：UserID输入 + User Info按钮 */}
        {/* 对应设计书 2.1 控件属性表 No.1 UserID / No.4 User Info */}
        <div className='ud18-search-row'>
          <div className='ud18-search-group'>
            <label htmlFor='ud18-userid'>UserID:</label>
            <input
              id='ud18-userid'
              type='text'
              value={userID}
              onChange={handleUserIDChange}
              placeholder=''
              disabled={isLoading}
              maxLength={MAX_USER_ID_LENGTH}
              inputMode='text'
              autoCapitalize='off'
              autoCorrect='off'
              autoComplete='off'
            />
          </div>
          <button
            className='ud18-btn-info'
            onClick={handleUserInfo}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : 'User Info'}
          </button>
        </div>

        {/* 第二行：User标签 */}
        {/* 对应设计书 2.1 控件属性表 No.2 User */}
        <div className='ud18-user-row'>
          <span className='ud18-user-label-text'>User:</span>
          <span className='ud18-user-value'>{userName || ''}</span>
        </div>

        {/* Document 多选下拉框 */}
        {/* 对应设计书 2.1 控件属性表 No.3 Document */}
        <div className='ud18-doc-section'>
          {/* <span className='ud18-doc-label'>Document <span className='ud18-multi-hint'>（按住Ctrl多选）</span></span> */}
          <select
            id='ud18-document'
            className='ud18-document-select'
            multiple
            value={selectedDocs}
            onChange={handleDocumentChange}
            disabled={isLoading}
            size={Math.max(4, documentList.length + 1)}
          >
            {documentList.length === 0 && (
              <option value='' disabled>-- 暂无可用文档 --</option>
            )}
            {documentList.map((doc, index) => (
              <option key={doc.documentType || index} value={doc.documentType}>
                {doc.documentType}
              </option>
            ))}
          </select>
        </div>

      </div>
      
        {/* 操作按钮区域 */}
        {/* 对应设计书 2.1 控件属性表 No.5 Update */}
        <div className='ud18-actions'>
          <button
            className='ud18-btn-update'
            onClick={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? '处理中...' : 'Update'}
          </button>
        </div>
    </div>
  );
};

export default UD18_HDocUserDocAdministration;
