import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HdocUserAdministration.css';

/**
 * HdocUserAdministration组件 - 用户权限管理页面
 * 
 * @description 支持查询用户信息、分配/更新/删除权限，权限类型包括Standard User、Rule Admin、Template Admin等
 * @props 无Props
 */
const HdocUserAdministration: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [reTypePassword, setReTypePassword] = useState<string>('');
  const [marketList, setMarketList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 权限状态管理
  const [permissions, setPermissions] = useState({
    standardUser: { enabled: false, markets: ['-EU'] },
    ruleAdmin: { enabled: false, markets: [] },
    templateAdmin: { enabled: false, markets: [] },
    documentAuthAdmin: { enabled: false, markets: [] },
    userAdmin: { enabled: false },
    adaptationUser: { enabled: false, markets: ['-EU'] },
    manageVariableList: { enabled: false },
    marketSuperUser: { markets: [] }
  });

  /**
   * 画面初期表示 - 调用API获取市场列表
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 获取当前登录用户ID
   * TODO: 从JWT token或session中解析userId
   */
  const getCurrentUserId = (): string => {
    return localStorage.getItem('userId') || 'test_user';
  };

  /**
   * 调用UD08SelectMarketmasterApi获取市场列表
   * 对应设计书 5.1 UD08SelectMarketmasterApi
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    
    try {
      // API请求 - 获取Market下拉列表数据 (对应设计书 5.1)
      const response = await axios.get('/api/UD08/select-marketmaster');
      
      if (response.data.success) {
        const markets = response.data.data.map((item: any) => item.market || item);
        setMarketList(markets);
      }
    } catch (error: any) {
      console.error('获取市场列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * USER INFO按钮点击处理 - 查询用户信息和权限
   * 对应设计书 3.2 USER INFO按钮押下 和 4.1.2 USER INFO按钮押下
   */
  const handleUserInfoClick = async () => {
    // 校验：UserID不能为空 (对应设计书 2.1 控件属性表 - UserID为必填项)
    if (!userId.trim()) {
      setErrorMessage('请输入UserID');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 步骤1：查询用户名 (对应设计书 4.1.2 步骤2)
      const userResponse = await axios.get('/api/UD01/select-hdoc-user-infor', {
        params: { UserId: userId }
      });
      
      // 条件1：若用户userId不存在 (对应设计书 4.2 No.1)
      if (!userResponse.data.success) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        return;
      }
      
      // 条件2：若用户存在，显示用户名
      setUserName(userResponse.data.data.userName || '');
      
      // 步骤2：查询用户权限 (对应设计书 4.1.2 步骤2)
      const authResponse = await axios.get('/api/UD17/select-doc-market-auth', {
        params: { UserId: userId }
      });
      
      if (authResponse.data.success) {
        const authData = authResponse.data.data.type;
        
        // 根据API返回的权限数据更新Checkbox状态 (对应设计书 4.1.2)
        setPermissions({
          standardUser: { 
            enabled: authData.standardUser?.enabled || false, 
            markets: authData.standardUser?.markets || ['-EU'] 
          },
          ruleAdmin: { 
            enabled: authData.ruleAdmin?.enabled || false, 
            markets: authData.ruleAdmin?.markets || [] 
          },
          templateAdmin: { 
            enabled: authData.templateAdmin?.enabled || false, 
            markets: authData.templateAdmin?.markets || [] 
          },
          documentAuthAdmin: { 
            enabled: authData.documentAuthAdmin?.enabled || false, 
            markets: authData.documentAuthAdmin?.markets || [] 
          },
          userAdmin: { 
            enabled: authData.userAdmin?.enabled || false 
          },
          adaptationUser: { 
            enabled: authData.adaptationUser?.enabled || false, 
            markets: authData.adaptationUser?.markets || ['-EU'] 
          },
          manageVariableList: { 
            enabled: authData.manageVariableList?.enabled || false 
          },
          marketSuperUser: { 
            markets: authData.showChangeVariantsFields?.markets || [] 
          }
        });
      }
    } catch (error: any) {
      console.error('查询用户信息失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update Role按钮点击处理 - 更新用户权限
   * 对应设计书 3.3 Update Role按钮押下 和 4.1.3 Update Role按钮押下
   */
  const handleUpdateRoleClick = async () => {
    // 校验：UserID不能为空
    if (!userId.trim()) {
      setErrorMessage('请输入UserID');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 步骤1：验证用户是否存在 (对应设计书 4.1.3 步骤2)
      const userResponse = await axios.get('/api/UD01/select-hdoc-user-infor', {
        params: { UserId: userId }
      });
      
      // 条件1：若用户userId不存在 (对应设计书 4.2 No.2)
      if (!userResponse.data.success) {
        setErrorMessage("We didn't recognize the userid you entered. Please try again.");
        return;
      }
      
      // 条件2：若用户存在，执行权限更新操作
      // 构建请求参数 (对应设计书 5.4 UD17UpdateHdocFunctionAuthApi)
      const requestData = {
        updateUser: userName || userId,
        updateDatetime: new Date().toISOString(),
        updateProcess: 'HdocUserAdministration', // 当前画面ID
        type: {
          standardUser: {
            enabled: permissions.standardUser.enabled,
            markets: permissions.standardUser.markets
          },
          ruleAdmin: {
            enabled: permissions.ruleAdmin.enabled,
            markets: permissions.ruleAdmin.markets
          },
          templateAdmin: {
            enabled: permissions.templateAdmin.enabled,
            markets: permissions.templateAdmin.markets
          },
          documentAuthAdmin: {
            enabled: permissions.documentAuthAdmin.enabled,
            markets: permissions.documentAuthAdmin.markets
          },
          userAdmin: {
            enabled: permissions.userAdmin.enabled
          },
          adaptationUser: {
            enabled: permissions.adaptationUser.enabled,
            markets: permissions.adaptationUser.markets
          },
          manageVariableList: {
            enabled: permissions.manageVariableList.enabled
          },
          showChangeVariantsFields: {
            enabled: permissions.marketSuperUser.markets.length > 0,
            markets: permissions.marketSuperUser.markets
          }
        }
      };
      
      // API请求 - 更新用户权限 (对应设计书 5.4)
      const response = await axios.put('/api/UD17/update-hdoc-function-auth', requestData);
      
      if (response.data.success) {
        alert('权限更新成功');
      } else {
        setErrorMessage(response.data.message || '权限更新失败');
      }
    } catch (error: any) {
      console.error('更新权限失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete Role按钮点击处理 - 删除用户权限
   * 对应设计书 3.4 Delete Role按钮押下 和 4.1.4 Delete Role按钮押下
   */
  const handleDeleteRoleClick = async () => {
    // 校验：UserID不能为空
    if (!userId.trim()) {
      setErrorMessage('请输入UserID');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 - 删除用户权限 (对应设计书 5.5 UD17DeleteHdocFunctionAuthApi)
      const response = await axios.delete('/api/UD17/delete-hdoc-function-auth', {
        params: { UserId: userId }
      });
      
      if (response.data.success) {
        alert('权限删除成功');
        // 清空所有权限状态
        setPermissions({
          standardUser: { enabled: false, markets: ['-EU'] },
          ruleAdmin: { enabled: false, markets: [] },
          templateAdmin: { enabled: false, markets: [] },
          documentAuthAdmin: { enabled: false, markets: [] },
          userAdmin: { enabled: false },
          adaptationUser: { enabled: false, markets: ['-EU'] },
          manageVariableList: { enabled: false },
          marketSuperUser: { markets: [] }
        });
      } else {
        setErrorMessage(response.data.message || '权限删除失败');
      }
    } catch (error: any) {
      console.error('删除权限失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理Checkbox变化
   */
  const handleCheckboxChange = (permissionKey: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: {
        ...prev[permissionKey as keyof typeof prev],
        enabled: checked
      }
    }));
  };

  /**
   * 处理Market选择变化
   */
  const handleMarketChange = (permissionKey: string, selectedMarkets: string[]) => {
    setPermissions(prev => ({
      ...prev,
      [permissionKey]: {
        ...prev[permissionKey as keyof typeof prev],
        markets: selectedMarkets
      }
    }));
  };

  return (
    <div className='hua-container'>
      <div className='hua-content'>
        {/* 标题区域 */}
        <h2 className='hua-title'>HDoc User Admin</h2>
        
        {/* UserID输入行 */}
        <div className='hua-form-row'>
          <label className='hua-label hua-required'>Userid</label>
          <input 
            type='text' 
            className='hua-input hua-input-short' 
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            maxLength={10}
            disabled={isLoading}
            required
          />
          <button 
            className='hua-info-button' 
            onClick={handleUserInfoClick}
            disabled={isLoading}
          >
            USER INFO
          </button>
        </div>
        
        {/* User输入行 */}
        <div className='hua-form-row'>
          <label className='hua-label'>User</label>
          <input 
            type='text' 
            className='hua-input hua-input-medium' 
            value={userName}
            
          />
          <input 
            type='password' 
            className='hua-input hua-input-short1' 
            value={reTypePassword}
            onChange={(e) => setReTypePassword(e.target.value)}
            disabled={isLoading}
          />
          <label className='hua-label'>(re-type password)</label>
        </div>
        
        {/* 权限Checkbox区域 */}
        <div className='hua-permissions-section'>
          {/* 第一行权限 */}
          <div className='hua-checkbox-row'>
            <label className='hua-checkbox-label'>
              <input 
                type='checkbox' 
                checked={permissions.standardUser.enabled}
                onChange={(e) => handleCheckboxChange('standardUser', e.target.checked)}
                disabled={isLoading}
              />
              Standard User
            </label>
            <label className='hua-checkbox-label'>
              <input 
                type='checkbox' 
                checked={permissions.ruleAdmin.enabled}
                onChange={(e) => handleCheckboxChange('ruleAdmin', e.target.checked)}
                disabled={isLoading}
              />
              Rule Admin
            </label>
            <label className='hua-checkbox-label'>
              <input 
                type='checkbox' 
                checked={permissions.templateAdmin.enabled}
                onChange={(e) => handleCheckboxChange('templateAdmin', e.target.checked)}
                disabled={isLoading}
              />
              Template Admin
            </label>
            <label className='hua-checkbox-label'>
              <input 
                type='checkbox' 
                checked={permissions.documentAuthAdmin.enabled}
                onChange={(e) => handleCheckboxChange('documentAuthAdmin', e.target.checked)}
                disabled={isLoading}
              />
              Document Auth Admin
            </label>
            <label className='hua-checkbox-label'>
              <input 
                type='checkbox' 
                checked={permissions.userAdmin.enabled}
                onChange={(e) => handleCheckboxChange('userAdmin', e.target.checked)}
                disabled={isLoading}
              />
              User Admin
            </label>
          </div>
          
          {/* Market下拉列表区域 */}
          <div className='hua-market-selects-row'>
            <select 
              className='hua-select hua-select-small'
              multiple
              value={permissions.standardUser.markets}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleMarketChange('standardUser', selected);
              }}
              disabled={!permissions.standardUser.enabled || isLoading}
            >
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
            
            <select 
              className='hua-select hua-select-small'
              multiple
              value={permissions.ruleAdmin.markets}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleMarketChange('ruleAdmin', selected);
              }}
              disabled={!permissions.ruleAdmin.enabled || isLoading}
            >
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
            
            <select 
              className='hua-select hua-select-small'
              multiple
              value={permissions.templateAdmin.markets}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleMarketChange('templateAdmin', selected);
              }}
              disabled={!permissions.templateAdmin.enabled || isLoading}
            >
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
            
            <select 
              className='hua-select hua-select-small'
              multiple
              value={permissions.documentAuthAdmin.markets}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleMarketChange('documentAuthAdmin', selected);
              }}
              disabled={!permissions.documentAuthAdmin.enabled || isLoading}
            >
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
          </div>
          
          {/* Roles标签和Adaptation user */}
          <div className='hua-roles-section'>
            <label className='hua-roles-label'>Roles</label>
            <label className='hua-checkbox-label hua-adaptation-label'>
              <input 
                type='checkbox' 
                checked={permissions.adaptationUser.enabled}
                onChange={(e) => handleCheckboxChange('adaptationUser', e.target.checked)}
                disabled={isLoading}
              />
              Adaptation use
            </label>
            </div>
            <div className='hua-market-selects-row'>
            <select 
              className='hua-select hua-select-adaptation'
              multiple
              value={permissions.adaptationUser.markets}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleMarketChange('adaptationUser', selected);
              }}
              disabled={!permissions.adaptationUser.enabled || isLoading}
            >
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
          </div>
          
          {/* Manage Variable List */}
          <div className='hua-manage-variable-row'>
            <label className='hua-label'>Manage Variable List</label>
            <input 
              type='checkbox' 
              checked={permissions.manageVariableList.enabled}
              onChange={(e) => handleCheckboxChange('manageVariableList', e.target.checked)}
              disabled={isLoading}
            />
          </div>
          
          {/* Market super user */}
          <div className='hua-market-super-row'>
            <label className='hua-label'>Market super user</label>
            <select 
              className='hua-select hua-select-market-super'
              multiple
              value={permissions.marketSuperUser.markets}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                handleMarketChange('marketSuperUser', selected);
              }}
              disabled={isLoading}
            >
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='hua-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='hua-loading'>
            加载中...
          </div>
        )}
        
        {/* 底部按钮区域 */}
        <div className='hua-bottom-buttons'>
          <button 
            className='hua-action-button' 
            onClick={handleUpdateRoleClick}
            disabled={isLoading}
          >
            Update Role
          </button>
          <button 
            className='hua-action-button' 
            onClick={handleDeleteRoleClick}
            disabled={isLoading}
          >
            Delete Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default HdocUserAdministration;
