// ListAvailableTemplates.tsx - UD14模块
import React, { useState, useEffect } from "react";
import "./ListAvailableTemplates.css";

interface MarketItem {
  market: string;
}

interface VariableItem {
  variable: string;
}

interface TemplateFile {
  filename: string;
  used: string;
  lastMod: string;
  size: string;
}

const ListAvailableTemplates = () => {
  const [selectedMarket, setSelectedMarket] = useState("");
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [templateFiles, setTemplateFiles] = useState<TemplateFile[]>([]);
  const [usedVariables, setUsedVariables] = useState<VariableItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面初始化：加载市场列表
  useEffect(() => {
    fetchMarketList();
  }, []);

  // 获取市场列表
  const fetchMarketList = async () => {
    try {
      const API_BASE_URL = "http://localhost:8081";

      console.log(
        "Fetching market list from:",
        `${API_BASE_URL}/api/ud14Searchresultist/getmarkets`,
      );

      const response = await fetch(
        `${API_BASE_URL}/api/ud14Searchresultist/getmarkets`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch market list");
      }

      const data = await response.json();
      console.log("Market list response:", data);

      if (data.code === 200 && data.data) {
        setMarketList(data.data);
      } else {
        setErrorMessage(data.msg || "Failed to load market list");
      }
    } catch (error) {
      console.error("Fetch market list error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "System error. Please contact administrator.",
      );
    }
  };

  // 处理市场选择变化
  const handleMarketChange = async (value: string) => {
    setSelectedMarket(value);
    setErrorMessage("");
    setSuccessMessage("");
    setTemplateFiles([]);

    // 如果选择了市场，加载该市场下的模板文件列表
    if (value) {
      await fetchTemplateFiles(value);
    }
  };

  // 获取指定市场下的模板文件列表
  const fetchTemplateFiles = async (marketCode: string) => {
    try {
      setIsLoading(true);
      const API_BASE_URL = "http://localhost:8081";

      console.log("Fetching template files for market:", marketCode);

      // 构建请求参数
      const requestBody = {
        Market: marketCode,
      };

      console.log("Request body:", requestBody);

      const response = await fetch(
        `${API_BASE_URL}/api/ud14Searchresultist/getvariablesbymarket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch template files");
      }

      const result = await response.json();
      console.log("Template files response:", result);

      if (result.code === 200 && Array.isArray(result.data)) {
        // 将返回的数据转换为TemplateFile格式
        const files: TemplateFile[] = result.data.map((item: any) => ({
          filename: item.filename || "",
          used: item.used || "",
          lastMod: item.lastMod || "",
          size: item.size || "",
        }));

        setTemplateFiles(files);
      } else {
        setTemplateFiles([]);
      }
    } catch (error) {
      console.error("Fetch template files error:", error);
      setTemplateFiles([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "System error. Please contact administrator.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 下载文件功能
  const handleDownload = async (filename: string) => {
    if (!selectedMarket || !filename) {
      setErrorMessage("Cannot download file.");
      return;
    }

    try {
      setIsLoading(true);
      const API_BASE_URL = "http://localhost:8081";
      const downloadUrl = `${API_BASE_URL}/api/template/download/${selectedMarket}/${encodeURIComponent(filename)}`;

      console.log("Downloading file:", downloadUrl);

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error("File not found or download failed.");
      }

      // 获取文件内容并创建下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`File ${filename} downloaded successfully.`);
    } catch (error) {
      console.error("Download error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to download file.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='lat-container'>
      {/* 消息显示 */}
      {errorMessage && <div className='lat-error-message'>{errorMessage}</div>}
      {successMessage && (
        <div className='lat-success-message'>{successMessage}</div>
      )}

      {/* List Templates区域 */}
      <div className='lat-section'>
        <h2 className='lat-section-title'>List Templates</h2>

        <div className='lat-form-group'>
          <label className='lat-label'>Select Market:</label>
          <select
            className='lat-select'
            value={selectedMarket}
            onChange={(e) => handleMarketChange(e.target.value)}
          >
            <option value='-'>-</option>
            {marketList.map((item, index) => (
              <option key={index} value={item.market}>
                {item.market}
              </option>
            ))}
          </select>
        </div>

        {/* 数据表格 */}
        <div className='lat-table-wrapper'>
          <table className='lat-table'>
            <thead>
              <tr>
                <th className='lat-th-icon'></th>
                <th className='lat-th-filename'>Filename</th>
                <th className='lat-th-used'>Used</th>
                <th className='lat-th-lastmod'>Last Mod,</th>
                <th className='lat-th-size'>Size</th>
              </tr>
            </thead>
            <tbody>
              {templateFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className='lat-empty-row'>
                    &nbsp;
                  </td>
                </tr>
              ) : (
                templateFiles.map((file, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "lat-even-row" : "lat-odd-row"}
                  >
                    <td className='lat-td-icon'>
                      {/* 文件图标占位符 */}
                      <span className='lat-file-icon'>📄</span>
                    </td>
                    <td className='lat-td-filename'>
                      <a
                        href='#'
                        className='lat-filename-link'
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownload(file.filename);
                        }}
                      >
                        {file.filename}
                      </a>
                    </td>
                    <td className='lat-td-used'>{file.used}</td>
                    <td className='lat-td-lastmod'>{file.lastMod}</td>
                    <td className='lat-td-size'>{file.size}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListAvailableTemplates;
