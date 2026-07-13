import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./EdbUserView.css";

/** 与后端 UserInfo 实体的字段名一致 */
interface UserInfo {
  userId: string;
  username: string;
  responsible: string;
  userposition: string;
  eMmail: string;
}

const API_BASE_URL = "http://localhost:8081";

const EdbUserView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // 优先从route state获取userid，否则从URL参数获取
  const userid =
    (location.state as { userid?: string })?.userid || username || "";

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (userid) {
      fetchUserInfo();
    } else {
      setErrorMessage("用户未登录或会话已过期，请重新登录");
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/user/${encodeURIComponent(userid)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user information");
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setUserInfo(result.data);
      } else if (result.code === 404) {
        // 未找到用户，字段显示为空
        setUserInfo(null);
      } else {
        setErrorMessage(result.msg || "获取用户信息失败");
        setUserInfo(null);
      }
    } catch (error) {
      // 网络异常或系统调用失败，字段显示为空
      setUserInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUserInfo(null);
    setErrorMessage("");
  };

  const handleBack = () => {
    try {
      navigate(-1);
    } catch {
      setErrorMessage("页面跳转失败，请刷新页面重试");
    }
  };

  return (
    <div className='euv-container'>
      <h1 className='euv-title'>EDB User View</h1>

      {errorMessage && <div className='euv-error-message'>{errorMessage}</div>}

      <div className='euv-border-box'>
        {isLoading ? (
          <div className='euv-loading'>Loading...</div>
        ) : (
          <div className='euv-form'>
            <div className='euv-button-bar'>
              <button
                className='euv-btn'
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </button>
              <button
                className='euv-btn'
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
            </div>
            <div className='euv-field-row'>
              <label className='euv-label'>Userid</label>
              <select className='euv-operator-select'>
                <option value='='>=</option>
                <option value='<'>&lt;</option>
                <option value='>'>&gt;</option>
              </select>
              <input
                type='text'
                className='euv-input euv-input-short'
                value={userInfo?.userId || userid || ""}
                readOnly
              />
            </div>
            <div className='euv-field-row'>
              <label className='euv-label'>Responsible</label>
              <select className='euv-operator-select'>
                <option value='='>=</option>
                <option value='<'>&lt;</option>
                <option value='>'>&gt;</option>
              </select>
              <input
                type='text'
                className='euv-input euv-input-medium'
                value={userInfo?.responsible || ""}
                readOnly
              />
            </div>
            <div className='euv-field-row'>
              <label className='euv-label'>User Position</label>
              <select className='euv-operator-select'>
                <option value='='>=</option>
                <option value='<'>&lt;</option>
                <option value='>'>&gt;</option>
              </select>
              <input
                type='text'
                className='euv-input euv-input-medium'
                value={userInfo?.userposition || ""}
                readOnly
              />
            </div>
            <div className='euv-field-row'>
              <label className='euv-label'>E-mail</label>
              <select className='euv-operator-select'>
                <option value='='>=</option>
                <option value='<'>&lt;</option>
                <option value='>'>&gt;</option>
              </select>
              <input
                type='text'
                className='euv-input euv-input-long'
                value={userInfo?.eMmail || ""}
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EdbUserView;
