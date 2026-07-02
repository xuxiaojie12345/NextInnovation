import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [userID, setUserID] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 处理登录按钮点击
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 前置处理：去除首尾空格
    const trimmedUserID = userID.trim();
    const trimmedPassword = password.trim();
    
    // 空值校验
    if (!trimmedUserID || !trimmedPassword) {
      setMessage("Username and password are required.");
      return;
    }
    
    // 调用API
    setIsLoading(true);
    setMessage("");
    
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: trimmedUserID,
          password: trimmedPassword,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 认证成功：保存userID到localStorage
        localStorage.setItem("userID", data.data.userId);
        // 跳转到菜单页面
        navigate("/menu");
      } else {
        // 认证失败
        setMessage("We didn't recognize the username or password you entered. Please try again.");
      }
    } catch (error) {
      // 网络错误或服务器错误
      setMessage("Network error or server unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入变化
  const handleUserIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserID(e.target.value);
    // 清除错误消息
    if (message) {
      setMessage("");
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // 清除错误消息
    if (message) {
      setMessage("");
    }
  };

  return (
    <div className="login-container">
      {/* 背景图 */}
      <div className="login-background"></div>
      
      {/* 内容区域 */}
      <div className="login-content">
        {/* 左侧标题区域 */}
        <div className="login-left">
          <h1 className="login-title">
            <span className="edb-logo">EDB</span>
            <span className="engineering-text">Engineering Database</span>
          </h1>
          <p className="login-subtitle">Use Outlook id and password</p>
          <p className="login-support">
            Support, authorization request or improvement suggestions, send mail to{" "}
            <a href="mailto:Support.TPI@volvo.com" className="support-link">
              Support.TPI@volvo.com
            </a>
          </p>
        </div>
        
        {/* 右侧登录表单区域 */}
        <div className="login-right">
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="User ID"
                value={userID}
                onChange={handleUserIDChange}
                disabled={isLoading}
                maxLength={10}
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
                maxLength={32}
                autoComplete="current-password"
              />
            </div>
            
            {/* 错误消息 */}
            {message && (
              <div className="error-message">
                {message}
              </div>
            )}
            
            <div className="form-group">
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
