/**
 * SearchUser组件 - 用户搜索页面
 * 
 * @description 提供用户搜索功能，允许管理员根据多种条件查询系统用户信息。
 *              支持按用户ID、用户名、市场以及权限类型(规则/模板)进行组合搜索。
 *              当选择"Not set"选项时，可查询所有未设置特定权限的用户。
 *              严格按照詳細設計UD19.md中定义的画面项目实现。
 * 
 * @features
 * - Userid输入框：搜索条件，最大长度10位，仅允许半角英数字
 * - User输入框：搜索条件，最大长度32位，仅允许半角英数字
 * - Market下拉列表：从MARKET_MASTER表动态加载市场数据
 * - Not set单选框：默认选中，选择后其他搜索条件将被忽略
 * - Rule单选框：对应type="R"
 * - Template单选框：对应type="T"
 * - Search按钮：执行搜索操作
 * - DataTable表格：显示搜索结果（Userid、User、Market）
 * - COUNT：显示搜索结果的总记录数
 * 
 * @security
 * - 仅授权用户可访问此搜索功能
 * - 搜索结果需根据当前登录用户的权限进行过滤
 * - 防止SQL注入等安全攻击
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchUser.css';

/**
 * 市场数据接口定义
 */
interface MarketItem {
  market: string;
}

/**
 * 搜索结果项接口定义
 */
interface SearchResultItem {
  userid: string;
  user: string;
  market: string;
}

/**
 * API响应数据结构
 */
interface ApiResponse<T = any> {
  code: number;
  data?: T;
  message?: string;
  errorCode?: string;
}

/**
 * SearchUser组件 - 用户搜索页面
 * 
 * @component
 * @returns {JSX.Element} 用户搜索页面组件
 * @description 根据詳細設計UD19.md实现完整的用户搜索功能
 */
