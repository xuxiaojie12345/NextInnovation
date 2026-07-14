import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HomologationVariablesResultList.css";

interface SearchResultItem {
  pc: string;
  num: number;
  market: string;
  variable: string;
  val: string;
  vs: string;
  vs2: string;
  comments: string;
  addDate: string;
  deleteDate: string;
  registerUser: string;
  registerDatetime: string;
}

const HomologationVariablesResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 从state中获取前画面传递的搜索条件
  const searchCriteria = location.state?.searchCriteria || {};

  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面初始化：调用API获取搜索结果
  useEffect(() => {
    fetchSearchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 调用UD08Search API获取搜索结果
  const fetchSearchResults = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const response = await fetch(
        `${API_BASE_URL}/api/ud09DeleteHdocuserdefinedrules/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(searchCriteria),
        },
      );

      if (!response.ok) {
        throw new Error("System error. Please contact administrator.");
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setSearchResults(result.data);
        setCount(result.data.length);
      } else {
        setSearchResults([]);
        setCount(0);
      }
    } catch (error: any) {
      setErrorMessage(
        error.message || "System error. Please contact administrator.",
      );
      setSearchResults([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理单选选择
  const handleRadioChange = (index: number) => {
    setSelectedRows([index]);
  };

  // 点击Select按钮：返回前画面并填充选中记录
  const handleSelect = () => {
    if (selectedRows.length === 0) {
      setErrorMessage("Please select a record.");
      return;
    }

    if (selectedRows.length > 1) {
      setErrorMessage("Please select only one record.");
      return;
    }

    const selectedIndex = selectedRows[0];
    const selectedRecord = searchResults[selectedIndex];

    // 将选中记录的数据保存到state，返回到HomologationVariables页面
    navigate("/homologation-variables", {
      state: {
        selectedRecord: {
          productClass: selectedRecord.pc,
          number: selectedRecord.num,
          market: selectedRecord.market,
          variable: selectedRecord.variable,
          value: selectedRecord.val,
          variantString1: selectedRecord.vs,
          variantString2: selectedRecord.vs2,
          comments: selectedRecord.comments,
          addDate: selectedRecord.addDate,
          deleteDate: selectedRecord.deleteDate,
          createdByUser: selectedRecord.registerUser,
          date: selectedRecord.registerDatetime,
        },
        isFromSelection: true,
      },
    });
  };

  // 点击Back按钮：返回前画面并保留搜索条件
  const handleBack = () => {
    navigate("/homologation-variables", {
      state: {
        searchCriteria: searchCriteria,
        isFromBack: true,
      },
    });
  };

  // 点击Print按钮：打印当前页面
  const handlePrint = () => {
    window.print();
  };

  // 点击Delete Selected按钮：批量删除选中的记录
  const handleDeleteSelected = async () => {
    if (selectedRows.length === 0) {
      setErrorMessage("Please select at least one record to delete.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // 构建删除请求参数
      const deleteParams = selectedRows.map((index) => {
        const record = searchResults[index];
        return {
          productClass: record.pc,
          number: record.num,
          market: record.market,
        };
      });

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const response = await fetch(
        `${API_BASE_URL}/api/ud09DeleteHdocuserdefinedrules/deleteSelected`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deleteParams),
        },
      );

      if (!response.ok) {
        throw new Error("System error. Please contact administrator.");
      }

      const result = await response.json();

      if (result.code === 200) {
        const deletedCount = result.data?.deletedCount || 0;
        const failedCount = result.data?.failedCount || 0;

        // 重新加载列表数据（会清除消息，所以先保存再恢复）
        await fetchSearchResults();
        setSelectedRows([]);

        if (failedCount === 0) {
          setSuccessMessage(`${deletedCount} records deleted successfully.`);
        } else if (deletedCount > 0) {
          setSuccessMessage(
            `${deletedCount} records deleted, ${failedCount} records failed.`,
          );
        } else {
          setErrorMessage("Failed to delete records. Please try again.");
        }
      } else {
        setErrorMessage(
          result.msg || "Failed to delete records. Please try again.",
        );
      }
    } catch (error: any) {
      setErrorMessage(
        error.message || "System error. Please contact administrator.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 点击Created by user链接：跳转到EDB User View页面，传递userid
  const handleUserClick = (userid: string) => {
    navigate(`/edb-user-view/${encodeURIComponent(userid)}`, {
      state: { userid },
    });
  };

  return (
    <div className="hvrl-container">
      {/* 标题 */}
      <h1 className="hvrl-title">Homologation Variables</h1>

      {/* 错误消息 */}
      {errorMessage && <div className="hvrl-error-message">{errorMessage}</div>}

      {/* 成功消息 */}
      {successMessage && (
        <div className="hvrl-success-message">{successMessage}</div>
      )}

      {/* 边框容器 */}
      <div className="hvrl-border-box">
        {/* 按钮区域 */}
        <div className="hvrl-button-bar">
          <button
            className="hvrl-btn"
            onClick={handleSelect}
            disabled={isLoading}
          >
            Select
          </button>
          <button
            className="hvrl-btn"
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            className="hvrl-btn"
            onClick={handlePrint}
            disabled={isLoading}
          >
            Print
          </button>
          <button
            className="hvrl-btn"
            onClick={handleDeleteSelected}
            disabled={isLoading}
          >
            Delete Selected
          </button>
        </div>

        {/* 数据表格 */}
        <div className="hvrl-table-container">
          {isLoading ? (
            <div className="hvrl-loading">Loading...</div>
          ) : (
            <table className="hvrl-table">
              <thead>
                <tr>
                  <th className="hvrl-checkbox-col"></th>
                  <th className="hvrl-th">*Product class</th>
                  <th className="hvrl-th">*Number</th>
                  <th className="hvrl-th">*Market</th>
                  <th className="hvrl-th">Variable</th>
                  <th className="hvrl-th">Value</th>
                  <th className="hvrl-th">Variant string.</th>
                  <th className="hvrl-th">Comments</th>
                  <th className="hvrl-th">Add (YYYYWW)</th>
                  <th className="hvrl-th">Delete (YYYYWW)</th>
                  <th className="hvrl-th">Created by user (Automatic)</th>
                  <th className="hvrl-th">Date (Automatic)</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="hvrl-no-data">
                      No records found
                    </td>
                  </tr>
                ) : (
                  searchResults.map((item, index) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0 ? "hvrl-row-even" : "hvrl-row-odd"
                      }
                    >
                      <td className="hvrl-checkbox-col">
                        <input
                          type="radio"
                          name="homologation-radio"
                          checked={selectedRows.includes(index)}
                          onChange={() => handleRadioChange(index)}
                        />
                      </td>
                      <td className="hvrl-td">{item.pc}</td>
                      <td className="hvrl-td">{item.num}</td>
                      <td className="hvrl-td">{item.market}</td>
                      <td className="hvrl-td">{item.variable}</td>
                      <td className="hvrl-td">{item.val}</td>
                      <td className="hvrl-td">
                        {item.vs}
                        {item.vs2 ? `-${item.vs2}` : ""}
                      </td>
                      <td className="hvrl-td">{item.comments}</td>
                      <td className="hvrl-td">{item.addDate}</td>
                      <td className="hvrl-td">{item.deleteDate}</td>
                      <td className="hvrl-td hvrl-link">
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleUserClick(item.registerUser);
                          }}
                        >
                          {item.registerUser}
                        </a>
                      </td>
                      <td className="hvrl-td">{item.registerDatetime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 计数显示 */}
        <div className="hvrl-count">Number of lines found: {count}</div>
      </div>
    </div>
  );
};

export default HomologationVariablesResultList;
