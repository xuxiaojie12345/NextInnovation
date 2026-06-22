import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./ModifyDocument.css";
import { getUserIdFromSession } from "../utils/sessionStorage";

// API基础URL配置
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── インターフェース定義 ────────────────────────────────────────────

/** 单个变量修改项 */
interface VariableItem {
  variableName: string;
  description: string;
  currentValue: string | null;
  modifiedValue: string | null;
}

/** Select查询响应数据 */
interface SelectVariableResponse {
  variables: VariableItem[];
}

/** 统一API响应 */
interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

/** 修改项（请求用） */
interface ModificationItem {
  variableName: string;
  newValue: string;
}

// ─── API関数 ──────────────────────────────────────────────────────

/**
 * UD05SelectVariableModification - 查询变量修改信息
 * GET /api/ud05/select-variable-modification
 */
const fetchVariableModifications = async (
  chassisNo: string,
  market: string,
): Promise<ApiResponse<SelectVariableResponse>> => {
  try {
    const response = await apiClient.get<ApiResponse<SelectVariableResponse>>(
      "/api/ud05/selectvariablemodification",
      {
        params: { chassisNo, market },
      },
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const { status, data } = error.response;
      throw {
        status,
        data: {
          code: status,
          message: data?.msg || data?.message || "API call failed",
        },
      };
    } else if (error.request) {
      throw {
        status: 0,
        data: { code: 0, message: "System timeout, please try again later." },
      };
    } else {
      throw { status: 500, data: { code: 500, message: "Unknown error" } };
    }
  }
};

/**
 * UD05UpdateHdocAdcaModification - 提交变量修改
 * POST /api/ud05/update-modification
 */
const submitModifications = async (
  chassisNo: string,
  updateUser: string,
  modifications: ModificationItem[],
): Promise<ApiResponse<void>> => {
  try {
    const response = await apiClient.post<ApiResponse<void>>(
      "/api/ud05/updatemodification",
      { chassisNo, updateUser, modifications },
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const { status, data } = error.response;
      throw {
        status,
        data: {
          code: status,
          message: data?.msg || data?.message || "Save failed",
        },
      };
    } else if (error.request) {
      throw {
        status: 0,
        data: { code: 0, message: "System timeout, please try again later." },
      };
    } else {
      throw { status: 500, data: { code: 500, message: "Unknown error" } };
    }
  }
};

// ─── コンポーネント ──────────────────────────────────────────────────

/**
 * ModifyDocument コンポーネント
 * UD05 - 用户查看VIN Plate文档变量，修改特定值并保存
 * 前画面から Chassis no, Market を渡される
 */
