import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ExistingHDocVariablesResult.css";

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

interface HdocVariable {
  variable: string;
  type: string;
  description: string;
  createdByUser: string;
  date: string;
}

interface SearchResult {
  variables: HdocVariable[];
  count: number;
}

const ExistingHDocVariablesResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [variables, setVariables] = useState<HdocVariable[]>([]);
  const [count, setCount] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [loading, setLoading] = useState(true);

  const searchParams = location.state as { [key: string]: string } | null;

  // 组件加载时保存检索条件到 sessionStorage
  if (searchParams) {
    sessionStorage.setItem("hdoc_search_params", JSON.stringify(searchParams));
  }

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: { [key: string]: string } = {};
        if (searchParams) {
          Object.entries(searchParams).forEach(([key, value]) => {
            if (value && typeof value === "string" && value.trim() !== "") {
              params[key] = value;
            }
          });
        }
        const res = await apiClient.get<ApiResponse<SearchResult>>(
          "/api/ud11hdocvariables/search",
          { params },
        );
        if (res.data.code === 200 && res.data.data) {
          setVariables(res.data.data.variables || []);
          setCount(res.data.data.count || 0);
        } else {
          showMessage(res.data.message || "获取数据失败", "error");
        }
      } catch (error: any) {
        showMessage(
          error?.response?.data?.message || "系统超时，请稍后再试",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const handleSelectRow = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  const handleSelect = () => {
    clearMessage();
    if (selectedIndex === null) {
      showMessage("No key defined for table.", "error");
      return;
    }
    const selected = variables[selectedIndex];
    const selectData = {
      variable: selected.variable,
      type: selected.type,
      description: selected.description,
      createdByUser: selected.createdByUser,
      date: selected.date,
    };
    sessionStorage.setItem("hdoc_search_params", JSON.stringify(selectData));
    navigate("/menu/existing-hdoc-variables", { state: selectData });
  };

  const handleBack = () => {
    if (searchParams) {
      sessionStorage.setItem(
        "hdoc_search_params",
        JSON.stringify(searchParams),
      );
    }
    navigate("/menu/existing-hdoc-variables", { state: searchParams || {} });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDown = () => {
    /* 无实际功能 */
  };

  const handleExcel = () => {
    // CSV导出
    const header = "Variable,Type,Description,Created by user,Date\n";
    const rows = variables
      .map(
        (v) =>
          `"${v.variable}","${v.type}","${v.description}","${v.createdByUser}","${v.date}"`,
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "HDocVariables.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleViewUser = (userName: string) => {
    navigate(`/menu/edb-user-view/${userName}`);
  };

  if (loading) {
    return (
      <div className="hdoc-result-page-wrapper">
        <div className="hdoc-result-container">
          <h1 className="hdoc-result-title">Existing HDoc Variables</h1>
          <div className="hdoc-result-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hdoc-result-page-wrapper">
      <div className="hdoc-result-container">
        <h1 className="hdoc-result-title">Existing HDoc Variables</h1>

        {message && (
          <div
            className={`hdoc-result-message hdoc-result-message-${messageType}`}
          >
            {message}
          </div>
        )}

        <div className="hdoc-result-button-row">
          <button
            type="button"
            className="hdoc-result-btn"
            onClick={handleSelect}
          >
            Select
          </button>
          <button
            type="button"
            className="hdoc-result-btn"
            onClick={handleDown}
          >
            Down
          </button>
          <button
            type="button"
            className="hdoc-result-btn"
            onClick={handleBack}
          >
            Back
          </button>
          <button
            type="button"
            className="hdoc-result-btn"
            onClick={handlePrint}
          >
            Print
          </button>
          <button
            type="button"
            className="hdoc-result-btn"
            onClick={handleExcel}
          >
            Excel
          </button>
        </div>

        <div className="hdoc-result-table-wrapper">
          <table className="hdoc-result-table">
            <thead>
              <tr>
                <th className="hdoc-result-th-check"></th>
                <th className="hdoc-result-th">Variable</th>
                <th className="hdoc-result-th">Type</th>
                <th className="hdoc-result-th">Description</th>
                <th className="hdoc-result-th">Created by user</th>
                <th className="hdoc-result-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {variables.length === 0 ? (
                <tr>
                  <td colSpan={6} className="hdoc-result-no-data">
                    查询条件没有找到相应的数据
                  </td>
                </tr>
              ) : (
                variables.map((v, index) => (
                  <tr
                    key={index}
                    className={
                      selectedIndex === index ? "hdoc-result-row-selected" : ""
                    }
                    onClick={() => handleSelectRow(index)}
                  >
                    <td className="hdoc-result-td-check">
                      <input
                        type="radio"
                        name="selectedRecord"
                        checked={selectedIndex === index}
                        onChange={() => handleSelectRow(index)}
                      />
                    </td>
                    <td className="hdoc-result-td">{v.variable}</td>
                    <td className="hdoc-result-td">{v.type}</td>
                    <td className="hdoc-result-td">{v.description}</td>
                    <td className="hdoc-result-td">
                      <span
                        className="hdoc-result-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewUser(v.createdByUser);
                        }}
                        title="查看用户信息"
                      >
                        {v.createdByUser}
                      </span>
                    </td>
                    <td className="hdoc-result-td">{v.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="hdoc-result-count">Number of lines found: {count}</div>
      </div>
    </div>
  );
};

export default ExistingHDocVariablesResult;
