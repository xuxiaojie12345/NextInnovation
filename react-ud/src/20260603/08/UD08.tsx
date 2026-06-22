import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { homologationVariablesApi } from "../../services/api";
import "./UD08.css";

// ===== 类型定义 =====

/** 下拉选项 */
interface SelectOption {
  value: string;
  label: string;
}

/** 认证参数记录 */
interface HomoVarRecord {
  productClass: string;
  number: number;
  market: string;
  variable: string;
  value: string;
  variantString1: string;
  variantString2: string;
  comments: string;
  add: string;
  delete: string;
  createdByUser: string;
  date: string;
}

/** 检索条件 */
interface SearchParams {
  productClass: string;
  number: string;
  market: string;
  variable: string;
  value: string;
  variantString1: string;
  variantString2: string;
  comments: string;
}

const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

// ===== 辅助函数 =====

/**
 * 从 localStorage 读取当前登录用户信息
 */
const getCurrentUser = (): {
  userId: string;
  name: string;
  token: string;
} | null => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEY_USER);
    if (!userStr) return null;
    const userInfo = JSON.parse(userStr);
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    return {
      userId: userInfo.userId || "",
      name: userInfo.name || "",
      token: token || "",
    };
  } catch {
    return null;
  }
};

// ===== 主组件 =====

