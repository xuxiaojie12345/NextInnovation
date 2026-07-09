import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { edbUserApi } from "../../services/api";
import "./UD25.css";

// ===== 类型定义 =====

interface UserInfo {
  userid: string;
  responsible: string;
  userPosition: string;
  email: string;
}

const STORAGE_KEY_USER = "user_info";
const STORAGE_KEY_TOKEN = "auth_token";

// ===== 辅助函数 =====

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

// ===== 主组件 =====

const UD25 = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // 从 URL 参数获取 userid
  const queryParams = new URLSearchParams(location.search);
  const userIdFromQuery = queryParams.get("userid") || "";

  // ===== 状态管理 =====
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!userIdFromQuery);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // ===== 初始化 =====

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.token) {
      navigate("/UD01", { replace: true });
      return;
    }
  }, [navigate]);

  // URL 有 userid 时自动加载
  useEffect(() => {
    if (userIdFromQuery) {
      loadUserInfo(userIdFromQuery);
    }
  }, [userIdFromQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== 业务逻辑 =====

  const loadUserInfo = async (id: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await edbUserApi.getUserInfo(id.trim());

      if (result && result.code === 200 && result.data) {
        const data = result.data;
        setUserInfo({
          userid: data.userid || "",
          responsible: data.responsible || "",
          userPosition: data.userPosition || "",
          email: data.email || "",
        });
      } else {
        setErrorMessage(result?.msg || "用户不存在");
      }
    } catch (err: any) {
      if (err.message?.includes("404")) {
        setErrorMessage("用户不存在");
      } else {
        setErrorMessage("无法加载用户信息，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /** 清空按钮处理 */
  const handleClear = useCallback(() => {
    setUserInfo(null);
    setErrorMessage("");
  }, []);

  /** 返回按钮处理 */
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // ===== 加载状态 =====

  if (isLoading) {
    return (
      <div className="ud25-container">
        <div className="ud25-loading">Loading...</div>
      </div>
    );
  }

  // ===== 渲染 =====

  return (
    <div className="ud25-container">
      <main className="ud25-main">
        <div className="ud25-card">
          <h1 className="ud25-page-title">EDB User View</h1>

          {/* 错误消息 */}
          {errorMessage && (
            <div className="ud25-error-message" role="alert">
              {errorMessage}
            </div>
          )}

          {/* 按钮区域 - 置于表单顶部 */}
          <div className="ud25-button-row">
            <button className="ud25-btn" onClick={handleClear}>
              Clear
            </button>
            <button className="ud25-btn" onClick={handleBack}>
              Back
            </button>
          </div>

          {/* 用户信息展示 */}
          {userInfo && (
            <div className="ud25-info-section">
              <div className="ud25-field-row">
                <span className="ud25-field-label">Userid</span>
                <span className="ud25-field-value">{userInfo.userid}</span>
              </div>
              <div className="ud25-field-row">
                <span className="ud25-field-label">Responsible</span>
                <span className="ud25-field-value">{userInfo.responsible}</span>
              </div>
              <div className="ud25-field-row">
                <span className="ud25-field-label">User Position</span>
                <span className="ud25-field-value">
                  {userInfo.userPosition}
                </span>
              </div>
              <div className="ud25-field-row">
                <span className="ud25-field-label">E-mail</span>
                <span className="ud25-field-value">
                  <a
                    href={`mailto:${userInfo.email}`}
                    className="ud25-email-link"
                  >
                    {userInfo.email}
                  </a>
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

export default UD25;
