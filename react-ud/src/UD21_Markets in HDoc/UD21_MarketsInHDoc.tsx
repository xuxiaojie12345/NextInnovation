import React, { useState, useEffect } from 'react';
import apiClient from '../api/config';
import './UD21_MarketsInHDoc.css';

/**
 * UD21_MarketsInHDoc 市场列表展示页面组件
 *
 * 功能说明：
 * - 从MARKET_MASTER表获取所有可用市场列表
 * - 以表格形式展示Market、Description、Weights from Hdoc信息
 * - 数据为空时显示友好的空状态提示
 *
 * @component
 * @returns {JSX.Element} 市场列表页面元素
 */
const UD21_MarketsInHDoc: React.FC = () => {
  // ==================== 状态管理 ====================
  // 对应设计书 2.1 控件属性表
  const [marketList, setMarketList] = useState<MarketItem[]>([]);  // 市场列表数据
  const [message, setMessage] = useState<string>('');               // 消息内容
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isLoading, setIsLoading] = useState<boolean>(false);      // 加载状态

  /** 市场列表项接口 */
  interface MarketItem {
    market: string;
    description: string;
  }

  // ==================== 初期表示 ====================
  // 对应设计书 3.1.1 市场列表展示
  useEffect(() => {
    fetchMarketList();
  }, []);

  /**
   * 获取市场列表数据
   * 对应设计书 4.1 UD19SearchResultListApi - UD19SelectMarketMaster()
   * GET /api/ud19/getmarket
   *
   * 处理流程：
   * 1. 调用API获取市场列表
   * 2. 若返回空数据，显示空状态提示
   * 3. 若成功则渲染表格
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/ud19/getmarket');
      // 后端返回格式：{ code: 200, msg: "查询成功", data: [{ market, description }, ...] }
      if (response.data?.code === 200 && Array.isArray(response.data?.data)) {
        const data = response.data.data;
        if (data.length === 0) {
          // 对应设计书 3.1.1 空值校验 - API返回空数组
          setMessage('当前没有可用的市场信息');
          setMessageType('success');
        }
        setMarketList(data);
      } else {
        // 响应异常
        setMarketList([]);
        if (response.data?.code !== 200) {
          setMessage('获取市场列表失败');
          setMessageType('error');
        }
      }
    } catch (error) {
      // 对应设计书 5. 异常处理 - 网络超时/数据库连接失败
      console.error('获取市场列表失败:', error);
      setMessage('获取市场列表失败，请稍后重试');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 渲染 ====================
  return (
    <div className="ud21-container">
      {/* 页面标题 */}
      <div className="ud21-title">Markets in HDoc</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud21-message ${messageType === 'success' ? 'ud21-message-success' : 'ud21-message-error'}`}>
          {message}
        </div>
      )}

      {/* 表格区域 */}
      <div className="ud21-content">
        <div className="ud21-table-wrapper">
          <table className="ud21-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Description</th>
                <th>Weights from Hdoc</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="ud21-loading">加载中...</td>
                </tr>
              ) : marketList.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={3} className="ud21-empty">
                    {message || '当前没有可用的市场信息'}
                  </td>
                </tr>
              ) : (
                marketList.map((item, index) => (
                  <tr key={index}>
                    <td className="ud21-cell-market">{item.market}</td>
                    <td className="ud21-cell-desc">{item.description}</td>
                    <td className="ud21-cell-weights"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UD21_MarketsInHDoc;
