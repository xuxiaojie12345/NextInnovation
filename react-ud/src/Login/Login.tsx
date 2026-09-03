import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// ... existing code ...

// ============================================
// AuthenticationApi（参照内部設計書 5.1 / 6. 异常处理）
// POST /api/Login/Authentication
// ============================================

/** 后端统一响应格式（LoginResponse: code / message / data） */
export interface LoginResponse {
  code: number;
  message: string;
  data: {
    token: string;
    userId: string;
    username: string;
  } | null;
}

/** API 基础地址（默认本地后端 8081，可用 .env 的 REACT_APP_API_BASE_URL 覆盖） */
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

/**
 * 调用后端登录认证 API
 * @param userID   用户ID
 * @param password 密码
 * @returns LoginResponse（code: 200 成功 / 401 认证失败 / 其他 系统错误）
 */
const authenticationApi = async (
  userID: string,
  password: string,
): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/api/Login/Authentication`,
    { userid: userID, password },
    { timeout: 10000 }, // API 超时 10 秒（对应内部設計書 6. 异常处理）
  );
  return response.data;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  // 状态管理 (对应设计书 6. 实现注意事项)
  const [userID, setUserID] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 处理 UserID 输入 (限制：半角英数字, MaxLength 10)
  const handleUserIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：只允许半角英数字
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= 10) {
      setUserID(val);
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) setMessage("");
    }
  };

  // 处理 Password 输入 (限制：半角英数字+记号, MaxLength 32)
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：允许半角英数字及常见 ASCII 符号
    if (
      /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/.test(val) &&
      val.length <= 32
    ) {
      setPassword(val);
      if (message) setMessage("");
    }
  };

  // 点击 Login 按钮触发 (对应设计书 3. 业务逻辑与校验规则)
  const handleLogin = async () => {
    // 1. 前置处理：去除首尾空格
    const trimmedUserID = userID.trim();
    const trimmedPassword = password.trim();

    // 2. 空值校验 (Frontend Check)
    if (!trimmedUserID || !trimmedPassword) {
      setMessage("Username and password are required.");
      return; // 终止流程，不调用 API
    }

    // 3. API 调用 (Backend Check)
    setIsLoading(true);
    setMessage(""); // 清除旧消息

    try {
      const result = await authenticationApi(trimmedUserID, trimmedPassword);

      if (result.code === 200) {
        // 认证成功：保存 Token 及用户信息，画面迁移至 /Menu
        localStorage.setItem("token", result.data?.token ?? "");
        localStorage.setItem("userId", result.data?.userId ?? "");
        localStorage.setItem("username", result.data?.username ?? "");
        navigate("/Menu");
      } else if (result.code === 401) {
        // 认证失败或账户锁定（对应内部設計書 6. 异常处理）
        const backendMsg = result.message || "";
        if (/lock/i.test(backendMsg)) {
          setMessage(
            "Your account is locked. Please contact your system administrator.",
          );
        } else {
          setMessage(
            backendMsg ||
              "We didn't recognize the username or password you entered. Please try again.",
          );
        }
      } else {
        // 其他错误码（如 500 系统错误）
        setMessage(result.message || "System error. Please contact support.");
      }
    } catch (error) {
      // 异常处理（对应内部設計書 6. 异常处理）
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

  return (
    <div className='login-container'>
      {/* 左側：タイトル・説明エリア（白文字） */}
      <div className='login-title-area'>
        <h1 className='login-title'>
          <span className='title-edb'>EDB</span>
          <span className='title-full'>Engineering Database</span>
        </h1>
        <p className='login-subtitle'>Use Outlook id and password</p>
        <p className='login-support'>
          Support, authorization request or improvement suggestions, send mail
          to: Support IPI
        </p>
      </div>

      {/* 右側：ログインパネル + パネル下部の赤文字 */}
      <div className='login-right'>
        <div className='login-form-area'>
          <div className='login-form'>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
            >
              {/* UserID: TextField, Input, Left Align */}
              <input
                id='userID'
                className='login-input'
                type='text'
                value={userID}
                onChange={handleUserIDChange}
                placeholder='UserID'
                aria-label='UserID'
                disabled={isLoading}
                autoComplete='username'
              />

              {/* Password: TextField, Input, Left Align, Masked */}
              <input
                id='password'
                className='login-input'
                type='password'
                value={password}
                onChange={handlePasswordChange}
                placeholder='Password'
                aria-label='Password'
                disabled={isLoading}
                autoComplete='current-password'
              />

              {/* Message Label: Output, Left Align, Red Color（Login 按钮の上に表示） */}
              {message && <div className='error-message'>{message}</div>}

              {/* Login Button: Center Align, Active/Disabled Control */}
              <button type='submit' className='login-button' disabled={isLoading}>
                {isLoading ? "Processing..." : "Login"}
              </button>
            </form>
          </div>
        </div>

        {/* パネル下部：赤色のヘルプテキスト（参照画像に準拠） */}
        <div className='login-help'>
          <p>
            If you get error message{" "}
            <span className='help-quote'>
              "Your account is locked. Please contact your system
              administrator"
            </span>
          </p>
          <p>
            Please try this alternative login link before contacting support.{" "}
            <button type='button' className='help-link'>
              Login
            </button>
          </p>
          <p>We are working to find root cause of problem</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