const ModifyDocument: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 前画面から受け取ったパラメータ
  const state =
    (location.state as {
      chassisNo?: string;
      market?: string;
    }) || {};

  const fullChassisNo = state.chassisNo || "";
  const market = state.market || "";

  // Chassis series（字母部分）和 Chassis no（数字部分） - 画面显示"XX - XXX"格式
  const chassisSeries = fullChassisNo.replace(/[0-9]/g, "");
  const chassisNumber = fullChassisNo.replace(/[A-Za-z]/g, "");

  // ステート管理
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [modifiedValues, setModifiedValues] = useState<Record<string, string>>(
    {},
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ── 4.1 画面初期化 ──
  useEffect(() => {
    const initializePage = async () => {
      if (!fullChassisNo) {
        setErrorMessage("Chassis no is required.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchVariableModifications(
          fullChassisNo,
          market,
        );

        if (response.code === 200 && response.data) {
          const items = response.data.variables || [];
          setVariables(items);

          // Modified value 列初始化：若后端返回已有修改值则填充，否则为空
          const initialValues: Record<string, string> = {};
          items.forEach((v) => {
            initialValues[v.variableName] = v.modifiedValue || "";
          });
          setModifiedValues(initialValues);
        } else {
          setErrorMessage(response.msg || "Failed to load variable data.");
        }
      } catch (error: any) {
        const message = error?.data?.message;
        if (error?.status === 0) {
          setErrorMessage("System timeout, please try again later.");
        } else {
          setErrorMessage(message || "Failed to load variable data.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializePage();
  }, [fullChassisNo, market]);

  // Modified value 変更ハンドラ
  const handleModifiedValueChange = useCallback(
    (variableName: string, value: string) => {
      setModifiedValues((prev) => ({ ...prev, [variableName]: value }));
      // 入力時にエラーメッセージをクリア
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  // ── 4.2 Save ──
  const handleSave = useCallback(async () => {
    setErrorMessage("");

    // 前端校验：检查是否至少有一个字段被修改
    const modifications: ModificationItem[] = [];
    let hasModification = false;

    for (const item of variables) {
      const newVal = (modifiedValues[item.variableName] || "").trim();

      // 单个字段超过500字符校验
      if (newVal.length > 500) {
        setErrorMessage(`Input exceeds maximum length of 500 characters.`);
        return;
      }

      if (newVal !== "") {
        modifications.push({
          variableName: item.variableName,
          newValue: newVal,
        });
        hasModification = true;
      }
    }

    // 若所有 Modified value 均为空
    if (!hasModification) {
      setErrorMessage("NO UNRELEASED VERSION EXISTS!");
      return;
    }

    setIsSaving(true);

    try {
      const updateUser = getUserIdFromSession();
      const response = await submitModifications(
        fullChassisNo,
        updateUser,
        modifications,
      );

      if (response.code === 200) {
        // 保存成功，携带 Chassis no 跳转至 Save Modifications 画面（Menu 右侧显示）
        navigate("/menu/save-modifications", {
          state: { chassisNo: fullChassisNo },
        });
      } else {
        setErrorMessage(response.msg || "Save failed.");
      }
    } catch (error: any) {
      const message = error?.data?.message;
      if (error?.status === 0) {
        setErrorMessage(
          "System error: Unable to connect to server. Please try again later.",
        );
      } else {
        setErrorMessage(message || "Save failed. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [variables, modifiedValues, fullChassisNo, navigate]);

  // Chassis no リンク → Chassis詳細画面
  const handleChassisNoClick = useCallback(() => {
    navigate("/menu/mvda-vehicle-specification", {
      state: { chassisNo: fullChassisNo },
    });
  }, [fullChassisNo, navigate]);

  // Template リンク（ダミー、実際のダウンロード機能なし）
  const handleTemplateClick = useCallback(() => {
    // 固定表示用: 实际功能不实现
  }, []);

  // Back ボタン
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // ── ローディング中 ──
  if (isLoading) {
    return (
      <div className="moddoc-page-wrapper">
        <div className="moddoc-content-area">
          <h1 className="moddoc-title">Modify Document</h1>
          <div className="moddoc-loading-msg">Loading variable data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="moddoc-page-wrapper">
      <div className="moddoc-content-area">
        <h1 className="moddoc-title">Modify Document</h1>

        {/* エラーメッセージ */}
        {errorMessage && (
          <div className="moddoc-error-msg" role="alert">
            {errorMessage}
          </div>
        )}

        {/* ヘッダー情報 */}
        <div className="moddoc-header">
          <div className="moddoc-header-row">
            <span className="moddoc-header-label">Chassis no:</span>
            <span className="moddoc-header-value">{chassisSeries}</span>
            <span className="moddoc-header-separator">-</span>
            <span
              className="moddoc-chassis-link"
              onClick={handleChassisNoClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleChassisNoClick();
              }}
            >
              {chassisNumber}
            </span>
          </div>
          <div className="moddoc-template-row">
            <span className="moddoc-header-label">Market:</span>
            <span className="moddoc-header-value">{market}</span>
          </div>
          <div className="moddoc-template-row">
            <span
              className="moddoc-template-link"
              onClick={handleTemplateClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleTemplateClick();
              }}
            >
              Template:aus/UD TEST.odt
            </span>
          </div>
        </div>

        {/* データテーブル */}
        <div className="moddoc-table-wrapper">
          {/* ボタン */}
          <div className="moddoc-button-row">
            <button
              type="button"
              className="moddoc-btn moddoc-btn-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
          <table className="moddoc-table">
            <thead>
              <th className="moddoc-th moddoc-th-variable">Variable</th>
              <th className="moddoc-th moddoc-th-desc">Description</th>
              <th className="moddoc-th moddoc-th-current">Current value</th>
              <th className="moddoc-th moddoc-th-modified">Modified value</th>
            </thead>
            <tbody>
              {variables.length > 0 ? (
                variables.map((item) => (
                  <tr key={item.variableName} className="moddoc-tr">
                    <td className="moddoc-td moddoc-td-variable">
                      {item.variableName}
                    </td>
                    <td className="moddoc-td moddoc-td-desc">
                      {item.description}
                    </td>
                    <td className="moddoc-td moddoc-td-current">
                      {item.currentValue || ""}
                    </td>
                    <td className="moddoc-td moddoc-td-modified">
                      <input
                        type="text"
                        className="moddoc-input"
                        value={modifiedValues[item.variableName] || ""}
                        onChange={(e) =>
                          handleModifiedValueChange(
                            item.variableName,
                            e.target.value,
                          )
                        }
                        maxLength={500}
                        disabled={isSaving}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="moddoc-td moddoc-no-data">
                    No variable data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModifyDocument;
