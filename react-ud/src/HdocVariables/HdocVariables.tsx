// HdocVariables.tsx - UD10模块
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HdocVariables.css";

interface FormData {
  variable: string;
  type: string;
  description: string;
  createdByUser: string;
  date: string;
  // 每个字段独立的运算符
  variableOperator: string;
  typeOperator: string;
  descriptionOperator: string;
  createdByUserOperator: string;
  dateOperator: string;
}

const HdocVariables = () => {
  const [formData, setFormData] = useState<FormData>({
    variable: "",
    type: "",
    description: "",
    createdByUser: "",
    date: "",
    // 默认所有运算符为 "="
    variableOperator: "=",
    typeOperator: "=",
    descriptionOperator: "=",
    createdByUserOperator: "=",
    dateOperator: "=",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Type下拉列表固定选项
  const typeOptions = ["VDA", "User Defined"];

  // 页面初始化：获取用户信息和日期
  useEffect(() => {
    fetchCurrentUserInfo();
  }, []);

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
          createdByUser: loggedInUser,
          date: dateTime,
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
          `${API_BASE_URL}/api/ud10Hdocvariables/getCurrentUserInfo`,
        );

        const response = await fetch(
          `${API_BASE_URL}/api/ud10Hdocvariables/getCurrentUserInfo`,
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Current user info response:", data);

          if (data.code === 200 && data.data) {
            setFormData((prev) => ({
              ...prev,
              createdByUser: data.data.currentUser || "",
              date: data.data.currentDateTime || "",
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
      // 如果获取失败，使用默认值
      const now = new Date();
      const dateTime = now.toISOString().slice(0, 19).replace("T", " ");

      setFormData((prev) => ({
        ...prev,
        createdByUser: "SYSTEM",
        date: dateTime,
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
    if (!formData.variable) {
      setErrorMessage("Variable为必填项");
      return false;
    }
    return true;
  };

  // Search功能
  const handleSearch = async () => {
    if (!validateRequiredFields()) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Sending search request to:",
        `${API_BASE_URL}/api/ud10Hdocvariables/search`,
      );
      console.log("Request data:", formData);

      const response = await fetch(
        `${API_BASE_URL}/api/ud10Hdocvariables/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variable: formData.variable,
            type: formData.type,
            description: formData.description,
            variableOperator: formData.variableOperator,
            typeOperator: formData.typeOperator,
            descriptionOperator: formData.descriptionOperator,
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
        // TODO: 跳转到搜索结果页面（如果需要）
        setSuccessMessage("搜索成功");
      } else {
        setErrorMessage(data.msg || "搜索失败");
      }
    } catch (error) {
      console.error("Search error:", error);
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

  // Clear功能
  const handleClear = () => {
    // 只保留 createdByUser 和 date 字段，清空其他所有字段，并重置所有运算符为默认值 "="
    setFormData((prev) => ({
      variable: "",
      type: "",
      description: "",
      createdByUser: prev.createdByUser,
      date: prev.date,
      // 重置所有运算符为默认值 "="
      variableOperator: "=",
      typeOperator: "=",
      descriptionOperator: "=",
      createdByUserOperator: "=",
      dateOperator: "=",
    }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Back功能：返回Menu画面
  const handleBack = () => {
    navigate("/menu");
  };

  // Add功能
  const handleAdd = async () => {
    if (!validateRequiredFields()) return;

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Sending add request to:",
        `${API_BASE_URL}/api/ud10Hdocvariables/add`,
      );
      console.log("Request data:", formData);

      const response = await fetch(
        `${API_BASE_URL}/api/ud10Hdocvariables/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variable: formData.variable,
            type: formData.type,
            description: formData.description,
            createdByUser: formData.createdByUser,
            date: formData.date,
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

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Sending update request to:",
        `${API_BASE_URL}/api/ud10Hdocvariables/update`,
      );
      console.log("Request data:", formData);

      const response = await fetch(
        `${API_BASE_URL}/api/ud10Hdocvariables/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variable: formData.variable,
            type: formData.type,
            description: formData.description,
            createdByUser: formData.createdByUser,
            date: formData.date,
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
        `${API_BASE_URL}/api/ud10Hdocvariables/delete`,
      );
      console.log("Request data:", formData);

      const response = await fetch(
        `${API_BASE_URL}/api/ud10Hdocvariables/delete`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variable: formData.variable,
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

  // Excel导出功能：画面显示什么就下载什么
  const handleExcel = () => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 从formData构建要导出的数据（当前画面显示的内容）
      const rows = [
        {
          Field: "Variable",
          Operator: formData.variableOperator,
          Value: formData.variable,
        },
        {
          Field: "Type",
          Operator: formData.typeOperator,
          Value: formData.type,
        },
        {
          Field: "Description",
          Operator: formData.descriptionOperator,
          Value: formData.description,
        },
        {
          Field: "Created by user",
          Operator: formData.createdByUserOperator,
          Value: formData.createdByUser,
        },
        {
          Field: "Date",
          Operator: formData.dateOperator,
          Value: formData.date,
        },
      ];

      // 生成CSV内容
      const headers = Object.keys(rows[0]);
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          headers
            .map((h) => {
              const val = (row as any)[h];
              // 如果值包含逗号或引号，用双引号包裹
              if (
                typeof val === "string" &&
                (val.includes(",") || val.includes('"') || val.includes("\n"))
              ) {
                return `"${val.replace(/"/g, '""')}"`;
              }
              return val ?? "";
            })
            .join(","),
        ),
      ].join("\n");

      // BOM for UTF-8 (Excel兼容)
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // 生成文件名：HDoc_Variables_YYYYMMDD.csv
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `HDoc_Variables_${dateStr}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("导出成功");
    } catch (error) {
      console.error("Export error:", error);
      setErrorMessage("导出失败，请重试");
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
      <h1 className='hv-title'>Existing HDoc Variables</h1>

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
          <button className='hv-btn' onClick={handleSearch}>
            Search
          </button>
          <button className='hv-btn' onClick={handleClear}>
            Clear
          </button>
          <button className='hv-btn' onClick={handleBack}>
            Back
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
          <button className='hv-btn' onClick={handleExcel}>
            Excel
          </button>
        </div>

        {/* 表单区域 */}
        <div className='hv-form-section'>
          {/* Variable */}
          <div className='hv-form-row'>
            <label className='hv-label-required'>*Variable</label>
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
              maxLength={30}
            />
          </div>

          {/* Type */}
          <div className='hv-form-row'>
            <label className='hv-label'>Type</label>
            <select
              className='hv-operator-select'
              value={formData.typeOperator}
              onChange={(e) =>
                handleInputChange("typeOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <select
              className='hv-select-short'
              value={formData.type}
              onChange={(e) => handleInputChange("type", e.target.value)}
            >
              <option value=''>请选择</option>
              {typeOptions.map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className='hv-form-row'>
            <label className='hv-label'>Description</label>
            <select
              className='hv-operator-select'
              value={formData.descriptionOperator}
              onChange={(e) =>
                handleInputChange("descriptionOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='!='>≠</option>
            </select>
            <input
              type='text'
              className='hv-input-long'
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              maxLength={100}
            />
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
              className='hv-input-short'
              value={formData.createdByUser}
              onChange={(e) =>
                handleInputChange("createdByUser", e.target.value)
              }
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
              <option value='!='>≠</option>
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

export default HdocVariables;
