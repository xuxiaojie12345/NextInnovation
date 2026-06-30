import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MarketsInHdoc.css';

/**
 * MarketsInHdoc组件 - 市场一览画面
 * 
 * @description 显示HDoc系统中可用的市场信息列表，展示市场代码、描述和权重信息
 * @props 无Props
 */
const MarketsInHdoc: React.FC = () => {
  // 状态管理 (对应设计书 7. 实现注意事项)
  const [marketList, setMarketList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 画面初期表示 - 调用API获取市场信息列表
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 调用UD21SelectMarketMasterApi获取市场信息列表
   * 对应设计书 5.1 UD21SelectMarketMasterApi
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:8081/api/ud19/selectmarketmaster');
      
      if (response.data.code === 200) {
        const data = response.data.data || [];
        setMarketList(Array.isArray(data) ? data : [data]);
      } else {
        setMarketList([]);
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setMarketList([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mih-container'>
      <div className='mih-content'>
        {/* 标题区域 */}
        <h2 className='mih-title'>Markets in HDoc</h2>
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='mih-loading'>
            加载中...
          </div>
        )}
        
        {/* DataTable区域 */}
        <div className='mih-table-container'>
          <table className='mih-table'>
            <thead>
              <tr>
                <th className='mih-th-market'>Market</th>
                <th className='mih-th-description'>Description</th>
                <th className='mih-th-weights'>Weights from Hdoc</th>
              </tr>
            </thead>
            <tbody>
              {marketList.length > 0 ? (
                marketList.map((row, index) => (
                  <tr key={index}>
                    <td className='mih-td-market'>{row.market || ''}</td>
                    <td className='mih-td-description'>{row.description || ''}</td>
                    <td className='mih-td-weights'>
                      {/* 权重信息以 "X" 或者 "X(*)" 的形式进行显示 (对应设计书 2.1 控件属性表) */}
                      {row.weightsFromHdoc || ''}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className='mih-empty-message'>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketsInHdoc;
