// Login 组件

// 对应功能模块

import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";

// Login

const Login: React.FC = () => {
  // navigate

  const navigate = useNavigate();
  // 状态管理 (对应设计书 6. 实现注意事项)
  const [userID, setUserID] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false); // 标记是否有错误，用于输入框样式
  const [inputKey, setInputKey] = useState<number>(0); // 强制重新挂载输入框（超长截断时用）

  // 处理 UserID 输入 - 输入时限制（对应设计书 4.2.1）
  const handleUserIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // val

    const val = e.target.value;
    
    // 只允许半角英数字输入
    if (/^[a-zA-Z0-9]*$/.test(val)) {
      if (val.length <= 10) {
        setUserID(val);
      } else {
        setUserID(val.slice(0, 10));
        setInputKey(k => k + 1); // 强制重新挂载 input，DOM 值重置为 state
      }
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) {
        setMessage("");
        setHasError(false);
      }
    } else {
      setUserID(userID);
      setInputKey(k => k + 1);
    }
  };

  // 处理 Password 输入 - 输入时限制（对应设计书 4.2.2）
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // val

    const val = e.target.value;
    
    // 只允许半角英数字+记号输入（ASCII可打印字符 0x20-0x7E）
    if (/^[\x20-\x7E]*$/.test(val)) {
      if (val.length <= 32) {
        setPassword(val);
      } else {
        setPassword(val.slice(0, 32));
        setInputKey(k => k + 1); // 强制重新挂载 input，DOM 值重置为 state
      }
      if (message) {
        setMessage("");
        setHasError(false);
      }
    } else {
      setPassword(password);
      setInputKey(k => k + 1);
    }
  };

  // 点击 Login 按钮触发 (对应设计书 3. 业务逻辑与校验规则)
  const handleLogin = async () => {
    // 清除旧消息
    setMessage("");
    setHasError(false);

    // 调试信息：打印当前状态
    console.log("Current userID:", userID, "length:", userID.length);
    console.log("Current password:", password, "length:", password.length);

    // 1. 必须入力チェック - UserID
    if (!userID || userID.trim() === "") {
      console.warn("Validation failed: userID is empty");
      setMessage("Username and password are required.");
      setHasError(true);
      return; // 终止流程，不调用 API
    }

    // 2. 必须入力チェック - Password
    if (!password || password.trim() === "") {
      console.warn("Validation failed: password is empty");
      setMessage("Username and password are required.");
      setHasError(true);
      return; // 终止流程，不调用 API
    }

    // 3. API 调用 (Backend Check)
    setIsLoading(true);

    try {
      // 调用后端认证API
      const response = await fetch('http://localhost:8081/api/authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userID.trim(),
          password: password.trim()
        }),
      });

      // result

      const result = await response.json();

      // 检查响应状态
      if (result.code === 200 && result.data && result.data.success) {
        // 登录成功，将完整用户信息存储到 localStorage
        localStorage.setItem('userInfo', JSON.stringify(result.data.userInfo));
        setMessage("");
        setHasError(false);
        navigate("/Menu");
      } else {
        // 登录失败
        console.warn("Login failed, result:", result);
        setMessage(result.message || "We didn't recognize the username or password you entered. Please try again.");
        setHasError(true);
        setPassword("");
      }
    } catch (error) {
      // 异常处理：网络错误、超时或服务器错误
      console.error('Login error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      setMessage("System error. Please contact administrator.");
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 左侧信息面板 */}
      <div className="login-info-panel">
        <div className="left-content">
          <h1><strong>EDB</strong> Engineering Database</h1>
          <p>Use Outlook id and password</p>
          <p>
            Support, authorization request or improvement suggestions, send mail to: Support TPI
          </p>
        </div>
      </div>

      {/* 右侧表单面板 */}
      <div className="login-form-panel">
        <div className="login-form">
          {/* Message Label: Output, Left Align, Red Color */}
          {message && <div className="error-message">{message}</div>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            {/* username: TextField, Input, Left Align */}
            <div className="form-group">
              <input
                id="username"
                key={inputKey}
                type="text"
                value={userID}
                onChange={handleUserIDChange}
                placeholder="UserID"
                disabled={isLoading}
                autoComplete="username"
                className={hasError ? 'input-error' : ''}
              />
            </div>

            {/* password: TextField, Input, Left Align, Masked */}
            <div className="form-group">
              <input
                id="password"
                key={inputKey + 1}
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                disabled={isLoading}
                autoComplete="current-password"
                maxLength={32}
                className={hasError ? 'input-error' : ''}
              />
            </div>

            {/* Login Button: Center Align, Active/Disabled Control */}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Processing..." : "Login"}
            </button>
          </form>

          {/* 备用登录链接提示 */}
          <div className="alternative-login-info">
            <p>If you get error message: "Your account is locked. Please contact your system administrator."</p>
            <p>Please try this alternative login link before contacting support.</p>
            <p>We are working to find root cause of problem.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Login

export default Login;