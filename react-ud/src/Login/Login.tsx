import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../fTRYDXFAD.jpeg";
import { authApi } from "../api";
import type { LoginRequest } from "../types/api";

const Login: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
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
      /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(val) &&
      val.length <= 32
    ) {
      setPassword(val);
      if (message) setMessage("");
    }
  };

  // 点击 Login 按钮触发
  const handleLogin = async () => {
    // 前置处理：去除首尾空格
    const trimmedUserID = userID.trim();
    const trimmedPassword = password.trim();

    // 空值校验 (Check)
    if (!trimmedUserID || !trimmedPassword) {
      setMessage("Username and password are required.");
      return; // 终止流程，不调用 API
    }

    // API 调用
    setIsLoading(true);
    setMessage(""); // 清除旧消息

    try {
      // 调用真实后端 API
      const loginData: LoginRequest = {
        userId: trimmedUserID,
        password: trimmedPassword,
      };

      const response = await authApi.login(loginData);

      if (response.success && response.data) {
        // 认证成功：保存 token 和用户信息
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "userInfo",
          JSON.stringify(response.data.userInfo),
        );

        // 跳转到 Menu 页面
        navigate("/Menu");
      } else {
        // 认证失败：显示后端返回的错误信息或默认错误信息
        setMessage(
          response.message ||
            "We didn't recognize the username or password you entered. Please try again.",
        );
      }
    } catch (error: any) {
      // 异常处理：网络错误或服务器错误
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "System error. Please contact administrator.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘 Enter 键
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className='login-container'>
      {/* 背景图片层 - 使用导入的图片 */}
      <div className='login-background'></div>

      {/* 内容层 */}
      <div className='login-content'>
        {/* 左侧标题区域 */}
        <div className='login-left'>
          <h1 className='login-title'>
            <span className='title-bold'>EDB</span>{" "}
            <span className='title-light'>Engineering Database</span>
          </h1>
          <p className='login-subtitle'>Use Outlook id and password</p>
          <p className='login-support'>
            Support, authorization request or improvement suggestions, send mail
            to:{" "}
            <a href='mailto:Support.TPI@volvo.com' className='support-link'>
              Support TPI
            </a>
          </p>
        </div>

        {/* 右侧登录表单区域 */}
        <div className='login-right'>
          <div className='login-form'>
            {/* UserID 输入框 */}
            <div className='form-group'>
              <input
                type='text'
                className='form-input'
                placeholder='User ID'
                value={userID}
                onChange={handleUserIDChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                maxLength={10}
                autoComplete='username'
              />
            </div>

            {/* Password 输入框 */}
            <div className='form-group'>
              <input
                type='password'
                className='form-input'
                placeholder='Password'
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                maxLength={32}
                autoComplete='current-password'
              />
            </div>

            {/* Login 按钮 */}
            <button
              className='login-button'
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Login"}
            </button>

            {/* 错误消息显示 */}
            {message && <div className='error-message'>{message}</div>}

            {/* 额外提示信息 */}
            <div className='login-hint'>
              <p>
                If you get error message, "Your account is locked. Please
                contact your system administrator."
              </p>
              <p>
                Please try this alternative login link before contacting
                support:{" "}
                <a href='/alternative-login' className='hint-link'>
                  Login
                </a>
              </p>
              <p>We are working to find root cause of problem</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