const SearchUser: React.FC = () => {
  // 搜索条件状态
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  
  // 权限类型单选框状态
  const [permissionType, setPermissionType] = useState<'notset' | 'rule' | 'template'>('notset');
  
  // 市场列表状态
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  
  // 搜索结果状态
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  
  // 搜索结果数量
  const [resultCount, setResultCount] = useState<number>(0);
  
  // 错误消息状态
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 初期表示 - 获取市场主数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD19.md的API规范：
   *              - Method: GET
   *              - Endpoint: /api/ud19/market-master
   *              
   *              成功时（200）：填充Market下拉列表
   *              失败时：显示错误消息
   */
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 获取市场主数据
   * 
   * @async
   * @returns {Promise<void>}
   * @description 调用UD19SelectMarketMaster，取得市场主数据返回给画面进行下拉列表初始化
   */
  const fetchMarketList = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // 调用UD19SelectMarketMaster获取市场主数据
      // Endpoint: GET /api/ud19/market-master
      const response = await axios.get<ApiResponse<MarketItem[]>>('/api/ud19/market-master');
      
      // 处理成功响应（200状态码）
      if (response.data.code === 200 && response.data.data) {
        setMarketList(response.data.data);
      } else {
        setErrorMessage('获取市场列表失败,请稍后重试');
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
      setErrorMessage(errorData.message || '服务器内部错误,请联系管理员');
    } else if (error.request) {
      setErrorMessage('网络连接超时,请检查网络后重试');
    } else {
      setErrorMessage('请求异常,请稍后重试');
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
   * 处理UserName输入变化
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件
   * @description 实时过滤非法字符，仅允许半角英数字，最大长度32位
   */
  const handleUserNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    
    // 只允许半角英数字
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    
    // 限制最大长度为32
    if (filteredValue.length <= 32) {
      setUserName(filteredValue);
    }
  };

  /**
   * 验证搜索条件
   * 
   * @returns {boolean} 是否有效
   * @description 检查Userid和User输入是否符合要求
   */
  const validateSearchConditions = (): boolean => {
    // 检查Userid格式
    if (userId && !/^[a-zA-Z0-9]+$/.test(userId)) {
      setErrorMessage('用户ID只能包含半角英数字,且不超过10个字符');
      return false;
    }
    
    // 检查User格式
    if (userName && !/^[a-zA-Z0-9]+$/.test(userName)) {
      setErrorMessage('用户名只能包含半角英数字,且不超过32个字符');
      return false;
    }
    
    return true;
  };

  /**
   * 处理Search按钮点击事件
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照詳細設計UD19.md的处理流程：
   *              步骤1：验证搜索条件
   *              步骤2：构建请求参数
   *              步骤3：调用API进行搜索
   *              步骤4：显示搜索结果和COUNT
   */
  const handleSearchClick = async (): Promise<void> => {
    // 前端校验
    if (!validateSearchConditions()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // 构建请求参数
      let requestData: any;
      
      if (permissionType === 'notset') {
        // 情况1：选择Not set
        requestData = {
          notSet: true,
          userId: '',
          userName: '',
          type: '',
          market: ''
        };
      } else {
        // 情况2：未选择Not set
        requestData = {
          notSet: false,
          userId: userId,
          userName: userName,
          type: permissionType === 'rule' ? 'R' : 'T',
          market: market
        };
      }
      
      // 调用UD19SearchHdoc进行搜索
      // Endpoint: GET /api/ud19/search-users
      const response = await axios.get<ApiResponse<{ list: SearchResultItem[]; count: number }>>(
        '/api/ud19/search-users',
        { params: requestData }
      );
      
      if (response.data.code !== 200) {
        setErrorMessage(response.data.message || '搜索用户失败');
        setSearchResults([]);
        setResultCount(0);
        return;
      }
      
      const resultData = response.data.data;
      if (resultData) {
        setSearchResults(resultData.list || []);
        setResultCount(resultData.count || 0);
        
        // 如果无匹配数据，显示提示
        if (!resultData.list || resultData.list.length === 0) {
          setErrorMessage('未找到符合条件的用户');
        }
      }
    } catch (error: any) {
      handleApiError(error);
      setSearchResults([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ud19-container">
        <div className="ud19-loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud19-container">      
      {/* 页面标题 */}
      <div className="ud19-page-title-area"> 
        <h1 className="ud19-page-title">Search HDoc User</h1>
       </div> 
      {/* 内容区域 */}
      <div className="ud19-content-area">        
        {/* 错误消息区域 */}
        {errorMessage && (
          <div className="ud19-error-message-area">
            <span className="ud19-error-text">{errorMessage}</span>
          </div>
        )}

        {/* 搜索条件区域 */}
        <div className="ud19-search-section">
          {/* 项番1: Userid */}
          <div className="ud19-input-row">
            <label className="ud19-label">Userid</label>
            <input
              type="text"
              className="ud19-input"
              value={userId}
              onChange={handleUserIdChange}
              maxLength={10}
              placeholder="请输入用户ID"
            />
          </div>

          {/* 项番2: User */}
          <div className="ud19-input-row">
            <label className="ud19-label">User</label>
            <input
              type="text"
              className="ud19-input"
              value={userName}
              onChange={handleUserNameChange}
              maxLength={32}
              placeholder="请输入用户名"
            />
          </div>

          {/* 项番3-6: Market和权限类型单选框在同一行 */}
          <div className="ud19-input-row ud19-market-radio-row">
            <label className="ud19-label">Market</label>
            <select
              className="ud19-select"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            >
              <option value="">请选择市场</option>
              {marketList.map((item, index) => (
                <option key={index} value={item.market}>
                  {item.market}
                </option>
              ))}
            </select>
            
            {/* 项番4-6: 权限类型单选框 - 竖行排列 */}
            <div className="ud19-radio-group-vertical">
              {/* 项番4: Not set */}
              <label className="ud19-radio-label">
                <input
                  type="radio"
                  name="permissionType"
                  value="notset"
                  checked={permissionType === 'notset'}
                  onChange={() => setPermissionType('notset')}
                  className="ud19-radio"
                />
                Not set
              </label>

              {/* 项番5: Rule */}
              <label className="ud19-radio-label">
                <input
                  type="radio"
                  name="permissionType"
                  value="rule"
                  checked={permissionType === 'rule'}
                  onChange={() => setPermissionType('rule')}
                  className="ud19-radio"
                />
                Rule
              </label>

              {/* 项番6: Template */}
              <label className="ud19-radio-label">
                <input
                  type="radio"
                  name="permissionType"
                  value="template"
                  checked={permissionType === 'template'}
                  onChange={() => setPermissionType('template')}
                  className="ud19-radio"
                />
                Template
              </label>
            </div>
          </div>

          {/* 项番7: Search按钮 - 与上面的输入框左对齐 */}
          <div className="ud19-button-area">
            <button
              type="button"
              className="ud19-button ud19-search-button"
              onClick={handleSearchClick}
            >
              Search
            </button>
          </div>
        </div>

        {/* 搜索结果区域 */}
        {searchResults.length > 0 && (
          <div className="ud19-result-section">
            {/* 项番8-10: DataTable表格 */}
            <table className="ud19-data-table">
              <thead>
                <tr>
                  <th className="ud19-col-userid">Userid</th>
                  <th className="ud19-col-user">User</th>
                  <th className="ud19-col-market">Market</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((item, index) => (
                  <tr key={index}>
                    <td className="ud19-col-userid">{item.userid}</td>
                    <td className="ud19-col-user">{item.user}</td>
                    <td className="ud19-col-market">{item.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 项番11: COUNT */}
            <div className="ud19-count-display">
              COUNT: {resultCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUser;
