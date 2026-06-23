import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./HomologationVariables.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

const HomologationVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [pc, setPc] = useState("");
  const [number, setNumber] = useState("");
  const [market, setMarket] = useState("");
  const [variable, setVariable] = useState("");
  const [val, setVal] = useState("");
  const [vs, setVs] = useState("");
  const [vs2, setVs2] = useState("");
  const [comments, setComments] = useState("");
  const [addDate, setAddDate] = useState("");
  const [deleteDate, setDeleteDate] = useState("");
  const [updateUser, setUpdateUser] = useState("");
  const [updateDatetime, setUpdateDatetime] = useState("");

  const [productClassOptions, setProductClassOptions] = useState<string[]>([]);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  const [loading, setLoading] = useState(true);

  const [savedPc, setSavedPc] = useState<string | null>(null);
  const [savedNumber, setSavedNumber] = useState<string | null>(null);
  const [savedMarket, setSavedMarket] = useState<string | null>(null);

  // 组件渲染时立即从 sessionStorage 恢复检索条件（Back/Select 返回时）
  const savedParams = sessionStorage.getItem("hvars_search_params");
  if (savedParams) {
    try {
      const restored = JSON.parse(savedParams);
      if (restored?.pc) setPc(restored.pc);
      if (restored?.number) setNumber(restored.number);
      if (restored?.market) setMarket(restored.market);
      if (restored?.variable !== undefined) setVariable(restored.variable);
      if (restored?.val !== undefined) setVal(restored.val);
      if (restored?.vs !== undefined) setVs(restored.vs);
      if (restored?.vs2 !== undefined) setVs2(restored.vs2);
      if (restored?.comments !== undefined) setComments(restored.comments);
      if (restored?.addDate !== undefined) setAddDate(restored.addDate);
      if (restored?.deleteDate !== undefined)
        setDeleteDate(restored.deleteDate);
      if (restored?.updateUser !== undefined)
        setUpdateUser(restored.updateUser);
      if (restored?.updateDatetime !== undefined)
        setUpdateDatetime(restored.updateDatetime);
      if (restored?.pc && restored?.number && restored?.market) {
        setSavedPc(restored.pc);
        setSavedNumber(restored.number);
        setSavedMarket(restored.market);
      }
    } catch (_) {}
    sessionStorage.removeItem("hvars_search_params");
  }

  // 显示消息
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  // 初始化：获取下拉框数据
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const [pcRes, marketRes] = await Promise.all([
          apiClient.get<ApiResponse>("/api/ud08/selectproductclassmaster"),
          apiClient.get<ApiResponse>("/api/ud08/selectmarketmaster"),
        ]);

        if (pcRes.data.code === 200 && pcRes.data.data) {
          const options = (pcRes.data.data as { pc: string }[]).map(
            (item) => item.pc,
          );
          setProductClassOptions(options);
        }
        if (marketRes.data.code === 200 && marketRes.data.data) {
          const options = (marketRes.data.data as { market: string }[]).map(
            (item) => item.market,
          );
          setMarketOptions(options);
        }
      } catch (error: any) {
        showMessage(
          error?.response?.data?.message ||
            "System error. Please contact support.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [location.state]);

  // 清除消息
  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  // 清空所有字段
  const handleClear = () => {
    setPc("");
    setNumber("");
    setMarket("");
    setVariable("");
    setVal("");
    setVs("");
    setVs2("");
    setComments("");
    setAddDate("");
    setDeleteDate("");
    setUpdateUser("");
    setUpdateDatetime("");
    setSavedPc(null);
    setSavedNumber(null);
    setSavedMarket(null);
    clearMessage();
  };

  // 处理Variable前缀
  const processVariable = (input: string): string => {
    let processed = input.trim();
    if (processed.startsWith("TEMPLATE-")) {
      processed = processed.substring("TEMPLATE-".length);
    }
    return processed;
  };

  // 校验主键是否为空
  const validatePrimaryKey = (operation: string): boolean => {
    if (!pc || !number || !market) {
      showMessage(
        `Product class, Number, and Market are required for ${operation} operation.`,
        "error",
      );
      return false;
    }
    return true;
  };

  // 查询操作
  const handleSearch = async () => {
    clearMessage();
    // 保存检索条件到 sessionStorage（确保 Back 返回时能恢复）
    const searchData = {
      pc,
      number,
      market,
      variable,
      val,
      vs,
      vs2,
      comments,
      addDate,
      deleteDate,
      updateUser,
      updateDatetime,
    };
    sessionStorage.setItem("hvars_search_params", JSON.stringify(searchData));
    navigate("/menu/homologation-variables-result", { state: searchData });
  };

  // 新增操作
  const handleAdd = async () => {
    clearMessage();
    if (!validatePrimaryKey("Add")) return;

    try {
      // 存在性检查
      const checkRes = await apiClient.get<ApiResponse>(
        "/api/ud08/selectuserdefined-rules",
        { params: { pc, number, market } },
      );
      if (checkRes.data.code === 200 && checkRes.data.data?.count > 0) {
        showMessage(
          "Primary key conflict, Please enter the correct content",
          "error",
        );
        return;
      }

      // Variable校验
      if (variable.trim()) {
        const processedVar = processVariable(variable);
        const varCheckRes = await apiClient.get<ApiResponse>(
          "/api/ud08/selecthdocvariables",
          { params: { variable: processedVar } },
        );
        if (
          varCheckRes.data.code === 200 &&
          varCheckRes.data.data?.count === 0
        ) {
          showMessage(
            "Variant does not exist, Please enter the correct content",
            "error",
          );
          return;
        }
      }

      // 执行新增
      const addRes = await apiClient.post<ApiResponse>("/api/ud08/add", {
        pc,
        number,
        market,
        variable: processVariable(variable),
        val,
        vs,
        vs2,
        comments,
        addDate,
        deleteDate,
        updateUser,
        updateDatetime: updateDatetime || null,
      });

      if (addRes.data.code === 200) {
        showMessage(addRes.data.message || "Added successfully", "success");
      } else {
        showMessage(
          addRes.data.msg || addRes.data.message || "Add operation failed.",
          "error",
        );
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        "System error. Please contact support.";
      showMessage(msg, "error");
    }
  };

  // 更新操作
  const handleUpdate = async () => {
    clearMessage();
    if (!validatePrimaryKey("Update")) return;

    try {
      // 从结果页返回后主键一致性检查
      if (savedPc && savedNumber && savedMarket) {
        if (
          pc !== savedPc ||
          number !== savedNumber ||
          market !== savedMarket
        ) {
          showMessage(
            "Primary key conflict, Please enter the correct content",
            "error",
          );
          return;
        }
      }

      // 存在性检查
      const checkRes = await apiClient.get<ApiResponse>(
        "/api/ud08/selectuserdefined-rules",
        { params: { pc, number, market } },
      );
      if (checkRes.data.code === 200 && checkRes.data.data?.count === 0) {
        showMessage(
          "Data does not exist, Please enter the correct content",
          "error",
        );
        return;
      }

      // Variable校验
      if (variable.trim()) {
        const processedVar = processVariable(variable);
        const varCheckRes = await apiClient.get<ApiResponse>(
          "/api/ud08/selecthdocvariables",
          { params: { variable: processedVar } },
        );
        if (
          varCheckRes.data.code === 200 &&
          varCheckRes.data.data?.count === 0
        ) {
          showMessage(
            "Variant does not exist, Please enter the correct content",
            "error",
          );
          return;
        }
      }

      // 执行更新
      const updateRes = await apiClient.post<ApiResponse>("/api/ud08/update", {
        pc,
        number,
        market,
        variable: processVariable(variable),
        val,
        vs,
        vs2,
        comments,
        addDate,
        deleteDate,
        updateUser,
        updateDatetime: updateDatetime || null,
      });

      if (updateRes.data.code === 200) {
        showMessage(
          updateRes.data.message || "Updated successfully",
          "success",
        );
      } else {
        showMessage(
          updateRes.data.msg ||
            updateRes.data.message ||
            "Update operation failed.",
          "error",
        );
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        "System error. Please contact support.";
      showMessage(msg, "error");
    }
  };

  // 删除操作
  const handleDelete = async () => {
    clearMessage();
    if (!validatePrimaryKey("Delete")) return;

    try {
      // 存在性检查
      const checkRes = await apiClient.get<ApiResponse>(
        "/api/ud08/selectuserdefined-rules",
        { params: { pc, number, market } },
      );
      if (checkRes.data.code === 200 && checkRes.data.data?.count === 0) {
        showMessage(
          "Data does not exist, Please enter the correct content",
          "error",
        );
        return;
      }

      // 执行删除
      const deleteRes = await apiClient.post<ApiResponse>("/api/ud08/delete", {
        pc,
        number,
        market,
      });

      if (deleteRes.data.code === 200) {
        showMessage(
          deleteRes.data.message || "Deleted successfully",
          "success",
        );
        handleClear();
      } else {
        showMessage(
          deleteRes.data.msg ||
            deleteRes.data.message ||
            "Delete operation failed.",
          "error",
        );
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        "System error. Please contact support.";
      showMessage(msg, "error");
    }
  };

  if (loading) {
    return (
      <div className="hvars-page-wrapper">
        <div className="hvars-container">
          <h1 className="hvars-title">Homologation Variables</h1>
          <div className="hvars-loading">Loading master data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hvars-page-wrapper">
      <div className="hvars-container">
        <h1 className="hvars-title">Homologation Variables</h1>

        {/* 消息区域 */}
        {message && (
          <div
            className={`hvars-message hvars-message-${messageType}`}
            role="alert"
          >
            {message}
          </div>
        )}

        {/* 表单区域 */}
        <div className="hvars-form">
          {/* 操作按钮 */}
          <div className="hvars-button-row">
            <button
              type="button"
              className="hvars-btn hvars-btn-search"
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              type="button"
              className="hvars-btn hvars-btn-clear"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="hvars-btn hvars-btn-add"
              onClick={handleAdd}
            >
              Add
            </button>
            <button
              type="button"
              className="hvars-btn hvars-btn-update"
              onClick={handleUpdate}
            >
              Update
            </button>
            <button
              type="button"
              className="hvars-btn hvars-btn-delete"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
          {/* Product class */}
          <div className="hvars-field">
            <span className="hvars-label">
              <span className="hvars-required">*</span>Product class
            </span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <select
              className="hvars-select"
              style={{ width: "220px" }}
              value={pc}
              onChange={(e) => setPc(e.target.value)}
            >
              <option value=""></option>
              {productClassOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Number */}
          <div className="hvars-field">
            <span className="hvars-label">
              <span className="hvars-required">*</span>Number
            </span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              style={{ width: "70px" }}
              value={number}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setNumber(val);
              }}
              maxLength={10}
            />
          </div>

          {/* Market */}
          <div className="hvars-field">
            <span className="hvars-label">
              <span className="hvars-required">*</span>Market
            </span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <select
              className="hvars-select"
              style={{ width: "70px" }}
              value={market}
              onChange={(e) => setMarket(e.target.value)}
            >
              <option value=""></option>
              {marketOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Variable */}
          <div className="hvars-field">
            <span className="hvars-label">Variable</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              style={{ width: "120px" }}
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* Value */}
          <div className="hvars-field">
            <span className="hvars-label">Value</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Variant string.1 */}
          <div className="hvars-field">
            <span className="hvars-label">Variant string.</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              value={vs}
              onChange={(e) => setVs(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Variant string.2 */}
          <div className="hvars-field">
            <span className="hvars-label"></span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              value={vs2}
              onChange={(e) => setVs2(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Comments */}
          <div className="hvars-field">
            <span className="hvars-label">Comments</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              style={{ width: "500px" }}
              className="hvars-input"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Add (date) */}
          <div className="hvars-field">
            <span className="hvars-label">Add</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              style={{ width: "70px" }}
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
              maxLength={6}
            />
            <span className="hvars-hint">YYYYWW</span>
          </div>

          {/* Delete (date) */}
          <div className="hvars-field">
            <span className="hvars-label">Delete</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              style={{ width: "70px" }}
              value={deleteDate}
              onChange={(e) => setDeleteDate(e.target.value)}
              maxLength={6}
            />
            <span className="hvars-hint">YYYYWW</span>
          </div>

          {/* Created by user */}
          <div className="hvars-field">
            <span className="hvars-label">Created by user</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              style={{ width: "80px" }}
              value={updateUser}
              onChange={(e) => setUpdateUser(e.target.value)}
              maxLength={16}
            />
            <span className="hvars-hint">Automatic</span>
          </div>

          {/* Date */}
          <div className="hvars-field">
            <span className="hvars-label">Date</span>
            <select className="hvars-operator">
              <option value="=">=</option>
            </select>
            <input
              type="text"
              className="hvars-input"
              style={{ width: "100px" }}
              value={updateDatetime}
              onChange={(e) => setUpdateDatetime(e.target.value)}
            />
            <span className="hvars-hint">Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomologationVariables;
