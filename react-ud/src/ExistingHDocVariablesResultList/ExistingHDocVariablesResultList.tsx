import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../common/css/common.css";
import "./ExistingHDocVariablesResultList.css";

/**
 * 查询结果记录的数据结构
 * @property variable - 变量名
 * @property type - 类型
 * @property description - 描述
 * @property registerUser - 创建用户
 * @property registerDatetime - 创建日期
 */
interface VariableRecord {
  variable: string;
  type: string;
  description: string;
  registerUser: string;
  registerDatetime: string;
}

/**
 * 后端返回的原始 Map 字段名（MyBatis 返回大写）
 */
interface RawRecord {
  VARIABLE: string;
  TYPE: string;
  DESCRIPTION: string;
  REGISTER_USER: string;
  REGISTER_DATETIME: string;
}

/**
 * 将后端返回的原始记录（大写字段）映射为驼峰命名
 */
const toCamelCase = (raw: RawRecord): VariableRecord => ({
  variable: raw.VARIABLE ?? "",
  type: raw.TYPE ?? "",
  description: raw.DESCRIPTION ?? "",
  registerUser: raw.REGISTER_USER ?? "",
  registerDatetime: raw.REGISTER_DATETIME ? String(raw.REGISTER_DATETIME) : "",
});

/**
 * Existing HDoc Variables Result List 页面组件
 * 展示查询结果，支持记录选择、返回、打印和 Excel 导出。
 *
 * 业务规则：
 * - 从 ExistingHDocVariables 页面通过 location.state 接收查询条件
 * - 组件挂载时自动调用 UD10 search API 获取查询结果
 * - 数据按 Variable 排序（由后端处理）
 * - Created by user 列显示为可点击链接，点击跳转到 EDB User View
 * - 支持单选记录进行 Down 操作（跳转到 Homologation Variables 页面）
 *
 * @returns {React.FC} ExistingHDocVariablesResultList 组件
 */
const ExistingHDocVariablesResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const searchState = location.state as {
    conditions?: Record<string, string>;
  } | null;
  const searchConditions = searchState?.conditions ?? null;

  const [results, setResults] = useState<VariableRecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 组件挂载时，根据从 ExistingHDocVariables 页面传递过来的查询条件，
   * 调用 UD10 search API 获取查询结果。
   */
  useEffect(() => {
    const fetchResults = async () => {
      if (!searchConditions) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMessage("");
      try {
        const res = await api.post<{ list: RawRecord[] }>("/variables/search", {
          variable: searchConditions.variable ?? "",
          variableOp: searchConditions.variableOp ?? "=",
          type: searchConditions.type ?? "",
          typeOp: searchConditions.typeOp ?? "=",
          description: searchConditions.description ?? "",
          descriptionOp: searchConditions.descriptionOp ?? "=",
          registerUser: searchConditions.createdByUser ?? "",
          registerUserOp: searchConditions.createdByUserOp ?? "=",
          registerDatetime: searchConditions.date ?? "",
          registerDatetimeOp: searchConditions.dateOp ?? "=",
        });
        if (res.code === 200 && res.data) {
          const mapped = (res.data.list || []).map(toCamelCase);
          setResults(mapped);
        } else {
          setErrorMessage(res.message || "Failed to fetch results.");
        }
      } catch {
        setErrorMessage("System error. Please contact administrator.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [searchConditions]);

  const toggleSelect = (idx: number) => {
    setSelectedIdx((prev) => (prev === idx ? -1 : idx));
  };

  const handleSelect = () => {
    if (selectedIdx < 0) {
      setErrorMessage("Please select a record first.");
      return;
    }
    // Return selected records to previous page
    const selectedRecords = [results[selectedIdx]];
    navigate("/menu/existing-hdoc-vars", { state: { selectedRecords } });
  };

  const handleBack = () => {
    // 将查询条件带回前页面
    navigate("/menu/existing-hdoc-vars", {
      state: { conditions: searchConditions },
    });
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = "ExistingHDocVariablesResultList";
    window.print();
    document.title = prevTitle;
  };

  /**
   * Down 操作：跳转到 Homologation Variables 页面并携带选中记录的 Variable
   */
  const handleDown = () => {
    window.alert("暂定不实装");
  };

  /**
   * CSV 导出（纯前端）：将查询结果导出为 CSV 文件
   */
  const handleExcel = () => {
    setErrorMessage("");
    const now = new Date();
    const today = now
      .toISOString()
      .slice(0, 19)
      .replace(/[-:]/g, "")
      .replace("T", "");
    const fileName = `ExistingHDocVariablesResultList_${today}.csv`;

    const headers = [
      "Variable",
      "Type",
      "Description",
      "Created by user",
      "Date",
    ];
    const csvRows = results.map((r) =>
      [r.variable, r.type, r.description, r.registerUser, r.registerDatetime]
        .map((cell) => `"${(cell || "").replace(/"/g, '""')}"`)
        .join(","),
    );
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    const bom = "\uFEFF";
    const blob = new Blob([bom + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleUserViewClick = (userid: string) => {
    navigate("/menu/edb-user-view", { state: { userid } });
  };

  return (
    <div className="ehvr-container panel panel-w1100 print-container">
      {/* 顶部标题栏 */}
      <div className="ehvr-header panel-header">
        <h1>Existing HDoc Variables</h1>
      </div>

      {errorMessage && <div className="ehvr-error msg-error">{errorMessage}</div>}

      {/* ─── 按钮 Table ─── */}
      <table className="ehvr-btn-table no-print">
        <tbody>
          <tr>
            <td className="ehvr-btn-cell">
              <button className="btn btn-primary" onClick={handleSelect}>
                Select
              </button>
              <button className="btn btn-secondary" onClick={handleDown}>
                Down
              </button>
              <button className="btn btn-secondary" onClick={handleBack}>
                Back
              </button>
              <button className="btn btn-secondary" onClick={handlePrint}>
                Print
              </button>
              <button className="btn btn-secondary" onClick={handleExcel}>
                Excel
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {isLoading ? (
        <div className="ehvr-empty">
          <p>Loading...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="ehvr-table-wrapper print-wrapper">
          <table className="ehvr-table print-table">
            <thead>
              <tr>
                <th className="th-check ehvr-th-noborder no-print"></th>
                <th className="ehvr-th-underline ehvr-th-noborder">Variable</th>
                <th className="ehvr-th-underline ehvr-th-noborder">Type</th>
                <th className="ehvr-th-underline ehvr-th-noborder">
                  Description
                </th>
                <th className="ehvr-th-underline ehvr-th-noborder">
                  Created by user
                </th>
                <th className="ehvr-th-underline ehvr-th-noborder">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx} className={selectedIdx === idx ? "selected" : ""}>
                  <td className="td-check no-print">
                    <input
                      type="radio"
                      name="selectedRow"
                      checked={selectedIdx === idx}
                      onChange={() => toggleSelect(idx)}
                    />
                  </td>
                  <td>{row.variable}</td>
                  <td>{row.type}</td>
                  <td>{row.description}</td>
                  <td>
                    <span
                      className="link-user"
                      onClick={() => handleUserViewClick(row.registerUser)}
                    >
                      {row.registerUser}
                    </span>
                  </td>
                  <td>
                    {row.registerDatetime
                      ? row.registerDatetime.substring(0, 10)
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ehvr-empty">
          <p>
            No results found. Please go back and try different search criteria.
          </p>
        </div>
      )}

      <div className="ehvr-count no-print">Number of lines found: {results.length}</div>
    </div>
  );
};

export default ExistingHDocVariablesResultList;
