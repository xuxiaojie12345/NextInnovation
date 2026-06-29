import React, { useState, useEffect } from "react";
import { marketsApi } from "../services/api";
import "./UD21.css";

interface MarketItem {
  market: string;
  description: string;
  weightsFromHdoc: string;
}

const UD21 = React.memo(() => {
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await marketsApi.getMarkets();
        if (result && (result.code === 200 || result.code === undefined)) {
          const data = result.data || result;
          setMarkets(Array.isArray(data) ? data : []);
        } else {
          setError("无法加载市场列表，请稍后重试");
        }
      } catch {
        setError("无法加载市场列表，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="ud21-container">
      <header className="ud21-header">
        <div className="ud21-header-logo">VOLVO</div>
      </header>
      <main className="ud21-main">
        <div className="ud21-card">
          <h1 className="ud21-page-title">Markets in Hdoc</h1>

          {error && (
            <div className="ud21-msg ud21-error" role="alert">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="ud21-loading">Loading...</div>
          ) : (
            <div className="ud21-table-wrap">
              <table className="ud21-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Description</th>
                    <th>Weights from Hdoc</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((m, idx) => (
                    <tr key={idx}>
                      <td>{m.market}</td>
                      <td>{m.description}</td>
                      <td>{m.weightsFromHdoc || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD21;
