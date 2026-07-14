import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./UD20.css";

interface DocRecord {
  doctype: string;
  registerUser: string;
  registerDatetime: string;
}

const API_DOCUMENT_LIST = "/api/market-document-settings-list/document-list";
const ROUTE_UD20_1 = "/UD20-1";
const ERR_QUERY_FAILED = "查询失败";
const ERR_SYSTEM_UNAVAILABLE = "系统暂时不可用，请稍后再试";
const ERR_NO_DATA = "No data found";

const UD20 = React.memo(() => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<DocRecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(API_DOCUMENT_LIST);
        const result = await res.json();
        if (result && (result.code === 200 || result.code === undefined)) {
          const data = result.data || result;
          const docs = data.documents || (Array.isArray(data) ? data : []);
          setRecords(docs);
        } else {
          setMessage(ERR_QUERY_FAILED);
          setMessageType("error");
        }
      } catch {
        setMessage(ERR_SYSTEM_UNAVAILABLE);
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSelect = useCallback(() => {
    if (selectedIdx === null) {
      setMessage(ERR_NO_DATA);
      setMessageType("error");
      return;
    }
    // 回填数据并返回上一页
    navigate(ROUTE_UD20_1, { state: { selected: records[selectedIdx] } });
  }, [selectedIdx, records, navigate]);

  const handleBack = useCallback(() => {
    navigate(ROUTE_UD20_1);
  }, [navigate]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleUserClick = useCallback(
    (user: string) => {
      navigate(`/UD25?userid=${encodeURIComponent(user)}`);
    },
    [navigate],
  );

  return (
    <div className="ud20-container">
      <header className="ud20-header">
        <div className="ud20-header-logo"></div>
      </header>
      <main className="ud20-main">
        <div className="ud20-card">
          <h1 className="ud20-page-title">HDoc - Market Document Settings</h1>

          {message && (
            <div className={`ud20-msg ud20-${messageType}`} role="alert">
              {message}
            </div>
          )}

          <div className="ud20-btns">
            <button className="ud20-btn" onClick={handleSelect}>
              Select
            </button>
            <button className="ud20-btn" onClick={handleBack}>
              Back
            </button>
            <button className="ud20-btn" onClick={handlePrint}>
              Print
            </button>
          </div>

          {isLoading ? (
            <div className="ud20-loading">Loading...</div>
          ) : (
            <div className="ud20-table-wrap">
              <table className="ud20-table">
                <thead>
                  <tr>
                    <th className="ud20-th-checkbox"></th>
                    <th>Document type</th>
                    <th>Bussines unit</th>
                    <th>User</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedIdx(idx)}
                      className={
                        selectedIdx === idx
                          ? "ud20-row-selected ud20-row-clickable"
                          : "ud20-row-clickable"
                      }
                    >
                      <td>
                        <input
                          type="radio"
                          name="docSelect"
                          checked={selectedIdx === idx}
                          onChange={() => setSelectedIdx(idx)}
                          className="ud20-radio"
                        />
                      </td>
                      <td>{r.doctype}</td>
                      <td>BU</td>
                      <td>
                        {r.registerUser ? (
                          <button
                            className="ud20-user-link"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(r.registerUser);
                            }}
                          >
                            {r.registerUser}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{r.registerDatetime || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD20;
