import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HomologationVariablesResultList.css";

interface RuleRecord {
  id?: number;
  pc: string;
  num: string;
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
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState<string>("");
  const [dataList, setDataList] = useState<RuleRecord[]>([]);
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
      const response = await fetch("/api/homologation/variables/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        const mapped = result.data.map((item: any) => ({
          id: item.id,
          pc: item.pc || "",
          num: item.num || "",
          market: item.market || "",
          variable: item.variable || "",
          val: item.val || "",
          vs: item.vs || "",
          vs2: item.vs2 || "",
          comments: item.comments || item.vs2 || "",
          addDate: item.addDate || "",
          deleteDate: item.deleteDate || "",
          registerUser: item.registerUser || "",
          registerDatetime: item.registerDatetime || "",
        }));
        setDataList(mapped);
      } else {
        setDataList([]);
        if (result.data && result.data.length === 0) {
          setErrorMessage("No records found matching your criteria.");
        }
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
    navigate("/homologation-variables", {
      state: {
        productClass: row.pc,
        number: row.num,
        market: row.market,
        variable: row.variable,
        value: row.val,
        variantString1: row.vs,
        variantString2: row.vs2,
        comments: row.comments,
        addDate: row.addDate,
        deleteDate: row.deleteDate,
        createdByUser: row.registerUser,
        date: row.registerDatetime,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteSelected = async () => {
    if (selectedIndex === null) {
      setErrorMessage("Please select a record to delete.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    const row = dataList[selectedIndex];
    try {
      const response = await fetch(`/api/homologation/variables/${row.id || ""}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productClass: row.pc,
          number: row.num,
          market: row.market,
        }),
      });

      const result = await response.json();

      if (response.ok || result.success) {
        setDataList((prev) => prev.filter((_, idx) => idx !== selectedIndex));
        setSelectedIndex(null);
      } else {
        setErrorMessage("Failed to delete the record. Please try again.");
      }
    } catch {
      setErrorMessage("Failed to delete the record. Please try again.");
    }
  };

  const handleUserClick = (userName: string) => {
    navigate("/edb-user-view", { state: { userId: userName } });
  };

  return (
    <div className="hrl-page">
      {/* 顶部导航栏 */}
      <header className="hrl-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="hrl-body">
        <div className="hrl-content">
          <h1 className="hrl-title">Homologation Variables Result List</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="hrl-error">{errorMessage}</div>}

          {/* 加载中 */}
          {isLoading && <div className="hrl-loading">Loading...</div>}

          {/* 结果表格 */}
          {!isLoading && !errorMessage && (
            <>
              {/* Count */}
              <div className="hrl-count">Number of lines found: {dataList.length}</div>

              {/* 表格 */}
              <div className="hrl-table-wrapper">
                <table className="hrl-table">
                  <thead>
                    <tr>
                      <th className="hrl-th-sel"></th>
                      <th className="hrl-th-pc">Product class</th>
                      <th className="hrl-th-num">Number</th>
                      <th className="hrl-th-mkt">Market</th>
                      <th className="hrl-th-var">Variable</th>
                      <th className="hrl-th-val">Value</th>
                      <th className="hrl-th-vs">Variant string.</th>
                      <th className="hrl-th-com">Comments</th>
                      <th className="hrl-th-add">Add</th>
                      <th className="hrl-th-del">Delete</th>
                      <th className="hrl-th-user">Created by user</th>
                      <th className="hrl-th-dt">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataList.length === 0 ? (
                      <tr>
                        <td className="hrl-no-data" colSpan={12}>No records found matching your criteria.</td>
                      </tr>
                    ) : (
                      dataList.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hrl-row ${selectedIndex === idx ? "hrl-row-selected" : ""}`}
                          onClick={() => handleRowClick(idx)}
                        >
                          <td className="hrl-td-sel">
                            <input
                              type="radio"
                              name="hrl-select"
                              className="hrl-radio"
                              checked={selectedIndex === idx}
                              onChange={() => handleRowClick(idx)}
                            />
                          </td>
                          <td className="hrl-td">{row.pc}</td>
                          <td className="hrl-td">{row.num}</td>
                          <td className="hrl-td">{row.market}</td>
                          <td className="hrl-td">{row.variable}</td>
                          <td className="hrl-td">{row.val}</td>
                          <td className="hrl-td">{row.vs}</td>
                          <td className="hrl-td">{row.comments}</td>
                          <td className="hrl-td">{row.addDate}</td>
                          <td className="hrl-td">{row.deleteDate}</td>
                          <td className="hrl-td">
                            <span
                              className="hrl-user-link"
                              onClick={(e) => { e.stopPropagation(); handleUserClick(row.registerUser); }}
                            >
                              {row.registerUser}
                            </span>
                          </td>
                          <td className="hrl-td">{row.registerDatetime}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 按钮行 */}
              <div className="hrl-buttons">
                <button className="hrl-btn" onClick={handleSelect}>Select</button>
                <button className="hrl-btn" onClick={handleBack}>Back</button>
                <button className="hrl-btn" onClick={handlePrint}>Print</button>
                <button className="hrl-btn hrl-btn-delete" onClick={handleDeleteSelected}>Delete selected</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomologationVariablesResultList;
