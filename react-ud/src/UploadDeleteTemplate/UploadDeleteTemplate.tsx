import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadDeleteTemplate.css";

// 定义市场接口
interface Market {
  marketCode: string;
  marketName: string;
}

// 定义模板文件接口
interface TemplateFile {
  fileName: string;
  filePath: string;
}

const UploadDeleteTemplate: React.FC = () => {
  // 路由导航
  const navigate = useNavigate();

  // 状态管理
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Upload区域状态
  const [uploadMarketList, setUploadMarketList] = useState<Market[]>([]);
  const [selectedUploadMarket, setSelectedUploadMarket] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Delete区域状态
  const [deleteMarketList, setDeleteMarketList] = useState<Market[]>([]);
  const [selectedDeleteMarket, setSelectedDeleteMarket] = useState<string>("");
  const [templatesList, setTemplatesList] = useState<TemplateFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  // 页面初始化 - 获取市场列表
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        // 调用API获取市场列表
        const response = await fetch("/api/ud12/selectmarket", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load markets");
        }

        const jsonResponse = await response.json();
        const data: Market[] = jsonResponse.data || [];
        
        // 填充两个Market下拉列表
        setUploadMarketList(data);
        setDeleteMarketList(data);
        
        // Templates下拉列表初始化为空
        setTemplatesList([]);
      } catch (err) {
        console.error("Failed to load markets:", err);
        setError("System error. Please contact administrator.");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, []);

  // Upload区域 - Market选择处理
  const handleUploadMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUploadMarket(e.target.value);
    // 清除错误和成功消息
    setError("");
    setSuccessMessage("");
  };

  // Delete区域 - Market选择处理（联动加载模板列表）
  const handleDeleteMarketChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const marketCode = e.target.value;
    setSelectedDeleteMarket(marketCode);
    setSelectedTemplate(""); // 清空选中的模板
    
    // 清除错误和成功消息
    setError("");
    setSuccessMessage("");

    // 如果选择了市场，加载该市场下的模板文件列表
    if (marketCode) {
      try {
        setLoading(true);
        
        // 调用API获取模板文件列表
        const response = await fetch(`/api/ud12/selectmarket/${marketCode}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load templates");
        }

        const jsonResponse = await response.json();
        const data: TemplateFile[] = jsonResponse.data || [];
        setTemplatesList(data);
      } catch (err) {
        console.error("Failed to load templates:", err);
        setError("System error. Please contact administrator.");
        setTemplatesList([]);
      } finally {
        setLoading(false);
      }
    } else {
      // 未选择市场时，清空模板列表
      setTemplatesList([]);
    }
  };

  // File Input选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      // 清除错误和成功消息
      setError("");
      setSuccessMessage("");
    }
  };

  // Templates下拉列表选择处理
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    // 清除错误和成功消息
    setError("");
    setSuccessMessage("");
  };

  // Upload file按钮点击处理
  const handleUploadClick = async () => {
    // 清除旧消息
    setError("");
    setSuccessMessage("");

    // 前端校验：检查是否选择了文件
    if (!selectedFile) {
      setError("NO FILE UPLOADED");
      return;
    }

    // 前端校验：检查文件大小是否超过10MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size exceeds the 10MB limit.");
      return;
    }

    // 前端校验：检查是否选择了市场
    if (!selectedUploadMarket) {
      setError("Please select a market.");
      return;
    }

    try {
      setLoading(true);

      // 构建FormData对象
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("market", selectedUploadMarket);

      // 调用文件上传API
      const response = await fetch("/api/ud12/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.code !== 200) {
        // 根据返回码显示不同的错误消息
        if (result.code === 400) {
          setError(result.message || "Invalid file type or size");
        } else {
          setError("System error. Please contact administrator.");
        }
        return;
      }

      // 上传成功
      setSuccessMessage(`TEMPLATE ${selectedFile.name} WAS SUCESSFULLY UPLOADED TO MARKET ${selectedUploadMarket}`);
      // 清空文件选择框
      setSelectedFile(null);
      // 重置文件输入框
      const fileInput = document.getElementById("templateFileInput") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("System error. Please contact administrator.");
    } finally {
      setLoading(false);
    }
  };

  // Delete按钮点击处理
  const handleDeleteClick = async () => {
    // 清除旧消息
    setError("");
    setSuccessMessage("");

    // 前端校验：检查是否选择了市场和模板
    if (!selectedDeleteMarket || !selectedTemplate) {
      setError("Please select market and template.");
      return;
    }

    // 显示确认对话框
    const confirmed = window.confirm("Do you really want to delete template?");
    if (!confirmed) {
      // 用户取消，终止流程
      return;
    }

    try {
      setLoading(true);

      // 构建请求参数
      const requestBody = {
        market: selectedDeleteMarket,
        fileName: selectedTemplate,
      };

      // 调用文件删除API
      const response = await fetch("/api/ud12/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.code !== 200) {
        // 根据返回码显示不同的错误消息
        if (result.code === 404) {
          setError(result.message || "File not found");
        } else {
          setError("System error. Please contact administrator.");
        }
        return;
      }

      // 删除成功
      setSuccessMessage(`TEMPLATE ${selectedTemplate} WAS SUCESSFULLY DELETE FROM MARKET ${selectedDeleteMarket}`);
      
      // 刷新Templates下拉列表
      const marketResponse = await fetch(`/api/ud12/selectmarket/${selectedDeleteMarket}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (marketResponse.ok) {
        const marketJson = await marketResponse.json();
        const templatesData: TemplateFile[] = marketJson.data || [];
        setTemplatesList(templatesData);
        setSelectedTemplate(""); // 清空选中的模板
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError("System error. Please contact administrator.");
    } finally {
      setLoading(false);
    }
  };

  // Check Template链接点击处理
  const handleCheckTemplateClick = () => {
    // 跳转到HDoc Template Check页面
    navigate("/HDocTemplateCheck");
  };

  return (
    <div className="upload-delete-template-container">
      {/* 页面标题 */}
      <h1 className="page-title">EDB Engineering Database - Upload Delete Template</h1>

      {/* 错误消息区域 */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* 成功消息区域 */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="loading-indicator">
          Loading...
        </div>
      )}

      {/* HDoc Template Upload区域 */}
      <div className="section-container">
        <h2 className="section-title">HDoc Template Upload</h2>
        
        <div className="form-group">
          <label htmlFor="templateFileInput" className="form-label">
            Template File
          </label>
          <input
            type="file"
            id="templateFileInput"
            className="form-control"
            onChange={handleFileChange}
            accept=".rtf,.docx,.doc"
          />
        </div>

        <div className="form-group">
          <label htmlFor="uploadMarketSelect" className="form-label">
            Market
          </label>
          <select
            id="uploadMarketSelect"
            className="form-control"
            value={selectedUploadMarket}
            onChange={handleUploadMarketChange}
          >
            <option value="">-- Select Market --</option>
            {uploadMarketList.map((market) => (
              <option key={market.marketCode} value={market.marketCode}>
                {market.marketCode} - {market.marketName}
              </option>
            ))}
          </select>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUploadClick}
            disabled={loading}
          >
            Upload file
          </button>
        </div>
      </div>

      {/* HDoc Template Delete区域 */}
      <div className="section-container">
        <h2 className="section-title">HDoc Template Delete</h2>
        
        <div className="form-group">
          <label htmlFor="deleteMarketSelect" className="form-label">
            Market
          </label>
          <select
            id="deleteMarketSelect"
            className="form-control"
            value={selectedDeleteMarket}
            onChange={handleDeleteMarketChange}
          >
            <option value="">-- Select Market --</option>
            {deleteMarketList.map((market) => (
              <option key={market.marketCode} value={market.marketCode}>
                {market.marketCode} - {market.marketName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="templateSelect" className="form-label">
            Templates
          </label>
          <select
            id="templateSelect"
            className="form-control"
            value={selectedTemplate}
            onChange={handleTemplateChange}
            disabled={!selectedDeleteMarket || templatesList.length === 0}
          >
            <option value="">-- Select Template --</option>
            {templatesList.length > 0 ? (
              templatesList.map((template) => (
                <option key={template.fileName} value={template.fileName}>
                  {template.fileName}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No templates available
              </option>
            )}
          </select>
        </div>

        <div className="button-group">
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDeleteClick}
            disabled={loading || !selectedDeleteMarket || !selectedTemplate}
          >
            Delete
          </button>
        </div>
      </div>

      {/* 底部链接 */}
      <div className="link-section">
        <a
          href="#"
          className="check-template-link"
          onClick={(e) => {
            e.preventDefault();
            handleCheckTemplateClick();
          }}
        >
          Check Template (Only for rtf files)
        </a>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
