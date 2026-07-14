import React, { useState, useCallback, useEffect } from "react";
import { userSearchApi } from "../services/api";
import "./UD19.css";

interface SearchResult {
  userid: string;
  user: string;
  market: string;
}

const UD19 = React.memo(() => {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<string>("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isLoading, setIsLoading] = useState(false);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("");
  }, []);

  // 初期表示：从数据库取得市场列表
  useEffect(() => {
    (async () => {
      try {
        const result = await userSearchApi.getMarkets();
        if (result && result.code === 200 && result.data?.markets) {
          const markets = result.data.markets.map(
            (m: { market: string }) => m.market,
          );
          setMarketOptions(markets);
        }
      } catch {
        // 静默失败
      }
    })();
  }, []);

  const handleSearch = useCallback(async () => {
    clearMessage();

    // 校验：至少输入一个条件

    const hasUserName = userName.trim().length > 0;
    const hasUserId = userId.trim().length > 0;
    const hasMarkets = selectedMarkets.length > 0;
    const hasSearchType = searchType.length > 0;

    if (!hasUserId && !hasUserName && !hasSearchType && !hasMarkets) {
      setMessage("请输入查询条件或选择筛选方式");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    try {
      const params: any = {};
      if (hasUserId) params.userid = userId.trim();
      if (hasUserName) params.user = userName.trim();
      if (hasSearchType) {
        if (searchType === "NOT_SET") params.notSet = "true";
        else if (searchType === "RULE") params.rule = "true";
        else if (searchType === "TEMPLATE") params.template = "true";
      }
      if (selectedMarkets.length > 0) {
        params.markets = selectedMarkets;
      }

      const result = await userSearchApi.searchUser(params);
      console.log("UD19 search result:", result);
      if (result && (result.code === 200 || result.code === undefined)) {
        const data = result.data || result;
        const users: SearchResult[] = data.users || [];
        setResults(users);
        setMessageType("success");
        setMessage(result.message || result.msg || "查询成功");
      } else {
        setMessage(result?.msg || `查询失败(code=${result?.code})，请稍后再试`);
        setMessageType("error");
        setResults([]);
      }
    } catch (err: any) {
      setMessage(`查询失败: ${err?.message || "未知错误"}`);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  }, [userId, userName, searchType, selectedMarkets, clearMessage]);

  const toggleMarket = useCallback((market: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market],
    );
  }, []);

  const handleRadioChange = useCallback((value: string) => {
    setSearchType((prev) => (prev === value ? "" : value));
  }, []);

  return (
    <div className="ud19-container">
      <header className="ud19-header">
        <div className="ud19-header-logo"></div>
      </header>
      <main className="ud19-main">
        <div className="ud19-card">
          <h1 className="ud19-page-title">Search HDoc User</h1>

          {message && (
            <div className={`ud19-msg ud19-${messageType}`} role="alert">
              {message}
            </div>
          )}

          {/* Userid / User (vertical) */}
          <div className="ud19-row">
            <label className="ud19-lbl" style={{ width: 60 }}>
              Userid
            </label>
            <input
              className="ud19-inp"
              type="text"
              maxLength={10}
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                clearMessage();
              }}
              style={{ width: "50%" }}
            />
          </div>
          <div className="ud19-row">
            <label className="ud19-lbl" style={{ width: 60 }}>
              User
            </label>
            <input
              className="ud19-inp"
              type="text"
              maxLength={32}
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                clearMessage();
              }}
              style={{ width: "50%" }}
            />
          </div>

          {/* Market list (left) + Radio buttons (right) */}
          <div className="ud19-bottom-row">
            {/* Market label (left) + Market list (right) */}
            <div className="ud19-market-section">
              <label className="ud19-lbl ud19-market-title">Market</label>
              <div className="ud19-market-list">
                <select multiple size={10}>
                  {marketOptions.map((m) => (
                    <option
                      key={m}
                      value={m}
                      onClick={() => toggleMarket(m)}
                      style={{
                        background: selectedMarkets.includes(m)
                          ? "#dce8f0"
                          : undefined,
                        fontWeight: selectedMarkets.includes(m)
                          ? 600
                          : undefined,
                      }}
                    >
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Radio buttons */}
            <div className="ud19-radio-group">
              <label>
                <input
                  type="radio"
                  checked={searchType === "NOT_SET"}
                  onChange={() => handleRadioChange("NOT_SET")}
                />
                Not set
              </label>
              <label>
                <input
                  type="radio"
                  checked={searchType === "RULE"}
                  onChange={() => handleRadioChange("RULE")}
                />
                Rule
              </label>
              <label>
                <input
                  type="radio"
                  checked={searchType === "TEMPLATE"}
                  onChange={() => handleRadioChange("TEMPLATE")}
                />
                Template
              </label>
            </div>
          </div>

          {/* Search button - bottom left */}
          <div className="ud19-search-btn-row">
            <button
              className="ud19-btn"
              onClick={handleSearch}
              disabled={isLoading}
            >
              Search
            </button>
          </div>

          {/* Results Table */}
          {results.length > 0 && (
            <>
              <div className="ud19-table-wrap">
                <table className="ud19-table">
                  <thead>
                    <tr>
                      <th>Userid</th>
                      <th>User</th>
                      <th>Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, idx) => (
                      <tr key={idx}>
                        <td>{(r as any).USERID || r.userid}</td>
                        <td>{(r as any).USER || r.user}</td>
                        <td>{(r as any).MARKET || r.market}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD19;
