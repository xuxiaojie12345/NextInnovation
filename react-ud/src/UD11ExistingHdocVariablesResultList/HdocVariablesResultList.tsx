import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./HdocVariablesResultList.css";

interface SearchResultItem {
  variable: string;
  type: string;
  description: string;
  createdByUser: string;
  date: string;
}

const HdocVariablesResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 从state中获取前画面传递的搜索条件
  const searchCriteria = location.state?.searchCriteria;

  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面初始化：调用API获取搜索结果
  useEffect(() => {
    fetchSearchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 调用API获取搜索结果
  const fetchSearchResults = async () => {
    // 如果没有搜索条件（直接刷新页面进入），跳转回搜索画面
    if (!searchCriteria || Object.keys(searchCriteria).length === 0) {
      setErrorMessage(
        "No search criteria found. Redirecting to search page...",
      );
      setIsLoading(false);
      setTimeout(() => navigate("/hdoc-variables"), 1500);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const response = await fetch(
        `${API_BASE_URL}/api/ud10Hdocvariables/search`,
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
    setSelectedRow(index);
  };

  // 点击Select按钮：返回前画面并填充选中记录
  const handleSelect = () => {
    if (
      selectedRow === null ||
      selectedRow < 0 ||
      selectedRow >= searchResults.length
    ) {
      setErrorMessage("Please select a record.");
      return;
    }

    const selectedRecord = searchResults[selectedRow];

    // 将选中记录的数据保存到state，返回到HdocVariables页面
    navigate("/hdoc-variables", {
      state: {
        selectedRecord: {
          variable: selectedRecord.variable,
          type: selectedRecord.type,
          description: selectedRecord.description,
          createdByUser: selectedRecord.createdByUser,
          date: selectedRecord.date,
        },
        isFromSelection: true,
      },
    });
  };

  // 点击Back按钮：返回前画面并保留搜索条件
  const handleBack = () => {
    navigate("/hdoc-variables", {
      state: {
        searchCriteria: searchCriteria,
        isFromBack: true,
      },
    });
  };

  // 点击Created by user链接：跳转到EDB User View页面，传递userid
  const handleUserClick = (userid: string) => {
    navigate(`/edb-user-view/${encodeURIComponent(userid)}`, {
      state: { userid },
    });
  };

  // 点击Print按钮：打印当前页面
  const handlePrint = () => {
    window.print();
  };

  // 点击Excel按钮：画面显示什么就下载什么
  const handleExcel = () => {
    if (searchResults.length === 0) {
      setErrorMessage("No data to export.");
      return;
    }

    try {
      // 从searchResults构建CSV（当前画面显示的数据）
      const headers = [
        "Variable",
        "Type",
        "Description",
        "Created by user",
        "Date",
      ];
      const csvContent = [
        headers.join(","),
        ...searchResults.map((row) =>
          headers
            .map((h) => {
              let val = "";
              if (h === "Variable") val = row.variable;
              else if (h === "Type") val = row.type;
              else if (h === "Description") val = row.description;
              else if (h === "Created by user") val = row.createdByUser;
              else if (h === "Date") val = row.date;
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

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `HDoc_Variables_${dateStr}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("File downloaded successfully.");
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to export data.");
    }
  };

  return (
    <div className='hvrl-container'>
      {/* 标题 */}
      <h1 className='hvrl-title'>Existing HDoc Variables</h1>

      {/* 错误消息 */}
      {errorMessage && <div className='hvrl-error-message'>{errorMessage}</div>}

      {/* 成功消息 */}
      {successMessage && (
        <div className='hvrl-success-message'>{successMessage}</div>
      )}

      {/* 边框容器 */}
      <div className='hvrl-border-box'>
        {/* 按钮区域 */}
        <div className='hvrl-button-bar'>
          <button
            className='hvrl-btn'
            onClick={handleSelect}
            disabled={isLoading}
          >
            Select
          </button>
          <button
            className='hvrl-btn'
            onClick={handleBack}
            disabled={isLoading}
          >
            Back
          </button>
          <button
            className='hvrl-btn'
            onClick={handlePrint}
            disabled={isLoading}
          >
            Print
          </button>
          <button
            className='hvrl-btn'
            onClick={handleExcel}
            disabled={isLoading}
          >
            Down
          </button>
          <button
            className='hvrl-btn'
            onClick={handleExcel}
            disabled={isLoading}
          >
            Excel
          </button>
        </div>

        {/* 数据表格 */}
        <div className='hvrl-table-container'>
          {isLoading ? (
            <div className='hvrl-loading'>Loading...</div>
          ) : (
            <table className='hvrl-table'>
              <thead>
                <tr>
                  <th className='hvrl-checkbox-col'></th>
                  <th className='hvrl-th'>*Variable</th>
                  <th className='hvrl-th'>Type</th>
                  <th className='hvrl-th'>Description</th>
                  <th className='hvrl-th'>
                    Created by user
                    <br />
                    (Automatic)
                  </th>
                  <th className='hvrl-th'>
                    Date
                    <br />
                    (Automatic)
                  </th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='hvrl-no-data'>
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
                      <td className='hvrl-checkbox-col'>
                        <input
                          type='radio'
                          name='hdoc-variable-radio'
                          checked={selectedRow === index}
                          onChange={() => handleRadioChange(index)}
                        />
                      </td>
                      <td className='hvrl-td'>{item.variable}</td>
                      <td className='hvrl-td'>{item.type}</td>
                      <td className='hvrl-td'>{item.description}</td>
                      <td className='hvrl-td hvrl-link'>
                        <span
                          onClick={() => handleUserClick(item.createdByUser)}
                          style={{
                            cursor: "pointer",
                            color: "#0000ff",
                            textDecoration: "underline",
                          }}
                        >
                          {item.createdByUser}
                        </span>
                      </td>
                      <td className='hvrl-td'>{item.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 计数显示 */}
        <div className='hvrl-count'>Number of lines found: {count}</div>
      </div>
    </div>
  );
};

export default HdocVariablesResultList;
