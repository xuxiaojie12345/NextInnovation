import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SearchUser.css';

/**
 * SearchUser组件 - 用户信息查询页面
 * 
 * @description 支持多条件组合查询（UserID、User、Market、Not set、Rule、Template），以DataTable形式展示检索结果
 * @props 无Props
 */
const SearchUser: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [market, setMarket] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('notSet'); // 默认选中Not set
  const [marketList, setMarketList] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
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
   * 画面初期表示 - 调用API获取市场列表
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 调用UD08SelectMarketmasterApi获取市场列表
   * 对应设计书 5.1 UD08SelectMarketmasterApi
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8081/api/ud19/selectmarketmaster');
      
      if (response.data.code === 200) {
        const markets = response.data.data.map((item: any) => item.market || item);
        setMarketList(['-EU', ...markets]);
      }
    } catch (error: any) {
      console.error('获取市场列表失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Search按钮点击处理 - 执行用户信息查询
   * 对应设计书 3.2 Search按钮押下 和 4.1.2 Search按钮押下
   */
  const handleSearchClick = async () => {
    setIsLoading(true);
    setErrorMessage('');
    clearMessage();
    
    try {
      // 构建请求参数 - 后端Ud19SearchRequest字段: userid, userName, type, market
      const typeMap: Record<string, string> = {
        'notSet': 'Notset',
        'rule': 'R',
        'template': 'T'
      };
      
      const requestData: any = {
        userid: userId.trim() || undefined,
        userName: userName.trim() || undefined,
        market: market.length > 0 ? market.join(',') : undefined
      };
      // type: 'Notset'时SQL跳过type条件；其他值则按对应字母过滤
      if (selectedType !== 'notSet') {
        requestData.type = typeMap[selectedType] || selectedType;
      }
      
      const response = await axios.post('http://localhost:8081/api/ud19/searchhdoc', requestData);
      
      if (response.data.code === 200) {
        const results = response.data.data || [];
        if (results.length === 0) {
          showMessage('没有找到对应的用户数据', 'info');
        }
        setSearchResults(results);
        setTotalCount(results.length);
      } else {
        showMessage(response.data.msg || '查询失败', 'error');
        setSearchResults([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '网络连接失败，请稍后重试', 'error');
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='su-container'>
      <div className='su-content'>
        {/* 标题区域 */}
        <h2 className='su-title'>Search HDoc User</h2>
        
        {/* 搜索条件区域 */}
        <div className='su-search-section'>
          {/* UserID输入行 */}
          <div className='su-form-row'>
            <label className='su-label'>Userid</label>
            <input 
              type='text' 
              className='su-input su-input-userid' 
              value={userId}
              onChange={(e) => {
                // 只允许输入半角英数字
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                setUserId(value);
              }}
              maxLength={10}
              disabled={isLoading}
              title='只能输入半角英数字，最大长度10'
            />
          </div>
          
          {/* User输入行 */}
          <div className='su-form-row'>
            <label className='su-label'>User</label>
            <input 
              type='text' 
              className='su-input su-input-user' 
              value={userName}
              onChange={(e) => {
                // 只允许输入半角英数字
                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                setUserName(value);
              }}
              maxLength={32}
              disabled={isLoading}
              title='只能输入半角英数字，最大长度32'
            />
          </div>
          
          {/* Market和Radio Box区域 */}
          <div className='su-market-radio-row'>
            <label className='su-label'>Market</label>
            <select 
              className='su-select su-select-market'
              multiple
              value={market}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                setMarket(selected);
              }}
              disabled={isLoading}
            >
              {marketList.map((m, index) => (
                <option key={index} value={m}>{m}</option>
              ))}
            </select>
            
            {/* Radio Box组 */}
            <div className='su-radio-group'>
              <label className='su-radio-label'>
                <input 
                  type='radio' 
                  name='searchType'
                  value='notSet'
                  checked={selectedType === 'notSet'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={isLoading}
                />
                Not set
              </label>
              <label className='su-radio-label'>
                <input 
                  type='radio' 
                  name='searchType'
                  value='rule'
                  checked={selectedType === 'rule'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={isLoading}
                />
                Rule
              </label>
              <label className='su-radio-label'>
                <input 
                  type='radio' 
                  name='searchType'
                  value='template'
                  checked={selectedType === 'template'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  disabled={isLoading}
                />
                Template
              </label>
            </div>
          </div>
          
          {/* Search按钮 */}
          <div className='su-button-row'>
            <button 
              className='su-search-button' 
              onClick={handleSearchClick}
              disabled={isLoading}
            >
              Search
            </button>
          </div>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='su-error-message'>
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
          <div className='su-loading'>
            加载中...
          </div>
        )}
      
        
        {/* DataTable区域 */}
        <div className='su-table-container'>
          <table className='su-table'>
            <thead>
              <tr>
                <th className='su-th-userid'>Userid</th>
                <th className='su-th-user'>User</th>
                <th className='su-th-market'>Market</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'su-row-even' : 'su-row-odd'}>
                    <td className='su-td-userid'>{result.userId || ''}</td>
                    <td className='su-td-user'>{result.userName || ''}</td>
                    <td className='su-td-market'>{result.market || ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className='su-empty-message'>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
                {/* COUNT显示 */}
        <div className='su-count-label'>
          COUNT: {totalCount}
        </div>
      </div>
    </div>
  );
};

export default SearchUser;
