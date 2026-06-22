import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

// 简单的日志工具（开发环境使用）
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data || "");
    }
  },
  error: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, data || "");
    }
  },
};

// API基础URL配置
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    "Content-Type": "application/json",
  },
});

// 登录请求参数接口
interface LoginRequest {
  userID: string;
  password: string;
}

// 统一API响应接口定义
interface ApiResponse<T = any> {
  code: number;
  msg?: string;
  message?: string;
  data?: T;
}

/**
 * 用户登录API（GET方式）
 * @param request 登录请求参数（userID和password）
 * @returns Promise<ApiResponse<UserInfo>>
 */
const loginApi = async (
  request: LoginRequest,
): Promise<ApiResponse<UserInfo>> => {
  try {
    // 使用GET方法，通过URL参数传递userId和password
    const response = await apiClient.get<ApiResponse<UserInfo>>(
      "/api/authentication/login",
      {
        params: {
          userId: request.userID,
          password: request.password,
        },
      },
    );

    return response.data;
  } catch (error: any) {
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response;

      // 使用后端返回的 JSON 中的 code，而非 HTTP 状态码（始终为200）
      const errorCode = data?.code || status;

      throw {
        status: errorCode,
        data: {
          code: errorCode,
          message: data?.msg || data?.message || "Authentication failed",
        },
      };
    } else if (error.request) {
      // 网络错误或超时
      throw {
        status: 0,
        data: {
          code: 0,
          message: "Network error. Please check your connection.",
        },
      };
    } else {
      // 其他错误
      throw {
        status: 500,
        data: {
          code: 500,
          message: "Unknown error",
        },
      };
    }
  }
};

// 用户信息接口定义
interface UserInfo {
  userid: string;
  username: string;
  responsible?: string;
  userposition?: string;
  email?: string;
}

const Login = () => {
  const navigate = useNavigate();
  const [userID, setUserID] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 登录处理函数
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // 前置处理：Trim
    const trimmedUserID = userID.trim();
    const trimmedPassword = password.trim();

    // 空值校验
    if (!trimmedUserID || !trimmedPassword) {
      setMessage("Username and password are required.");
      return;
    }

    // 格式校验 (UserID: 半角英数字)
    const userIDRegex = /^[a-zA-Z0-9]+$/;
    if (!userIDRegex.test(trimmedUserID)) {
      setMessage("Invalid character format.");
      return;
    }

    setIsLoading(true);

    try {
      // 调用后端 API（GET方式）
      const response = await loginApi({
        userID: trimmedUserID,
        password: trimmedPassword,
      });

      // 结果处理 - 成功
      if (response.code === 200 && response.data) {
        const userInfo = response.data;

        // 保存用户信息到 sessionStorage（后续画面可以直接使用）
        sessionStorage.setItem("userId", userInfo.userid || "");
        sessionStorage.setItem("userName", userInfo.username || "");
        sessionStorage.setItem("responsible", userInfo.responsible || "");
        sessionStorage.setItem("userPosition", userInfo.userposition || "");
        sessionStorage.setItem("email", userInfo.email || "");

        logger.info("用户信息已保存到sessionStorage:", {
          userId: userInfo.userid,
          userName: userInfo.username,
          responsible: userInfo.responsible,
          userPosition: userInfo.userposition,
          email: userInfo.email,
        });

        // 画面迁移：跳转到 Menu 一览画面
        navigate("/menu");
      } else {
        setMessage(
          "We didn't recognize the username or password you entered. Please try again.",
        );
      }
    } catch (error: any) {
      // 结果处理 - 失败
      const status = error?.status;
      const errorCode = error?.data?.code;

      // 账户锁定 (403)
      if (status === 403 || errorCode === 403) {
        setMessage(
          "Your account is locked. Please contact your system administrator.",
        );
      }
      // 认证失败 (401)
      else if (status === 401 || errorCode === 401) {
        setMessage(
          "We didn't recognize the username or password you entered. Please try again.",
        );
        // 安全要求：清空密码框
        setPassword("");
      }
      // 网络或其他错误
      else {
        setMessage("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 支持 Enter 键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin(e as any);
    }
  };

  return (
    <div className="login-container">
      <div className="content-wrapper">
        {/* 左侧标题区域 */}
        <div className="left-section">
          {/* EDB 和 Engineering Database 放在同一行容器中 */}
          <div className="title-row">
            <h1 className="main-title">EDB</h1>
            <h2 className="sub-title">Engineering Database</h2>
          </div>

          <p className="instruction-text">Use Outlook id and password</p>
          <p className="support-text">
            Support, authorization request or improvement suggestions, send mail
            to: Support TPI
          </p>
        </div>

        {/* 右侧表单区域 */}
        <div className="right-section">
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="UserID"
              value={userID}
              onChange={(e) => setUserID(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={10}
              className="input-field"
              disabled={isLoading}
              aria-label="UserID"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={32}
              className="input-field"
              disabled={isLoading}
              aria-label="Password"
            />

            {/* Message Label */}
            {message && (
              <div className="error-message" role="alert" aria-live="polite">
                {message}
              </div>
            )}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>

            {/* 底部固定提示信息 */}
            <div className="footer-info">
              <p>
                if you get error message:" Your account is locked. Please
                contact your system administrator."
              </p>
              <p>
                Please try the alternative login method or contacting support:
                Login
              </p>
              <p>We are working to find root causes of problem.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
