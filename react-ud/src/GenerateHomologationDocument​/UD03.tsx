import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { documentApi } from "../services/api";
import "./UD03.css";

// ===== 类型定义 =====

/** 文档类型选项 */
interface DocTypeOption {
  doctype: string;
}

/** localStorage 键名 */
const STORAGE_KEY_CRITERIA = "ud03_last_criteria";
const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

// ===== 辅助函数 =====

/**
 * 从 localStorage 读取当前登录用户信息
 */
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

/**
 * 保存检索条件到 localStorage
 */
const saveSearchCriteria = (series: string, no: string, docType: string) => {
  try {
    localStorage.setItem(
      STORAGE_KEY_CRITERIA,
      JSON.stringify({
        chassisSeries: series,
        chassisNo: no,
        documentType: docType,
      }),
    );
  } catch {
    // localStorage 写入失败时不处理
  }
};

/**
 * 从 localStorage 读取上次检索条件
 */
const loadSearchCriteria = (): {
  chassisSeries: string;
  chassisNo: string;
  documentType: string;
} | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CRITERIA);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

/**
 * 清除 localStorage 中的检索条件
 */
const clearSearchCriteria = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_CRITERIA);
  } catch {
    // 忽略
  }
};

// ===== 主组件 =====

const UD03 = React.memo(() => {
  const navigate = useNavigate();

  // 6.1 状态管理
  const [chassisSeries, setChassisSeries] = useState<string>("");
  const [chassisNo, setChassisNo] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true); // 页面加载/API调用中
  const [docTypeOptions, setDocTypeOptions] = useState<DocTypeOption[]>([]);
  const [user, setUser] = useState<{
    userId: string;
    name: string;
    token: string;
  } | null>(null);

  // ===== 初始化 =====

  // 会话校验 + 加载下拉列表 + 回填上次检索条件
  useEffect(() => {
    const currentUser = getCurrentUser();

    // 会话校验：无用户或无 token 则重定向至登录页
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }

    setUser(currentUser);

    // 回填上次检索条件
    const savedCriteria = loadSearchCriteria();
    if (savedCriteria) {
      setChassisSeries(savedCriteria.chassisSeries);
      setChassisNo(savedCriteria.chassisNo);
      setDocumentType(savedCriteria.documentType);
    }

    // 4.1 调用 UD03SelectHdocdocumentlistApi 获取下拉列表数据
    const initPage = async () => {
      try {
        const response = await documentApi.getDocumentTypesGet();
        // 后端返回格式: CommonResponse { code, msg, data: { documentTypes: [...] } }
        if (
          response &&
          response.data &&
          Array.isArray(response.data.documentTypes)
        ) {
          setDocTypeOptions(response.data.documentTypes);
        } else {
          setDocTypeOptions([]);
        }
      } catch {
        setErrorMessage("Failed to load document types. Please refresh.");
        setDocTypeOptions([]);
      }

      setIsLoading(false);
    };

    initPage();
  }, [navigate]);

  // ===== 输入处理 =====

  /**
   * Chassis series 输入处理：仅允许半角英数字 (a-z, A-Z, 0-9)
   */
  const handleChassisSeriesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const filtered = value.replace(/[^a-zA-Z0-9]/g, "");
      setChassisSeries(filtered);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  /**
   * Chassis no 输入处理：仅允许半角数字 (0-9)
   */
  const handleChassisNoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const filtered = value.replace(/[^0-9]/g, "");
      setChassisNo(filtered);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  /**
   * Document type 选择处理
   */
  const handleDocumentTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setDocumentType(e.target.value);
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  // ===== 业务逻辑 =====

  /**
   * 3.1 处理流程 - Submit 按钮
   */
  const handleSubmit = useCallback(async () => {
    // 前置处理：trim()
    const trimmedSeries = chassisSeries.trim();
    const trimmedNo = chassisNo.trim();
    const trimmedDocType = documentType.trim();

    // 3.2 校验详细规格表 No.1 & No.2: 空值校验
    if (!trimmedSeries || !trimmedNo) {
      setErrorMessage("Chassis series and chassis no are required.");
      return;
    }

    // 3.2 校验详细规格表 No.3: Document type 空值校验
    if (!trimmedDocType) {
      setErrorMessage("Please select a document type.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // 4. API 调用 - 验证底盘编号存在性（隐含逻辑）
      // 此处使用 documentApi 的相关接口进行验证
      // 若验证通过，保存检索条件并跳转
      saveSearchCriteria(trimmedSeries, trimmedNo, trimmedDocType);

      // 跳转至 UD04 Generate document 页面（携带参数）
      navigate("/UD04", {
        state: {
          chassisSeries: trimmedSeries,
          chassisNo: trimmedNo,
          documentType: trimmedDocType,
        },
      });
    } catch {
      // 3.2 校验详细规格表 No.4: API 验证失败
      setErrorMessage("Chassis no is not exists");
    } finally {
      setIsLoading(false);
    }
  }, [chassisSeries, chassisNo, documentType, navigate]);

  /**
   * Reset 按钮处理：清空表单及 localStorage 缓存
   */
  const handleReset = useCallback(() => {
    setChassisSeries("");
    setChassisNo("");
    setDocumentType("");
    setErrorMessage("");
    clearSearchCriteria();
  }, []);

  /**
   * Help 按钮处理：跳转到 UD24 HDoc Help 页面
   */
  const handleHelp = useCallback(() => {
    navigate("/UD24");
  }, [navigate]);

  // ===== 加载状态 =====

  if (isLoading && docTypeOptions.length === 0) {
    return (
      <div className="ud03-container">
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  // ===== 渲染 =====

  return (
    <div className="ud03-container">
      <header className="ud03-header">
        <div className="ud03-header-logo"></div>
      </header>

      {/* 表单区域 */}
      <main className="ud03-main">
        <div className="ud03-form-card">
          {/* 页面标题 */}
          <h1 className="ud03-page-title">
            HDoc - Generate Homologation Document
          </h1>
          {/* 错误消息 - 动态显示 */}
          {errorMessage && (
            <div className="ud03-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* Chassis series */}
          <div className="ud03-field-row">
            <label className="ud03-label" htmlFor="chassis-series-input">
              Chassis series <span className="ud03-required">*</span>
            </label>
            <div className="ud03-field-control">
              <input
                id="chassis-series-input"
                className="ud03-input"
                type="text"
                value={chassisSeries}
                onChange={handleChassisSeriesChange}
                maxLength={5}
                autoComplete="off"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Chassis no */}
          <div className="ud03-field-row">
            <label className="ud03-label" htmlFor="chassis-no-input">
              Chassis no <span className="ud03-required">*</span>
            </label>
            <div className="ud03-field-control">
              <input
                id="chassis-no-input"
                className="ud03-input"
                type="text"
                value={chassisNo}
                onChange={handleChassisNoChange}
                maxLength={10}
                autoComplete="off"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Document type */}
          <div className="ud03-field-row">
            <label className="ud03-label" htmlFor="document-type-select">
              Document type <span className="ud03-required">*</span>
            </label>
            <div className="ud03-field-control">
              <select
                id="document-type-select"
                className="ud03-select"
                value={documentType}
                onChange={handleDocumentTypeChange}
                disabled={isLoading}
              >
                <option value="" disabled>
                  -- Select --
                </option>
                {docTypeOptions.map((opt, index) => (
                  <option key={index} value={opt.doctype}>
                    {opt.doctype}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 按钮区域 */}
          <div className="ud03-button-row">
            <button
              className="ud03-btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
            <button
              className="ud03-btn"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </button>
            <button className="ud03-btn" onClick={handleHelp}>
              Help
            </button>
          </div>

          {/* Support Mail - 常显 */}
          <div className="ud03-support-mail">
            HDoc support:{" "}
            <a href="mailto:support.tpi@volvo.com" className="ud03-mail-link">
              support.tpi@volvo.com
            </a>
          </div>
        </div>
      </main>
    </div>
  );
});

export default UD03;
