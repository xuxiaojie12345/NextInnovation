import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ListAvailableTemplates.css';

/**
 * ListAvailableTemplates组件 - 可用模板列表页面
 * 
 * @description 展示各个市场下可用的模板文件列表，包括文件名、最后修改时间、文件大小以及是否被使用等信息
 * @props 无Props
 */
const ListAvailableTemplates: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [marketList, setMarketList] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [dataTableList, setDataTableList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 画面初期表示 - 调用API获取市场列表
   * 对应设计书 3.1 ListAvailableTemplates初期表示 和 4.1.1 画面的初期表示
   */
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 监听selectedMarket变化，当用户选择市场后加载文件列表
   * 对应设计书 3.2 Market的选择 和 4.1.2 下拉框数据选择
   */
  useEffect(() => {
    if (selectedMarket) {
      fetchFileListAndUsedData(selectedMarket);
    } else {
      // 若未选择市场，清空表格数据
      setDataTableList([]);
    }
  }, [selectedMarket]);

  /**
   * 调用UD08SelectMarketmasterApi获取市场列表
   * 对应设计书 5.1 UD08SelectMarketmasterApi
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 - 获取Market下拉列表数据
      const response = await axios.post('/api/UD08/select-marketmaster');
      
      if (response.data.success) {
        const markets = response.data.data.map((item: any) => item.market || item);
        setMarketList(markets);
      } else {
        setErrorMessage(response.data.message || '获取市场列表失败');
      }
    } catch (error: any) {
      console.error('获取市场列表失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 并行调用两个API获取文件列表和Used数据
   * 对应设计书 4.1.2 下拉框数据选择 步骤1和步骤2
   */
  const fetchFileListAndUsedData = async (market: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // 并行调用两个API
      const [fileResponse, usedResponse] = await Promise.all([
        // API请求 - 获取该市场文件夹下的文件列表 (对应设计书 5.2 UD14SelectMarketFileApi)
        axios.get('/api/UD14/select-market-file', {
          params: { market }
        }),
        
        // API请求 - 获取HDOC_USER_DEFINED_RULES表中的VARIABLE列表 (对应设计书 5.3 UD14SelectHdocUserDefinedUsedApi)
        axios.get('/api/UD14/select-hdoc-user-defined-used', {
          params: { market }
        })
      ]);
      
      if (fileResponse.data.success && usedResponse.data.success) {
        const fileList = fileResponse.data.data || [];
        const usedVariables = usedResponse.data.data.variable ? [usedResponse.data.data.variable] : [];
        
        // 匹配文件名与VARIABLE，填充Used列 (对应设计书 7. 实现注意事项 - 数据匹配逻辑)
        const matchedData = fileList.map((file: any) => {
          // 去除文件扩展名后比较
          const fileNameWithoutExt = file.fileName.split('.')[0];
          const matchedVariable = usedVariables.find((variable: string) => 
            variable.includes(fileNameWithoutExt) || fileNameWithoutExt.includes(variable)
          );
          
          return {
            fileName: file.fileName,
            used: matchedVariable || '',
            lastMod: file.lastMod,
            size: file.size
          };
        });
        
        setDataTableList(matchedData);
      } else {
        setErrorMessage('获取文件列表失败');
      }
    } catch (error: any) {
      console.error('获取文件列表失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='lat-container'>
      <div className='lat-content'>
        {/* 标题区域 */}
        <h2 className='lat-title'>List Templates</h2>
        
        {/* Select Market下拉框区域 */}
        <div className='lat-filter-section'>
          <label className='lat-label'>Select Market:</label>
          <select 
            className='lat-select' 
            value={selectedMarket} 
            onChange={(e) => setSelectedMarket(e.target.value)}
            disabled={isLoading}
          >
            <option value="">请选择市场</option>
            {marketList.map((market, index) => (
              <option key={index} value={market}>{market}</option>
            ))}
          </select>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='lat-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* DataTable表格区域 */}
        <div className='lat-table-container'>
          {isLoading ? (
            <div className='lat-loading'>加载中...</div>
          ) : (
            <table className='lat-table'>
              <thead>
                <tr>
                  <th className='lat-th-icon'></th>
                  <th className='lat-th-filename'>Filename</th>
                  <th className='lat-th-used'>Used</th>
                  <th className='lat-th-lastmod'>Last Mod,</th>
                  <th className='lat-th-size'>Size</th>
                </tr>
              </thead>
              <tbody>
                {dataTableList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className='lat-empty-message'>
                      {selectedMarket ? '暂无数据' : '请选择市场查看模板列表'}
                    </td>
                  </tr>
                ) : (
                  dataTableList.map((row, index) => (
                    <tr 
                      key={index} 
                      className={index % 2 === 0 ? 'lat-row-even' : 'lat-row-odd'}
                    >
                      <td className='lat-td-icon'>
                        {/* 文件图标占位符 */}
                        <span className='lat-file-icon'>📄</span>
                      </td>
                      <td className='lat-td-filename'>{row.fileName}</td>
                      <td className='lat-td-used'>{row.used}</td>
                      <td className='lat-td-lastmod'>{row.lastMod}</td>
                      <td className='lat-td-size'>{row.size}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListAvailableTemplates;
