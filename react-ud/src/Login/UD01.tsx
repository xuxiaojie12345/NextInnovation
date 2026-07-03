import React, { useState, useEffect } from "react";
import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./UD01.css";

// 类型定义
interface LoginResponse {
  code: number;
  msg: string;
  user: {
    userId: string;
    name: string;
    password: string;
  };
}

const UD01: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 自动聚焦 UserID
  useEffect(() => {
    const input = document.getElementById("userid-input");
    if (input) input.focus();
  }, []);

  // 【修正】处理 UserID 输入：只允许半角英数字
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 正则表达式：只保留 a-z, A-Z, 0-9
    const filteredValue = value.replace(/[^a-zA-Z0-9]/g, "");
    setUserId(filteredValue);

    // 当用户开始重新输入时，清除之前的错误消息（可选优化体验）
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // 处理 Password 输入
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // 核心登录逻辑
  const handleLogin = async () => {
    // 1. 前置处理：Trim (虽然输入时已过滤，但以防粘贴带空格的情况，再次trim)
    const trimmedUserId = userId.trim();
    const trimmedPassword = password.trim();

    // 2. 空值校验 (Frontend Check)
    if (!trimmedUserId || !trimmedPassword) {
      setErrorMessage("Username and password are required.");
      return;
    }

    // 清空错误，开始加载
    setErrorMessage("");
    setIsLoading(true);

    try {
      // 3. API 调用 (Backend Check)
      const response = await axios.post<LoginResponse>(
        "/api/AuthenticationApi/login",
        {
          userId: trimmedUserId,
          password: trimmedPassword,
        },
      );

      // 4. 结果处理 - 成功
      if (response.data && response.data.code === 200) {
        console.log("=== 登录成功，准备保存数据 ===");
        console.log("response.data.user:", response.data);
        console.log("response.data:", response.data);

        // 检查 user 对象是否存在且有效
        if (!response.data) {
          console.error("错误：后端返回的 user 对象为空");
          setErrorMessage("登录失败：用户信息不完整");
          setIsLoading(false);
          return;
        }

        // 保存用户信息到 localStorage（UD02 需要读取）
        const userInfoStr = JSON.stringify(response.data);
        console.log("保存到 localStorage 的 user_info:", userInfoStr);
        localStorage.setItem("user_info", userInfoStr);

        console.log("保存到 localStorage 的 auth_token:", trimmedUserId);
        localStorage.setItem("auth_token", trimmedUserId); // 使用 userId 作为 token

        // 验证保存是否成功
        const savedUserInfo = localStorage.getItem("user_info");
        const savedToken = localStorage.getItem("auth_token");
        console.log("验证 - 读取到的 user_info:", savedUserInfo);
        console.log("验证 - 读取到的 auth_token:", savedToken);

        // 跳转到 UD02 主菜单页面
        navigate("/UD02");
      } else {
        setErrorMessage(
          "We didn't recognize the username or password you entered. Please try again.",
        );
        setPassword(""); // 清空密码
      }
    } catch (error: any) {
      // 5. 结果处理 - 失败
      if (error.response) {
        const status = error.response.status;
        const serverMsg = error.response.data?.message;

        if (status === 401 || status === 403) {
          if (serverMsg && serverMsg.toLowerCase().includes("locked")) {
            setErrorMessage("您的账户已被锁定，请联系系统管理员");
          } else {
            setErrorMessage(
              "We didn't recognize the username or password you entered. Please try again.",
            );
          }
          setPassword("");
        } else if (status === 500) {
          setErrorMessage("System error. Please contact administrator.");
        } else {
          setErrorMessage(serverMsg || "Login failed. Please try again.");
        }
      } else {
        setErrorMessage("Network error. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 支持 Enter 键
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      {/* 左侧品牌区域 */}
      <div className="login-brand-section">
        <div>
          <span className="brand-title">EDB</span>
          <span className="brand-title2"> Engineering Database</span>
        </div>
        <div className="brand-subtitle">Use Outlook id and password</div>
        <div className="brand-support">
          Support, authorization request or improvement suggestions, send mail
          to: Support.TPI
        </div>
      </div>

      {/* 右侧登录区域 */}
      <div className="login-form-section">
        <div className="login-form-wrapper">
          {/* 错误消息 */}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {/* UserID 输入框：绑定新的 handleUserIdChange */}
          <Input
            id="userid-input"
            placeholder="UserID"
            value={userId}
            onChange={handleUserIdChange} // 【修正】使用过滤函数
            onKeyDown={handleKeyDown}
            maxLength={10}
            disabled={isLoading}
            style={{ marginBottom: 16 }}
          />

          {/* Password 输入框 */}
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            onKeyDown={handleKeyDown}
            maxLength={32}
            disabled={isLoading}
            style={{ marginBottom: 16 }}
          />

          <Button
            type="primary"
            className="login-button"
            onClick={handleLogin}
            loading={isLoading}
            disabled={isLoading}
          >
            Login
          </Button>
        </div>

        {/* 底部备用链接提示 */}
        <div className="fallback-login-info">
          <div>
            If you get error message: "Your account is locked. Please contact
            your system administrator."
          </div>
          <div>
            Please try this alternative login link before contacting support:
            <span
              className="fallback-link"
              onClick={() => (window.location.href = "/alternative-login")}
            >
              &nbsp;Login
            </span>
          </div>
          <div className="fallback-note">
            We are working to find root cause of problem.
          </div>
        </div>
      </div>
    </div>
  );
};

export default UD01;
