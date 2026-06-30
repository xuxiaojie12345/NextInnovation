/**
 * SearchUser 组件 - 多条件用户搜索页面（UD19）
 * 功能：支持通过 Userid、User、Market、权限类型（Not set/Rule/Template）组合搜索用户
 * 对应详细设计：详细设计/詳細設計UD19.md
 */
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./SearchUser.css";

/** 后端API基础地址 */
const API_BASE_URL = "http://localhost:8081";

/** 市场选项数据类型 */
interface MarketItem {
  MARKET: string;
}

/** 搜索结果数据类型 */
interface SearchResultItem {
  USERID: string;
  USERNAME: string;
  MARKET: string;
}

/** 权限类型枚举 */
type AuthType = "Not set" | "Rule" | "Template";

/**
 * SearchUser 组件
 * 提供多条件组合的用户搜索功能，支持输入限制、单选按钮互斥、搜索结果展示
 */
const SearchUser: React.FC = () => {
  // -------- 状态管理（对应详细设计 2.1 控件属性表）--------
  const [userid, setUserid] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [authType, setAuthType] = useState<AuthType>("Not set");
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [count, setCount] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  /** 清空消息 */
  const clearMessage = () => setMessage("");

  /**
   * 页面初始化 - 获取市场列表（对应详细设计 3.1.1 页面初始化流程）
   * 调用 UD19SelectMarketMaster（operation=GET_MARKET_LIST）
   */
  useEffect(() => {
    const fetchMarketList = async () => {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/ud19/UD19SearchResultListApi`,
          { operation: "GET_MARKET_LIST" }
        );
        if (response.data.code === 200 && response.data.data?.markets) {
          setMarketList(response.data.data.markets);
        }
      } catch (err) {
        console.error("Failed to load market list:", err);
      }
    };
    fetchMarketList();
  }, []);

  /**
   * 处理 Userid 输入变化（对应详细设计 2.1 输入限制）
   * 只允许半角英数字，最大10字符
   */
  const handleUseridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= 10) {
      setUserid(val);
      if (message) clearMessage();
    }
  };

  /**
   * 处理 User 输入变化（对应详细设计 2.1 输入限制）
   * 只允许半角英数字，最大32字符
   */
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= 32) {
      setUser(val);
      if (message) clearMessage();
    }
  };

  /**
   * 处理 Market 多选列表变化
   */
  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions);
    const val = selected.length > 0 ? selected[selected.length - 1].value : '';
    setMarket(val);
    if (message) clearMessage();
  };

  /**
   * 处理权限类型单选按钮变化（对应详细设计 6. 实现注意事项 - 单选按钮互斥）
   * Not set、Rule、Template 三个 RadioBox 为互斥选择
   */
  const handleAuthTypeChange = (type: AuthType) => {
    setAuthType(type);
    if (message) clearMessage();
  };

  /**
   * 构建搜索参���（对应详细设计 3.1.2 ~ 3.1.4 搜索流程）
   * 根据输入条件决定搜索参数
   */
  const buildSearchParams = () => {
    const params: Record<string, string> = {
      operation: "SEARCH_USER"
    };

    // 优先级：Userid > User > 权限类型（Rule/Template）> Not set（全检索）
    if (userid.trim()) {
      params.userid = userid.trim();
    } else if (user.trim()) {
      params.user = user.trim();
    } else if (authType === "Rule" || authType === "Template") {
      params.type = authType;
    }

    // 无论哪种搜索方式，只要选择了 Market 就加入参数
    if (market) {
      params.market = market;
    }

    return params;
  };

  /**
   * Search 按钮处理 - 执行用户搜索（对应详细设计 3.1.2 ~ 3.1.4）
   * 调用 UD19SearchHdoc（operation=SEARCH_USER）
   *
   * 当通过 Userid 搜索时，先调用 Saviynt（/api/authentication/userinfo）
   * 验证用户是否存在并获取用户名，用户不存在则终止搜索
   */
  const handleSearch = async () => {
    clearMessage();
    setIsLoading(true);

    try {
      // 步骤1：当输入 Userid 时，先调用 Saviynt 验证用户是否存在
      if (userid.trim()) {
        const saviyntResponse = await axios.get(
          `${API_BASE_URL}/api/authentication/userinfo`,
          { params: { userId: userid.trim() } }
        );

        if (saviyntResponse.data.code !== 200 || !saviyntResponse.data.data) {
          // 对应详细设计 3.2 No.1 - 未找到对应用户
          setMessage("未找到该用户");
          setSearchResults([]);
          setCount(0);
          setHasSearched(true);
          setIsLoading(false);
          return;
        }
      }

      // 步骤2：执行搜索
      const params = buildSearchParams();
      const response = await axios.post(
        `${API_BASE_URL}/api/ud19/UD19SearchResultListApi`,
        params
      );

      if (response.data.code === 200) {
        const data = response.data.data;
        const rawResults = data.results || [];
        const totalCount = data.count || 0;

        // 统一标准化列名（后端MyBatis返回的列名大小写不确定）
        const results = rawResults.map((item: Record<string, any>) => {
          // 找出实际存在的key
          const keys = Object.keys(item);
          const userIdKey = keys.find(k => k.toUpperCase() === "USERID") || "USERID";
          const userNameKey = keys.find(k => k.toUpperCase() === "USERNAME") || "USERNAME";
          const marketKey = keys.find(k => k.toUpperCase() === "MARKET") || "MARKET";
          return {
            USERID: item[userIdKey] || "",
            USERNAME: item[userNameKey] || "",
            MARKET: item[marketKey] || ""
          };
        });

        if (results.length === 0) {
          // 对应详细设计 3.2 No.2 - 无匹配记录
          setMessage("未找到符合条件的用户");
        }

        setSearchResults(results);
        setCount(totalCount);
        setHasSearched(true);
      } else {
        setMessage(
          response.data.message || "System error. Please contact administrator."
        );
      }
    } catch (err) {
      // 对应详细设计 5. 异常处理 - API网络错误
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        // Saviynt 返回 404 表示用户不存在
        setMessage("未找到该用户");
        setSearchResults([]);
        setCount(0);
        setHasSearched(true);
      } else {
        setMessage("网络连接失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear 按钮处理 - 清空所有搜索条件和结果
   */
  const handleClear = () => {
    setUserid("");
    setUser("");
    setMarket("");
    setAuthType("Not set");
    setSearchResults([]);
    setCount(0);
    setHasSearched(false);
    clearMessage();
  };

  /**
   * 处理键盘事件 - 按回车触发搜索
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSearch();
    }
  };

  return (
    <div className="ud19-container">
      <main className="ud19-main">
        <div className="ud19-card">
          {/* 页面标题 */}
          <h1 className="ud19-title">Search HDoc User</h1>

          {/* 消息提示 */}
          {message && <div className="ud19-message">{message}</div>}

          {/* Userid 输入行 */}
          <div className="ud19-field">
            <label className="ud19-label">Userid</label>
            <input
              type="text"
              className="ud19-input"
              value={userid}
              onChange={handleUseridChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={10}
              placeholder="Enter User ID"
            />
          </div>

          {/* User 输入行 */}
          <div className="ud19-field">
            <label className="ud19-label">User</label>
            <input
              type="text"
              className="ud19-input"
              value={user}
              onChange={handleUserChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={32}
              placeholder="Enter User Name"
            />
          </div>

          {/* Market 下拉 + Type 单选框 合并为一行 */}
          <div className="ud19-field">
            <label className="ud19-label">Market</label>
            <select
              className="ud19-select ud19-select-wide"
              multiple
              value={market ? [market] : []}
              onChange={handleMarketChange}
              disabled={isLoading}
              size={8}
            >
              {marketList.map((item, index) => (
                <option key={index} value={item.MARKET}>
                  {item.MARKET}
                </option>
              ))}
            </select>
            {/* Type 单选框组 - 竖排放在 Market 右侧 */}
            <div className="ud19-radio-group">
              {(["Not set", "Rule", "Template"] as AuthType[]).map((type) => (
                <label key={type} className="ud19-radio-label">
                  <input
                    type="radio"
                    className="ud19-radio"
                    name="authType"
                    checked={authType === type}
                    onChange={() => handleAuthTypeChange(type)}
                    disabled={isLoading}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {/* 按钮区域 */}
          <div className="ud19-btn-row">
            <button
              type="button"
              className="ud19-btn"
              onClick={handleSearch}
              disabled={isLoading}
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              className="ud19-btn"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </button>
          </div>

          {/* 搜索结果区域 */}
          {hasSearched && (
            <div className="ud19-result-section">
              <div className="ud19-result-header">
                <span className="ud19-count-label">COUNT: {count}</span>
              </div>

              {searchResults.length > 0 ? (
                <div className="ud19-table-wrapper">
                  <table className="ud19-table">
                    <thead>
                      <tr>
                        <th>Userid</th>
                        <th>User</th>
                        <th>Market</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((item, index) => (
                        <tr key={index}>
                          <td>{item.USERID || ""}</td>
                          <td>{item.USERNAME || ""}</td>
                          <td>{item.MARKET || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ud19-empty">未找到符合条件的用户</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchUser;
