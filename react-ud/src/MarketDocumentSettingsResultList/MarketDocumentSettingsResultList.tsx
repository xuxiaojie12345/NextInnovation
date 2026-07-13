import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../common/css/common.css";
import "./MarketDocumentSettingsResultList.css";

interface DocumentRecord {
  doctype: string;
  businessUnit: string;
  registerUser: string;
  registerDatetime: string;
}

const MarketDocumentSettingsResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    doctype?: string;
    doctypeOp?: string;
    registerUser?: string;
    registerUserOp?: string;
    registerDatetime?: string;
    registerDatetimeOp?: string;
  } | null;

  const [results, setResults] = useState<DocumentRecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.post<{ documentList: any[] }>(
          "/ud20/getDocumentList",
          {
            doctype: state?.doctype || "",
            doctypeOp: state?.doctypeOp || "=",
            registerUser: state?.registerUser || "",
            registerUserOp: state?.registerUserOp || "=",
            registerDatetime: state?.registerDatetime || "",
            registerDatetimeOp: state?.registerDatetimeOp || "=",
          },
        );
        if (res.code === 200 && res.data) {
          const rawList = res.data.documentList || [];
          // MyBatis 返回大写字段名，映射为驼峰
          const docs: DocumentRecord[] = rawList.map((d: any) => ({
            doctype: d.DOCTYPE ?? "",
            businessUnit: d.BUSINESS_UNIT ?? "BU",
            registerUser: d.REGISTER_USER ?? "",
            registerDatetime: d.REGISTER_DATETIME
              ? String(d.REGISTER_DATETIME).substring(0, 10)
              : "",
          }));
          setResults(docs);
          if (docs.length === 0) {
            setMessage("没有找到符合条件的文档");
          }
        } else {
          setMessage("没有找到符合条件的文档");
        }
      } catch {
        setMessage("系统暂时不可用，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [
    state?.doctype,
    state?.doctypeOp,
    state?.registerUser,
    state?.registerUserOp,
    state?.registerDatetime,
    state?.registerDatetimeOp,
  ]);

  const handleSelect = () => {
    if (selectedIdx < 0) {
      setMessage("No data found");
      return;
    }
    const record = results[selectedIdx];
    navigate("/menu/market-document-setting", {
      state: {
        doctype: record.doctype,
        registerUser: record.registerUser,
        registerDatetime: record.registerDatetime,
      },
    });
  };

  const handleBack = () => {
    navigate("/menu/market-document-setting", {
      state: {
        doctype: state?.doctype || "",
        doctypeOp: state?.doctypeOp || "=",
        registerUser: state?.registerUser || "",
        registerUserOp: state?.registerUserOp || "=",
        registerDatetime: state?.registerDatetime || "",
        registerDatetimeOp: state?.registerDatetimeOp || "=",
      },
    });
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = "MarketDocumentSettingsList";
    window.print();
    document.title = prevTitle;
  };

  const handleUserClick = (userId: string) => {
    navigate("/menu/edb-user-view", { state: { userid: userId } });
  };

  return (
    <div className="mdsr-container panel panel-w1100 print-container">
      <div className="mdsr-header panel-header">
        <h1 className="print-header-sm">HDoc - Market Document Setting</h1>
      </div>

      {message && <div className="mdsr-error no-print">{message}</div>}

      <table className="mdsr-btn-table no-print">
        <tbody>
          <tr>
            <td className="mdsr-btn-cell">
              <button
                className="btn"
                onClick={handleSelect}
                disabled={selectedIdx < 0}
              >
                Select
              </button>
              <button className="btn" onClick={handleBack}>
                Back
              </button>
              <button className="btn" onClick={handlePrint}>
                Print
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {isLoading ? (
        <div className="mdsr-loading">Loading...</div>
      ) : results.length > 0 ? (
        <div className="mdsr-table-wrapper print-wrapper">
          <table className="mdsr-table print-table">
            <thead>
              <tr>
                <th className="mdsr-th-check no-print"></th>
                <th>Document type</th>
                <th>Business unit</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx} className={selectedIdx === idx ? "selected" : ""}>
                  <td className="mdsr-td-check no-print">
                    <input
                      type="radio"
                      name="selectedRow"
                      checked={selectedIdx === idx}
                      onChange={() => setSelectedIdx(idx)}
                    />
                  </td>
                  <td>{row.doctype}</td>
                  <td>{row.businessUnit}</td>
                  <td>
                    <span
                      className="mdsr-link-user print-link-plain"
                      onClick={() => handleUserClick(row.registerUser)}
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
        !isLoading && <div className="mdsr-empty">没有找到符合条件的文档</div>
      )}

      <div className="mdsr-count">Number of lines found: {results.length}</div>
    </div>
  );
};

export default MarketDocumentSettingsResultList;
