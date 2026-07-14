import React, { useState, useEffect } from "react";
import { api, API_BASE_URL } from "../services/api";
import "../common/css/common.css";
import "./ListAvailableTemplates.css";

interface TemplateFile {
  filename: string;
  used: string; // VARIABLE if registered in HDOC_USER_DEFINED_RULES
  lastMod: string;
  size: string;
}

interface FileDetail {
  filename: string;
  lastMod: string;
  size: string;
}

// 可用模板列表组件
const ListAvailableTemplates: React.FC = () => {
  const [selectMarket, setSelectMarket] = useState("");

  const [markets, setMarkets] = useState<string[]>([]);
  const [templateList, setTemplateList] = useState<TemplateFile[]>([]);

  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.post<{ marketList: string[] }>(
          "/ud14/selectMarketmaster",
          {},
        );
        if (res.code === 200 && res.data) {
          setMarkets(res.data.marketList || []);
        } else {
          setMessage("System error. Please contact administrator.");
        }
      } catch {
        setMessage("System error. Please contact administrator.");
      }
    })();
  }, []);

  // 选择市场后加载模板列表
  useEffect(() => {
    if (!selectMarket) {
      setTemplateList([]);
      return;
    }

    (async () => {
      setIsLoading(true);
      clearMessages();

      try {
        // Step 1: 从网络路径读取模板文件列表（含最后修改时间和大小）
        const listRes = await api.post<{ templateList: FileDetail[] }>(
          "/template/listTemplates",
          {
            market: selectMarket,
          },
        );

        if (listRes.code === 200 && listRes.data) {
          const fileDetails = listRes.data.templateList || [];

          if (fileDetails.length === 0) {
            setMessage("No templates found for the selected market.");
            setTemplateList([]);
            return;
          }

          // Step 2: 对每个文件检查是否在 HDOC_USER_DEFINED_RULES 中注册（获取 Used 信息）
          const templatePromises = fileDetails.map(async (fileInfo) => {
            let used = "-";
            try {
              const usedRes = await api.post<{ variableList: string[] }>(
                "/ud14/selectHdocUserDefinedRules",
                {
                  market: selectMarket,
                  filename: fileInfo.filename,
                },
              );
              if (usedRes.code === 200 && usedRes.data) {
                const vars = usedRes.data.variableList || [];
                if (vars.length > 0) {
                  used = vars[0];
                }
              }
            } catch {
              // Used info is optional, silently ignore
            }

            return {
              filename: fileInfo.filename,
              used,
              lastMod: fileInfo.lastMod || "-",
              size: fileInfo.size || "-",
            } as TemplateFile;
          });

          const templates = await Promise.all(templatePromises);
          setTemplateList(templates);
        } else {
          setMessage(listRes.message || "Market folder not found.");
          setTemplateList([]);
        }
      } catch {
        setMessage("System error. Please contact administrator.");
        setTemplateList([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [selectMarket]);

  const handleDownload = async (filename: string) => {
    clearMessages();

    if (!selectMarket) {
      setMessage("Please select a market first.");
      return;
    }

    setIsLoading(true);
    try {
      // Use POST to download endpoint (backend returns file as blob in response)
      const token = localStorage.getItem("token") || "";
      const url = `${API_BASE_URL}/template/download`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          market: selectMarket,
          fileName: filename,
        }),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // Try to get as blob (file), fallback to JSON
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        if (json.code !== 200) {
          setMessage(json.message || "File not found.");
          return;
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccessMessage(`File "${filename}" downloaded successfully.`);
    } catch {
      setMessage("File not found.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lat-container panel panel-w1000">
      <div className="lat-header panel-header">
        <h1>List Templates</h1>
      </div>

      {message && <div className="lat-error msg-error">{message}</div>}
      {successMessage && <div className="lat-success msg-success">{successMessage}</div>}

      {/* 搜索表单 */}
      <div className="f-form">
        <div className="f-row">
          <span className="f-label">Select Market</span>
          <select
            className="f-input"
            value={selectMarket}
            onChange={(e) => setSelectMarket(e.target.value)}
            disabled={isLoading}
          >
            <option value="">-- Select --</option>
            {markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lat-table-section">
        <table className="lat-table">
          <thead>
            <tr>
              <th className="lat-th-icon"></th>
              <th>Filename</th>
              <th>Used</th>
              <th>Last Mod</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {selectMarket && templateList.length > 0 ? (
              templateList.map((item, idx) => (
                <tr key={idx}>
                  <td className="lat-td-icon">
                    <span className="lat-file-icon">📄</span>
                  </td>
                  <td>
                    <span
                      className="lat-download-link"
                      onClick={() => handleDownload(item.filename)}
                    >
                      {item.filename}
                    </span>
                  </td>
                  <td>{item.used || "-"}</td>
                  <td>{item.lastMod}</td>
                  <td>{item.size}</td>
                </tr>
              ))
            ) : selectMarket && !isLoading ? (
              <tr>
                <td colSpan={5} className="lat-empty-cell">
                  No templates found for the selected market.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListAvailableTemplates;
