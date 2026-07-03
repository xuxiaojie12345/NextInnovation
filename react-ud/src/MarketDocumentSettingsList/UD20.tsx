import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./UD20.css";

interface DocRecord {
  doctype: string;
  registerUser: string;
  registerDatetime: string;
}

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
        const res = await fetch(
          "/api/market-document-settings-list/document-list",
        );
        const result = await res.json();
        if (result && (result.code === 200 || result.code === undefined)) {
          const data = result.data || result;
          const docs = data.documents || (Array.isArray(data) ? data : []);
          setRecords(docs);
        } else {
          setMessage("查询失败");
          setMessageType("error");
        }
      } catch {
        setMessage("系统暂时不可用，请稍后再试");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSelect = useCallback(() => {
    if (selectedIdx === null) {
      setMessage("No data found");
      setMessageType("error");
      return;
    }
    // 回填数据并返回上一页
    navigate("/UD20-1", { state: { selected: records[selectedIdx] } });
  }, [selectedIdx, records, navigate]);

  const handleBack = useCallback(() => {
    navigate("/UD20-1");
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
                    <th style={{ width: 40 }}></th>
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
                      style={{
                        background: selectedIdx === idx ? "#dce8f0" : undefined,
                        cursor: "pointer",
                      }}
                    >
                      <td>
                        <input
                          type="radio"
                          name="docSelect"
                          checked={selectedIdx === idx}
                          onChange={() => setSelectedIdx(idx)}
                          style={{ accentColor: "#003057", cursor: "pointer" }}
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
