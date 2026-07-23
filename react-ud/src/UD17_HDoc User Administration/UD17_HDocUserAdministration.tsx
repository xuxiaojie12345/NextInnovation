import React, { useState, useEffect, useCallback } from 'react';
import './UD17_HDocUserAdministration.css';
import apiClient from '../api/config';

/*  类型定义 */
/** type代码→角色key映射表（对应全体API設計 type与checkbox对应关系） */
const TYPE_TO_ROLE_MAP: Record<string, string> = {
  U: 'Standard User',
  R: 'Rule Admin',
  T: 'Template Admin',
  D: 'Document Auth Admin',
  A: 'User Admin',
  DOCMOD: 'Adaptation user',
  MCSU: 'Manage Variable List',
};

/** checkbox key → 数据库FUNCTION值映射（对应MASTER_AUTH.TYPE存储值） */
const ROLE_TO_DB_FUNCTION_MAP: Record<string, string> = {
  'Standard User': 'USER',
  'Rule Admin': 'RULES',
  'Template Admin': 'TEMPLATE',
  'Document Auth Admin': 'Document',
  'User Admin': 'User Administrator',
  'Adaptation user': 'ADAPTATION DOC',
  'Manage Variable List': 'market super user',
  'Market Super User': 'market super user',
};

/** 角色配置项 - 用于管理画面中的权限行 */
interface RoleConfig {
  key: string;                     // 唯一标识
  label: string;                   // 显示名称
  hasMarket: boolean;              // 是否有Market下拉框
  marketFixed?: string;            // 固定Market值（如'-EU'），无则从列表选择
  isLabel?: boolean;               // 是否为Label（Output），不显示复选框
}

/* 角色配置表  */
const ROLE_CONFIGS: RoleConfig[] = [
  { key: 'Standard User',       label: 'Standard User',       hasMarket: true,  marketFixed: '-EU' },
  { key: 'Rule Admin',          label: 'Rule Admin',          hasMarket: true  },
  { key: 'Template Admin',      label: 'Template Admin',      hasMarket: true  },
  { key: 'Document Auth Admin', label: 'Document Auth Admin', hasMarket: true  },
  { key: 'User Admin',          label: 'User Admin',          hasMarket: false },
  { key: 'Adaptation user',     label: 'Adaptation user',     hasMarket: true,  marketFixed: '-EU' },
  { key: 'Manage Variable List', label: 'Manage Variable List', hasMarket: false },
  { key: 'Market Super User',   label: 'Market Super User',   hasMarket: true,  isLabel: true  },
];

/* ============================================================
   UD17_HDocUserAdministration 组件
   HDoc User Administration - 用户权限管理页面
   ============================================================ */