const UD08 = React.memo(() => {
  const navigate = useNavigate();

  // ===== 状态管理 =====

  // 各字段的运算符（默认为 "="）
  const [opProductClass, setOpProductClass] = useState<string>("=");
  const [opNumber, setOpNumber] = useState<string>("=");
  const [opMarket, setOpMarket] = useState<string>("=");
  const [opVariable, setOpVariable] = useState<string>("=");
  const [opValue, setOpValue] = useState<string>("=");
  const [opVariantString1, setOpVariantString1] = useState<string>("=");
  const [opVariantString2, setOpVariantString2] = useState<string>("=");
  const [opComments, setOpComments] = useState<string>("=");

  // 表单输入
  const [productClass, setProductClass] = useState<string>("");
  const [number, setNumber] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [variantString1, setVariantString1] = useState<string>("");
  const [variantString2, setVariantString2] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  // 输出字段（系统自动填充）
  const [addLabel, setAddLabel] = useState<string>("YYYYWW");
  const [deleteLabel, setDeleteLabel] = useState<string>("YYYYWW");
  const [createdByUser, setCreatedByUser] = useState<string>("Automatic");
  const [dateLabel, setDateLabel] = useState<string>("Automatic");

  // 下拉列表数据
  const [productClassOptions, setProductClassOptions] = useState<
    SelectOption[]
  >([]);
  const [marketOptions, setMarketOptions] = useState<SelectOption[]>([]);
  const [variableOptions, setVariableOptions] = useState<SelectOption[]>([]);

  // 搜索结果列表
  const [searchResults, setSearchResults] = useState<HomoVarRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HomoVarRecord | null>(
    null,
  );

  // 页面状态
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [user, setUser] = useState<{
    userId: string;
    name: string;
    token: string;
  } | null>(null);

  // ===== 初始化 =====

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }
    setUser(currentUser);

    const initPage = async () => {
      try {
        // 并行加载三个下拉列表
        const [productRes, marketRes, variableRes] = await Promise.all([
          homologationVariablesApi.getProductClassMaster(),
          homologationVariablesApi.getMarketMaster(),
          homologationVariablesApi.getHdocVariables(),
        ]);

        // 处理 Product Class 下拉
        if (productRes && productRes.data && Array.isArray(productRes.data)) {
          setProductClassOptions(productRes.data);
        } else {
          setProductClassOptions([]);
        }

        // 处理 Market 下拉
        if (marketRes && marketRes.data && Array.isArray(marketRes.data)) {
          setMarketOptions(marketRes.data);
        } else {
          setMarketOptions([]);
        }

        // 处理 Variable 下拉（用于输入提示）
        if (
          variableRes &&
          variableRes.data &&
          Array.isArray(variableRes.data)
        ) {
          setVariableOptions(variableRes.data);
        } else {
          setVariableOptions([]);
        }
      } catch {
        setErrorMessage("无法加载下拉列表数据，请刷新页面重试");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  // ===== 运算符处理 =====

  const OPERATOR_OPTIONS = ["=", "!=", ">", "<", ">=", "<=", "Like"];

  const renderOperatorSelect = (
    value: string,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
  ) => (
    <select
      className="ud08-operator"
      value={value}
      onChange={onChange}
      disabled={isSubmitting}
    >
      {OPERATOR_OPTIONS.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  );

  // ===== 输入处理 =====

  const handleProductClassChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setProductClass(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleProductClassOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpProductClass(e.target.value);
    },
    [],
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Number 仅允许半角数字 (0-9)
      const value = e.target.value;
      const filtered = value.replace(/[^0-9]/g, "");
      setNumber(filtered);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleNumberOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpNumber(e.target.value);
    },
    [],
  );

  const handleMarketChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setMarket(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleMarketOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpMarket(e.target.value);
    },
    [],
  );

  const handleVariableChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVariable(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleVariableOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpVariable(e.target.value);
    },
    [],
  );

  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleValueOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpValue(e.target.value);
    },
    [],
  );

  const handleVariantString1Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVariantString1(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleVariantString1OpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpVariantString1(e.target.value);
    },
    [],
  );

  const handleVariantString2Change = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setVariantString2(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleVariantString2OpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpVariantString2(e.target.value);
    },
    [],
  );

  const handleCommentsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setComments(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleCommentsOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpComments(e.target.value);
    },
    [],
  );

  // ===== 业务逻辑 =====

  /**
   * 清空表单
   */
  const handleClear = useCallback(() => {
    setProductClass("");
    setNumber("");
    setMarket("");
    setVariable("");
    setValue("");
    setVariantString1("");
    setVariantString2("");
    setComments("");
    setOpProductClass("=");
    setOpNumber("=");
    setOpMarket("=");
    setOpVariable("=");
    setOpValue("=");
    setOpVariantString1("=");
    setOpVariantString2("=");
    setOpComments("=");
    setAddLabel("YYYYWW");
    setDeleteLabel("YYYYWW");
    setCreatedByUser("Automatic");
    setDateLabel("Automatic");
    setSelectedRecord(null);
    setErrorMessage("");
  }, []);

  /**
   * Search - 查询认证参数记录
   */
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setErrorMessage("");
    setSelectedRecord(null);

    try {
      const params: SearchParams = {
        productClass: productClass.trim(),
        number: number.trim(),
        market: market.trim(),
        variable: variable.trim(),
        value: value.trim(),
        variantString1: variantString1.trim(),
        variantString2: variantString2.trim(),
        comments: comments.trim(),
      };

      const result = await homologationVariablesApi.getProductClassMaster();

      if (result && result.data && Array.isArray(result.data)) {
        setSearchResults(result.data);
        if (result.data.length === 0) {
          setErrorMessage("未找到符合条件的记录");
        }
      } else {
        setSearchResults([]);
        setErrorMessage("未找到符合条件的记录");
      }
    } catch {
      setErrorMessage("查询失败，请稍后重试");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [
    productClass,
    number,
    market,
    variable,
    value,
    variantString1,
    variantString2,
    comments,
  ]);

  /**
   * 选择搜索结果中的记录
   */
  const handleSelectRecord = useCallback((record: HomoVarRecord) => {
    setSelectedRecord(record);
    setProductClass(record.productClass);
    setNumber(String(record.number));
    setMarket(record.market);
    setVariable(record.variable);
    setValue(record.value);
    setVariantString1(record.variantString1);
    setVariantString2(record.variantString2);
    setComments(record.comments);
    setAddLabel(record.add || "YYYYWW");
    setDeleteLabel(record.delete || "YYYYWW");
    setCreatedByUser(record.createdByUser || "Automatic");
    setDateLabel(record.date || "Automatic");
    // 运算符重置为 "="
    setOpProductClass("=");
    setOpNumber("=");
    setOpMarket("=");
    setOpVariable("=");
    setOpValue("=");
    setOpVariantString1("=");
    setOpVariantString2("=");
    setOpComments("=");
    setErrorMessage("");
  }, []);

  /**
   * 表单校验 - Add / Update 时检查必填项
   */
  const validateRequired = useCallback((): boolean => {
    if (!productClass.trim()) {
      setErrorMessage("Product class 是必填项");
      return false;
    }
    if (!number.trim()) {
      setErrorMessage("Number 是必填项");
      return false;
    }
    if (!market.trim()) {
      setErrorMessage("Market 是必填项");
      return false;
    }
    return true;
  }, [productClass, number, market]);

  /**
   * Add - 新增记录
   */
  const handleAdd = useCallback(async () => {
    if (!validateRequired()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const params = {
        productClass: productClass.trim(),
        number: parseInt(number.trim(), 10),
        market: market.trim(),
        variable: variable.trim(),
        value: value.trim(),
        variantString1: variantString1.trim(),
        variantString2: variantString2.trim(),
        comments: comments.trim(),
      };

      const result = await homologationVariablesApi.add(params);

      if (result && result.success) {
        // 新增成功后，清空表单并刷新列表
        handleClear();
        alert("添加成功");
      } else {
        setErrorMessage(result?.message || "添加失败，请确认输入内容");
      }
    } catch (err: any) {
      if (err.message?.includes("409") || err.message?.includes("Conflict")) {
        setErrorMessage(
          "Primary key conflict, Please enter the correct content",
        );
      } else {
        setErrorMessage("添加失败，请稍后重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    productClass,
    number,
    market,
    variable,
    value,
    variantString1,
    variantString2,
    comments,
    validateRequired,
    handleClear,
  ]);

  /**
   * Update - 更新记录
   */
  const handleUpdate = useCallback(async () => {
    if (!validateRequired()) return;
    if (!selectedRecord) {
      setErrorMessage("请先从搜索结果中选择要更新的记录");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const params = {
        productClass: productClass.trim(),
        number: parseInt(number.trim(), 10),
        market: market.trim(),
        variable: variable.trim(),
        value: value.trim(),
        variantString1: variantString1.trim(),
        variantString2: variantString2.trim(),
        comments: comments.trim(),
      };

      const result = await homologationVariablesApi.update(params);

      if (result && result.success) {
        handleClear();
        alert("更新成功");
      } else {
        setErrorMessage(result?.message || "更新失败");
      }
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("Not Found")) {
        setErrorMessage(
          "Data does not exist, Please enter the correct content",
        );
      } else {
        setErrorMessage("更新失败，请稍后重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    productClass,
    number,
    market,
    variable,
    value,
    variantString1,
    variantString2,
    comments,
    selectedRecord,
    validateRequired,
    handleClear,
  ]);

  /**
   * Delete - 删除记录
   */
  const handleDelete = useCallback(async () => {
    if (!selectedRecord) {
      setErrorMessage("请选择要删除的记录");
      return;
    }

    if (!window.confirm("确定要删除该记录吗？")) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const params = {
        productClass: selectedRecord.productClass,
        number: selectedRecord.number,
        market: selectedRecord.market,
      };

      const result = await homologationVariablesApi.delete(params);

      if (result && result.success) {
        handleClear();
        alert("删除成功");
      } else {
        setErrorMessage(result?.message || "删除失败");
      }
    } catch (err: any) {
      if (err.message?.includes("404") || err.message?.includes("Not Found")) {
        setErrorMessage(
          "Data does not exist, Please enter the correct content",
        );
      } else {
        setErrorMessage("删除失败，请稍后重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRecord, handleClear]);

  // ===== 加载状态 =====

  if (isLoading) {
    return (
      <div className="ud08-container">
        <div className="ud08-loading">Loading...</div>
      </div>
    );
  }

  // ===== 渲染 =====

  return (
    <div className="ud08-container">
      {/* 主内容 */}
      <main className="ud08-main ud08-main-noheader">
        <div className="ud08-form-card">
          {/* 页面标题 */}
          <h1 className="ud08-page-title">Homologation Variables</h1>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="ud08-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 操作按钮 - 置于表单顶部 */}
          <div className="ud08-button-row">
            <button
              className="ud08-btn"
              onClick={handleSearch}
              disabled={isSearching || isSubmitting}
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
            <button
              className="ud08-btn"
              onClick={handleClear}
              disabled={isSubmitting}
            >
              Clear
            </button>
            <button
              className="ud08-btn"
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
            <button
              className="ud08-btn"
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
            <button
              className="ud08-btn"
              onClick={handleDelete}
              disabled={isSubmitting || !selectedRecord}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </button>
          </div>

          {/* 表单区域 */}
          <div className="ud08-form-area">
            {/* Product class - 下拉框 */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="product-class-select">
                Product class <span className="ud08-required">*</span>
              </label>
              {renderOperatorSelect(opProductClass, handleProductClassOpChange)}
              <div className="ud08-field-control">
                <select
                  id="product-class-select"
                  className="ud08-select"
                  value={productClass}
                  onChange={handleProductClassChange}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select --</option>
                  {productClassOptions.map((opt, index) => (
                    <option key={index} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Number - 文本框（仅数字） */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="number-input">
                Number <span className="ud08-required">*</span>
              </label>
              {renderOperatorSelect(opNumber, handleNumberOpChange)}
              <div className="ud08-field-control">
                <input
                  id="number-input"
                  className="ud08-input"
                  type="text"
                  value={number}
                  onChange={handleNumberChange}
                  maxLength={10}
                  autoComplete="off"
                  disabled={isSubmitting}
                  placeholder="0-9"
                />
              </div>
            </div>

            {/* Market - 下拉框 */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="market-select">
                Market <span className="ud08-required">*</span>
              </label>
              {renderOperatorSelect(opMarket, handleMarketOpChange)}
              <div className="ud08-field-control">
                <select
                  id="market-select"
                  className="ud08-select"
                  value={market}
                  onChange={handleMarketChange}
                  disabled={isSubmitting}
                >
                  <option value="">-- Select --</option>
                  {marketOptions.map((opt, index) => (
                    <option key={index} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Variable */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="variable-input">
                Variable
              </label>
              {renderOperatorSelect(opVariable, handleVariableOpChange)}
              <div className="ud08-field-control">
                <input
                  id="variable-input"
                  className="ud08-input"
                  type="text"
                  value={variable}
                  onChange={handleVariableChange}
                  maxLength={20}
                  autoComplete="off"
                  disabled={isSubmitting}
                  list="variable-datalist"
                />
                <datalist id="variable-datalist">
                  {variableOptions.map((opt, index) => (
                    <option key={index} value={opt.value} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Value */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="value-input">
                Value
              </label>
              {renderOperatorSelect(opValue, handleValueOpChange)}
              <div className="ud08-field-control">
                <input
                  id="value-input"
                  className="ud08-input"
                  type="text"
                  value={value}
                  onChange={handleValueChange}
                  maxLength={200}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Variant string.1 */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="variant-string1-input">
                Variant string.1
              </label>
              {renderOperatorSelect(
                opVariantString1,
                handleVariantString1OpChange,
              )}
              <div className="ud08-field-control">
                <input
                  id="variant-string1-input"
                  className="ud08-input"
                  type="text"
                  value={variantString1}
                  onChange={handleVariantString1Change}
                  maxLength={100}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Variant string.2 */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="variant-string2-input">
                Variant string.2
              </label>
              {renderOperatorSelect(
                opVariantString2,
                handleVariantString2OpChange,
              )}
              <div className="ud08-field-control">
                <input
                  id="variant-string2-input"
                  className="ud08-input"
                  type="text"
                  value={variantString2}
                  onChange={handleVariantString2Change}
                  maxLength={100}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Comments */}
            <div className="ud08-field-row">
              <label className="ud08-label" htmlFor="comments-input">
                Comments
              </label>
              {renderOperatorSelect(opComments, handleCommentsOpChange)}
              <div className="ud08-field-control">
                <input
                  id="comments-input"
                  className="ud08-input"
                  type="text"
                  value={comments}
                  onChange={handleCommentsChange}
                  maxLength={100}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* 系统输出字段（无运算符） */}
            <div className="ud08-field-row">
              <label className="ud08-label">Add</label>
              <div className="ud08-field-control ud08-field-control-full">
                <span className="ud08-output-text">{addLabel}</span>
              </div>
            </div>
            <div className="ud08-field-row">
              <label className="ud08-label">Delete</label>
              <div className="ud08-field-control ud08-field-control-full">
                <span className="ud08-output-text">{deleteLabel}</span>
              </div>
            </div>
            <div className="ud08-field-row">
              <label className="ud08-label">Created by user</label>
              <div className="ud08-field-control ud08-field-control-full">
                <span className="ud08-output-text">{createdByUser}</span>
              </div>
            </div>
            <div className="ud08-field-row">
              <label className="ud08-label">Date</label>
              <div className="ud08-field-control ud08-field-control-full">
                <span className="ud08-output-text">{dateLabel}</span>
              </div>
            </div>
          </div>

          {/* 搜索结果表格 */}
          {searchResults.length > 0 && (
            <div className="ud08-results-section">
              <h2 className="ud08-results-title">Search Results</h2>
              <div className="ud08-results-table-wrapper">
                <table className="ud08-results-table">
                  <thead>
                    <tr>
                      <th>Product class</th>
                      <th>Number</th>
                      <th>Market</th>
                      <th>Variable</th>
                      <th>Value</th>
                      <th>Variant string.1</th>
                      <th>Variant string.2</th>
                      <th>Comments</th>
                      <th>Add</th>
                      <th>Created by</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((record, index) => (
                      <tr
                        key={index}
                        className={`ud08-table-row ${
                          selectedRecord === record
                            ? "ud08-table-row-selected"
                            : ""
                        }`}
                        onClick={() => handleSelectRecord(record)}
                      >
                        <td>{record.productClass}</td>
                        <td>{record.number}</td>
                        <td>{record.market}</td>
                        <td>{record.variable}</td>
                        <td>{record.value}</td>
                        <td>{record.variantString1}</td>
                        <td>{record.variantString2}</td>
                        <td>{record.comments}</td>
                        <td>{record.add}</td>
                        <td>{record.createdByUser}</td>
                        <td>{record.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 用户信息 */}
          {user && (
            <div className="ud08-user-info">
              <span>Logged in as: {user.name}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD08;
