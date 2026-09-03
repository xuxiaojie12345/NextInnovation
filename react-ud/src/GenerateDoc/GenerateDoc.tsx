import React, { useEffect, useState } from "react";
import "./GenerateDoc.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ============================================
// UD03SelectHdocdocumentlistApi（参照内部設計書 6.1 / 7. 异常处理）
// POST /api/GenerateDocument/UD03SelectHdocdocumentlist
// ============================================

/** 后端统一响应格式（UD03SelectHdocdocumentlistResponse: code / message / data） */
export interface GenerateDocResponse {
  code: number;
  message: string;
  data: {
    documentTypeList: string[];
  } | null;
}

/** API 基础地址（默认本地后端 8081，可用 .env 的 REACT_APP_API_BASE_URL 覆盖） */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

/** localStorage 键：保存上次检索条件（内部設計 3：默认显示上次条件） */
const STORAGE_KEY = "generateDocConditions";

/** 上次检索条件 */
interface StoredConditions {
  chassisSeries: string;
  chassisNo: string;
  documentType: string;
}

/**
 * 调用后端 DocumentType 取得 API
 * @returns GenerateDocResponse（code: 200 成功 / 401 认证失败 / 其他 系统错误）
 */
const fetchDocumentTypeApi = async (): Promise<GenerateDocResponse> => {
  const response = await axios.post<GenerateDocResponse>(
    `${API_BASE_URL}/api/GenerateDocument/UD03SelectHdocdocumentlist`,
    {},
    { timeout: 10000 }, // API 超时 10 秒（对应内部設計書 7. 异常处理）
  );
  return response.data;
};

/** 从 localStorage 读取上次检索条件（内部設計 3：默认显示上次条件） */
const loadStoredConditions = (): StoredConditions => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as StoredConditions;
    }
  } catch {
    // 忽略解析错误，使用空默认值
  }
  return { chassisSeries: "", chassisNo: "", documentType: "" };
};

/** 保存检索条件到 localStorage（内部設計 3：默认显示上次条件） */
const saveStoredConditions = (conditions: StoredConditions): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));
  } catch {
    // 忽略保存失败
  }
};

/**
 * 文档生成检索画面コンポーネント（Generate Homologation Document）
 *
 * Props:
 * - onShowHelp?: () => void —— 点击 Help 按钮时的回调，用于在 Menu 右侧内容区域
 *   （与本画面同一位置）显示 [Help] 画面（内部設計 4.4 / 5.4）
 *
 * 機能：
 * - 初期表示：调用 API [UD03SelectHdocdocumentlist] 获取 Document type 下拉列表（内部設計 4.1 / 5.1）
 * - Submit：校验必须项目后，将数据传入画面 [Generate document] 并迁移（内部設計 4.2 / 5.2）
 * - Reset：清除画面数据并重新进行初期表示（内部設計 4.3 / 5.3）
 * - Help：在相同位置显示 [Help] 画面（内部設計 4.4 / 5.4）
 */
interface GenerateDocProps {
  /** 点击 Help 按钮时显示 [Help] 画面的回调（与本画面同一位置） */
  onShowHelp?: () => void;
}

