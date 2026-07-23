import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ExistingHDocVariablesResultList.css";

interface VariableRecord {
  variable: string;
  type: string;
  description: string;
  registerUser: string;
  registerDatetime: string;
}

const ExistingHDocVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");
  const [dataList, setDataList] = useState<VariableRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);

    const state = location.state as any;
    if (!state) {
      setErrorMessage("No search criteria provided.");
      setIsLoading(false);
      return;
    }

    fetchSearchResults(state);
  }, [navigate, location.state]);

  const fetchSearchResults = async (criteria: any) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/hdoc/existing-variables/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        const mapped = result.data.map((item: any) => ({
          variable: item.variable || "",
          type: item.type || "",
          description: item.description || "",
          registerUser: item.registerUser || "",
          registerDatetime: item.registerDatetime || "",
        }));
        setDataList(mapped);
      } else {
        setDataList([]);
        setErrorMessage("No records found matching your criteria.");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleRowClick = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  const handleSelect = () => {
    if (selectedIndex === null) {
      setErrorMessage("Please select a record first.");
      return;
    }
    const row = dataList[selectedIndex];
    navigate("/existing-hdoc-variables", {
      state: {
        variable: row.variable,
        type: row.type,
        description: row.description,
        createdByUser: row.registerUser,
        date: row.registerDatetime,
      },
    });
  };

  const handleDown = () => {
    if (selectedIndex === null) {
      setErrorMessage("No key defined for table.");
      return;
    }
    const row = dataList[selectedIndex];
    navigate("/homologation-variables", {
      state: {
        variable: row.variable,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    const params = new URLSearchParams();
    const row = selectedIndex !== null ? dataList[selectedIndex] : null;
    if (row) {
      if (row.variable) params.append("variable", row.variable);
      if (row.type) params.append("type", row.type);
    }
    window.open(`/api/hdoc/existing-variables/export?${params.toString()}`, "_blank");
  };

  const handleUserClick = (userName: string) => {
    navigate("/edb-user-view", { state: { userId: userName } });
  };

  return (
    <div className="ehrl-page">
      {/* 顶部导航栏 */}
      <header className="ehrl-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="ehrl-body">
        <div className="ehrl-content">
          <h1 className="ehrl-title">Existing HDoc Variables Result List</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="ehrl-error">{errorMessage}</div>}

          {/* 加载中 */}
          {isLoading && <div className="ehrl-loading">Loading...</div>}

          {/* 结果 */}
          {!isLoading && (
            <>
              {/* Count */}
              <div className="ehrl-count">Number of lines found: {dataList.length}</div>

              {/* 表格 */}
              <div className="ehrl-table-wrapper">
                <table className="ehrl-table">
                  <thead>
                    <tr>
                      <th className="ehrl-th-sel"></th>
                      <th className="ehrl-th-var">Variable</th>
                      <th className="ehrl-th-type">Type</th>
                      <th className="ehrl-th-desc">Description</th>
                      <th className="ehrl-th-user">Created by user</th>
                      <th className="ehrl-th-dt">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.length === 0 ? (
                      <tr>
                        <td className="ehrl-no-data" colSpan={6}>No records found matching your criteria.</td>
                      </tr>
                    ) : (
                      dataList.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`ehrl-row ${selectedIndex === idx ? "ehrl-row-selected" : ""}`}
                          onClick={() => handleRowClick(idx)}
                        >
                          <td className="ehrl-td-sel">
                            <input
                              type="radio"
                              name="ehrl-select"
                              className="ehrl-radio"
                              checked={selectedIndex === idx}
                              onChange={() => handleRowClick(idx)}
                            />
                          </td>
                          <td className="ehrl-td">{row.variable}</td>
                          <td className="ehrl-td">{row.type}</td>
                          <td className="ehrl-td">{row.description}</td>
                          <td className="ehrl-td">
                            <span
                              className="ehrl-user-link"
                              onClick={(e) => { e.stopPropagation(); handleUserClick(row.registerUser); }}
                            >
                              {row.registerUser}
                            </span>
                          </td>
                          <td className="ehrl-td">{row.registerDatetime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 按钮行 */}
              <div className="ehrl-buttons">
                <button className="ehrl-btn" onClick={handleSelect}>Select</button>
                <button className="ehrl-btn" onClick={handleDown}>Down</button>
                <button className="ehrl-btn" onClick={handleBack}>Back</button>
                <button className="ehrl-btn" onClick={handlePrint}>Print</button>
                <button className="ehrl-btn" onClick={handleExcel}>Excel</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExistingHDocVariablesResultList;
