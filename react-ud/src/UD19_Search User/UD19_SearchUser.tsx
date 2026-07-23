import React, { useState, useEffect } from 'react';
import './UD19_SearchUser.css';
import apiClient from '../api/config';

/* ============================================================
   类型定义
   ============================================================ */

/** Market列表项 */
interface MarketItem {
  market: string;
  description: string;
}

/** 搜索结果用户项 */
interface SearchUserItem {
  userId: string;
  username: string;
  market: string;
}

/* ============================================================
   UD19_SearchUser 组件
   Search User - 用户搜索页面
   ============================================================ */
const UD19_SearchUser: React.FC = () => {

  // ==================== 状态管理 ====================
  const [userId, setUserId] = useState<string>('');              // UserID输入值
  const [username, setUsername] = useState<string>('');          // 用户名输入值
  const [selectedMarket, setSelectedMarket] = useState<string>(''); // 选中的Market
  const [searchType, setSearchType] = useState<string>('notSet');  // 搜索类型: notSet/rule/template
  const [marketOptions, setMarketOptions] = useState<MarketItem[]>([]); // Market下拉列表
  const [searchResults, setSearchResults] = useState<SearchUserItem[]>([]); // 搜索结果
  const [message, setMessage] = useState<string>('');            // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success'); // 消息类型
  const [isLoading, setIsLoading] = useState<boolean>(false);    // 加载状态
  const [hasSearched, setHasSearched] = useState<boolean>(false); // 是否已执行搜索

  // ==================== 常量定义 ====================
  const USER_ID_REGEX = /^[a-zA-Z0-9]*$/;            // 半角英数字
  const USER_REGEX = /^[a-zA-Z0-9]*$/;               // 半角英数字
  const MAX_USER_ID_LENGTH = 10;
  const MAX_USERNAME_LENGTH = 32;

  // ==================== 初期表示 ====================
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 获取Market下拉列表数据
   */
  const fetchMarketList = async () => {
    try {
      const response = await apiClient.get('/api/ud19/getmarket');
      if (response.data?.code === 200 && Array.isArray(response.data?.data)) {
        setMarketOptions(response.data.data);
      }
    } catch (error) {
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 UserID 输入变化
   */
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (USER_ID_REGEX.test(val)) {
      setUserId(val);
    }
  };

  /**
   * 处理用户名输入变化
   */
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (USER_REGEX.test(val)) {
      setUsername(val);
    }
  };

  /**
   * 处理Market下拉框变化
   */
  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMarket(e.target.value);
  };

  /**
   * 处理搜索类型单选框变化
   *
   * @param type - 搜索类型
   */
  const handleSearchTypeChange = (type: string) => {
    setSearchType(type);
  };

  // ==================== API 调用 ====================

  /**
   * Search 按钮按下 搜索用户
   */
  const handleSearch = async () => {
    const trimmedUserId = userId.trim();
    const trimmedUsername = username.trim();

    // 校验：UserID格式（如果有输入）
    if (trimmedUserId && !USER_ID_REGEX.test(trimmedUserId)) {
      setMessageType('error');
      setMessage('UserID只能包含半角英数字');
      return;
    }

    // 校验用户名格式
    if (trimmedUsername && !USER_REGEX.test(trimmedUsername)) {
      setMessageType('error');
      setMessage('用户名只能包含半角英数字');
      return;
    }

    // API调用
    setIsLoading(true);
    setMessage('');
    setHasSearched(true);

    try {
      // 构建查询参数
      const params: Record<string, string> = {};
      if (trimmedUserId) params.userId = trimmedUserId;
      if (trimmedUsername) params.username = trimmedUsername;
      if (selectedMarket) params.market = selectedMarket;
      if (searchType !== 'notSet') {
        // 画面Radio值与数据库TYPE的映射: rule→R, template→T
        params.type = searchType === 'rule' ? 'R' : 'T';
      }

      // 调用搜索API
      const response = await apiClient.get('/api/ud19/search', {
        params,
      });

      // 结果处理
      if (response.data?.code === 200) {
        const responseData = response.data.data;
        const tableData: SearchUserItem[] = responseData?.datatable || [];
        const count = responseData?.count || tableData.length;

        setSearchResults(tableData);

        if (count > 0) {
          // 找到匹配用户，将结果的Userid和User填充到搜索条件中
          const firstResult = tableData[0];
          if (trimmedUserId) {
            setUsername(firstResult.username);
          }
          if (trimmedUsername) {
            setUserId(firstResult.userId);
          }
          setMessageType('success');
        }
      } else {
        setMessageType('error');
        setMessage(response.data?.msg || '搜索失败');
        setSearchResults([]);
      }
    } catch (error: any) {
      // 异常处理
      setMessageType('error');
      setSearchResults([]);

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        if (statusCode === 400) {
          setMessage(errorMsg || '请输入至少一个搜索条件');
        } else if (statusCode >= 500) {
          // 异常处理 - 服务器内部错误
          setMessage('服务器内部错误，请联系管理员');
        } else {
          setMessage(errorMsg || '搜索失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        // 异常处理 - 超时错误
        setMessage('请求超时，请稍后重试');
      } else {
        // 异常处理 - 网络连接失败
        setMessage('网络连接失败，请检查网络设置');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud19-container'>
      {/* 页面标题 */}
      <div className='ud19-title'>Search User</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud19-message ${
           messageType === 'success' ? 'ud19-message-success' : 'ud19-message-error'
          }`} > {message} 
        </div>
      )}

      {/* 搜索条件区域 */}
      <div className='ud19-form-section'>

        {/* UserID：label + input 同行 */}
        <div className='ud19-field-row'>
          <label htmlFor='ud19-userid'>Userid</label>
          <input id='ud19-userid' type='text' value={userId} onChange={handleUserIdChange} placeholder=''
            disabled={isLoading} maxLength={MAX_USER_ID_LENGTH} className='ud19-input'
          />
        </div>

        {/* User：label + input 同行 */}
        <div className='ud19-field-row'>
          <label htmlFor='ud19-user'>User</label>
          <input id='ud19-user' type='text' value={username}
            onChange={handleUsernameChange}
            placeholder=''
            disabled={isLoading}
            maxLength={MAX_USERNAME_LENGTH}
            className='ud19-input'
          />
        </div>

        {/* Market：label + dropdown + Radio 按钮 */}
        <div className='ud19-market-row'>
          <label htmlFor='ud19-market'>Market</label>
          <select id='ud19-market' className='ud19-select' value={selectedMarket}
            onChange={handleMarketChange}
            disabled={isLoading}
            size={10}
          >
            <option value=''></option>
            {marketOptions.map((item, index) => (
              <option key={index} value={item.market}>
                {item.market}
              </option>
            ))}
          </select>
          <div className='ud19-radio-group'>
            <label className='ud19-radio-item'>
              <input type='radio' name='searchType' checked={searchType === 'notSet'}
                onChange={() => handleSearchTypeChange('notSet')}
                disabled={isLoading}
              />
              Not set
            </label>
            <label className='ud19-radio-item'>
              <input type='radio' name='searchType' checked={searchType === 'rule'}
                onChange={() => handleSearchTypeChange('rule')}
                disabled={isLoading}
              />
              Rule
            </label>
            <label className='ud19-radio-item'>
              <input type='radio' name='searchType' checked={searchType === 'template'}
                onChange={() => handleSearchTypeChange('template')}
                disabled={isLoading}
              />
              Template
            </label>
          </div>
        </div>
      </div>

        {/* Search 按钮 */}
        <div className='ud19-action-area'>
          <button className='ud19-btn-search' onClick={handleSearch} disabled={isLoading} >
            {isLoading ? '处理中...' : 'Search'}
          </button>
        </div>

      {/* 搜索结果区域 */}
      <div className='ud19-result-section'>
          {hasSearched && searchResults.length > 0 ? (
            <table className='ud19-table'>
              <thead>
                <tr>
                  <th>Userid</th>
                  <th>User</th>
                  <th>Market</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((item, index) => (
                  <tr key={index}>
                    <td>{item.userId}</td>
                    <td>{item.username}</td>
                    <td>{item.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : hasSearched && searchResults.length === 0 && !message ? (
            <div className='ud19-empty'>未找到匹配的用户</div>
          ) : !hasSearched ? (
            <div className='ud19-empty'>请输入搜索条件后点击Search按钮</div>
          ) : null}
      </div>
    </div>
  );
};

export default UD19_SearchUser;
