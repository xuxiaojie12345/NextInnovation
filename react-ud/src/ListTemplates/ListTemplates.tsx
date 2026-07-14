/**
 * ListTemplates 组件 - 模板列表页面（UD14）
 * 功能：选择Market，显示该Market文件夹下的模板文件列表
 * 参照 UD12 风格实现
 */
import React, { useState, useEffect } from "react";
import api from "../config/api";
import "./ListTemplates.css";

/** 市场数据类型 */
interface MarketItem {
  market: string;
}

/** 市场列表API响应 */
interface MarketListResponse {
  markets: MarketItem[];
  totalCount: number;
}

/** 模板文件数据类型 */
interface TemplateFile {
  filename: string;
  used: string;
  lastModified: string;
  size: string;
  downloadUrl: string;
}

/** 文件列表API响应 */
interface FileListResponse {
  files: TemplateFile[];
  totalCount: number;
}

/**
 * ListTemplates 组件
 * 选择Market后显示该市场文件夹下的模板文件列表
 */
const ListTemplates: React.FC = () => {
  // 市场列表
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  // 当前选中的市场
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  // 文件列表
  const [fileList, setFileList] = useState<TemplateFile[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 错误消息
  const [error, setError] = useState<string>("");

  /**
   * 页面初始化 - 获取市场列表
   */
  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(
          `/api/ud14/UD14SelectMarketmaster`
        );
        if (response.data.code === 200 && response.data.data) {
          const data: MarketListResponse = response.data.data;
          setMarketList(data.markets || []);
        } else {
          setError("System error. Please contact administrator.");
        }
      } catch (err) {
        setError("System error. Please contact administrator.");
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  /**
   * 市场选择处理 - 加载对应市场的文件列表
   */
  const handleMarketChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const market = e.target.value;
    setSelectedMarket(market);
    setError("");

    if (!market) {
      setFileList([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(
        `/api/ud14/UD14SelectHdocuserdefinedrules`,
        { params: { market } }
      );
      if (response.data.code === 200 && response.data.data) {
        const data: FileListResponse = response.data.data;
        setFileList(data.files || []);
      } else {
        setError("System error. Please contact administrator.");
        setFileList([]);
      }
    } catch (err) {
      setError("System error. Please contact administrator.");
      setFileList([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 文件下载处理 - 对应详细设计 3.1.3 文件下载流程
   * 构造下载URL: /api/ud14/download?market={market}&filename={filename}
   */
  const handleFileDownload = async (file: TemplateFile) => {
    try {
      if (!selectedMarket) {
        setError("Market not selected.");
        return;
      }
      const response = await api.get(`/api/ud14/download`, {
        params: { market: selectedMarket, filename: file.filename },
        responseType: 'blob'
      });
      // 创建下载链接
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("File not found. Please contact administrator.");
    }
  };

  return (
    <div className="ud14-container">
      <h1 className="ud14-title">List Templates</h1>

      {loading && <div className="ud14-loading">Loading...</div>}
      {error && !loading && <div className="ud14-error">{error}</div>}

      {/* Select Market - 参照UD12的布局 */}
      <div className="ud14-section">
        <div className="ud14-form-group">
          <label className="ud14-label">Select Market</label>
          <select
            className="ud14-select"
            value={selectedMarket}
            onChange={handleMarketChange}
          >
            <option value="">-- Select Market --</option>
            {marketList.map((item) => (
              <option key={item.market} value={item.market}>
                {item.market}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 文件列表 - DataTable格式，对应详细设计2.1控件属性表 */}
      {!loading && selectedMarket && (
        <div className="ud14-table-wrapper">
          <table className="ud14-table">
            <thead>
              <tr>
                <th className="ud14-icon-col"></th>
                <th>Filename</th>
                <th>Used</th>
                <th>Last Mod,</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {fileList.length > 0 ? (
                fileList.map((file, index) => (
                  <tr key={index}>
                    <td className="ud14-icon-col"><span className="ud14-file-icon">📄</span></td>
                    <td>
                      <a
                        href="#"
                        className="ud14-file-link"
                        onClick={(e) => { e.preventDefault(); handleFileDownload(file); }}
                      >
                        {file.filename}
                      </a>
                    </td>
                    <td>{file.used}</td>
                    <td>{file.lastModified}</td>
                    <td>{file.size}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="ud14-empty">No templates available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListTemplates;
