import React, { useState, useEffect } from "react";
import "./MarketsInHdoc.css";

interface MarketItem {
  market: string;
  description: string;
  weightsFromHdoc?: string;
}

const MarketsInHdoc: React.FC = () => {
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    fetchMarketList();
  }, []);

  const fetchMarketList = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud19/getmarketlist`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.code === 200 && result.data) {
        const sortedData = [...result.data].sort(
          (a: MarketItem, b: MarketItem) =>
            (a.market || "").localeCompare(b.market || ""),
        );
        setMarketList(sortedData);
      } else {
        setErrorMessage(result.msg || "获取市场列表失败");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderWeightsCell = (market: MarketItem) => {
    if (market.weightsFromHdoc) {
      return (
        <span className='weights-indicator'>{market.weightsFromHdoc}</span>
      );
    }
    return <span className='weights-empty'>-</span>;
  };

  return (
    <div className='markets-in-hdoc-container'>
      <h2 className='page-title'>Markets in HDoc</h2>
      {errorMessage && <div className='error-message'>{errorMessage}</div>}
      {isLoading ? (
        <div className='loading-message'>加载中...</div>
      ) : (
        <div className='table-container'>
          <table className='markets-table'>
            <thead>
              <tr>
                <th className='market-column'>Market</th>
                <th className='description-column'>Description</th>
                <th className='weights-column'>Weights from Hdoc</th>
              </tr>
            </thead>
            <tbody>
              {marketList.length > 0 ? (
                marketList.map((item, index) => (
                  <tr key={index}>
                    <td className='market-cell'>{item.market}</td>
                    <td className='description-cell'>{item.description}</td>
                    <td className='weights-cell'>{renderWeightsCell(item)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className='no-data-cell'>
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

export default MarketsInHdoc;
