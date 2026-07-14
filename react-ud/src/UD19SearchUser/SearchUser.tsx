import { useState, useEffect } from "react";
import "./SearchUser.css";

interface MarketItem {
  market: string;
  description: string;
}

interface SearchResult {
  userid: string;
  user: string;
  market: string;
}

const SearchUser: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [market, setMarket] = useState("");
  const [permissionType, setPermissionType] = useState("NOT_SET");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [marketList, setMarketList] = useState<MarketItem[]>([]);

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

  // 页面初始化：加载市场列表
  useEffect(() => {
    fetchMarketList();
  }, []);

  // 获取市场列表
  const fetchMarketList = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/ud19/getmarketlist`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch market list");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        setMarketList(data.data);
      } else {
        setErrorMessage("获取Market列表失败，请联系管理员");
      }
    } catch (error) {
      setErrorMessage("系统内部错误，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // 校验UserID
  const validateUserId = (): boolean => {
    if (!userId || userId.trim() === "") {
      setErrorMessage("Userid不能为空");
      return false;
    }

    if (!/^[a-zA-Z0-9]+$/.test(userId)) {
      setErrorMessage("Userid只能包含半角英数字");
      return false;
    }

    if (userId.length > 10) {
      setErrorMessage("Userid长度不能超过10字符");
      return false;
    }

    return true;
  };

  // 校验UserName
  const validateUserName = (): boolean => {
    if (!userName || userName.trim() === "") {
      setErrorMessage("User不能为空");
      return false;
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(userName)) {
      setErrorMessage("User只能包含半角英数字");
      return false;
    }

    if (userName.length > 32) {
      setErrorMessage("User长度不能超过32字符");
      return false;
    }

    return true;
  };

  // Search按钮处理
  const handleSearch = async () => {
    // 清空之前的消息
    setErrorMessage("");
    setSearchResults([]);

    // 确定搜索类型
    let searchType = permissionType;
    let hasUserId = userId && userId.trim() !== "";
    let hasUserName = userName && userName.trim() !== "";

    // 如果同时输入了UserID和User，优先使用UserID
    if (hasUserId) {
      // 校验UserID
      if (!validateUserId()) {
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/ud19/searchhdoc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: userId.trim().toUpperCase(),
            user: "",
            market: market,
            searchType: searchType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();

        if (data.code === 200 && data.data) {
          setSearchResults(data.data.users || []);
        } else {
          // 检查是否是用户不存在的错误
          if (data.msg && data.msg.includes("不存在")) {
            setErrorMessage(data.msg);
          } else {
            setErrorMessage(data.msg || "搜索失败，请联系管理员");
          }
        }
      } catch (error: any) {
        // 判断是否是网络错误
        if (error.message === "Failed to fetch") {
          setErrorMessage("无法连接到后端服务，请确认后端服务已启动");
        } else {
          setErrorMessage("系统内部错误，请联系管理员");
        }
      } finally {
        setIsLoading(false);
      }
    } else if (hasUserName) {
      // 校验UserName
      if (!validateUserName()) {
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/ud19/searchhdoc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: "",
            user: userName.trim(),
            market: market,
            searchType: searchType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();

        if (data.code === 200 && data.data) {
          setSearchResults(data.data.users || []);
        } else {
          // 检查是否是用户不存在的错误
          const errMsg = data.msg || data.message || "";
          if (errMsg.includes("不存在")) {
            setErrorMessage(errMsg);
          } else {
            setErrorMessage(errMsg || "搜索失败，请联系管理员");
          }
        }
      } catch (error: any) {
        // 判断是否是网络错误
        if (error.message === "Failed to fetch") {
          setErrorMessage("无法连接到后端服务，请确认后端服务已启动");
        } else {
          setErrorMessage("系统内部错误，请联系管理员");
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Not set、Rule、Template搜索（没有输入UserID或User）
      try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/ud19/searchhdoc`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: "",
            user: "",
            market: market,
            searchType: searchType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();

        if (data.code === 200 && data.data) {
          setSearchResults(data.data.users || []);
        } else {
          setErrorMessage(data.msg || data.message || "搜索失败，请联系管理员");
        }
      } catch (error: any) {
        // 判断是否是网络错误
        if (error.message === "Failed to fetch") {
          setErrorMessage("无法连接到后端服务，请确认后端服务已启动");
        } else {
          setErrorMessage("系统内部错误，请联系管理员");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className='su-container'>
      {/* 标题 */}
      <h1 className='su-title'>Search HDoc User</h1>

      {/* 边框容器 */}
      <div className='su-border-box'>
        {/* 搜索条件区域 */}
        <div className='su-search-section'>
          {/* UserID */}
          <div className='su-form-row'>
            <label className='su-label'>Userid</label>
            <input
              type='text'
              className='su-input'
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              maxLength={10}
              disabled={isLoading}
            />
          </div>

          {/* User */}
          <div className='su-form-row'>
            <label className='su-label'>User</label>
            <input
              type='text'
              className='su-input'
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={32}
              disabled={isLoading}
            />
          </div>

          {/* Market下拉列表 + 权限类型单选框 */}
          <div className='su-form-row'>
            <label className='su-label'>Market</label>
            <div className='su-market-permission-wrapper'>
              <select
                className='su-select'
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                disabled={isLoading}
                size={8}
              >
                {marketList.length > 0 ? (
                  <>
                    <option value=''>&nbsp;</option>
                    {marketList.map((item, index) => (
                      <option key={index} value={item.market}>
                        {item.market}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value='' disabled>
                    加载中...
                  </option>
                )}
              </select>
              <div className='su-permission-inline'>
                <div className='su-radio-group-inline'>
                  <input
                    type='radio'
                    id='not-set'
                    name='permissionType'
                    value='NOT_SET'
                    checked={permissionType === "NOT_SET"}
                    onChange={(e) => setPermissionType(e.target.value)}
                    disabled={isLoading}
                  />
                  <label htmlFor='not-set' className='su-radio-label'>
                    Not set
                  </label>
                </div>
                <div className='su-radio-group-inline'>
                  <input
                    type='radio'
                    id='rule'
                    name='permissionType'
                    value='RULE'
                    checked={permissionType === "RULE"}
                    onChange={(e) => setPermissionType(e.target.value)}
                    disabled={isLoading}
                  />
                  <label htmlFor='rule' className='su-radio-label'>
                    Rule
                  </label>
                </div>
                <div className='su-radio-group-inline'>
                  <input
                    type='radio'
                    id='template'
                    name='permissionType'
                    value='TEMPLATE'
                    checked={permissionType === "TEMPLATE"}
                    onChange={(e) => setPermissionType(e.target.value)}
                    disabled={isLoading}
                  />
                  <label htmlFor='template' className='su-radio-label'>
                    Template
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Search按钮 */}
          <div className='su-button-section'>
            <button
              className='su-button'
              onClick={handleSearch}
              disabled={isLoading}
            >
              Search
            </button>
          </div>
        </div>

        {/* 搜索结果表格 */}
        {searchResults.length > 0 && (
          <div className='su-result-section'>
            <table className='su-table'>
              <thead>
                <tr>
                  <th className='su-th'>Userid</th>
                  <th className='su-th'>User</th>
                  <th className='su-th'>Market</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((result, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "su-tr-even" : "su-tr-odd"}
                  >
                    <td className='su-td'>{result.userid}</td>
                    <td className='su-td'>{result.user}</td>
                    <td className='su-td'>{result.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 错误消息显示 */}
        {errorMessage && <div className='su-error-message'>{errorMessage}</div>}
      </div>
    </div>
  );
};

export default SearchUser;
