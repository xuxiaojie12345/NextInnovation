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
  const [marketList, setMarketList] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [dataTableList, setDataTableList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    clearMessage();

    try {
      const response = await axios.post('http://localhost:8081/api/ud14/selectmarketmaster');

      if (response.data.code === 200) {
        const data = response.data.data || {};
        const markets = (data.marketList || []).map((item: any) => item.market || item);
        setMarketList(markets);
        setAllFiles(data.allFiles || []);
      } else {
        showMessage(response.data.msg || '获取数据失败', 'error');
      }
    } catch (error: any) {
      showMessage('网络连接失败，请稍后重试', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsedData = async (market: string, fileList: any[]) => {
    try {
      const response = await axios.post('http://localhost:8081/api/ud14/selecthdocuserdefinedused', {
        market: market
      });

      if (response.data.code === 200) {
        const usedData: Array<{variable: string; val: string}> = response.data.data || [];
        const matchedData = fileList.map((file: any) => {
          // 构造匹配key: {market}/{filename}
          const valKey = market + '/' + (file.fileName || '');
          // 查找VAL字段匹配这条数据的记录
          const match = usedData.find((item: any) => item.val === valKey);
          return {
            ...file,
            used: match ? match.variable : ''
          };
        });
        setDataTableList(matchedData);
      }
    } catch (error: any) {
      showMessage('获取Used数据失败', 'error');
    }
  };

  const handleDownload = async (market: string, fileName: string) => {
    try {
      const response = await axios.post('http://localhost:8081/api/ud14/downfile', {
        market: market,
        fileName: fileName
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showMessage('文件下载成功', 'success');
    } catch (error: any) {
      showMessage('文件下载失败', 'error');
    }
  };

  useEffect(() => {
    if (selectedMarket) {
      const filtered = allFiles.filter(f => f.market === selectedMarket);
      setDataTableList(filtered);
      fetchUsedData(selectedMarket, filtered);
    } else {
      setDataTableList([]);
    }
  }, [selectedMarket, allFiles]);

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
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
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
                        <span className='lat-file-icon'>📄</span>
                      </td>
                      <td className='lat-td-filename'>
                        <span 
                          className='lat-file-link' 
                          onClick={() => handleDownload(selectedMarket, row.fileName)}
                        >
                          {row.fileName}
                        </span>
                      </td>
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
