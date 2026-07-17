import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadDeleteTemplate.css";

interface MarketItem {
  market: string;
}

interface TemplateFile {
  fileName: string;
  filePath: string;
}

const UploadDeleteTemplate: React.FC = () => {
  const [uploadMarket, setUploadMarket] = useState("");
  const [deleteMarket, setDeleteMarket] = useState("");
  const [templates, setTemplates] = useState<TemplateFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 页面初始化：加载市场列表
  useEffect(() => {
    fetchMarketList();
  }, []);

  // 获取市场列表
  const fetchMarketList = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/ud12UploadDeletetemplat/getMarketList`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch market list");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        setMarketList(data.data);
      } else {
        setErrorMessage(data.msg || "Failed to load market list");
      }
    } catch (err) {
      setErrorMessage("Failed to load market list");
    }
  };

  // 处理上传区域的市场选择变化
  const handleUploadMarketChange = (value: string) => {
    setUploadMarket(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // 处理删除区域的市场选择变化
  const handleDeleteMarketChange = async (value: string) => {
    setDeleteMarket(value);
    setSelectedTemplate("");
    setErrorMessage("");
    setSuccessMessage("");

    // 如果选择了市场，加载该市场下的模板文件列表
    if (value) {
      await fetchTemplateFiles(value);
    } else {
      setTemplates([]);
    }
  };

  // 获取指定市场下的模板文件列表
  const fetchTemplateFiles = async (marketCode: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/template/files/${marketCode}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch template files");
      }

      const result = await response.json();

      if (result.code === 200 && Array.isArray(result.data)) {
        setTemplates(result.data);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // 处理模板选择
  const handleTemplateSelect = (value: string) => {
    setSelectedTemplate(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // 上传文件功能
  const handleUpload = async () => {
    // 验证是否选择了文件
    if (!selectedFile) {
      setErrorMessage("NO FILE UPLOADED");
      return;
    }

    // 验证是否选择了市场
    if (!uploadMarket) {
      setErrorMessage("Please select a market.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 构建FormData（确保使用file对象的原始数据）
      const formData = new FormData();
      formData.append("file", selectedFile, selectedFile.name);
      formData.append("market", uploadMarket);

      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/template/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        const result = data.data;
        setSuccessMessage(
          result.message ||
            `TEMPLATE ${selectedFile.name} WAS SUCESSFULLY UPLOADED TO MARKET ${uploadMarket}`,
        );
        // 清空文件选择
        setSelectedFile(null);
        const fileInput = document.getElementById(
          "template-file-input",
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
      } else {
        setErrorMessage(data.msg || "Upload failed");
      }
    } catch (err) {
      setErrorMessage("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除模板功能
  const handleDelete = async () => {
    // 验证是否选择了市场和模板
    if (!deleteMarket || !selectedTemplate) {
      setErrorMessage("Please select market and template.");
      return;
    }

    // 显示确认对话框
    const confirmed = window.confirm("Do you really want to delete template?");
    if (!confirmed) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/template/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            market: deleteMarket,
            fileName: selectedTemplate,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Delete failed");
      }

      const data = await response.json();

      if (data.code === 200 && data.data) {
        const result = data.data;
        setSuccessMessage(
          result.message ||
            `TEMPLATE ${selectedTemplate} WAS SUCESSFULLY DELETE FROM MARKET ${deleteMarket}`,
        );
        // 刷新模板列表
        await fetchTemplateFiles(deleteMarket);
        setSelectedTemplate("");
      } else {
        setErrorMessage(data.msg || "Delete failed");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Delete failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 跳转到模板检查页面
  const handleCheckTemplate = () => {
    navigate("/hdoc-template-check");
  };

  return (
    <div className='udt-container'>
      {isLoading && (
        <div className='udt-loading-overlay'>
          <div className='udt-loading'>Uploading...</div>
        </div>
      )}
      {/* 消息显示 */}
      {errorMessage && <div className='udt-error-message'>{errorMessage}</div>}
      {successMessage && (
        <div className='udt-success-message'>{successMessage}</div>
      )}

      {/* HDoc Template Upload区域 */}
      <div className='udt-section'>
        <h2 className='udt-section-title'>HDoc Template Upload</h2>

        <div className='udt-form-group'>
          <label className='udt-label'>Template File:</label>
          <input
            id='template-file-input'
            type='file'
            className='udt-file-input'
            onChange={handleFileSelect}
            accept='.rtf,.docx,.doc,.xlsx,.xls'
          />
        </div>

        <div className='udt-form-group'>
          <label className='udt-label'>Market:</label>
          <select
            className='udt-select'
            value={uploadMarket}
            onChange={(e) => handleUploadMarketChange(e.target.value)}
          >
            <option value=''>请选择</option>
            {marketList.map((item, index) => (
              <option key={index} value={item.market}>
                {item.market}
              </option>
            ))}
          </select>
        </div>

        <div className='udt-button-row'>
          <button
            className='udt-btn'
            onClick={handleUpload}
            disabled={isLoading}
          >
            Upload file
          </button>
        </div>

        {/* 提示信息 */}
        <div className='udt-info-text'>
          Before uploading new VIN plate templates, inform
          support.tpi@volvo.com, to make sure that the connection to the cab
          factory will work.
        </div>
      </div>

      {/* HDoc Template Delete/Archive区域 */}
      <div className='udt-section'>
        <h2 className='udt-section-title'>HDoc Template Delete/Archive</h2>

        <div className='udt-form-group'>
          <label className='udt-label'>Market:</label>
          <select
            className='udt-select'
            value={deleteMarket}
            onChange={(e) => handleDeleteMarketChange(e.target.value)}
          >
            <option value=''>请选择</option>
            {marketList.map((item, index) => (
              <option key={index} value={item.market}>
                {item.market}
              </option>
            ))}
          </select>
        </div>

        <div className='udt-form-group'>
          <label className='udt-label'>Templates:</label>
          <select
            className='udt-select'
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            disabled={!deleteMarket || isLoading}
          >
            <option value=''>请选择</option>
            {templates.map((item, index) => (
              <option key={index} value={item.fileName}>
                {item.fileName}
              </option>
            ))}
          </select>
        </div>

        <div className='udt-button-row'>
          <button
            className='udt-btn'
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Check your rtf template区域 */}
      <div className='udt-section'>
        <h3 className='udt-subsection-title'>Check your rtf template</h3>

        <div className='udt-description'>
          In case you have a rtf template you should run a check on it before
          uploading it. After check download the template to your desktop and
          then upload it to your template directory. Use the link below.
        </div>

        <div className='udt-link-row'>
          <button
            type='button'
            className='udt-link'
            onClick={handleCheckTemplate}
          >
            Check Template (Only for rtf files)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
