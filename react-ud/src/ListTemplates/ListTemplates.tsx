/**
 * ListTemplates 组件 - 模板列表页面（UD14）
 * 功能：展示各市场下的模板文件列表，支持按市场筛选查看文件详细信息及使用状态
 * 对应详细设计：详细设计/詳細設計UD14.md
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ListTemplates.css";

/**
 * 市场数据类型
 */
interface MarketItem {
  market: string;
}

/**
 * 市场列表API响应数据类型
 * 对应详细设计 4.1 Response Success
 */
interface MarketListResponse {
  markets: MarketItem[];
  totalCount: number;
}

/**
 * 模板文件数据类型
 * 对应详细设计 4.2 Response Success
 */
interface TemplateFile {
  filename: string;
  used: string;
  lastModified: string;
  size: string;
  downloadUrl: string;
}

/**
 * 文件列表API响应数据类型
 */
interface FileListResponse {
  files: TemplateFile[];
  totalCount: number;
}

/** 后端API基础地址 */
const API_BASE_URL = "http://localhost:8081";

/**
 * ListTemplates 组件
 * 显示各市场下的模板文件列表，支持市场筛选
 * 仅读操作，不涉及数据修改
 */
const ListTemplates: React.FC = () => {
  const navigate = useNavigate();

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
   * 调用 UD14SelectMarketmaster（GET /api/ud14/UD14SelectMarketmaster）
   * 对应详细设计 3.1.1 页面初始化流程
   */
  useEffect(() => {
    const fetchMarkets = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/ud14/UD14SelectMarketmaster`
        );
        if (response.data.code === 200 && response.data.data) {
          const data: MarketListResponse = response.data.data;
          setMarketList(data.markets || []);
        } else {
          setError("系统内部错误，请联系管理员");
        }
      } catch (err) {
        setError("系统内部错误，请联系管理员");
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  /**
   * 市场选择处理 - 加载对应市场的文件列表
   * 调用 UD14SelectHdocuserdefinedrules（GET /api/ud14/UD14SelectHdocuserdefinedrules?market={marketCode}）
   * 对应详细设计 3.1.2 市场选择与文件列表加载流程
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
      const response = await axios.get(
        `${API_BASE_URL}/api/ud14/UD14SelectHdocuserdefinedrules`,
        { params: { market } }
      );
      if (response.data.code === 200 && response.data.data) {
        const data: FileListResponse = response.data.data;
        setFileList(data.files || []);
      } else {
        setError("系统内部错误，请联系管理员");
        setFileList([]);
      }
    } catch (err) {
      setError("系统内部错误，请联系管理员");
      setFileList([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 文件下载处理
   * 对应详细设计 3.1.3 文件下载流程
   */
  const handleFileDownload = (file: TemplateFile) => {
    try {
      const link = document.createElement("a");
      link.href = `${API_BASE_URL}${file.downloadUrl}`;
      link.download = file.filename;
      link.click();
    } catch (err) {
      setError("文件不存在，请联系管理员");
    }
  };

  return (
    <div className="ud14-container">
      {/* 页面标题 */}
      <h1 className="ud14-title">EDB Engineering Database - List Templates</h1>

      {/* 加载状态 */}
      {loading && <div className="ud14-loading">Loading...</div>}

      {/* 错误消息 */}
      {error && !loading && <div className="ud14-error">{error}</div>}

      {/* Select Market 下拉列表 */}
      <div className="ud14-form">
        <div className="ud14-field">
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

      {/* 数据表格 */}
      {!loading && selectedMarket && (
        <div className="ud14-table-wrapper">
          <table className="ud14-table">
            <thead>
              <tr>
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
                    <td>
                      <a
                        href="#"
                        className="ud14-file-link"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFileDownload(file);
                        }}
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
                  <td colSpan={4} className="ud14-empty">
                    No files found.
                  </td>
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
