import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { hdocVariablesApi } from "../services/api";
import "./UD11.css";

// ===== 类型定义 =====

interface HdocVariableRecord {
  variable: string;
  type: string;
  description: string;
  createdByUser: string;
  date: string;
}

const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

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

const UD11 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 UD10 传来的检索条件
  const searchParams = location.state as {
    variable?: string;
    type?: string;
    description?: string;
  } | null;

  const [dataSource, setDataSource] = useState<HdocVariableRecord[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ===== 初始化 =====
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }

    const fetchData = async () => {
      try {
        const params: any = {};
        if (searchParams?.variable) params.variable = searchParams.variable;
        if (searchParams?.type) params.type = searchParams.type;
        if (searchParams?.description)
          params.description = searchParams.description;

        const result = await hdocVariablesApi.searchVariables(params);

        // 后端返回格式: { code: 200, data: { variables: [...], count: 98 } }
        if (result && result.code === 200 && result.data) {
          const rawList = result.data.variables || [];
          // 字段名映射
          const mapped = rawList.map((r: any) => ({
            variable: r.variable || r.Variable || "",
            type: r.type || r.Type || "",
            description: r.description || r.Description || "",
            createdByUser:
              r.createdByUser || r.Created_by_user || r.registerUser || "",
            date: r.date || r.Date || r.registerDatetime || "",
          }));
          setDataSource(mapped);
          setTotalCount(result.data.count ?? mapped.length);
        } else {
          setDataSource([]);
          setTotalCount(0);
        }
      } catch {
        setErrorMessage("无法加载检索结果，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, searchParams]);

  // ===== 操作 =====

  /** 单选 */
  const handleRadioChange = useCallback(
    (key: string) => {
      setSelectedKeys([key]);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  /** Select - 返回上一页并回填选中项 */
  const handleSelect = useCallback(() => {
    if (selectedKeys.length === 0) {
      setErrorMessage("请至少选择一条记录");
      return;
    }
    const selectedRecords = selectedKeys.map(
      (key) => dataSource[parseInt(key, 10)],
    );
    navigate("/UD10", { state: { selectedRecords } });
  }, [selectedKeys, dataSource, navigate]);

  /** Down - 跳转至认证参数页面 */
  const handleDown = useCallback(() => {
    if (selectedKeys.length === 0) {
      setErrorMessage("请至少选择一条记录");
      return;
    }
    const record = dataSource[parseInt(selectedKeys[0], 10)];
    navigate(
      `/UD10?variable=${encodeURIComponent(record.variable)}&type=${encodeURIComponent(record.type)}`,
    );
  }, [selectedKeys, dataSource, navigate]);

  /** Back */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /** Print */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /** Excel */
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (searchParams?.variable)
      params.append("variable", searchParams.variable);
    if (searchParams?.type) params.append("type", searchParams.type);
    window.open(`/api/HDOC_VARIABLES/export?${params.toString()}`, "_blank");
  }, [searchParams]);

  /** 跳转用户详情 */
  const handleUserLinkClick = useCallback(
    (userId: string) => {
      navigate(`/UD25?userid=${encodeURIComponent(userId)}`);
    },
    [navigate],
  );

  // ===== 加载状态 =====
  if (isLoading) {
    return (
      <div className="ud11-container">
        <div className="ud11-loading">Loading...</div>
      </div>
    );
  }

  // ===== 渲染 =====
  return (
    <div className="ud11-container">
      <header className="ud11-header">
        <div className="ud11-header-logo"></div>
      </header>
      <main className="ud11-main">
        <div className="ud11-card">
          <h1 className="ud11-page-title">
            Homologation Variables - Search Results
          </h1>

          {errorMessage && (
            <div className="ud11-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 按钮行 */}
          <div className="ud11-button-row">
            <button className="ud11-btn" onClick={handleSelect}>
              Select
            </button>
            <button className="ud11-btn" onClick={handleDown}>
              Down
            </button>
            <button className="ud11-btn" onClick={handleBack}>
              Back
            </button>
            <button className="ud11-btn" onClick={handlePrint}>
              Print
            </button>
            <button className="ud11-btn" onClick={handleExport}>
              Excel
            </button>
          </div>

          {/* 表格 */}
          <div className="ud11-table-wrapper">
            <table className="ud11-table">
              <thead>
                <tr>
                  <th className="ud11-th-radio"></th>
                  <th>Variable</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Created by user</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dataSource.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="ud11-td-empty">
                      未找到符合条件的记录
                    </td>
                  </tr>
                ) : (
                  dataSource.map((record, index) => {
                    const idxStr = index.toString();
                    return (
                      <tr
                        key={idxStr}
                        className={`ud11-tr ${selectedKeys.includes(idxStr) ? "ud11-tr-selected" : ""}`}
                      >
                        <td className="ud11-td-radio">
                          <input
                            type="radio"
                            name="ud11-select"
                            checked={selectedKeys.includes(idxStr)}
                            onChange={() => handleRadioChange(idxStr)}
                          />
                        </td>
                        <td>{record.variable}</td>
                        <td>{record.type}</td>
                        <td>{record.description}</td>
                        <td>
                          <span
                            className="ud11-user-link"
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              handleUserLinkClick(record.createdByUser)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                handleUserLinkClick(record.createdByUser);
                            }}
                          >
                            {record.createdByUser}
                          </span>
                        </td>
                        <td>{record.date}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 计数 */}
          <div className="ud11-count">Number of lines found: {totalCount}</div>
        </div>
      </main>
    </div>
  );
});

export default UD11;