const UD17_HDocUserAdministration: React.FC = () => {

  // ==================== 状态管理 ====================
  // 对应设计书 6. 实现注意事项 No.1
  const [userID, setUserID] = useState<string>('');                    // UserID输入值
  const [userName, setUserName] = useState<string>('');                // 用户名（查询后显示）
  const [queriedUserID, setQueriedUserID] = useState<string>('');      // 上一次查询的UserID
  const [message, setMessage] = useState<string>('');                  // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success'); // 消息类型
  const [isLoading, setIsLoading] = useState<boolean>(false);          // 加载状态
  const [isQueried, setIsQueried] = useState<boolean>(false);          // 是否已查询用户信息

  // 角色勾选状态：key -> checked
  const [checkedRoles, setCheckedRoles] = useState<Record<string, boolean>>({});
  // Market选择状态：roleType -> market值
  const [marketSelections, setMarketSelections] = useState<Record<string, string>>({});
  // Market下拉列表数据源（从API获取）
  const [marketList, setMarketList] = useState<string[]>([]);

  // ==================== 常量定义 ====================
  const USER_ID_REGEX = /^[a-zA-Z0-9]*$/;           // 半角英数字
  const MAX_USER_ID_LENGTH = 10;

  // ==================== 初期表示 ====================
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 获取Market下拉列表数据
   */
  const fetchMarketList = async () => {
    try {
      const response = await apiClient.get('/api/ud14/market');
      if (response.data?.code === 200 && Array.isArray(response.data?.data)) {
        const markets: string[] = response.data.data.map(
          (item: { market: string }) => item.market
        );
        setMarketList(markets);

        // 初始化Market选择：固定值设为'-EU'，其余设为空
        const initialMarkets: Record<string, string> = {};
        ROLE_CONFIGS.forEach((role) => {
          initialMarkets[role.key] = role.marketFixed || '';
        });
        setMarketSelections(initialMarkets);
      }
    } catch (error) {
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 UserID 输入变化
   * 限制：只允许半角英数字
   */
  const handleUserIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (USER_ID_REGEX.test(val)) {
      setUserID(val);
      if (message) {
        setMessage('');
      }
    }
  };

  /**
   * 处理角色复选框变化
   *
   * @param roleKey - 角色标识
   * @param checked - 是否选中
   */
  const handleRoleCheckChange = (roleKey: string, checked: boolean) => {
    setCheckedRoles((prev) => ({
      ...prev,
      [roleKey]: checked,
    }));
  };

  /**
   * 处理Market下拉框变化
   *
   * @param roleKey - 角色标识
   * @param market - 选择的Market值
   */
  const handleMarketChange = (roleKey: string, market: string) => {
    setMarketSelections((prev) => ({
      ...prev,
      [roleKey]: market,
    }));
  };

  // ==================== API 调用 ====================
  const handleUserInfo = async () => {
    // 1. 前置处理：去除首尾空格
    const trimmedUserID = userID.trim();
    console.log("修改前的userID"+userID);
    // 2. 空值校验（前端校验）
    if (!trimmedUserID) {
      setMessageType('error');
      setMessage('请输入用户ID');
      return;
    }
    // 3. API调用
    setIsLoading(true);
    setMessage('');
    setUserName('');
    setIsQueried(false);

    try {
      // 步骤4: 首先检查该用户是否存在于用户机能权限表HDOC_FUNCTION_AUTH表里
      const response = await apiClient.get('/api/ud17/userinfo', {
        params: { userId: trimmedUserID },
      });

      if (response.data?.success === true || response.data?.code === "200") {
        // 步骤5: 用户存在，从userName字段获取用户名称
        const displayName = response.data.userName || trimmedUserID;
        setUserName(displayName);

        // 步骤4(续): 解析authList，通过type代码映射到对应的checkbox
        const authList: Array<{ market: string; type: string; BU?: string }> = response.data.authList || [];

        // 设置角色勾选状态：根据type代码映射到checkbox key
        const newCheckedRoles: Record<string, boolean> = {};
        const newMarkets: Record<string, string> = {};

        // 先查找MCSU的auth项（如果有，其market要赋给Market Super User）
        const mcsuAuth = authList.find((item) => item.type === 'MCSU');

        ROLE_CONFIGS.forEach((role) => {
          // 根据type→role映射查找该角色对应的auth项
          const matchingType = Object.keys(TYPE_TO_ROLE_MAP).find(
            (typeCode) => TYPE_TO_ROLE_MAP[typeCode] === role.key
          );
          const auth = matchingType
            ? authList.find((item) => item.type === matchingType)
            : undefined;

          newCheckedRoles[role.key] = !!auth;

          // 特殊处理：MCSU的market值赋给Market Super User的下拉框
          if (role.key === 'Market Super User' && mcsuAuth) {
            newMarkets[role.key] = mcsuAuth.market;
          } else {
            newMarkets[role.key] = auth ? auth.market : (role.marketFixed || '');
          }
        });

        setCheckedRoles(newCheckedRoles);
        setMarketSelections(newMarkets);

        // 步骤6: 结果反馈 - 显示用户名称和权限配置
        setIsQueried(true);
        setQueriedUserID(trimmedUserID);
        setMessageType('success');
        setMessage('');
      } else {
        setMessageType('error');
        setMessage("We didn't recognize the userid you entered. Please try again.");
        resetPermissions();
      }
    } catch (error: any) {
      // 异常处理

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.message;

        if (statusCode === 400) {
          setMessageType('error');
          setMessage(errorMsg || "We didn't recognize the userid you entered. Please try again.");
        } else if (statusCode >= 500) {
          setMessageType('error');
          setMessage('系统繁忙，请稍后重试');
        } else {
          setMessageType('error');
          setMessage(errorMsg || '查询失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        setMessageType('error');
        setMessage('请求超时，请检查网络连接后重试');
      } else {
        setMessageType('error');
        setMessage('系统繁忙，请稍后重试');
      }
      resetPermissions();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 更新用户权限
   */
  const handleUpdateRole = async () => {
    // 对应设计书 3.2 校验详细规格表 No.3
    const trimmedUserID = userID.trim();
    if (!trimmedUserID || !isQueried || trimmedUserID !== queriedUserID) {
      setMessageType('error');
      setMessage('请先查询用户信息');
      return;
    }
    console.log("是修改前的还是修改后的userID"+userID);
    setIsLoading(true);
    setMessage('');

    try {
      // 构建请求数据
      const functionAuths: Array<{ function: string; market: string }> = [];

      ROLE_CONFIGS.forEach((role) => {
        // Checkbox类型：选中才加入
        // Label类型（Market Super User）：有Market值则加入
        if (checkedRoles[role.key] || role.isLabel) {
          const market = role.hasMarket
            ? (marketSelections[role.key] || role.marketFixed || '')
            : '';
          // Label类型且Market为空时不加入
          if (role.isLabel && !market) return;
          // 使用ROLE_TO_DB_FUNCTION_MAP转换为数据库存储的值
          const dbFunction = ROLE_TO_DB_FUNCTION_MAP[role.key] || role.key;
          functionAuths.push({
            function: dbFunction,
            market,
          });
        }
      });

      const response = await apiClient.put('/api/ud17/updaterole', {
        userId: trimmedUserID,
        functionAuths,
      });

      // 结果处理
      if (response.data?.success === true || response.data?.code === "200") {
        setMessageType('success');
        setMessage('用户权限更新成功');
      } else {
        setMessageType('error');
        setMessage(response.data?.message || '用户权限更新失败，请稍后重试');
      }
    } catch (error: any) {
      // 异常处理
      setMessageType('error');

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.message;

        if (statusCode === 400) {
          setMessage(errorMsg || "We didn't recognize the userid you entered. Please try again.");
        } else {
          setMessage(errorMsg || '用户权限更新失败，请稍后重试');
        }
      } else if (error.code === 'ECONNABORTED') {
        setMessage('请求超时，请检查网络连接后重试');
      } else {
        setMessage('用户权限更新失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 删除用户所有权限
   */
  const handleDeleteRole = async () => {
    const trimmedUserID = userID.trim();
    if (!trimmedUserID || !isQueried || trimmedUserID !== queriedUserID) {
      setMessageType('error');
      setMessage('请先查询用户信息');
      return;
    }

    // 删除确认对话框
    const confirmed = window.confirm('确定要删除该用户的所有权限吗？');
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await apiClient.post('/api/ud17/deleteuser', {
        userId: trimmedUserID,
      });

      // 结果处理
      if (response.data?.success === true || response.data?.code === "200") {
        // 成功：清空画面所有权限配置
        resetPermissions();
        setUserName('');
        setIsQueried(false);
        setMessageType('success');
        setMessage('用户权限删除成功');
      } else {
        setMessageType('error');
        setMessage(response.data?.message || '用户权限删除失败，请稍后重试');
      }
    } catch (error: any) {
      // 异常处理
      setMessageType('error');

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.message;

        if (statusCode === 400) {
          setMessage(errorMsg || "We didn't recognize the userid you entered. Please try again.");
        } else {
          setMessage(errorMsg || '用户权限删除失败，请稍后重试');
        }
      } else if (error.code === 'ECONNABORTED') {
        setMessage('请求超时，请检查网络连接后重试');
      } else {
        setMessage('用户权限删除失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 辅助函数 ====================

  /**
   * 重置所有权限配置
   */
  const resetPermissions = useCallback(() => {
    setCheckedRoles({});
    const initialMarkets: Record<string, string> = {};
    ROLE_CONFIGS.forEach((role) => {
      initialMarkets[role.key] = role.marketFixed || '';
    });
    setMarketSelections(initialMarkets);
  }, []);

  // ==================== 渲染 UI ====================
  // 第一行checkbox的角色（并列显示）
  const row1Roles = ['Standard User', 'Rule Admin', 'Template Admin', 'Document Auth Admin', 'User Admin'];

  return (
    <div className='ud17-container'>
      {/* 页面标题*/}
      <div className='ud17-title'>HDoc User Administration</div>

        {/* 消息显示区域 */}
        {message && (
            <div
            className={`ud17-message ${
                messageType === 'success' ? 'ud17-message-success' : 'ud17-message-error'
            }`}
            >
            {message}
            </div>
        )}
        
      {/* 用户查询区域 */}
      <div className='ud17-form-section'>
        {/* UserID输入 + User Info按钮 */}
        <div className='ud17-search-row'>
          <div className='ud17-search-group'>
            <label htmlFor='ud17-userid'>UserID</label>
            <input id='ud17-userid'  type='text' value={userID} onChange={handleUserIDChange}
              placeholder='' disabled={isLoading} maxLength={MAX_USER_ID_LENGTH}
              inputMode='text'autoCapitalize='off' autoCorrect='off' autoComplete='off'
            />
          </div>
          <button className='ud17-btn-info' onClick={handleUserInfo} disabled={isLoading}>{isLoading ? '处理中...' : 'User Info'}</button>
        </div>

        {/* User输入框 - 显示在UserID下方 */}
        <div className='ud17-search-row'>
          <div className='ud17-search-group'>
            <label htmlFor='ud17-user'>User</label>
            <input id='ud17-user' type='text' value={userName || ''}
              placeholder='' disabled maxLength={MAX_USER_ID_LENGTH}
              inputMode='text' autoCapitalize='off' autoCorrect='off' autoComplete='off'
            />
          </div>
        </div>


        {/* Roles区域（前两行共用标题） */}
        <div className='ud17-roles-area'>
          <span className='ud17-roles-label'>Roles</span>
          <div className='ud17-roles-content'>
            {/* 第一行：5个checkbox并列 */}
            <div className='ud17-checkbox-row'>
              {ROLE_CONFIGS.filter((r) => row1Roles.includes(r.key)).map((role) => (
                <div key={role.key} className='ud17-checkbox-item'>
                  <div className='ud17-checkbox-wrapper'>
                    <input
                      type='checkbox'
                      id={`chk-${role.key}`}
                      checked={!!checkedRoles[role.key]}
                      onChange={(e) => handleRoleCheckChange(role.key, e.target.checked)}
                      disabled={isLoading}
                    />
                    <label htmlFor={`chk-${role.key}`}>{role.label}</label>
                  </div>
                  {/* Market下拉框 - 在checkbox下方 */}
                  {role.hasMarket && (
                    <select
                      className='ud17-market-select'
                      value={marketSelections[role.key] || ''}
                      onChange={(e) => handleMarketChange(role.key, e.target.value)}
                      disabled={isLoading || !!role.marketFixed}
                      size={10}
                    >
                      {role.marketFixed ? (
                        <option value={role.marketFixed}>{role.marketFixed}</option>
                      ) : (
                        <>
                          <option value='' disabled hidden></option>
                          {marketList.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* 第二行：Adaptation user */}
            <div className='ud17-checkbox-row ud17-row2'>
              {ROLE_CONFIGS.filter((r) => r.key === 'Adaptation user').map((role) => (
                <div key={role.key} className='ud17-checkbox-item'>
                  <div className='ud17-checkbox-wrapper'>
                    <input
                      type='checkbox'
                      id={`chk-${role.key}`}
                      checked={!!checkedRoles[role.key]}
                      onChange={(e) => handleRoleCheckChange(role.key, e.target.checked)}
                      disabled={isLoading}
                    />
                    <label htmlFor={`chk-${role.key}`}>{role.label}</label>
                  </div>
                  {role.hasMarket && (
                    <select
                      className='ud17-market-select'
                      value={marketSelections[role.key] || ''}
                      onChange={(e) => handleMarketChange(role.key, e.target.value)}
                      disabled={isLoading || !!role.marketFixed}
                      size={10}
                    >
                      <option value={role.marketFixed}>{role.marketFixed}</option>
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manage Variable List行 */}
        <div className='ud17-roles-area'>
          <span className='ud17-roles-label'>Manage Variable List</span>
          <div className='ud17-roles-content'>
            <div className='ud17-checkbox-row ud17-row2'>
              {ROLE_CONFIGS.filter((r) => r.key === 'Manage Variable List').map((role) => (
                <div key={role.key} className='ud17-checkbox-item'>
                  <div className='ud17-checkbox-wrapper'>
                    <input
                      type='checkbox'
                      id={`chk-${role.key}`}
                      checked={!!checkedRoles[role.key]}
                      onChange={(e) => handleRoleCheckChange(role.key, e.target.checked)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Super User行 */}
        <div className='ud17-roles-area'>
          <span className='ud17-roles-label'>Market Super User</span>
          <div className='ud17-roles-content'>
            <div className='ud17-checkbox-row ud17-row2'>
              {ROLE_CONFIGS.filter((r) => r.key === 'Market Super User').map((role) => (
                <div key={role.key} className='ud17-checkbox-item-inline'>
                  {role.hasMarket && (
                    <select
                      className='ud17-market-select'
                      value={marketSelections[role.key] || ''}
                      onChange={(e) => handleMarketChange(role.key, e.target.value)}
                      disabled={isLoading}
                      size={10}
                    >
                      <option value='' disabled hidden></option>
                      {marketList.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        
      </div>

      {/* 操作按钮 */}
        <div className='ud17-actions'>
          <button className='ud17-btn-update' onClick={handleUpdateRole} 
          disabled={isLoading}> {isLoading ? '处理中...' : 'Update Role'}</button>
          <button className='ud17-btn-delete' onClick={handleDeleteRole} 
          disabled={isLoading}> {isLoading ? '处理中...' : 'Delete Role'}</button>
        </div>
    </div> 
     
  );
};

export default UD17_HDocUserAdministration;
