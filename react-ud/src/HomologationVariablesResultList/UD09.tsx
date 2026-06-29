import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { homologationVariablesApi } from "../services/api";
import "./UD09.css";

// ===== 类型定义 =====

/** 认证参数记录 */
interface HomoVarRecord {
  productClass: string;
  number: number;
  market: string;
  variable: string;
  value: string;
  variantString: string;
  comments: string;
  addDate: string;
  deleteDate: string | null;
  createdByUser: string;
  date: string;
}

const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

// ===== 辅助函数 =====

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

const UD09 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 UD08 传来的检索条件
  const searchParams = location.state as Record<string, string> | null;

  // ===== 状态管理 =====
  const [dataSource, setDataSource] = useState<HomoVarRecord[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
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

    if (!searchParams) {
      setErrorMessage("检索条件缺失，无法加载数据");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const result = await homologationVariablesApi.searchList(searchParams);
        // 后端返回格式: { code: 200, msg: "Success", data: { records: [{pc, num, market, ...}], count: 98 } }
        if (result && result.code === 200 && result.data) {
          const records = result.data.records || result.data;
          if (Array.isArray(records)) {
            // 将后端字段名映射为前端字段名
            const mapped = records.map((r: any) => ({
              productClass: r.pc || r.productClass || "",
              number: r.num || r.number || 0,
              market: r.market || "",
              variable: r.variable || "",
              value: r.val || r.value || "",
              variantString: r.vs || r.variantString || "",
              comments: r.comments || "",
              addDate: r.addDate || r.add_date || "",
              deleteDate: r.deleteDate || r.delete_date || "",
              createdByUser: r.registerUser || r.createdByUser || "",
              date: r.registerDatetime || r.date || "",
            }));
            setDataSource(mapped);
          } else {
            setDataSource([]);
          }
        } else {
          setDataSource([]);
        }
      } catch {
        setErrorMessage("无法加载检索结果，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate, searchParams]);

  // ===== 业务逻辑 =====

  /** 单选 - 选择一条记录 */
  const handleRadioChange = useCallback(
    (key: string) => {
      setSelectedKeys([key]);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  /** 生成行唯一键 */
  const getRowKey = (record: HomoVarRecord, index: number): string =>
    `${record.productClass}-${record.number}-${record.market}-${index}`;

  /** Select - 返回上一页并回填选中项 */
  const handleSelect = useCallback(() => {
    if (selectedKeys.length === 0) {
      setErrorMessage("请至少选择一条记录");
      return;
    }
    const selectedRecords = selectedKeys.map(
      (key) => dataSource[parseInt(key, 10)],
    );
    navigate("/UD08", { state: { selectedRecords } });
  }, [selectedKeys, dataSource, navigate]);

  /** Back - 返回上一页 */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /** Print - 打印当前列表 */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /** Delete selected - 批量删除 */
  const handleDeleteSelected = useCallback(async () => {
    if (selectedKeys.length === 0) {
      setErrorMessage("请至少选择一条记录");
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedKeys.length} 条记录吗？`)) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const recordsToDelete = selectedKeys.map(
        (key) => dataSource[parseInt(key, 10)],
      );
      const deleteParams = recordsToDelete.map((r) => ({
        pc: r.productClass,
        num: String(r.number),
        market: r.market,
      }));

      const result = await homologationVariablesApi.deleteSelected({
        selectedRecords: deleteParams,
      });

      if (result && result.code === 200) {
        alert(`删除成功，共删除 ${selectedKeys.length} 条记录`);
        // 刷新列表：从 dataSource 中移除已删除项
        const keySet = new Set(selectedKeys);
        setDataSource((prev) =>
          prev.filter((_, idx) => !keySet.has(idx.toString())),
        );
        setSelectedKeys([]);
      } else {
        setErrorMessage(result?.msg || "删除失败，请稍后重试");
      }
    } catch {
      setErrorMessage("删除失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedKeys, dataSource]);

  /** 点击 Created by user 链接 */
  const handleUserLinkClick = useCallback(
    (userId: string) => {
      navigate(`/UD25?userid=${encodeURIComponent(userId)}`);
    },
    [navigate],
  );

  /** 排序处理（简单切换排序方向） */
  const [sortField, setSortField] = useState<string>("productClass");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = useCallback(
    (field: string) => {
      if (sortField === field) {
        setSortAsc((prev) => !prev);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
    },
    [sortField],
  );

  /** 排序后的数据 */
  const sortedData = [...dataSource].sort((a, b) => {
    const aVal = String((a as any)[sortField] || "");
    const bVal = String((b as any)[sortField] || "");
    return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });

  /** 排序箭头 */
  const sortArrow = (field: string) => {
    if (sortField !== field) return "";
    return sortAsc ? " ▲" : " ▼";
  };

  // ===== 加载状态 =====

  if (isLoading) {
    return (
      <div className="ud09-container">
        <div className="ud09-loading">Loading...</div>
      </div>
    );
  }

  // ===== 渲染 =====

  return (
    <div className="ud09-container">
      <header className="ud09-header">
        <div className="ud09-header-logo">VOLVO</div>
      </header>
      <main className="ud09-main">
        <div className="ud09-card">
          {/* 页面标题 */}
          <h1 className="ud09-page-title">Homologation Variables</h1>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="ud09-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="ud09-button-row">
            <button
              className="ud09-btn"
              onClick={handleSelect}
              disabled={isDeleting}
            >
              Select
            </button>
            <button className="ud09-btn" onClick={handleBack}>
              Back
            </button>
            <button className="ud09-btn" onClick={handlePrint}>
              Print
            </button>
            <button
              className="ud09-btn ud09-btn-danger"
              onClick={handleDeleteSelected}
              disabled={isDeleting || selectedKeys.length === 0}
            >
              {isDeleting ? "Deleting..." : "Delete Selected"}
            </button>
          </div>

          {/* 数据表格 */}
          <div className="ud09-table-wrapper">
            <table className="ud09-table">
              <thead>
                <tr>
                  <th className="ud09-th-checkbox"></th>
                  <th>*Product class</th>
                  <th>*Number</th>
                  <th>*Market</th>
                  <th>Variable</th>
                  <th>Value</th>
                  <th>Variant string.</th>
                  <th>Comments</th>
                  <th>Add (YYYYWW)</th>
                  <th>Delete (YYYYWW)</th>
                  <th>Created by user (Automatic)</th>
                  <th>Date (Automatic)</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="ud09-td-empty">
                      未找到符合条件的记录
                    </td>
                  </tr>
                ) : (
                  sortedData.map((record, index) => {
                    const rowKey = getRowKey(record, index);
                    return (
                      <tr
                        key={rowKey}
                        className={`ud09-tr ${
                          selectedKeys.includes(index.toString())
                            ? "ud09-tr-selected"
                            : ""
                        }`}
                      >
                        <td className="ud09-td-checkbox">
                          <input
                            type="radio"
                            name="ud09-select-row"
                            checked={selectedKeys.includes(index.toString())}
                            onChange={() => handleRadioChange(index.toString())}
                          />
                        </td>
                        <td>{record.productClass}</td>
                        <td>{record.number}</td>
                        <td>{record.market}</td>
                        <td>{record.variable}</td>
                        <td>{record.value}</td>
                        <td>{record.variantString}</td>
                        <td>{record.comments}</td>
                        <td>{record.addDate}</td>
                        <td>{record.deleteDate || "-"}</td>
                        <td>
                          <span
                            className="ud09-user-link"
                            onClick={() =>
                              handleUserLinkClick(record.createdByUser)
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleUserLinkClick(record.createdByUser);
                              }
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

          {/* 记录计数 */}
          <div className="ud09-count">
            Number of lines found: {dataSource.length}
          </div>

          {/* 用户信息 */}
          {user && (
            <div className="ud09-user-info">
              <span>Logged in as: {user.name}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD09;
