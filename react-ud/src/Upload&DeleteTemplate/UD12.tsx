import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { templateApi } from "../services/api";
import "./UD12.css";

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

const UD12 = React.memo(() => {
  const navigate = useNavigate();

  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadMarket, setUploadMarket] = useState<string>("");
  // Delete
  const [deleteMarket, setDeleteMarket] = useState<string>("");
  const [deleteTemplate, setDeleteTemplate] = useState<string>("");
  const [templateOptions, setTemplateOptions] = useState<string[]>([]);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);
  // Common
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
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
        const result = await templateApi.selectMarket();
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

  // Delete Market 变化时从服务器加载模板文件列表
  useEffect(() => {
    if (!deleteMarket) {
      setTemplateOptions([]);
      setDeleteTemplate("");
      return;
    }
    const loadTemplates = async () => {
      try {
        const result = await templateApi.listTemplates(deleteMarket);
        if (result && result.code === 200 && result.data) {
          const templates = result.data.templates || result.data;
          const list = Array.isArray(templates)
            ? templates.map((t: any) => (typeof t === "string" ? t : ""))
            : [];
          setTemplateOptions(list.filter(Boolean));
        } else {
          setTemplateOptions([]);
        }
      } catch {
        setTemplateOptions([]);
      }
    };
    loadTemplates();
    setDeleteTemplate("");
  }, [deleteMarket]);

  // ===== Upload =====

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setUploadFile(file);
      setErrorMessage("");
      setSuccessMessage("");
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!uploadFile) {
      setErrorMessage("NO FILE UPLOADED");
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      setErrorMessage("文件过大，请压缩后上传");
      return;
    }

    try {
      const result = await templateApi.uploadFile(uploadFile, uploadMarket);
      if (result && result.code === 200) {
        setSuccessMessage(
          result.msg ||
            `TEMPLATE ${uploadFile.name} WAS SUCCESSFULLY UPLOADED TO MARKET ${uploadMarket}`,
        );
        setUploadFile(null);
        // 重置文件输入框
        const fileInput = document.getElementById(
          "ud12-file-input",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setErrorMessage(result?.msg || "上传失败");
      }
    } catch {
      setErrorMessage("上传失败，请稍后重试");
    }
  }, [uploadFile, uploadMarket]);

  // ===== Delete =====

  const handleDelete = useCallback(async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!deleteMarket) {
      setErrorMessage("请选择市场");
      return;
    }
    if (!deleteTemplate) {
      setErrorMessage("请选择模板");
      return;
    }
    if (!window.confirm("Do you really want to delete template?")) return;

    try {
      const result = await templateApi.deleteFile(deleteMarket, deleteTemplate);
      if (result && result.code === 200) {
        setSuccessMessage(
          result.msg ||
            `TEMPLATE ${deleteTemplate} WAS SUCCESSFULLY DELETE FROM MARKET ${deleteMarket}`,
        );
        setDeleteTemplate("");
        // 重新从服务器获取模板列表
        const refreshResult = await templateApi.listTemplates(deleteMarket);
        if (refreshResult && refreshResult.code === 200 && refreshResult.data) {
          const templates = refreshResult.data.templates || refreshResult.data;
          const list = Array.isArray(templates)
            ? templates.map((t: any) => (typeof t === "string" ? t : ""))
            : [];
          setTemplateOptions(list.filter(Boolean));
        } else {
          setTemplateOptions([]);
        }
      } else {
        setErrorMessage(result?.msg || "删除失败");
      }
    } catch {
      setErrorMessage("删除失败，请稍后重试");
    }
  }, [deleteMarket, deleteTemplate]);

  // ===== Check Template =====

  const handleCheckLink = useCallback(() => {
    navigate("/UD13");
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="ud12-container">
        <div className="ud12-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="ud12-container">
      <header className="ud12-header">
        <div className="ud12-header-logo"></div>
      </header>
      <main className="ud12-main">
        <div className="ud12-card">
          <h1 className="ud12-page-title">HDoc Template Upload</h1>

          {errorMessage && (
            <div className="ud12-message ud12-error" role="alert">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="ud12-message ud12-success">{successMessage}</div>
          )}

          {/* === Upload Section === */}
          <div className="ud12-section">
            <div className="ud12-field-row">
              <label className="ud12-label">Template File</label>
              <input
                id="ud12-file-input"
                type="file"
                onChange={handleFileChange}
              />
            </div>
            <div className="ud12-field-row">
              <label className="ud12-label">Market</label>
              <select
                className="ud12-select"
                value={uploadMarket}
                onChange={(e) => setUploadMarket(e.target.value)}
              >
                <option value="">-- Select --</option>
                {marketOptions.map((m, i) => (
                  <option key={i} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="ud12-field-row ud12-field-row-button">
              <label className="ud12-label"></label>
              <button className="ud12-btn" onClick={handleUpload}>
                Upload file
              </button>
            </div>
          </div>

          {/* === Delete Section === */}
          <p className="ud12-notice">
            Before uploading new VIN plate templates, inform{" "}
            support.tpi@volvo.com, to make sure that the connection to the cab
            factory will work.
          </p>
          <br></br>
          <h2 className="ud12-section-title">HDoc Template Delete/Archive</h2>
          <div className="ud12-section">
            <div className="ud12-field-row">
              <label className="ud12-label">Market</label>
              <select
                className="ud12-select"
                value={deleteMarket}
                onChange={(e) => setDeleteMarket(e.target.value)}
              >
                <option value="">-- Select --</option>
                {marketOptions.map((m, i) => (
                  <option key={i} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="ud12-field-row">
              <label className="ud12-label">Templates</label>
              <select
                className="ud12-select"
                value={deleteTemplate}
                onChange={(e) => setDeleteTemplate(e.target.value)}
              >
                <option value="">-- Select --</option>
                {templateOptions.map((t, i) => (
                  <option key={i} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="ud12-field-row ud12-field-row-button">
              <label className="ud12-label"></label>
              <button className="ud12-btn" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>

          {/* === Check Section === */}
          <div className="ud12-section">
            <h2 className="ud12-section-title">Check your rtf template</h2>
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
            <span
              className="ud12-check-link"
              role="button"
              tabIndex={0}
              onClick={handleCheckLink}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleCheckLink();
              }}
            >
              Check Template (Only for rtf files)
            </span>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD12;
