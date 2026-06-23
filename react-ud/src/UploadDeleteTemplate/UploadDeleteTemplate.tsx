import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UploadDeleteTemplate.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

const UploadDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();

  // Upload area
  const [uploadMarket, setUploadMarket] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete area
  const [deleteMarket, setDeleteMarket] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Common
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 8000);
  };

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await apiClient.get<ApiResponse<{ market: string }[]>>(
          "/api/ud12uploaddeletetemplat/selectmarketmaster",
        );
        if (res.data.code === 200 && res.data.data) {
          const options = res.data.data.map((item) => item.market);
          setMarketOptions(options);
        }
      } catch (error: any) {
        showMessage(
          error?.response?.data?.message || "获取市场列表失败",
          "error",
        );
      }
    };
    fetchMarkets();
  }, []);

  // Load templates when delete market changes
  useEffect(() => {
    if (!deleteMarket) {
      setTemplates([]);
      setSelectedTemplate("");
      return;
    }
    const fetchTemplates = async () => {
      try {
        const res = await apiClient.get<ApiResponse<string[]>>(
          "/api/ud12uploaddeletetemplat/listtemplates",
          { params: { market: deleteMarket } },
        );
        if (res.data.code === 200 && res.data.data) {
          setTemplates(res.data.data);
          setSelectedTemplate("");
        }
      } catch (_) {
        setTemplates([]);
      }
    };
    fetchTemplates();
  }, [deleteMarket]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      showMessage("NO FILE UPLOADED", "error");
      return;
    }
    if (!uploadMarket) {
      showMessage("请选择目标市场", "error");
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("market", uploadMarket);
      const res = await apiClient.post<ApiResponse>(
        "/api/ud12uploaddeletetemplat/uploadfile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (res.data.code === 200) {
        showMessage(res.data.msg || "上传成功", "success");
        setUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        showMessage(res.data.msg || "上传失败", "error");
      }
    } catch (error: any) {
      showMessage(error?.response?.data?.msg || "上传失败", "error");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMarket) {
      showMessage("请选择目标市场", "error");
      return;
    }
    if (!selectedTemplate) {
      showMessage("请选择要删除的模板", "error");
      return;
    }
    if (!window.confirm("Do you really want to delete template?")) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.post<ApiResponse>(
        "/api/ud12uploaddeletetemplat/deletefile",
        {
          market: deleteMarket,
          template: selectedTemplate,
        },
      );
      if (res.data.code === 200) {
        showMessage(res.data.msg || "删除成功", "success");
        setSelectedTemplate("");
        // Refresh template list
        const refreshRes = await apiClient.get<ApiResponse<string[]>>(
          "/api/ud12uploaddeletetemplat/listtemplates",
          { params: { market: deleteMarket } },
        );
        if (refreshRes.data.code === 200)
          setTemplates(refreshRes.data.data || []);
      } else {
        showMessage(res.data.msg || "删除失败", "error");
      }
    } catch (error: any) {
      showMessage(error?.response?.data?.msg || "删除失败", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isRtf = selectedTemplate.toLowerCase().endsWith(".rtf");

  return (
    <div className="ud12-page-wrapper">
      <div className="ud12-container">
        <h1 className="ud12-title">Upload/Delete Template</h1>

        {message && (
          <div className={`ud12-message ud12-message-${messageType}`}>
            {message}
          </div>
        )}

        {/* Upload Area */}
        <div className="ud12-section">
          <h2 className="ud12-section-title">HDoc Template Upload</h2>
          <div className="ud12-field">
            <span className="ud12-label">Template File</span>
            <input
              type="file"
              className="ud12-file-input"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>
          <div className="ud12-field">
            <span className="ud12-label">Market</span>
            <select
              className="ud12-select"
              value={uploadMarket}
              onChange={(e) => setUploadMarket(e.target.value)}
            >
              <option value=""></option>
              {marketOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="ud12-btn"
            onClick={handleUpload}
            disabled={uploadLoading}
          >
            {uploadLoading ? "Uploading..." : "Upload file"}
          </button>
        </div>

        {/* Delete Area */}
        <div className="ud12-section">
          <h2 className="ud12-section-title">HDoc Template Delete</h2>
          <div className="ud12-field">
            <span className="ud12-label">Market</span>
            <select
              className="ud12-select"
              value={deleteMarket}
              onChange={(e) => setDeleteMarket(e.target.value)}
            >
              <option value=""></option>
              {marketOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="ud12-field">
            <span className="ud12-label">Templates</span>
            <select
              className="ud12-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value=""></option>
              {templates.map((tpl) => (
                <option key={tpl} value={tpl}>
                  {tpl}
                </option>
              ))}
            </select>
          </div>
          <div className="ud12-actions">
            <button
              type="button"
              className="ud12-btn"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>
            {isRtf && (
              <span
                className="ud12-check-link"
                onClick={() => navigate("/menu/hdoc-template-check")}
              >
                Check Template (Only for rtf files)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
