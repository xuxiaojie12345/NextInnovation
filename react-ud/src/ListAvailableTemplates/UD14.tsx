import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { templateListApi } from "../services/api";
import "./UD14.css";

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

interface FileItem {
  filename: string;
  used: boolean;
  lastModified: string;
  size: string;
}

const UD14 = React.memo(() => {
  const navigate = useNavigate();

  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初期化 - 获取市场列表
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }
    const init = async () => {
      try {
        const result = await templateListApi.selectMarket();
        if (result && result.code === 200 && result.data) {
          const markets = result.data.markets || result.data;
          const list = Array.isArray(markets)
            ? markets.map((m: any) =>
                typeof m === "string" ? m : m.market || m.MARKET || "",
              )
            : [];
          setMarketOptions(list.filter(Boolean));
        }
      } catch {
        setErrorMessage("无法加载市场列表");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate]);

  // 选择市场变化时加载文件列表
  useEffect(() => {
    if (!selectedMarket) {
      setFileList([]);
      setErrorMessage("");
      return;
    }
    const loadFiles = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [fileResult, ruleResult] = await Promise.all([
          templateListApi.selectTemplateFiles(selectedMarket),
          templateListApi.selectHdocuserdefinedrules(selectedMarket),
        ]);
        if (fileResult && fileResult.code === 200) {
          const list = Array.isArray(fileResult.data) ? fileResult.data : [];
          setFileList(list as FileItem[]);
        } else {
          setErrorMessage("无法加载文件列表，请稍后重试");
          setFileList([]);
        }
        if (ruleResult && ruleResult.code === 200 && ruleResult.data) {
          const vars = Array.isArray(ruleResult.data.rules)
            ? ruleResult.data.rules
            : [];
          setRules(vars);
        } else {
          setRules([]);
        }
      } catch {
        setErrorMessage("无法加载文件列表，请稍后重试");
        setFileList([]);
        setRules([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadFiles();
  }, [selectedMarket]);

  const handleDownload = useCallback(
    (filename: string) => {
      const url = templateListApi.downloadFile(selectedMarket, filename);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [selectedMarket],
  );

  if (isLoading && !selectedMarket) {
    return (
      <div className="ud14-container">
        <div className="ud14-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud14-container">
      <header className="ud14-header">
        <div className="ud14-header-logo">VOLVO</div>
      </header>
      <main className="ud14-main">
        <div className="ud14-card">
          <h1 className="ud14-page-title">List Templates</h1>

          {errorMessage && (
            <div className="ud14-message ud14-error" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Select Market */}
          <div className="ud14-filter-row">
            <label className="ud14-filter-label">Select Market:</label>
            <select
              className="ud14-select"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              <option value="">-</option>
              {marketOptions.map((m, i) => (
                <option key={i} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="ud14-table-wrapper">
            <table className="ud14-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Filename</th>
                  <th>Used</th>
                  <th>Last Mod.</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="ud14-table-empty">
                      Loading...
                    </td>
                  </tr>
                ) : fileList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="ud14-table-empty">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  fileList.map((item, index) => (
                    <tr key={index}>
                      <td className="ud14-col-icon">
                        <span className="ud14-file-icon">&#128196;</span>
                      </td>
                      <td>
                        <span
                          className="ud14-file-link"
                          role="button"
                          tabIndex={0}
                          onClick={() => handleDownload(item.filename)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              handleDownload(item.filename);
                          }}
                        >
                          {item.filename}
                        </span>
                      </td>
                      <td className="ud14-col-center">
                        {rules.length > 0 ? (
                          <span className="ud14-used-yes">
                            {rules.join(", ")}
                          </span>
                        ) : (
                          <span className="ud14-used-no">-</span>
                        )}
                      </td>
                      <td>{item.lastModified}</td>
                      <td className="ud14-col-right">{item.size}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD14;
