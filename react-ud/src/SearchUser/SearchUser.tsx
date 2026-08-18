import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./SearchUser.css";

/**
 * ============================================================
 * SearchUser 组件（Search HDoc User 画面）
 * ------------------------------------------------------------
 * 功能：用户管理员通过输入 Userid / User、选择 Market 或权限
 *       类型（Not set / Rule / Template），点击 Search 按钮调用
 *       后端 SearchUserApi 检索用户信息，并在检索区域下方以
 *       DataTable 形式显示检索结果（Userid / User / Market / COUNT）。
 *
 * 对应设计书：work/SearchUser_詳細設計.md
 *   - 画面项目定义：第 2.1 节控件属性表
 *   - 业务逻辑：第 3 章（初期表示、5 种检索场景、校验规格）
 *   - 接口定义：第 4 章 SearchUserApi
 *   - 异常处理：第 5 章异常场景表
 *
 * Props：无（画面独立组件，默认导出，可直接在 Menu 中跳转使用）
 * ============================================================
 */

/** 后端统一响应结构（对应设计书 4.1 Response） */
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 检索结果用户信息（对应设计书 4.1 data.users[]） */
interface UserItem {
  userid: string;
  user: string;
  market: string;
}

/** 检索响应数据体（对应设计书 4.1 data） */
interface SearchUserData {
  count: number;
  users: UserItem[];
}

/** 权限类型单选组取值（对应画面项目 No.4～No.6 RadioBox） */
type FunctionType = "" | "NOT_SET" | "RULE" | "TEMPLATE";

/** 后端服务根地址（与 application-dev.yml 的 server.port 一致） */
const API_BASE_URL = "http://localhost:8081";

/** 输入限制正则：半角英数字（对应设计书 2.1 许容文字） */
const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9]*$/;

/** Userid 最大长度（对应画面项目 No.1：MaxLength 10） */
const USERID_MAX_LENGTH = 10;

/** User 最大长度（对应画面项目 No.2：MaxLength 32） */
const USER_MAX_LENGTH = 32;

/**
 * 表单校验（可复用核心函数）
 * 对应设计书 3.2 校验详细规格表 No.1～No.4
 * @param userid Userid 输入值
 * @param user   User 输入值
 * @returns 错误消息；校验通过时返回空字符串
 */
const validateForm = (userid: string, user: string): string => {
  if (!ALPHANUMERIC_PATTERN.test(userid)) {
    // 校验规格 No.1：Userid 仅允许半角英数字
    return "请输入半角英数字。";
  }
  if (!ALPHANUMERIC_PATTERN.test(user)) {
    // 校验规格 No.2：User 仅允许半角英数字
    return "请输入半角英数字。";
  }
  if (userid.length > USERID_MAX_LENGTH) {
    // 校验规格 No.3：Userid 超长检查
    return "Userid 最大长度为 10 字符。";
  }
  if (user.length > USER_MAX_LENGTH) {
    // 校验规格 No.4：User 超长检查
    return "User 最大长度为 32 字符。";
  }
  return "";
};

