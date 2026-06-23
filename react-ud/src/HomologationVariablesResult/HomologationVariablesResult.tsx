import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./HomologationVariablesResult.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// API响应接口
interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

// 搜索结果记录接口
interface Record {
  pc: string;
  num: string;
  market: string;
  variable: string;
  val: string;
  vs: string;
  vs2: string;
  comments: string;
  add_date: string;
  delete_date: string;
  register_user: string;
  register_datetime: string;
}

interface SearchResult {
  records: Record[];
  count: number;
}

const HomologationVariablesResult: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 检索结果
  const [records, setRecords] = useState<Record[]>([]);
  const [count, setCount] = useState(0);

  // 选中记录（单选）
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 消息状态
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // 加载状态
  const [loading, setLoading] = useState(true);

  // 保存前页面的查询条件
  const searchParams = location.state as { [key: string]: string } | null;

  // 显示消息
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  // 初始化：获取检索结果
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params: { [key: string]: string } = {};
        if (searchParams) {
          Object.entries(searchParams).forEach(([key, value]) => {
            if (value && typeof value === "string" && value.trim() !== "") {
              // 将前端参数名映射为后端 Controller 期望的参数名
              if (key === "vs") params["string1"] = value as string;
              else if (key === "vs2") params["string2"] = value as string;
              else params[key] = value as string;
            }
          });
        }

        const res = await apiClient.get<ApiResponse<SearchResult>>(
          "/api/ud09/search",
          { params },
        );

        if (res.data.code === 200 && res.data.data) {
          setRecords(res.data.data.records || []);
          setCount(res.data.data.count || 0);
        } else {
          showMessage(
            res.data.message || res.data.msg || "获取数据失败",
            "error",
          );
        }
      } catch (error: any) {
        showMessage(
          error?.response?.data?.message ||
            error?.response?.data?.msg ||
            "系统超时，请稍后再试",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 清除消息
  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  // 单选记录
  const handleSelectRow = (index: number) => {
    setSelectedIndex(selectedIndex === index ? null : index);
  };

  // Select - 选择记录返回上级页面
  const handleSelect = () => {
    clearMessage();
    if (selectedIndex === null) {
      showMessage("没有选择记录", "error");
      return;
    }

    // 获取选中的记录
    const selectedRecord = records[selectedIndex];

    // 将选中记录保存到 sessionStorage（确保返回时能回填）
    const selectData = {
      pc: selectedRecord.pc,
      number: selectedRecord.num,
      market: selectedRecord.market,
      variable: selectedRecord.variable,
      val: selectedRecord.val,
      vs: selectedRecord.vs,
      vs2: selectedRecord.vs2,
      comments: selectedRecord.comments,
      addDate: selectedRecord.add_date,
      deleteDate: selectedRecord.delete_date,
      updateUser: selectedRecord.register_user,
      updateDatetime: selectedRecord.register_datetime,
    };
    sessionStorage.setItem("hvars_search_params", JSON.stringify(selectData));

    // 返回上级画面并回填数据
    navigate("/menu/homologation-variables", {
      state: selectData,
    });
  };

  // Back - 返回上级页面并恢复查询条件
  const handleBack = () => {
    // 将检索条件保存到 sessionStorage，确保上级页面能恢复
    if (searchParams) {
      sessionStorage.setItem(
        "hvars_search_params",
        JSON.stringify(searchParams),
      );
    }
    navigate("/menu/homologation-variables", {
      state: searchParams || {},
    });
  };

  // Print - 打印当前结果
  const handlePrint = () => {
    window.print();
  };

  // Delete Selected - 删除选中记录
  const handleDeleteSelected = async () => {
    clearMessage();
    if (selectedIndex === null) {
      showMessage("没有选择要删除的记录", "error");
      return;
    }

    if (!window.confirm("确定要删除选中的记录吗？")) {
      showMessage("删除操作已取消", "error");
      return;
    }

    try {
      // 删除选中的记录
      const record = records[selectedIndex];
      await apiClient.post<ApiResponse>("/api/ud09/deleteselected", {
        selectedRecords: [
          {
            pc: record.pc,
            number: record.num,
            market: record.market,
          },
        ],
      });

      showMessage("选择的记录已成功删除", "success");

      // 刷新数据
      const params: { [key: string]: string } = {};
      if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value && typeof value === "string" && value.trim() !== "") {
            if (key === "vs") params["string1"] = value as string;
            else if (key === "vs2") params["string2"] = value as string;
            else params[key] = value as string;
          }
        });
      }
      const res = await apiClient.get<ApiResponse<SearchResult>>(
        "/api/ud09/search",
        { params },
      );
      if (res.data.code === 200 && res.data.data) {
        setRecords(res.data.data.records || []);
        setCount(res.data.data.count || 0);
      }
      setSelectedIndex(null);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        "操作失败";
      showMessage(errMsg, "error");
    }
  };

  // 查看用户信息
  // 查看用户信息
  const handleViewUser = (userName: string) => {
    navigate(`/menu/edb-user-view/${userName}`);
  };

  if (loading) {
    return (
      <div className="hvars-result-page-wrapper">
        <div className="hvars-result-container">
          <h1 className="hvars-result-title">Homologation Variables</h1>
          <div className="hvars-result-loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hvars-result-page-wrapper">
      <div className="hvars-result-container">
        <h1 className="hvars-result-title">Homologation Variables</h1>

        {/* 消息区域 */}
        {message && (
          <div
            className={`hvars-result-message hvars-result-message-${messageType}`}
            role="alert"
          >
            {message}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="hvars-result-button-row">
          <button
            type="button"
            className="hvars-result-btn hvars-result-btn-select"
            onClick={handleSelect}
          >
            Select
          </button>
          <button
            type="button"
            className="hvars-result-btn hvars-result-btn-back"
            onClick={handleBack}
          >
            Back
          </button>
          <button
            type="button"
            className="hvars-result-btn hvars-result-btn-print"
            onClick={handlePrint}
          >
            Print
          </button>
          <button
            type="button"
            className="hvars-result-btn hvars-result-btn-delete"
            onClick={handleDeleteSelected}
          >
            Delete selected
          </button>
        </div>

        {/* 数据表格 */}
        <div className="hvars-result-table-wrapper">
          <table className="hvars-result-table">
            <thead>
              <tr>
                <th className="hvars-result-th-check"></th>
                <th className="hvars-result-th">
                  <span className="hvars-result-required">*</span>Product class
                </th>
                <th className="hvars-result-th">
                  <span className="hvars-result-required">*</span>Number
                </th>
                <th className="hvars-result-th">
                  <span className="hvars-result-required">*</span>Market
                </th>
                <th className="hvars-result-th">Variable</th>
                <th className="hvars-result-th">Value</th>
                <th className="hvars-result-th">Variant string</th>
                <th className="hvars-result-th">Comments</th>
                <th className="hvars-result-th">Add</th>
                <th className="hvars-result-th">Delete</th>
                <th className="hvars-result-th">Created by user</th>
                <th className="hvars-result-th">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={12} className="hvars-result-no-data">
                    查询条件没有找到相应的数据
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr
                    key={index}
                    className={
                      selectedIndex === index ? "hvars-result-row-selected" : ""
                    }
                    onClick={() => handleSelectRow(index)}
                  >
                    <td className="hvars-result-td-check">
                      <input
                        type="radio"
                        name="selectedRecord"
                        checked={selectedIndex === index}
                        onChange={() => handleSelectRow(index)}
                      />
                    </td>
                    <td className="hvars-result-td">{record.pc}</td>
                    <td className="hvars-result-td">{record.num}</td>
                    <td className="hvars-result-td">{record.market}</td>
                    <td className="hvars-result-td">{record.variable}</td>
                    <td className="hvars-result-td">{record.val}</td>
                    <td className="hvars-result-td">
                      {record.vs}
                      {record.vs2 ? `, ${record.vs2}` : ""}
                    </td>
                    <td className="hvars-result-td">{record.comments}</td>
                    <td className="hvars-result-td">{record.add_date}</td>
                    <td className="hvars-result-td">{record.delete_date}</td>
                    <td className="hvars-result-td">
                      <span
                        className="hvars-result-link"
                        onClick={() => handleViewUser(record.register_user)}
                        title="查看用户信息"
                      >
                        {record.register_user}
                      </span>
                    </td>
                    <td className="hvars-result-td">
                      {record.register_datetime}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 检索结果件数 */}
        <div className="hvars-result-count">Number of lines found: {count}</div>
      </div>
    </div>
  );
};

export default HomologationVariablesResult;
