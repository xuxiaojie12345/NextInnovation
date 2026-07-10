/**
 * UploadDeleteTemplate 组件 - 模板上传删除页面（UD12）
 * 功能：管理HDoc模板文件的上传和删除操作
 * 对应详细设计：详细设计/詳細設計UD12.md
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";
import "./UploadDeleteTemplate.css";

/**
 * 市场数据类型
 * 对应详细设计 4.1 Response Success
 */
interface Market {
  marketCode: string;
  marketName: string;
}

/**
 * 模板文件数据类型
 * 对应详细设计 4.1 场景2 Response Success
 */
interface TemplateFile {
  fileName: string;
  filePath: string;
}

/**
 * UploadDeleteTemplate 组件
 * 提供模板文件上传和删除管理功能
 * 包含HDoc Template Upload和HDoc Template Delete两个区域
 */
const UploadDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();

  // 市场列表状态
  const [uploadMarketList, setUploadMarketList] = useState<Market[]>([]);
  const [deleteMarketList, setDeleteMarketList] = useState<Market[]>([]);

  // Upload区域状态
  const [selectedUploadMarket, setSelectedUploadMarket] = useState<string>("");

  // 文件输入框引用 - 直接通过DOM获取文件，避免React状态管理问题
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete区域状态
  const [selectedDeleteMarket, setSelectedDeleteMarket] = useState<string>("");
  const [templatesList, setTemplatesList] = useState<TemplateFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // 通用状态
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  /**
   * 页面初始化 - 调用UD12SelectMarket获取可用市场列表
   * 对应详细设计 3.1.1 页面初始化流程
   * API: GET /api/ud12/selectmarket
   */
  useEffect(() => {
    const initializePage = async () => {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      try {
        const response = await api.get(`/api/ud12/selectmarket`);
        const data: Market[] = response.data.data || [];
        // 填充Upload和Delete两个区域的Market下拉列表
        setUploadMarketList(data);
        setDeleteMarketList(data);
        // Templates下拉列表初始化为空
        setTemplatesList([]);
      } catch (err) {
        setError("System error. Please contact administrator.");
      } finally {
        setLoading(false);
      }
    };
    initializePage();
  }, []);

  /**
   * Upload区域Market选择处理
   */
  const handleUploadMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUploadMarket(e.target.value);
    setError("");
    setSuccessMessage("");
  };

  /**
   * Delete区域Market选择处理 - 联动加载模板列表
   * 对应详细设计 3.1.4 市场选择联动流程
   * API: GET /api/ud12/selectmarket/{marketCode}
   */
  const handleDeleteMarketChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const marketCode = e.target.value;
    setSelectedDeleteMarket(marketCode);
    setSelectedTemplate("");
    setError("");
    setSuccessMessage("");

    if (marketCode) {
      setLoading(true);
      try {
        const response = await api.get(`/api/ud12/selectmarket/${marketCode}`);
        const data: TemplateFile[] = response.data.data || [];
        setTemplatesList(data);
      } catch (err) {
        setError("System error. Please contact administrator.");
        setTemplatesList([]);
      } finally {
        setLoading(false);
      }
    } else {
      setTemplatesList([]);
    }
  };

  /**
   * 获取选中的File对象 - 直接从DOM的input.files读取，不受React渲染影响
   */
  const getSelectedFile = (): File | null => {
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
      return fileInputRef.current.files[0];
    }
    return null;
  };

  /**
   * Templates下拉列表选择处理
   */
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    setError("");
    setSuccessMessage("");
  };

  /**
   * Upload file按钮点击处理 - 文件上传
   * 对应详细设计 3.1.2 文件上传流程
   * API: POST /api/ud12/upload (multipart/form-data)
   */
  const handleUploadClick = async () => {
    setError("");
    setSuccessMessage("");

    // 直接从DOM文件输入框获取选中的文件
    const file = getSelectedFile();

    // 校验：是否选择了文件（对应详细设计 3.2 No.1）
    if (!file) {
      setError("NO FILE UPLOADED");
      return;
    }

    // 校验：是否选择了市场
    if (!selectedUploadMarket) {
      setError("Please select market.");
      return;
    }

    // 校验：文件大小是否超过10MB（对应详细设计 3.2 No.2）
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 10MB limit.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("market", selectedUploadMarket);

      // 注意：不要手动设置 Content-Type，axios 会自动设置 multipart boundary
      const response = await api.post(
        `/api/ud12/upload`,
        formData
      );

      if (response.data.code === 200) {
        const result = response.data.data;
        setSuccessMessage(
          `TEMPLATE ${result.fileName} WAS SUCESSFULLY UPLOADED TO MARKET ${result.market}`
        );
        setSelectedUploadMarket("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else if (response.data.code === 400) {
        setError(response.data.message || "Invalid file type or size (Max 10MB)");
      } else {
        setError("System error. Please contact administrator.");
      }
    } catch (err) {
      setError("System error. Please contact administrator.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete按钮点击处理 - 模板文件删除
   * 对应详细设计 3.1.3 模板删除流程
   * API: POST /api/ud12/delete
   */
  const handleDeleteClick = async () => {
    setError("");
    setSuccessMessage("");

    // 校验：是否选择了市场和模板（对应详细设计 3.2 No.3）
    if (!selectedDeleteMarket || !selectedTemplate) {
      setError("Please select market and template.");
      return;
    }

    // 确认对话框（对应详细设计 3.1.3 步骤3）
    if (!window.confirm("Do you really want to delete template?")) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/ud12/delete`, {
        market: selectedDeleteMarket,
        fileName: selectedTemplate
      });

      if (response.data.code === 200) {
        setSuccessMessage(
          `TEMPLATE ${selectedTemplate} WAS SUCESSFULLY DELETE FROM MARKET ${selectedDeleteMarket}`
        );
        // 刷新模板列表
        const marketRes = await api.get(`/api/ud12/selectmarket/${selectedDeleteMarket}`);
        setTemplatesList(marketRes.data.data || []);
        setSelectedTemplate("");
      } else if (response.data.code === 404) {
        setError(response.data.message || "File not found");
      } else {
        setError("System error. Please contact administrator.");
      }
    } catch (err) {
      setError("System error. Please contact administrator.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check Template链接点击处理
   * 对应详细设计 3.1.5 模板检查链接跳转
   */
  const handleCheckTemplateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/Menu/HDocTemplateCheck");
  };

  return (
    <div className="ud12-container">
      <h1 className="ud12-title">EDB Engineering Database - Upload Delete Template</h1>

      {loading && <div className="ud12-loading">Loading...</div>}

      {error && !loading && <div className="ud12-error">{error}</div>}

      {successMessage && !loading && <div className="ud12-success">{successMessage}</div>}

      {/* HDoc Template Upload区域 */}
      <div className="ud12-section">
        <h2 className="ud12-section-title">HDoc Template Upload</h2>

        <div className="ud12-form-group">
          <label className="ud12-label" htmlFor="templateFileInput">Template File</label>
          <input
            type="file"
            id="templateFileInput"
            ref={fileInputRef}
            className="ud12-file-input"

          />
        </div>

        <div className="ud12-form-group">
          <label className="ud12-label" htmlFor="uploadMarketSelect">Market</label>
          <select
            id="uploadMarketSelect"
            className="ud12-select"
            value={selectedUploadMarket}
            onChange={handleUploadMarketChange}
          >
            <option value="">-- Select Market --</option>
            {uploadMarketList.map((market) => (
              <option key={market.marketCode} value={market.marketCode}>
                {market.marketCode}
              </option>
            ))}
          </select>
        </div>

        <div className="ud12-btn-group">
          <button type="button" className="ud12-btn ud12-btn-primary"
            onClick={handleUploadClick} disabled={loading}>
            Upload file
          </button>
        </div>
      </div>

      {/* HDoc Template Delete区域 */}
      <div className="ud12-section">
        <h2 className="ud12-section-title">HDoc Template Delete</h2>

        <div className="ud12-form-group">
          <label className="ud12-label" htmlFor="deleteMarketSelect">Market</label>
          <select
            id="deleteMarketSelect"
            className="ud12-select"
            value={selectedDeleteMarket}
            onChange={handleDeleteMarketChange}
          >
            <option value="">-- Select Market --</option>
            {deleteMarketList.map((market) => (
              <option key={market.marketCode} value={market.marketCode}>
                {market.marketCode}
              </option>
            ))}
          </select>
        </div>

        <div className="ud12-form-group">
          <label className="ud12-label" htmlFor="templateSelect">Templates</label>
          <select
            id="templateSelect"
            className="ud12-select"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            disabled={false}
          >
            <option value="">-- Select Template --</option>
            {templatesList.length > 0 ? (
              templatesList.map((t) => (
                <option key={t.fileName} value={t.fileName}>{t.fileName}</option>
              ))
            ) : (
              <option value="" disabled>No templates available</option>
            )}
          </select>
        </div>

        <div className="ud12-btn-group">
          <button type="button" className="ud12-btn ud12-btn-danger"
            onClick={handleDeleteClick}>
            Delete
          </button>
        </div>
      </div>

      {/* Check Template 说明文字 + 链接 */}
      <div className="ud12-link-section">
        <p style={{ color: '#ff4d4f', fontWeight: 'bold', margin: 0 }}>Check your rtf template</p>
        <p className="ud12-check-text">
          In case you have a rtf template you should run a check on it
          before uploading it.
          <br />
          After check download the template to your desktop and then upload
          it to your template directory.
          <br />
          Use the link bellow.
        </p>
        <br />
        <a href="#" className="ud12-link" onClick={handleCheckTemplateClick}>
          Check Template (Only for rtf files)
        </a>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
