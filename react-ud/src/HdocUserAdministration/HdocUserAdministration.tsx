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
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

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
    return sessionStorage.getItem('userId') || '';
  };

  /**
   * 调用UD08SelectMarketmasterApi获取市场列表
   * 对应设计书 5.1 UD08SelectMarketmasterApi
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    
    try {
      // API请求 - 获取Market下拉列表数据 (对应设计书 5.1)
      const response = await axios.post('http://localhost:8081/api/ud12/selectmarket');
      
      if (response.data.code === 200) {
        const markets = response.data.data.map((item: any) => item.market || item);
        // 在所有pulldownlist第一行添加 "-EU"
        setMarketList(['-EU', ...markets]);
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
      showMessage('请输入UserID', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // 步骤1：查询用户名 (对应设计书 4.1.2 步骤2)
      const userResponse = await axios.post('http://localhost:8081/api/ud01/login', {
        UserId: userId
      });
      
      // 条件1：若用户userId不存在 (对应设计书 4.2 No.1)
      if (userResponse.data.code !== 200) {
        showMessage("We didn't recognize the userid you entered. Please try again.", 'error');
        return;
      }
      
      // 条件2：若用户存在，显示用户名
      setUserName(userResponse.data.data?.username || '');
      
      // 步骤2：查询用户权限 (对应设计书 4.1.2 步骤2)
      const authResponse = await axios.post('http://localhost:8081/api/ud17/userinfo', {
        UserId: userId
      });
      
      if (authResponse.data.code === 200) {
        const authList = authResponse.data.data;
        
        // TYPE字母→权限Key映射 (HDOC_MARKET_AUTH)
        const typeToPermissionKey: Record<string, string> = {
          'A': 'userAdmin',
          'R': 'ruleAdmin',
          'T': 'templateAdmin',
          'U': 'standardUser',
          'D': 'documentAuthAdmin',
          'DOCMOD': 'adaptationUser',
          'MCSU': 'marketSuperUser'
        };
        
        // FUNCTION名称→权限Key映射 (HDOC_FUNCTION_AUTH)
        const functionToPermissionKey: Record<string, string> = {
          'Standard User': 'standardUser',
          'Rule Admin': 'ruleAdmin',
          'Template Admin': 'templateAdmin',
          'Document Auth Admin': 'documentAuthAdmin',
          'User Admin': 'userAdmin',
          'ADAPTATION DOC': 'adaptationUser',
          'Manage Variable List': 'manageVariableList',
          'Market Super User': 'marketSuperUser'
        };
        
        // 初始化所有权限为disabled
        const newPermissions: any = {
          standardUser: { enabled: false, markets: [] as string[] },
          ruleAdmin: { enabled: false, markets: [] as string[] },
          templateAdmin: { enabled: false, markets: [] as string[] },
          documentAuthAdmin: { enabled: false, markets: [] as string[] },
          userAdmin: { enabled: false },
          adaptationUser: { enabled: false, markets: [] as string[] },
          manageVariableList: { enabled: false },
          marketSuperUser: { markets: [] as string[] }
        };
        
        // 遍历后端返回的权限列表
        if (Array.isArray(authList)) {
          authList.forEach((item: any) => {
            const typeVal = item.type as string;
            const market = item.market as string;
            const funcVal = item.function as string;
            
            // === 处理 HDOC_MARKET_AUTH.TYPE → 权限checkbox + market高亮 ===
            const permKey = typeToPermissionKey[typeVal];
            if (permKey && newPermissions[permKey]) {
              const perm = newPermissions[permKey];
              // 有数据则勾选checkbox
              if (typeof perm.enabled === 'boolean') {
                perm.enabled = true;
              }
              // market高亮
              if (market && perm.markets) {
                if (!perm.markets.includes(market)) {
                  perm.markets.push(market);
                }
              }
            }
            
            // === 处理 HDOC_FUNCTION_AUTH.FUNCTION → 权限checkbox ===
            if (funcVal && funcVal.trim()) {
              const funcPermKey = functionToPermissionKey[funcVal.trim()];
              if (funcPermKey && newPermissions[funcPermKey]) {
                const perm = newPermissions[funcPermKey];
                if (typeof perm.enabled === 'boolean') {
                  perm.enabled = true;
                }
              }
            }
          });
        }
        
        setPermissions(newPermissions);
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update Role按钮点击处理 - 更新用户权限
   * 对应设计书 3.3 Update Role按钮押下
   * 先删除旧数据，再按当前画面选择批量插入新数据
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
      // 步骤1：验证用户是否存在
      const userResponse = await axios.post('http://localhost:8081/api/ud01/login', {
        UserId: userId
      });
      
      if (userResponse.data.code !== 200) {
        showMessage("We didn't recognize the userid you entered. Please try again.", 'error');
        return;
      }
      
      // 权限配置：Key → TYPE字母 + FUNCTION名称
      const permissionConfig: Record<string, { type: string; func: string; hasMarket: boolean }> = {
        standardUser: { type: 'U', func: 'Standard User', hasMarket: true },
        ruleAdmin: { type: 'R', func: 'Rule Admin', hasMarket: true },
        templateAdmin: { type: 'T', func: 'Template Admin', hasMarket: true },
        documentAuthAdmin: { type: 'D', func: 'Document Auth Admin', hasMarket: true },
        userAdmin: { type: 'A', func: 'User Admin', hasMarket: false },
        adaptationUser: { type: 'DOCMOD', func: 'ADAPTATION DOC', hasMarket: true },
        manageVariableList: { type: '', func: 'Manage Variable List', hasMarket: false },
        marketSuperUser: { type: 'MCSU', func: 'Market Super User', hasMarket: true }
      };
      
      // 构建 MARKET_AUTH 列表：每个勾选权限下每个market生成一条记录
      const marketAuthList: { type: string; market: string }[] = [];
      // 构建 FUNCTION_AUTH 列表：每个勾选权限生成一条记录
      const functionAuthList: { function: string }[] = [];
      
      Object.entries(permissionConfig).forEach(([key, cfg]) => {
        const perm = (permissions as any)[key];
        if (!perm) return;
        
        const isEnabled = perm.enabled || (key === 'marketSuperUser' && perm.markets?.length > 0);
        if (!isEnabled) return;
        
        // FUNCTION_AUTH：每个启用的权限加一条function记录
        functionAuthList.push({ function: cfg.func });
        
        // MARKET_AUTH：有market的权限，每个market生成一条记录
        if (cfg.hasMarket && cfg.type && perm.markets && Array.isArray(perm.markets)) {
          perm.markets.forEach((market: string) => {
            if (market && market.trim()) {
              marketAuthList.push({ type: cfg.type, market: market.trim() });
            }
          });
        }
      });
      
      // API请求 - 更新用户权限
      const response = await axios.post('http://localhost:8081/api/ud17/updaterole', {
        userId: userId,
        updateUser: getCurrentUserId(),
        updateProcess: 'HdocUserAdministration',
        marketAuthList: marketAuthList,
        functionAuthList: functionAuthList
      });
      
      if (response.data.code === 200) {
        showMessage('权限更新成功', 'success');
      } else {
        showMessage(response.data.msg || '权限更新失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
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
      showMessage('请输入UserID', 'error');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // API请求 - 删除用户权限 (对应设计书 5.5 UD17DeleteHdocFunctionAuthApi)
      const response = await axios.post('http://localhost:8081/api/ud17/deleterole', {
        UserId: userId
      });
      
      if (response.data.code === 200) {
        showMessage('权限删除成功', 'success');
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
        showMessage(response.data.msg || '权限删除失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
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
