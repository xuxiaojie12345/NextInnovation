import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { homologationVariablesApi } from "../services/api";
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
/** sessionStorage 键名 - 保存检索条件 */
const STORAGE_KEY_UD08_FORM = "ud08_search_criteria";

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
      userId: token || userInfo.user?.userId || userInfo.userId || "",
      name: userInfo.user?.name || userInfo.name || "",
      token: token || "",
    };
  } catch {
    return null;
  }
};

// ===== 主组件 =====

const UD08 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [opAdd, setOpAdd] = useState<string>("=");
  const [opDelete, setOpDelete] = useState<string>("=");
  const [opCreatedBy, setOpCreatedBy] = useState<string>("=");
  const [opDate, setOpDate] = useState<string>("=");

  // 表单输入
  const [productClass, setProductClass] = useState<string>("");
  const [number, setNumber] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [variantString1, setVariantString1] = useState<string>("");
  const [variantString2, setVariantString2] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  // 系统自动填充字段（TextField / Input/Output / 活性）
  const [addVal, setAddVal] = useState<string>("");
  const [deleteVal, setDeleteVal] = useState<string>("");
  const [createdByVal, setCreatedByVal] = useState<string>("");
  const [dateVal, setDateVal] = useState<string>("");

  // 下拉列表数据
  const [productClassOptions, setProductClassOptions] = useState<
    SelectOption[]
  >([]);
  const [marketOptions, setMarketOptions] = useState<SelectOption[]>([]);
  const [variableOptions, setVariableOptions] = useState<SelectOption[]>([]);

  // 搜索结果列表
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
    // 初期表示时，Created by user默认显示登录用户ID
    setCreatedByVal(currentUser.userId);
    // 初期表示时，Date显示当前时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setDateVal(`${year}-${month}-${day} ${hours}:${minutes}`);

    const initPage = async () => {
      try {
        // 并行加载三个下拉列表
        const [productRes, marketRes, variableRes] = await Promise.all([
          homologationVariablesApi.getProductClassMaster(),
          homologationVariablesApi.getMarketMaster(),
          homologationVariablesApi.getHdocVariables(),
        ]);

        // デバッグ: 実際のレスポンス構造を確認
        console.log("UD08 ProductClass response:", productRes);
        console.log("UD08 Market response:", marketRes);
        console.log("UD08 Variable response:", variableRes);

        // 处理下拉列表数据
        // 返回格式: { code: 200, data: { productClasses: [{pc, description}, ...] } }
        // 也可能 data 本身就是数组: { code: 200, data: [{pc, description}, ...] }
        const extractArray = (
          res: any,
          labelName: string = "",
          useValueAsLabel: boolean = false,
        ): SelectOption[] => {
          if (!res || !res.data) return [];
          // 如果 data 本身就是数组
          if (Array.isArray(res.data)) {
            return mapItems(res.data, labelName, useValueAsLabel);
          }
          const dataObj = res.data;
          // 遍历 data 内的所有属性，找到第一个数组
          for (const key of Object.keys(dataObj)) {
            if (Array.isArray(dataObj[key])) {
              console.log(
                `UD08 extractArray found key: ${key}`,
                dataObj[key].slice(0, 2),
              );
              return mapItems(dataObj[key], labelName, useValueAsLabel);
            }
          }
          return [];
        };

        const mapItems = (
          items: any[],
          labelName: string,
          useValueAsLabel: boolean = false,
        ): SelectOption[] => {
          return items.map((item: any) => {
            if (typeof item === "string") {
              return { value: item, label: item };
            }
            if (typeof item === "object" && item !== null) {
              // 尝试各种可能的字段名
              const possibleValueKeys = [
                "pc",
                "value",
                "code",
                "key",
                "id",
                "market",
                "mk",
                "productClass",
                "variable",
              ];
              const possibleLabelKeys = [
                "description",
                "label",
                "name",
                "desc",
                "text",
                "marketDescription",
                "marketName",
              ];
              let val = "";
              let lbl = "";
              for (const k of possibleValueKeys) {
                if (item[k] !== undefined) {
                  val = String(item[k]);
                  break;
                }
              }
              for (const k of possibleLabelKeys) {
                if (item[k] !== undefined) {
                  lbl = String(item[k]);
                  break;
                }
              }
              if (!val) val = labelName || `item_${Math.random()}`;
              if (useValueAsLabel) {
                lbl = val;
              } else if (!lbl) {
                lbl = val;
              }
              return { value: val, label: lbl };
            }
            return { value: String(item), label: String(item) };
          });
        };

        setProductClassOptions(extractArray(productRes, "", true));
        setMarketOptions(extractArray(marketRes));
        setVariableOptions(extractArray(variableRes));
        // 从 sessionStorage 恢复上次检索条件（从UD09返回时）
        try {
          const saved = sessionStorage.getItem(STORAGE_KEY_UD08_FORM);
          if (saved) {
            const formState = JSON.parse(saved);
            setProductClass(formState.productClass || "");
            setNumber(formState.number || "");
            setMarket(formState.market || "");
            setVariable(formState.variable || "");
            setValue(formState.value || "");
            setVariantString1(formState.variantString1 || "");
            setVariantString2(formState.variantString2 || "");
            setComments(formState.comments || "");
            setOpProductClass(formState.opProductClass || "=");
            setOpNumber(formState.opNumber || "=");
            setOpMarket(formState.opMarket || "=");
            setOpVariable(formState.opVariable || "=");
            setOpValue(formState.opValue || "=");
            setOpVariantString1(formState.opVariantString1 || "=");
            setOpVariantString2(formState.opVariantString2 || "=");
            setOpComments(formState.opComments || "=");
            setAddVal(formState.addVal || "");
            setDeleteVal(formState.deleteVal || "");
            setCreatedByVal(formState.createdByVal || "");
            setDateVal(formState.dateVal || "");
          }
        } catch {}
      } catch {
        setErrorMessage("无法加载下拉列表数据，请刷新页面重试");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  // ===== 接收从UD09返回的选择记录 =====
  useEffect(() => {
    const stateData = location.state as { selectedRecords?: any[] } | null;
    if (
      stateData &&
      stateData.selectedRecords &&
      stateData.selectedRecords.length > 0
    ) {
      const record = stateData.selectedRecords[0];
      setProductClass(record.productClass || "");
      setNumber(String(record.number || ""));
      setMarket(record.market || "");
      setVariable(record.variable || "");
      setValue(record.value || "");
      setVariantString1(record.variantString || "");
      setVariantString2("");
      setComments(record.comments || "");
      setAddVal(record.addDate || record.add || "");
      setDeleteVal(record.deleteDate || record.delete || "");
      setCreatedByVal(record.createdByUser || "");
      setDateVal(record.date || "");
      // 清除 sessionStorage，避免初始化 useEffect 异步完成后覆盖本次回填数据
      try {
        sessionStorage.removeItem(STORAGE_KEY_UD08_FORM);
      } catch {}
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  // ---- Add / Delete / Created by user / Date 入力処理 ----

  const handleAddChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setAddVal(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleAddOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpAdd(e.target.value);
    },
    [],
  );

  const handleDeleteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDeleteVal(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleDeleteOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpDelete(e.target.value);
    },
    [],
  );

  const handleCreatedByChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCreatedByVal(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleCreatedByOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpCreatedBy(e.target.value);
    },
    [],
  );

  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDateVal(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  const handleDateOpChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOpDate(e.target.value);
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
    setOpAdd("=");
    setOpDelete("=");
    setOpCreatedBy("=");
    setOpDate("=");
    setAddVal("");
    setDeleteVal("");
    setCreatedByVal("");
    setDateVal("");
    setSelectedRecord(null);
    setErrorMessage("");
    // 清除保存的检索条件
    try {
      sessionStorage.removeItem(STORAGE_KEY_UD08_FORM);
    } catch {}
  }, []);

  /**
   * Search - 跳转至UD09查询结果页
   */
  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setErrorMessage("");

    // 将检索条件保存到 sessionStorage，以便从UD09返回时恢复
    const formState = {
      productClass: productClass.trim(),
      number: number.trim(),
      market: market.trim(),
      variable: variable.trim(),
      value: value.trim(),
      variantString1: variantString1.trim(),
      variantString2: variantString2.trim(),
      comments: comments.trim(),
      opProductClass,
      opNumber,
      opMarket,
      opVariable,
      opValue,
      opVariantString1,
      opVariantString2,
      opComments,
      addVal,
      deleteVal,
      createdByVal,
      dateVal,
    };
    try {
      sessionStorage.setItem(STORAGE_KEY_UD08_FORM, JSON.stringify(formState));
    } catch {}

    const params = {
      productClass: formState.productClass,
      number: formState.number,
      market: formState.market,
      variable: formState.variable,
      value: formState.value,
      variantString1: formState.variantString1,
      variantString2: formState.variantString2,
      comments: formState.comments,
      opProductClass,
      opNumber,
      opMarket,
      opVariable,
      opValue,
      opVariantString1,
      opVariantString2,
      opComments,
    };

    navigate("/UD09", { state: params });
  }, [
    productClass,
    number,
    market,
    variable,
    value,
    variantString1,
    variantString2,
    comments,
    opProductClass,
    opNumber,
    opMarket,
    opVariable,
    opValue,
    opVariantString1,
    opVariantString2,
    opComments,
    addVal,
    deleteVal,
    createdByVal,
    dateVal,
    navigate,
  ]);

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
   * Variable存在校验
   */
  const validateVariable = useCallback((): boolean => {
    const trimmedVar = variable.trim();
    if (!trimmedVar) return true; // Variable 可为空，为空时不校验
    const exists = variableOptions.some(
      (opt) => opt.value.toLowerCase() === trimmedVar.toLowerCase(),
    );
    if (!exists) {
      setErrorMessage(
        "Variant does not exist, Please enter the correct content",
      );
      return false;
    }
    return true;
  }, [variable, variableOptions]);

  /**
   * Add - 新增记录
   */
  const handleAdd = useCallback(async () => {
    if (!validateRequired()) return;
    if (!validateVariable()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const params = {
        productClass: productClass.trim(),
        number: parseInt(number.trim(), 10),
        market: market.trim(),
        variable: variable.trim(),
        value: value.trim(),
        string1: variantString1.trim() || null,
        string2: variantString2.trim() || null,
        comments: comments.trim(),
      };

      const result = await homologationVariablesApi.add(params);

      if (result && result.code === 200) {
        handleClear();
        alert("添加成功");
      } else {
        setErrorMessage(result?.msg || "添加失败，请确认输入内容");
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
    if (!validateVariable()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const params = {
        productClass: productClass.trim(),
        number: parseInt(number.trim(), 10),
        market: market.trim(),
        variable: variable.trim(),
        value: value.trim(),
        string1: variantString1.trim() || null,
        string2: variantString2.trim() || null,
        comments: comments.trim(),
      };

      const result = await homologationVariablesApi.update(params);

      if (result && result.code === 200) {
        handleClear();
        alert("更新成功");
      } else {
        setErrorMessage(result?.msg || "更新失败");
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
    if (!validateRequired()) return;

    if (!window.confirm("确定要删除该记录吗？")) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const params = {
        productClass: productClass.trim(),
        number: parseInt(number.trim(), 10),
        market: market.trim(),
      };

      const result = await homologationVariablesApi.delete(params);

      if (result && result.code === 200) {
        handleClear();
        alert("删除成功");
      } else {
        setErrorMessage(result?.msg || "删除失败");
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
  }, [productClass, number, market, validateRequired, handleClear]);

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
      <header className="ud08-header">
        <div className="ud08-header-logo"></div>
      </header>
      <main className="ud08-main">
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
              disabled={isSubmitting}
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

            {/* Add - 短入力框 + 右侧自动值 */}
            <div className="ud08-field-row">
              <label className="ud08-label">Add</label>
              {renderOperatorSelect(opAdd, handleAddOpChange)}
              <div className="ud08-field-control-short">
                <input
                  className="ud08-input"
                  type="text"
                  value={addVal}
                  onChange={handleAddChange}
                  maxLength={6}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
              <span className="ud08-auto-value">{"YYYYWW"}</span>
            </div>
            {/* Delete - 短入力框 + 右侧自动值 */}
            <div className="ud08-field-row">
              <label className="ud08-label">Delete</label>
              {renderOperatorSelect(opDelete, handleDeleteOpChange)}
              <div className="ud08-field-control-short">
                <input
                  className="ud08-input"
                  type="text"
                  value={deleteVal}
                  onChange={handleDeleteChange}
                  maxLength={6}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
              <span className="ud08-auto-value">{"YYYYWW"}</span>
            </div>
            {/* Created by user - 短入力框 + 右侧自动值 */}
            <div className="ud08-field-row">
              <label className="ud08-label">Created by user</label>
              {renderOperatorSelect(opCreatedBy, handleCreatedByOpChange)}
              <div className="ud08-field-control-short">
                <input
                  className="ud08-input"
                  type="text"
                  value={createdByVal}
                  onChange={handleCreatedByChange}
                  maxLength={16}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
              <span className="ud08-auto-value">{"Automatic"}</span>
            </div>
            {/* Date - 短入力框 + 右侧自动值 */}
            <div className="ud08-field-row">
              <label className="ud08-label">Date</label>
              {renderOperatorSelect(opDate, handleDateOpChange)}
              <div className="ud08-field-control-short">
                <input
                  className="ud08-input"
                  type="text"
                  value={dateVal}
                  onChange={handleDateChange}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
              </div>
              <span className="ud08-auto-value">{"Automatic"}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD08;
