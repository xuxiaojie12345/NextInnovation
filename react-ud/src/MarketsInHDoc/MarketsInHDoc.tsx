/**
 * MarketsInHDoc 组件 - 市场列表页面（UD21）
 * 功能：展示HDoc系统中所有可用市场的列表信息，包含市场代码、描述和HDoc权重状态
 * 数据为只读展示，页面加载时自动获取
 * 对应详细设计：详细设计/詳細設計UD21.md
 */
import React, { useState, useEffect } from "react";
import api from "../config/api";
import "./MarketsInHDoc.css";

/** 市场数据类型 */
interface MarketItem {
  market: string;
  description: string;
  weights: string;
}

/**
 * MarketsInHDoc 组件
 * 以表格形式展示所有市场信息，纯展示页面，无用户输入操作
 */
// MarketsInHDoc

const MarketsInHDoc: React.FC = () => {
  // -------- 状态管理（对应详细设计 2.1 控件属性表）--------
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 页面初始化 - 获取市场列表（对应详细设计 3.1.1 页面初始化流程）
   * 调用 UD19SearchResultListApi（operation=GET_MARKET_LIST）
   */
  useEffect(() => {
    // fetchMarkets

    const fetchMarkets = async () => {
      setIsLoading(true);
      try {
        // response

        const response = await api.post(
          `/api/ud19/UD19SearchResultListApi`,
          { operation: "GET_MARKET_LIST" }
        );

        if (response.data.code === 200 && response.data.data?.markets) {
          // 标准化列名并构造展示数据（对应详细设计 6. 实现注意事项 - 权重标识）
          const list = response.data.data.markets.map((item: Record<string, any>) => {
            // marketCode

            const marketCode = item.MARKET || item.market || "";
            // description

            const description = item.DESCRIPTION || item.description || "";
            // 权重标识：X / X(*) / 空（根据业务逻辑模拟，实际从后端获取）
            const weights = item.WEIGHTS || item.weights || "";
            return {
              market: marketCode,
              description: description,
              weights: weights
            };
          });

          // 按Market代码字母升序排序（对应详细设计 3.1.1 步骤3）
          list.sort((a: MarketItem, b: MarketItem) =>
            a.market.localeCompare(b.market)
          );

          setMarketList(list);

          if (list.length === 0) {
            // 对应详细设计 5. 异常处理 - MARKET_MASTER表无数据
            setMessage("No data found");
          }
        } else {
          setMessage("No data found");
        }
      } catch (err) {
        // 对应详细设计 5. 异常处理
        setMessage("系统错误，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  return (
    <div className="ud21-container">
      {/* 页面标题 */}
      <h1 className="ud21-title">Markets in HDoc</h1>

      {/* 消息提示（对应详细设计 5. 异常处理） */}
      {message && <div className="ud21-message">{message}</div>}

      {isLoading && <div className="ud21-loading">Loading...</div>}

      {/* 数据表格（对应详细设计 2.1 DataTable） */}
      {!isLoading && (
        <div className="ud21-table-wrapper">
          <table className="ud21-table">
            <thead>
              <tr>
                <th>Market</th>
                <th>Description</th>
                <th className="ud21-th-center">Weights from Hdoc</th>
              </tr>
            </thead>
            <tbody>
              {marketList.length > 0 ? (
                marketList.map((item, index) => (
                  <tr key={index}>
                    <td>{item.market}</td>
                    <td>{item.description}</td>
                    <td className="ud21-td-center">{item.weights}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="ud21-empty-row">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// MarketsInHDoc

export default MarketsInHDoc;
