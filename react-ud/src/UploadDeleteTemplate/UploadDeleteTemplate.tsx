import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import "../common/css/common.css";
import "./UploadDeleteTemplate.css";

interface TemplateFile {
  filename: string;
  size: string;
  lastMod: string;
}

const UploadDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();

  // ── Upload 区域状态 ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMarket, setUploadMarket] = useState("");

  // ── Delete 区域状态 ──
  const [deleteMarket, setDeleteMarket] = useState("");
  const [templates, setTemplates] = useState<TemplateFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // ── 共用状态 ──
  const [markets, setMarkets] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── 加载 Market 下拉数据 ──
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post<{ marketList: string[] }>(
          "/template/selectMarket",
          {},
        );
        if (res.code === 200 && res.data) {
          setMarkets(res.data.marketList || []);
        }
      } catch {
        setMessage("System error. Please contact administrator.");
      }
    })();
  }, []);

  // ── Delete Market 变更时加载 Templates ──
  useEffect(() => {
    if (!deleteMarket) {
      setTemplates([]);
      setSelectedTemplate("");
      return;
    }
    (async () => {
      try {
        const res = await api.post<{ templateList: TemplateFile[] }>(
          "/template/listTemplates",
          {
            market: deleteMarket,
          },
        );
        if (res.code === 200 && res.data) {
          setTemplates(res.data.templateList || []);
        }
        setSelectedTemplate("");
      } catch {
        setTemplates([]);
      }
    })();
  }, [deleteMarket]);

  // ── 消息 ──
  const clearMessages = () => {
    setMessage("");
    setSuccessMessage("");
  };

  // ── 文件选择 ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  // ── 上传 ──
  const handleUpload = async () => {
    clearMessages();

    if (!selectedFile) {
      setMessage("NO FILE UPLOADED");
      return;
    }
    if (!uploadMarket) {
      setMessage("NO Market UPLOADED");
      return;
    }

    // 文件大小校验（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setMessage("File size exceeds 10MB limit. Please select a smaller file.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("market", uploadMarket);

      const res = await api.uploadFile("/template/upload", formData);
      if (res.code === 200) {
        const fileName = selectedFile.name;
        setSuccessMessage(
          `TEMPLATE ${fileName} WAS SUCCESSFULLY UPLOADED TO MARKET ${uploadMarket}`,
        );
        setSelectedFile(null);
        // 重置文件输入框
        const fileInput = document.getElementById(
          "templateFile",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setMessage(res.message || "File upload failed. Please try again.");
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 删除 ──
  const handleDelete = async () => {
    clearMessages();

    if (!deleteMarket || !selectedTemplate) {
      setMessage("Please select both market and template.");
      return;
    }

    if (!window.confirm("Do you really want to delete template?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/template/delete", {
        fileName: selectedTemplate,
        market: deleteMarket,
      });
      if (res.code === 200) {
        setSuccessMessage(
          `TEMPLATE ${selectedTemplate} WAS SUCCESSFULLY DELETED FROM MARKET ${deleteMarket}`,
        );
        setSelectedTemplate("");
        // 刷新模板列表
        const listRes = await api.post<{ templateList: TemplateFile[] }>(
          "/template/listTemplates",
          {
            market: deleteMarket,
          },
        );
        if (listRes.code === 200 && listRes.data) {
          setTemplates(listRes.data.templateList || []);
        }
      } else {
        setMessage(res.message || "File deletion failed. Please try again.");
      }
    } catch {
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── 跳转到 HDoc Template Check 页面 ──
  const handleCheckTemplate = () => {
    navigate("/menu/hdoc-template-check");
  };

  return (
    <div className="udt-container panel panel-w700">
      {message && <div className="udt-error msg-error">{message}</div>}
      {successMessage && <div className="udt-success msg-success">{successMessage}</div>}

      {/* ═══════ Upload 区域 ═══════ */}
      <div className="udt-section">
        <h2 className="udt-section-title">HDoc Template Upload</h2>
        <table className="udt-form-table">
          <tbody>
            <tr>
              <td className="udt-label">Template File：</td>
              <td className="udt-value">
                <input
                  id="templateFile"
                  type="file"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </td>
            </tr>
            <tr>
              <td className="udt-label">Market：</td>
              <td className="udt-value">
                <select
                  className="udt-select"
                  value={uploadMarket}
                  onChange={(e) => setUploadMarket(e.target.value)}
                  disabled={isLoading}
                >
                  <option value=""></option>
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr className="udt-btn-row">
              <td className="udt-value">
                <button
                  className="btn"
                  onClick={handleUpload}
                  disabled={isLoading}
                >
                  Upload file
                </button>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="udt-notice">
        Before uploading new wIN plate templates, inform support.tpi@123.com
        <br />
        to make sure that the connection to the cab factory will work.
      </div>

      <div style={{ height: "60px" }}></div>

      {/* ═══════ Delete 区域 ═══════ */}
      <div className="udt-section">
        <h2 className="udt-section-title">HDoc Template Delete/Archive</h2>
        <table className="udt-form-table">
          <tbody>
            <tr>
              <td className="udt-label">Market：</td>
              <td className="udt-value">
                <select
                  className="udt-select"
                  value={deleteMarket}
                  onChange={(e) => setDeleteMarket(e.target.value)}
                  disabled={isLoading}
                >
                  <option value=""></option>
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td className="udt-label">Templates：</td>
              <td className="udt-value">
                <select
                  className="udt-select"
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value=""></option>
                  {templates.map((t) => (
                    <option key={t.filename} value={t.filename}>
                      {t.filename}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr className="udt-btn-row">
              <td className="udt-value">
                <button
                  className="btn"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  Delete
                </button>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ═══════ 链接 ═══════ */}
      <div className="udt-check-info">
        <p>Check your rtf template</p>
        <p>
          In case you have a rtf template you should run a check on it before
          uploading it.
          <br />
          After check download the template to your desktop and then upload it
          to your template directory.
          <br />
          Use the link bellow.
        </p>
      </div>
      <div className="udt-link-area">
        <span className="udt-link" onClick={handleCheckTemplate}>
          Check Template (Only for rtf files)
        </span>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
