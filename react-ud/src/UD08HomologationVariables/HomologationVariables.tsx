// HomologationVariables.tsx - UD08模块
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HomologationVariables.css";

interface ProductClassItem {
  pc: string;
  productName: string;
}

interface MarketItem {
  market: string;
  description: string;
}

interface VariableItem {
  variable: string;
}

interface FormData {
  productClass: string;
  number: string;
  market: string;
  variable: string;
  value: string;
  variantString1: string;
  variantString2: string;
  comments: string;
  addDate: string;
  deleteDate: string;
  createdByUser: string;
  date: string;
  // 每个字段独立的运算符
  productClassOperator: string;
  numberOperator: string;
  marketOperator: string;
  variableOperator: string;
  valueOperator: string;
  variantString1Operator: string;
  variantString2Operator: string;
  commentsOperator: string;
  addDateOperator: string;
  deleteDateOperator: string;
  createdByUserOperator: string;
  dateOperator: string;
}

const HomologationVariables: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    productClass: "",
    number: "",
    market: "",
    variable: "",
    value: "",
    variantString1: "",
    variantString2: "",
    comments: "",
    addDate: "",
    deleteDate: "",
    createdByUser: "",
    date: "",
    // 默认所有运算符为 "="
    productClassOperator: "=",
    numberOperator: "=",
    marketOperator: "=",
    variableOperator: "=",
    valueOperator: "=",
    variantString1Operator: "=",
    variantString2Operator: "=",
    commentsOperator: "=",
    addDateOperator: "=",
    deleteDateOperator: "=",
    createdByUserOperator: "=",
    dateOperator: "=",
  });

  const [productClassList, setProductClassList] = useState<ProductClassItem[]>(
    [],
  );
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [variableList, setVariableList] = useState<VariableItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // 页面初始化：加载下拉列表数据和用户信息
  useEffect(() => {
    fetchDropdownData();
    fetchCurrentUserInfo();
  }, []);

  // 处理从 HomologationVariablesResultList 返回的导航状态
  useEffect(() => {
    const state = location.state as any;
    if (!state) return;

    // Select → 填充选中记录的内容
    if (state.isFromSelection && state.selectedRecord) {
      const record = state.selectedRecord;
      setFormData((prev) => ({
        ...prev,
        productClass: record.productClass || "",
        number: String(record.number ?? ""),
        market: record.market || "",
        variable: record.variable || "",
        value: record.value || "",
        variantString1: record.variantString1 || "",
        variantString2: record.variantString2 || "",
        comments: record.comments || "",
        addDate: record.addDate || "",
        deleteDate: record.deleteDate || "",
        createdByUser: record.createdByUser || prev.createdByUser,
        date: record.date || prev.date,
        // 重置运算符为默认值 "="
        productClassOperator: "=",
        numberOperator: "=",
        marketOperator: "=",
        variableOperator: "=",
        valueOperator: "=",
        variantString1Operator: "=",
        variantString2Operator: "=",
        commentsOperator: "=",
        addDateOperator: "=",
        deleteDateOperator: "=",
        createdByUserOperator: "=",
        dateOperator: "=",
      }));
      setErrorMessage("");
      setSuccessMessage("");
    }

    // Back → 保留之前的搜索条件
    if (state.isFromBack && state.searchCriteria) {
      const criteria = state.searchCriteria;
      setFormData((prev) => ({
        ...prev,
        productClass: criteria.productClass || "",
        number: String(criteria.number ?? ""),
        market: criteria.market || "",
        variable: criteria.variable || "",
        value: criteria.value || "",
        variantString1: criteria.variantString1 || "",
        variantString2: criteria.variantString2 || "",
        comments: criteria.comments || "",
        addDate: criteria.addDate || "",
        deleteDate: criteria.deleteDate || "",
        createdByUser: criteria.createdByUser || prev.createdByUser,
        date: criteria.date || prev.date,
        // 恢复各字段的操作符
        productClassOperator: criteria.productClassOperator || "=",
        numberOperator: criteria.numberOperator || "=",
        marketOperator: criteria.marketOperator || "=",
        variableOperator: criteria.variableOperator || "=",
        valueOperator: criteria.valueOperator || "=",
        variantString1Operator: criteria.variantString1Operator || "=",
        variantString2Operator: criteria.variantString2Operator || "=",
        commentsOperator: criteria.commentsOperator || "=",
        addDateOperator: criteria.addDateOperator || "=",
        deleteDateOperator: criteria.deleteDateOperator || "=",
        createdByUserOperator: criteria.createdByUserOperator || "=",
        dateOperator: criteria.dateOperator || "=",
      }));
      setErrorMessage("");
      setSuccessMessage("");
    }

    // 清除 state，防止刷新页面时重复填充
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // 获取下拉列表数据
  const fetchDropdownData = async () => {
    try {
      // 获取Product class列表
      const pcResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/getProductClassMaster`,
      );
      if (pcResponse.ok) {
        const pcData = await pcResponse.json();
        if (pcData.code === 200 && pcData.data) {
          setProductClassList(pcData.data);
        }
      }

      // 获取Market列表
      const marketResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/getMarketMaster`,
      );
      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        if (marketData.code === 200 && marketData.data) {
          setMarketList(marketData.data);
        }
      }

      // 获取Variable列表
      const varResponse = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/getHdocVariables`,
      );
      if (varResponse.ok) {
        const varData = await varResponse.json();
        if (varData.code === 200 && varData.data) {
          setVariableList(varData.data);
        }
      }
    } catch (err) {}
  };

  // 获取当前用户信息和日期
  const fetchCurrentUserInfo = async () => {
    try {
      // 从 localStorage 获取登录用户 ID
      const loggedInUser = localStorage.getItem("currentUser");

      if (loggedInUser) {
        // 使用登录的用户 ID
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, "0");
        const dateTime =
          now.getFullYear() +
          "-" +
          pad(now.getMonth() + 1) +
          "-" +
          pad(now.getDate()) +
          " " +
          pad(now.getHours()) +
          ":" +
          pad(now.getMinutes()) +
          ":" +
          pad(now.getSeconds());

        setFormData((prev) => ({
          ...prev,
          createdByUser: loggedInUser, // 使用登录用户 ID
          date: dateTime,
          // Add 和 Delete 字段不自动填充，保持为空
        }));
      } else {
        // 如果没有登录用户，尝试从后端 API 获取
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/getCurrentUserInfo`,
        );

        if (response.ok) {
          const data = await response.json();

          if (data.code === 200 && data.data) {
            // 只自动填充 Created by user 和 Date 字段
            setFormData((prev) => ({
              ...prev,
              createdByUser: data.data.currentUser || "",
              date: data.data.currentDateTime || "",
              // Add 和 Delete 字段不自动填充，保持为空
            }));
          }
        }
      }
    } catch (error) {
      // 如果获取失败，使用默认值（只填充 Created by user 和 Date）
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const dateTime =
        now.getFullYear() +
        "-" +
        pad(now.getMonth() + 1) +
        "-" +
        pad(now.getDate()) +
        " " +
        pad(now.getHours()) +
        ":" +
        pad(now.getMinutes()) +
        ":" +
        pad(now.getSeconds());

      setFormData((prev) => ({
        ...prev,
        createdByUser: "SYSTEM",
        date: dateTime,
        // Add 和 Delete 字段不自动填充，保持为空
      }));
    }
  };

  // 文字種別バリデーション用の定義
  const FIELD_VALIDATION: Record<string, { pattern: RegExp; message: string }> =
    {
      number: { pattern: /^[0-9]*$/, message: "Number只能输入半角数字" },
      variable: {
        pattern: /^[!-~]*$/,
        message: "Variable只能输入半角英数字+記号",
      },
      value: { pattern: /^[!-~]*$/, message: "Value只能输入半角英数字+記号" },
      variantString1: {
        pattern: /^[!-~]*$/,
        message: "Variant string.1只能输入半角英数字+記号",
      },
      variantString2: {
        pattern: /^[!-~]*$/,
        message: "Variant string.2只能输入半角英数字+記号",
      },
      comments: {
        pattern: /^[!-~]*$/,
        message: "Comments只能输入半角英数字+記号",
      },
      addDate: { pattern: /^[!-~]*$/, message: "Add只能输入半角英数字+記号" },
      deleteDate: {
        pattern: /^[!-~]*$/,
        message: "Delete只能输入半角英数字+記号",
      },
    };

  // 处理输入变化（文字種別バリデーション付き）
  const handleInputChange = (field: keyof FormData, value: string) => {
    // テキストフィールドの文字種別チェック
    const validation = FIELD_VALIDATION[field as string];
    if (validation && value.length > 0) {
      // 空文字でない場合、許可された文字のみで構成されているか確認
      const invalidChars = value
        .split("")
        .filter((ch) => !validation.pattern.test(ch));
      if (invalidChars.length > 0) {
        setErrorMessage(validation.message);
        return; // 値を更新せずエラーメッセージのみ表示
      }
    }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 清除错误和成功消息
    setErrorMessage("");
    setSuccessMessage("");
  };

  // バリデーションエラーメッセージ定義（Submit用）
  const FIELD_VALIDATION_ERRORS: Record<string, string> = {
    number: "Number只能输入半角数字",
    variable: "Variable只能输入半角英数字+記号",
    value: "Value只能输入半角英数字+記号",
    variantString1: "Variant string.1只能输入半角英数字+記号",
    variantString2: "Variant string.2只能输入半角英数字+記号",
    comments: "Comments只能输入半角英数字+記号",
    addDate: "Add只能输入半角英数字+記号",
    deleteDate: "Delete只能输入半角英数字+記号",
  };

  // 文字種別バリデーション（Submit時に全フィールドをチェック）
  const validateFieldChars = (): boolean => {
    const fields: Array<keyof FormData> = [
      "number",
      "variable",
      "value",
      "variantString1",
      "variantString2",
      "comments",
      "addDate",
      "deleteDate",
    ];
    for (const f of fields) {
      const value = formData[f] as string;
      if (value.length > 0) {
        const validation = FIELD_VALIDATION[f as string];
        if (validation) {
          const invalidChars = value
            .split("")
            .filter((ch) => !validation.pattern.test(ch));
          if (invalidChars.length > 0) {
            setErrorMessage(FIELD_VALIDATION_ERRORS[f as string]);
            return false;
          }
        }
      }
    }
    return true;
  };

  // 验证必填字段
  const validateRequiredFields = (): boolean => {
    if (!formData.productClass || !formData.number || !formData.market) {
      setErrorMessage("Product class、Number、Market为必填项");
      return false;
    }
    return true;
  };

  // 验证Variable字段
  const validateVariable = async (): Promise<boolean> => {
    let variableValue = formData.variable;

    // 如果以TEMPLATE-开头，去除前缀
    if (variableValue.startsWith("TEMPLATE-")) {
      variableValue = variableValue.substring(9); // 去除"TEMPLATE-"
    }

    // 检查是否存在于HDOC_VARIABLES表中
    const exists = variableList.some((item) => item.variable === variableValue);
    if (!exists) {
      setErrorMessage(
        "Variant does not exist, Please enter the correct content",
      );
      return false;
    }

    return true;
  };

  // Search List功能：导航到搜索结果列表页面（UD09）
  const handleSearchList = () => {
    if (!validateFieldChars()) return;
    if (!formData.productClass || !formData.number || !formData.market) {
      setErrorMessage("Product class、Number、Market为必填项");
      return;
    }

    // 构建搜索条件对象（包含各字段前的操作符）
    const searchCriteria = {
      productClass: formData.productClass,
      number: parseInt(formData.number) || 0,
      market: formData.market,
      variable: formData.variable || null,
      value: formData.value || null,
      variantString1: formData.variantString1 || null,
      variantString2: formData.variantString2 || null,
      comments: formData.comments || null,
      addDate: formData.addDate || null,
      deleteDate: formData.deleteDate || null,
      createdByUser: formData.createdByUser || null,
      date: formData.date || null,
      // 传递各字段的操作符
      productClassOperator: formData.productClassOperator || "=",
      numberOperator: formData.numberOperator || "=",
      marketOperator: formData.marketOperator || "=",
      variableOperator: formData.variableOperator || "=",
      valueOperator: formData.valueOperator || "=",
      variantString1Operator: formData.variantString1Operator || "=",
      variantString2Operator: formData.variantString2Operator || "=",
      commentsOperator: formData.commentsOperator || "=",
      addDateOperator: formData.addDateOperator || "=",
      deleteDateOperator: formData.deleteDateOperator || "=",
      createdByUserOperator: formData.createdByUserOperator || "=",
      dateOperator: formData.dateOperator || "=",
    };

    // 导航到搜索结果列表页面
    navigate("/homologation-variables-result-list", {
      state: {
        searchCriteria: searchCriteria,
      },
    });
  };

  // Clear功能
  const handleClear = () => {
    // 只保留 createdByUser 和 date 字段，清空其他所有字段，并重置所有运算符为默认值 "="
    setFormData((prev) => ({
      productClass: "",
      number: "",
      market: "",
      variable: "",
      value: "",
      variantString1: "",
      variantString2: "",
      comments: "",
      addDate: "", // 清空 Add 日期
      deleteDate: "", // 清空 Delete 日期
      createdByUser: prev.createdByUser, // 保留 Created by user
      date: prev.date, // 保留 Date
      // 重置所有运算符为默认值 "="
      productClassOperator: "=",
      numberOperator: "=",
      marketOperator: "=",
      variableOperator: "=",
      valueOperator: "=",
      variantString1Operator: "=",
      variantString2Operator: "=",
      commentsOperator: "=",
      addDateOperator: "=",
      deleteDateOperator: "=",
      createdByUserOperator: "=",
      dateOperator: "=",
    }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Add功能
  const handleAdd = async () => {
    if (!validateFieldChars()) return;
    if (!validateRequiredFields()) return;

    // 验证Variable
    if (formData.variable && !(await validateVariable())) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pc: formData.productClass,
            num: parseInt(formData.number) || 0,
            market: formData.market,
            variable: formData.variable,
            val: formData.value,
            vs: formData.variantString1,
            vs2: formData.variantString2,
            comments: formData.comments,
            addDate: formData.addDate,
            userid: formData.createdByUser, // 传递 Created by user 的值
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.code === 200) {
        setSuccessMessage("记录添加成功");
      } else {
        setErrorMessage(data.msg || "添加失败");
      }
    } catch (err) {}
  };

  // Update功能
  const handleUpdate = async () => {
    if (!validateFieldChars()) return;
    if (!validateRequiredFields()) return;

    // 验证Variable
    if (formData.variable && !(await validateVariable())) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pc: formData.productClass,
            num: parseInt(formData.number) || 0,
            market: formData.market,
            variable: formData.variable,
            val: formData.value,
            vs: formData.variantString1,
            vs2: formData.variantString2,
            comments: formData.comments,
            userid: formData.createdByUser, // 传递 Created by user 的值
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.code === 200) {
        setSuccessMessage("记录更新成功");
      } else {
        setErrorMessage(data.msg || "更新失败");
      }
    } catch (err) {}
  };

  // Delete功能
  const handleDelete = async () => {
    if (!validateFieldChars()) return;
    if (!validateRequiredFields()) return;
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud08HomologationVariables/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pc: formData.productClass,
            num: parseInt(formData.number) || 0,
            market: formData.market,
            userid: formData.createdByUser, // 传递 Created by user 的值
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();

      if (data.code === 200) {
        setSuccessMessage("记录删除成功");
      } else {
        setErrorMessage(data.msg || "删除失败");
      }
    } catch (err) {}
  };

  return (
    <div className='hv-container'>
      {/* 标题 */}
      <h1 className='hv-title'>Homologation Variables</h1>

      {/* 边框容器 - 包含按钮和表单 */}
      <div className='hv-border-box'>
        {/* 错误消息显示 */}
        {errorMessage && <div className='hv-error-message'>{errorMessage}</div>}

        {/* 成功消息显示 */}
        {successMessage && (
          <div className='hv-success-message'>{successMessage}</div>
        )}

        {/* 按钮区域 */}
        <div className='hv-button-bar'>
          <button className='hv-btn' onClick={handleSearchList}>
            Search
          </button>
          <button className='hv-btn' onClick={handleClear}>
            Clear
          </button>
          <button className='hv-btn' onClick={handleAdd}>
            Add
          </button>
          <button className='hv-btn' onClick={handleUpdate}>
            Update
          </button>
          <button className='hv-btn' onClick={handleDelete}>
            Delete
          </button>
        </div>

        {/* 表单区域 */}
        <div className='hv-form-section'>
          {/* Product class */}
          <div className='hv-form-row'>
            <label className='hv-label-required'>*Product class</label>
            <select
              className='hv-operator-select'
              value={formData.productClassOperator}
              onChange={(e) =>
                handleInputChange("productClassOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <select
              className='hv-select'
              value={formData.productClass}
              onChange={(e) =>
                handleInputChange("productClass", e.target.value)
              }
            >
              <option value=''>请选择</option>
              {productClassList.map((item, index) => (
                <option key={index} value={item.pc}>
                  {item.pc}
                </option>
              ))}
            </select>
          </div>

          {/* Number */}
          <div className='hv-form-row'>
            <label className='hv-label-required'>*Number</label>
            <select
              className='hv-operator-select'
              value={formData.numberOperator}
              onChange={(e) =>
                handleInputChange("numberOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='>'>&gt;</option>
              <option value='<'>&lt;</option>
            </select>
            <input
              type='text'
              className='hv-input-short'
              value={formData.number}
              onChange={(e) => handleInputChange("number", e.target.value)}
              maxLength={10}
            />
          </div>

          {/* Market */}
          <div className='hv-form-row'>
            <label className='hv-label-required'>*Market</label>
            <select
              className='hv-operator-select'
              value={formData.marketOperator}
              onChange={(e) =>
                handleInputChange("marketOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <select
              className='hv-select-short'
              value={formData.market}
              onChange={(e) => handleInputChange("market", e.target.value)}
            >
              <option value=''>请选择</option>
              {marketList.map((item, index) => (
                <option key={index} value={item.market}>
                  {item.market}
                </option>
              ))}
            </select>
          </div>

          {/* Variable */}
          <div className='hv-form-row'>
            <label className='hv-label'>Variable</label>
            <select
              className='hv-operator-select'
              value={formData.variableOperator}
              onChange={(e) =>
                handleInputChange("variableOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-medium'
              value={formData.variable}
              onChange={(e) => handleInputChange("variable", e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Value */}
          <div className='hv-form-row'>
            <label className='hv-label'>Value</label>
            <select
              className='hv-operator-select'
              value={formData.valueOperator}
              onChange={(e) =>
                handleInputChange("valueOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-long'
              value={formData.value}
              onChange={(e) => handleInputChange("value", e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Variant string.1 */}
          <div className='hv-form-row'>
            <label className='hv-label'>Variant string.</label>
            <select
              className='hv-operator-select'
              value={formData.variantString1Operator}
              onChange={(e) =>
                handleInputChange("variantString1Operator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-long'
              value={formData.variantString1}
              onChange={(e) =>
                handleInputChange("variantString1", e.target.value)
              }
              maxLength={100}
            />
          </div>

          {/* Variant string.2 */}
          <div className='hv-form-row'>
            <label className='hv-label'></label>
            <select
              className='hv-operator-select'
              value={formData.variantString2Operator}
              onChange={(e) =>
                handleInputChange("variantString2Operator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-long'
              value={formData.variantString2}
              onChange={(e) =>
                handleInputChange("variantString2", e.target.value)
              }
              maxLength={100}
            />
          </div>

          {/* Comments */}
          <div className='hv-form-row'>
            <label className='hv-label'>Comments</label>
            <select
              className='hv-operator-select'
              value={formData.commentsOperator}
              onChange={(e) =>
                handleInputChange("commentsOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-long'
              value={formData.comments}
              onChange={(e) => handleInputChange("comments", e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Add */}
          <div className='hv-form-row'>
            <label className='hv-label'>Add</label>
            <select
              className='hv-operator-select'
              value={formData.addDateOperator}
              onChange={(e) =>
                handleInputChange("addDateOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-short'
              value={formData.addDate}
              onChange={(e) => handleInputChange("addDate", e.target.value)}
              maxLength={6}
              placeholder='YYYYMM'
            />
            <span className='hv-auto-text'>YYYYWW</span>
          </div>

          {/* Delete */}
          <div className='hv-form-row'>
            <label className='hv-label'>Delete</label>
            <select
              className='hv-operator-select'
              value={formData.deleteDateOperator}
              onChange={(e) =>
                handleInputChange("deleteDateOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-short'
              value={formData.deleteDate}
              onChange={(e) => handleInputChange("deleteDate", e.target.value)}
              maxLength={6}
              placeholder='YYYYMM'
            />
            <span className='hv-auto-text'>YYYYWW</span>
          </div>

          {/* Created by user */}
          <div className='hv-form-row'>
            <label className='hv-label'>Created by user</label>
            <select
              className='hv-operator-select'
              value={formData.createdByUserOperator}
              onChange={(e) =>
                handleInputChange("createdByUserOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-medium'
              value={formData.createdByUser}
              onChange={(e) =>
                handleInputChange("createdByUser", e.target.value)
              }
              maxLength={16}
              readOnly
            />
            <span className='hv-auto-text'>Automatic</span>
          </div>

          {/* Date */}
          <div className='hv-form-row'>
            <label className='hv-label'>Date</label>
            <select
              className='hv-operator-select'
              value={formData.dateOperator}
              onChange={(e) =>
                handleInputChange("dateOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='>'>&gt;</option>
              <option value='<'>&lt;</option>
            </select>
            <input
              type='text'
              className='hv-input-short'
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              readOnly
            />
            <span className='hv-auto-text'>Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomologationVariables;
