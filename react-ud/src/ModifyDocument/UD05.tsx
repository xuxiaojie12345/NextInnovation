import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { documentApi } from "../services/api";
import "./UD05.css";

// ===== 类型定义 =====

interface ModificationItem {
  variable: string;
  description: string;
  currentValue: string;
  modifiedValue: string;
}

interface UD05Data {
  chassisNo: string;
  market: string;
  templateFile: string;
  modifications: ModificationItem[];
}

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

const UD05 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const stateData = location.state as {
    chassisNo?: string;
    market?: string;
  } | null;

  const [chassisInfo, setChassisInfo] = useState<{
    chassisNo: string;
    market: string;
    templateFile: string;
  } | null>(null);
  const [modificationsList, setModificationsList] = useState<
    ModificationItem[]
  >([]);
  const [originalList, setOriginalList] = useState<ModificationItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }

    const initPage = async () => {
      const chassisNo = stateData?.chassisNo || "";
      if (!chassisNo) {
        setErrorMessage("无法加载数据，请检查输入");
        setIsLoading(false);
        return;
      }

      try {
        // 调用API获取变量修改信息
        const parts = chassisNo.split("_");
        const serie = parts[0] || chassisNo;
        const chno = parts[1] || "";
        const response = await documentApi.getSelectVariableModification({
          serie: serie,
          chno: chno,
        });

        if (response && response.data) {
          const result = response.data;
          setChassisInfo({
            chassisNo: result.chassisNo,
            market: result.market,
            templateFile: result.templateFile,
          });
          const items = result.modifications || [];
          setModificationsList(items);
          setOriginalList(JSON.parse(JSON.stringify(items)));
          setErrorMessage("");
        } else {
          setErrorMessage("数据加载失败，请稍后重试");
        }
      } catch {
        setErrorMessage("数据加载失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [navigate, stateData]);

  // ===== 输入处理 =====

  const handleModifiedValueChange = useCallback(
    (index: number, value: string) => {
      setModificationsList((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], modifiedValue: value };
        return updated;
      });
      if (errorMessage) setErrorMessage("");
    },
    [errorMessage],
  );

  // ===== 业务逻辑 =====

  const handleSave = useCallback(async () => {
    // 3.1 Step 3: 空值/变更校验
    const hasChanges = modificationsList.some((item, index) => {
      const orig = originalList[index];
      return (
        item.modifiedValue !== orig.modifiedValue || item.modifiedValue !== ""
      );
    });

    if (!hasChanges) {
      setErrorMessage("NO UNRELEASED VERSION EXISTS!");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // 构造请求体
      const changedItems = modificationsList.filter(
        (item, index) =>
          item.modifiedValue !== originalList[index].modifiedValue &&
          item.modifiedValue !== "",
      );

      await documentApi.updateHdocAdcaModification({
        chassisNo: chassisInfo?.chassisNo || "",
        market: chassisInfo?.market || "",
        templateFile: chassisInfo?.templateFile || "",
        modifications: changedItems.map((item) => ({
          variable: item.variable,
          currentValue: item.currentValue,
          modifiedValue: item.modifiedValue,
        })),
      });

      // 成功：跳转至UD06保存修改结果页面
      const parts = (stateData?.chassisNo || "").split("_");
      navigate("/UD06", {
        state: {
          chassisSerie: parts[0] || "",
          chassisNumber: parts[1] || "",
        },
      });
    } catch {
      setErrorMessage("保存失败，请检查输入内容");
    } finally {
      setIsLoading(false);
    }
  }, [modificationsList, originalList, chassisInfo, navigate]);

  const handleChassisNoClick = useCallback(() => {
    if (chassisInfo?.chassisNo) {
      navigate(`/UD07?chassisNo=${encodeURIComponent(chassisInfo.chassisNo)}`);
    }
  }, [navigate, chassisInfo]);

  const handleTemplateDownload = useCallback(() => {
    if (chassisInfo?.templateFile) {
      const link = document.createElement("a");
      link.href = `/download/template/${chassisInfo.templateFile}`;
      link.download = chassisInfo.templateFile;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [chassisInfo]);

  // ===== 加载状态 =====

  if (isLoading) {
    return (
      <div className="ud05-container">
        <div className="ud05-loading">Loading...</div>
      </div>
    );
  }

  // ===== 渲染 =====

  return (
    <div className="ud05-container">
      <header className="ud05-header">
        <div className="ud05-header-logo">VOLVO</div>
      </header>

      <main className="ud05-main">
        <div className="ud05-content-box">
          <h1 className="ud05-page-title">Modify Document</h1>

          {errorMessage && (
            <div className="ud05-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {chassisInfo && (
            <>
              {/* 基本信息 */}
              <div className="ud05-info-section">
                <div className="ud05-info-row">
                  <span className="ud05-info-label">Chassis no:</span>
                  <span
                    className="ud05-info-value ud05-link"
                    onClick={handleChassisNoClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleChassisNoClick();
                    }}
                  >
                    {chassisInfo.chassisNo}
                  </span>
                </div>
                <div className="ud05-info-row">
                  <span className="ud05-info-label">Market:</span>
                  <span className="ud05-info-value">{chassisInfo.market}</span>
                </div>
                <div className="ud05-info-row">
                  <span className="ud05-info-label">Template:</span>
                  <span
                    className="ud05-info-value ud05-link"
                    onClick={handleTemplateDownload}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTemplateDownload();
                    }}
                  >
                    {chassisInfo.templateFile}
                  </span>
                </div>
              </div>

              {/* Save 按钮（在表格上方） */}
              <div className="ud05-button-row">
                <button
                  className="ud05-btn"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>

              {/* 修改表格 */}
              <div className="ud05-table-wrapper">
                <table className="ud05-table">
                  <thead>
                    <tr>
                      <th className="ud05-th">Variable</th>
                      <th className="ud05-th">Description</th>
                      <th className="ud05-th">Current value</th>
                      <th className="ud05-th">Modified value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modificationsList.map((item, index) => (
                      <tr
                        key={index}
                        className={
                          item.modifiedValue &&
                          item.modifiedValue !==
                            originalList[index]?.modifiedValue
                            ? "ud05-row-changed"
                            : ""
                        }
                      >
                        <td className="ud05-td">{item.variable}</td>
                        <td className="ud05-td">{item.description}</td>
                        <td className="ud05-td">{item.currentValue}</td>
                        <td className="ud05-td">
                          <input
                            className="ud05-input"
                            type="text"
                            value={item.modifiedValue}
                            onChange={(e) =>
                              handleModifiedValueChange(index, e.target.value)
                            }
                            maxLength={500}
                            disabled={isLoading || !item.currentValue}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD05;