const SearchUser: React.FC = () => {
  // ---------- 检索条件状态（对应画面项目 No.1～No.6） ----------
  const [userid, setUserid] = useState<string>("");
  const [user, setUser] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  // 单选组初期值为未選択（设计书 2.1：Not set/Rule/Template 初期値 未選択）
  const [functionType, setFunctionType] = useState<FunctionType>("");

  // ---------- 输出状态（对应画面项目 No.8～No.11） ----------
  const [marketList, setMarketList] = useState<string[]>([]);
  const [resultList, setResultList] = useState<UserItem[]>([]);
  const [count, setCount] = useState<number>(0);
  // 是否已执行过检索（控制结果区域表示）
  const [searched, setSearched] = useState<boolean>(false);

  // ---------- 消息与加载状态（对应设计书第 5 章异常处理） ----------
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Userid 输入处理
   * 校验规格 No.1/No.3：仅允许半角英数字，超过 10 位阻止输入
   */
  const handleUseridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (ALPHANUMERIC_PATTERN.test(val) && val.length <= USERID_MAX_LENGTH) {
      setUserid(val);
      if (message) setMessage("");
    }
  };

  /**
   * User 输入处理
   * 校验规格 No.2/No.4：仅允许半角英数字，超过 32 位阻止输入
   */
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (ALPHANUMERIC_PATTERN.test(val) && val.length <= USER_MAX_LENGTH) {
      setUser(val);
      if (message) setMessage("");
    }
  };

  /**
   * Market 下拉点击处理：再次点击已选中的选项时取消选择
   * 原生 select 点击已选项不触发 onChange，故通过 onClick 判断实现二次点击取消，
   * 取消后 market 状态置空，检索时不再传递 market 条件
   */
  const handleMarketClick = (e: React.MouseEvent<HTMLSelectElement>) => {
    const target = e.target as HTMLOptionElement;
    if (target.tagName === "OPTION" && target.value === market) {
      setMarket("");
    }
  };

  /**
   * 初期表示处理（对应设计书 3.1.1）
   * 画面正常表示，请求 API 加载 Market 列表填充下拉选项。
   * 异常场景 No.4：Market 列表加载失败时下拉显示为空，不阻断画面表示。
   */
  const loadMarketList = useCallback(async () => {
    try {
      const res = await axios.get<ApiResponse<{ markets: string[] }>>(
        `${API_BASE_URL}/api/Market/getMarketList`,
      );
      if (res.data.code === 200 && res.data.data) {
        setMarketList(res.data.data.markets || []);
      }
    } catch (error) {
      // 加载失败不阻断画面表示，仅提示（设计书第 5 章 No.4）
      setMessage("Market 列表加载失败，请刷新页面重试。");
    }
  }, []);

  useEffect(() => {
    loadMarketList();
  }, [loadMarketList]);

  /**
   * Search 按钮点击处理（对应设计书 3.1.2 ～ 3.1.4）
   * 处理流程：前端校验 → 调用 SearchUserApi → 显示检索结果
   */
  const handleSearch = async () => {
    // 1. 前端校验（Frontend Check）：失败则终止，不调用 API
    const errorMsg = validateForm(userid, user);
    if (errorMsg) {
      setMessage(errorMsg);
      return;
    }

    // 2. API 调用（Backend Check，对应设计书 3.1.3 / 4.1 SearchUserApi）
    setIsLoading(true);
    setMessage("");
    try {
      const params: Record<string, string> = {};
      if (userid) params.serid = userid;
      if (user) params.user = user;
      if (market) params.market = market;
      if (functionType) params.function = functionType;

      const res = await axios.get<ApiResponse<SearchUserData>>(
        `${API_BASE_URL}/api/SearchUser`,
        { params },
      );

      // 3. 结果处理（对应设计书 3.1.4）
      if (res.data.code === 200 && res.data.data) {
        // 检索成功：显示 DataTable 与 COUNT；结果为空时 COUNT = 0
        setResultList(res.data.data.users || []);
        setCount(res.data.data.count || 0);
      } else {
        // 业务级失败：显示后端返回的消息，保留检索条件
        setMessage(res.data.message || "检索失败：服务器内部错误，请稍后重试。");
      }
      setSearched(true);
    } catch (error) {
      // 校验规格 No.5/No.6 + 异常场景 No.5/No.6：
      // API 返回 500 或网络异常时显示错误消息，保留检索条件
      setSearched(true);
      setResultList([]);
      setCount(0);
      if (axios.isAxiosError(error) && error.response) {
        setMessage("检索失败：服务器内部错误，请稍后重试。");
      } else {
        setMessage("检索失败：网络连接异常，请检查网络后重试。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-user-container">
      {/* 画面标题（与 searchUser.png 一致：深蓝加粗，左上角） */}
      <h2 className="search-user-title">Search HDoc User</h2>

      {/* Message Label：Output，左对齐，红色文字（设计书第 5 章） */}
      {message && <div className="search-user-message">{message}</div>}

      {/* ---------- 检索表单区域（左侧面板，对应画面项目 No.1～No.7） ---------- */}
      <form
        className="search-user-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        {/* Userid: TextField, Input, MaxLength 10, 半角英数字, 左对齐 */}
        <div className="form-row">
          <label htmlFor="su-userid">Userid</label>
          <input
            id="su-userid"
            type="text"
            value={userid}
            onChange={handleUseridChange}
            maxLength={USERID_MAX_LENGTH}
            disabled={isLoading}
          />
        </div>

        {/* User: TextField, Input, MaxLength 32, 半角英数字, 左对齐 */}
        <div className="form-row">
          <label htmlFor="su-user">User</label>
          <input
            id="su-user"
            type="text"
            value={user}
            onChange={handleUserChange}
            maxLength={USER_MAX_LENGTH}
            disabled={isLoading}
          />
        </div>

        {/* Market: Pull-down List, 选项由初期表示时 API 加载（设计书 3.1.1）
            支持二次点击已选中项取消选择，取消后不传递 market 条件 */}
        <div className="form-row">
          <label htmlFor="su-market">Market</label>
          <select
            id="su-market"
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            onClick={handleMarketClick}
            disabled={isLoading}
            size={6}
          >
            {marketList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* RadioBox 单选组：Not set / Rule / Template（画面项目 No.4～No.6） */}
        <div className="radio-group">
          <label className="radio-item">
            <input
              type="radio"
              name="functionType"
              value="NOT_SET"
              checked={functionType === "NOT_SET"}
              onChange={() => setFunctionType("NOT_SET")}
              disabled={isLoading}
            />
            <span>Not set</span>
          </label>
          <label className="radio-item">
            <input
              type="radio"
              name="functionType"
              value="RULE"
              checked={functionType === "RULE"}
              onChange={() => setFunctionType("RULE")}
              disabled={isLoading}
            />
            <span>Rule</span>
          </label>
          <label className="radio-item">
            <input
              type="radio"
              name="functionType"
              value="TEMPLATE"
              checked={functionType === "TEMPLATE"}
              onChange={() => setFunctionType("TEMPLATE")}
              disabled={isLoading}
            />
            <span>Template</span>
          </label>
        </div>

        {/* Search: Button, Action, 文字配置 中（画面项目 No.7） */}
        <div className="form-row button-row">
          <button
            type="submit"
            className="search-button"
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* ---------- 检索结果区域（检索区域下方显示，对应设计书 3.1.4） ---------- */}
      {searched && (
        <div className="search-user-result">
          {/* DataTable: Userid / User / Market（画面项目 No.8～No.10） */}
          <table className="result-table">
            <thead>
              <tr>
                <th>Userid</th>
                <th>User</th>
                <th>Market</th>
              </tr>
            </thead>
            <tbody>
              {resultList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    No data
                  </td>
                </tr>
              ) : (
                resultList.map((item, index) => (
                  <tr key={`${item.userid}-${index}`}>
                    <td>{item.userid}</td>
                    <td>{item.user}</td>
                    <td>{item.market}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {/* COUNT: 検索結果のレコード数を表示（画面项目 No.11） */}
          <div className="result-count">COUNT: {count}</div>
        </div>
      )}
    </div>
  );
};

export default SearchUser;