const GenerateDoc: React.FC<GenerateDocProps> = ({ onShowHelp }) => {
  const navigate = useNavigate();

  // 画面入力値（内部設計 3. 画面項目定义）
  const [chassisSeries, setChassisSeries] = useState<string>("");
  const [chassisNo, setChassisNo] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");
  const [documentTypeList, setDocumentTypeList] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 初期表示（内部設計 4.1 / 5.1）
   * 1. 读取上次检索条件作为各項目默认值（内部設計 3）
   * 2. 调用 API [UD03SelectHdocdocumentlist] 获取 DocumentType 数据
   * 3. 将获取的数据放入 [Document type] 下拉框
   */
  useEffect(() => {
    // 读取上次检索条件（内部設計 3：默认显示上次条件）
    const stored = loadStoredConditions();
    setChassisSeries(stored.chassisSeries);
    setChassisNo(stored.chassisNo);
    setDocumentType(stored.documentType);

    const loadDocumentTypes = async () => {
      setIsLoading(true);
      try {
        // API 调用（内部設計 5.1：初期表示）
        const result = await fetchDocumentTypeApi();
        if (result.code === 200 && result.data) {
          // 将 API 返回的数据放入 [Document type]（内部設計 5.1）
          setDocumentTypeList(result.data.documentTypeList);
        } else if (result.code === 401) {
          // 认证失败（对应内部設計書 7. 异常处理）
          setMessage(
            "Your account is locked. Please contact your system administrator.",
          );
        } else {
          // 其他错误码（如 500 系统错误）
          setMessage(result.message || "System error. Please contact support.");
        }
      } catch (error) {
        // 异常处理（对应内部設計書 7. 异常处理）
        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            // API 超时
            setMessage("Request timeout. Please try again.");
          } else if (!error.response) {
            // 网络异常（后端未启动 / 无法连接）
            setMessage(
              "Network error. Please check your connection and try again.",
            );
          } else {
            // 服务器返回异常
            setMessage("System error. Please contact support.");
          }
        } else {
          setMessage("System error. Please contact support.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDocumentTypes();
    // 初期表示时仅执行一次（内部設計 4.1）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 处理 Chassis series 输入（内部設計 3：半角数字, MaxLength 5）
  const handleChassisSeriesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：只允许半角数字
    if (/^[0-9]*$/.test(val) && val.length <= 5) {
      setChassisSeries(val);
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) setMessage("");
    }
  };

  // 处理 Chassis no 输入（内部設計 3：半角数字, MaxLength 10）
  const handleChassisNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：只允许半角数字
    if (/^[0-9]*$/.test(val) && val.length <= 10) {
      setChassisNo(val);
      if (message) setMessage("");
    }
  };

  // 处理 Document type 选择（内部設計 3：半角英数字 + 記号，值来自下拉列表）
  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
    if (message) setMessage("");
  };

  /**
   * Reset 按钮处理（内部設計 4.3 / 5.3）
   * 1. 清除画面中的数据
   * 2. 重新进行初期表示（重新调用 API 获取 Document type）
   */
  const handleReset = () => {
    setChassisSeries("");
    setChassisNo("");
    setDocumentType("");
    setMessage("");
  };

  /**
   * Help 按钮处理（内部設計 4.4 / 5.4）
   * 在本画面相同位置显示 [Help] 画面（Menu 右侧内容区域），
   * 若未提供 onShowHelp 回调（独立页面访问时）则跳转至 /Help 路由。
   */
  const handleHelp = () => {
    if (onShowHelp) {
      // 在 Menu 右侧内容区域（与本画面同一位置）显示 [Help] 画面
      onShowHelp();
    } else {
      navigate("/Help");
    }
  };

  /**
   * Submit 按钮处理（内部設計 4.2 / 5.2）
   * 1. 获取画面入力的 [Chassis series] 和 [Chassis no]
   * 2. 校验必须项目（内部設計 3）
   * 3. 将数据传入画面 [Generate document] 并迁移
   */
  const handleSubmit = () => {
    // 必须项目校验（内部設計 3：Chassis series / Chassis no / Document type）
    if (!chassisSeries.trim()) {
      setMessage("Chassis series is required.");
      return;
    }
    if (!chassisNo.trim()) {
      setMessage("Chassis no is required.");
      return;
    }
    if (!documentType) {
      setMessage("Document type is required.");
      return;
    }

    // 保存上次检索条件（内部設計 3：默认显示上次条件）
    saveStoredConditions({
      chassisSeries: chassisSeries.trim(),
      chassisNo: chassisNo.trim(),
      documentType,
    });

    // 将数据传入画面 [Generate document] 并迁移（内部設計 4.2 / 5.2）
    navigate("/GenerateDocument", {
      state: {
        chassisSeries: chassisSeries.trim(),
        chassisNo: chassisNo.trim(),
        documentType,
      },
    });
  };

  return (
    <div className="generate-doc-container">
      {/* タイトル（画像：左上に太字ダークブルー） */}
      <h2 className="generate-doc-title">
        HDoc - Generate Homologation Document
      </h2>

      {/* メインフォーム枠（画像：細いライトブルー枠 + 白背景） */}
      <div className="generate-doc-form">
        {/* 項目定義（内部設計 3：Chassis series / Chassis no / Document type） */}
        <div className="form-row">
          <label className="form-label" htmlFor="chassisSeries">
            Chassis series
          </label>
          <input
            id="chassisSeries"
            className="form-input"
            type="text"
            value={chassisSeries}
            onChange={handleChassisSeriesChange}
            placeholder=""
            disabled={isLoading}
            maxLength={5}
          />
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="chassisNo">
            Chassis no
          </label>
          <input
            id="chassisNo"
            className="form-input"
            type="text"
            value={chassisNo}
            onChange={handleChassisNoChange}
            placeholder=""
            disabled={isLoading}
            maxLength={10}
          />
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="documentType">
            Document type
          </label>
          <select
            id="documentType"
            className="form-input form-select"
            value={documentType}
            onChange={handleDocumentTypeChange}
            disabled={isLoading}
          >
            <option value="">-- Select --</option>
            {documentTypeList.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* error message area（内部設計 3：仅在出错时显示红色文字） */}
        {message && <div className="error-message">{message}</div>}

        {/* フッターバー（画像：ライトブルーグレー帯 + グレーボタン） */}
        <div className="form-footer">
          <button
            type="button"
            className="footer-button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Submit
          </button>
          <button
            type="button"
            className="footer-button"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </button>
          <button type="button" className="footer-button" onClick={handleHelp}>
            Help
          </button>
        </div>
      </div>

      {/* Support Mail（内部設計 3 / 画像：枠外下部に黒文字） */}
      <p className="support-mail">HDoc support: support.tpi@volvo.com</p>
    </div>
  );
};

export default GenerateDoc;
