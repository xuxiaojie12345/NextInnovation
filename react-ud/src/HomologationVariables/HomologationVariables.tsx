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

const HomologationVariables = () => {
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
  const [isLoading, setIsLoading] = useState(false);
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
      const API_BASE_URL = "http://localhost:8081";

      // 获取Product class列表
      const pcResponse = await fetch(
        `${API_BASE_URL}/api/ud08HomologationVariables/getProductClassMaster`,
      );
      if (pcResponse.ok) {
        const pcData = await pcResponse.json();
        if (pcData.code === 200 && pcData.data) {
          setProductClassList(pcData.data);
        }
      }

      // 获取Market列表
      const marketResponse = await fetch(
        `${API_BASE_URL}/api/ud08HomologationVariables/getMarketMaster`,
      );
      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        if (marketData.code === 200 && marketData.data) {
          setMarketList(marketData.data);
        }
      }

      // 获取Variable列表
      const varResponse = await fetch(
        `${API_BASE_URL}/api/ud08HomologationVariables/getHdocVariables`,
      );
      if (varResponse.ok) {
        const varData = await varResponse.json();
        if (varData.code === 200 && varData.data) {
          setVariableList(varData.data);
        }
      }
    } catch (error) {
      console.error("Fetch dropdown data error:", error);
      setErrorMessage("系统内部错误，请联系管理员");
    }
  };

  // 获取当前用户信息和日期
  const fetchCurrentUserInfo = async () => {
    try {
      // 从 localStorage 获取登录用户 ID
      const loggedInUser = localStorage.getItem("currentUser");

      console.log("Logged in user from localStorage:", loggedInUser);

      if (loggedInUser) {
        // 使用登录的用户 ID
        const now = new Date();
        const dateTime = now.toISOString().slice(0, 19).replace("T", " ");

        setFormData((prev) => ({
          ...prev,
          createdByUser: loggedInUser, // 使用登录用户 ID
          date: dateTime,
          // Add 和 Delete 字段不自动填充，保持为空
        }));

        console.log("Auto-filled form data with logged-in user:", {
          createdByUser: loggedInUser,
          date: dateTime,
        });
      } else {
        // 如果没有登录用户，尝试从后端 API 获取
        const API_BASE_URL = "http://localhost:8081";

        console.log(
          "Fetching current user info from:",
          `${API_BASE_URL}/api/ud08HomologationVariables/getCurrentUserInfo`,
        );

        const response = await fetch(
          `${API_BASE_URL}/api/ud08HomologationVariables/getCurrentUserInfo`,
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Current user info response:", data);

          if (data.code === 200 && data.data) {
            // 只自动填充 Created by user 和 Date 字段
            setFormData((prev) => ({
              ...prev,
              createdByUser: data.data.currentUser || "",
              date: data.data.currentDateTime || "",
              // Add 和 Delete 字段不自动填充，保持为空
            }));

            console.log("Auto-filled form data:", {
              createdByUser: data.data.currentUser,
              date: data.data.currentDateTime,
            });
          }
        } else {
          console.warn(
            "Failed to fetch current user info, status:",
            response.status,
          );
        }
      }
    } catch (error) {
      console.error("Fetch current user info error:", error);
      // 如果获取失败，使用默认值（只填充 Created by user 和 Date）
      const now = new Date();
      const dateTime = now.toISOString().slice(0, 19).replace("T", " ");

      setFormData((prev) => ({
        ...prev,
        createdByUser: "SYSTEM",
        date: dateTime,
        // Add 和 Delete 字段不自动填充，保持为空
      }));
    }
  };

  // 处理输入变化
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 清除错误和成功消息
    setErrorMessage("");
    setSuccessMessage("");
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

    console.log("Navigating to result list with criteria:", searchCriteria);

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
    if (!validateRequiredFields()) return;

    // 验证Variable
    if (formData.variable && !(await validateVariable())) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Sending add request to:",
        `${API_BASE_URL}/api/ud08HomologationVariables/add`,
      );
      console.log("Request data:", {
        pc: formData.productClass,
        num: formData.number,
        market: formData.market,
        variable: formData.variable,
        val: formData.value,
        vs: formData.variantString1,
        vs2: formData.variantString2,
        comments: formData.comments,
      });

      const response = await fetch(
        `${API_BASE_URL}/api/ud08HomologationVariables/add`,
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

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.code === 200) {
        setSuccessMessage("记录添加成功");
      } else {
        setErrorMessage(data.msg || "添加失败");
      }
    } catch (error) {
      console.error("Add error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setErrorMessage(
          "无法连接到后端服务，请确认后端服务已启动（http://localhost:8081）",
        );
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "系统内部错误，请联系管理员",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update功能
  const handleUpdate = async () => {
    if (!validateRequiredFields()) return;

    // 验证Variable
    if (formData.variable && !(await validateVariable())) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Sending update request to:",
        `${API_BASE_URL}/api/ud08HomologationVariables/update`,
      );
      console.log("Request data:", {
        pc: formData.productClass,
        num: formData.number,
        market: formData.market,
        variable: formData.variable,
        val: formData.value,
        vs: formData.variantString1,
        vs2: formData.variantString2,
        comments: formData.comments,
        userid: formData.createdByUser, // 传递 Created by user 的值
      });

      const response = await fetch(
        `${API_BASE_URL}/api/ud08HomologationVariables/update`,
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

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.code === 200) {
        setSuccessMessage("记录更新成功");
      } else {
        setErrorMessage(data.msg || "更新失败");
      }
    } catch (error) {
      console.error("Update error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setErrorMessage(
          "无法连接到后端服务，请确认后端服务已启动（http://localhost:8081）",
        );
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "系统内部错误，请联系管理员",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete功能
  const handleDelete = async () => {
    if (!validateRequiredFields()) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Sending delete request to:",
        `${API_BASE_URL}/api/ud08HomologationVariables/delete`,
      );
      console.log("Request data:", {
        pc: formData.productClass,
        num: formData.number,
        market: formData.market,
        userid: formData.createdByUser, // 传递 Created by user 的值
      });

      const response = await fetch(
        `${API_BASE_URL}/api/ud08HomologationVariables/delete`,
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

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (data.code === 200) {
        setSuccessMessage("记录删除成功");
      } else {
        setErrorMessage(data.msg || "删除失败");
      }
    } catch (error) {
      console.error("Delete error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        setErrorMessage(
          "无法连接到后端服务，请确认后端服务已启动（http://localhost:8081）",
        );
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "系统内部错误，请联系管理员",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='hv-container'>
        <div className='hv-loading'>Loading...</div>
      </div>
    );
  }

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
