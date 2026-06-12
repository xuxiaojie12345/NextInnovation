import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/login";

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
      /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(val) &&
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
      const result = await loginApi({
        userId: trimmedUserID,
        password: trimmedPassword,
      });

      if (result.code === 200 && result.data) {
        // 认证成功：保存 Token 并跳转
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("username", result.data.username);
        navigate("/Menu");
      } else {
        // 认证失败：显示后端返回的错误信息
        setMessage(
          result.msg || "We didn't recognize the username or password you entered. Please try again.",
        );
      }
    } catch (error) {
      // 异常处理：网络错误或服务器错误
      setMessage("System error. Please contact administrator.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='login-container'>
      <div className='login-box'>
        <div className='login-header'>
          <h2>Login</h2>
        </div>

        {/* Message Label: Output, Left Align, Red Color */}
        {message && (
          <div
            className='error-message'
            style={{
              color: "#ff4d4f",
              textAlign: "left",
              marginBottom: "15px",
              fontSize: "14px",
              wordBreak: "break-word",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {/* UserID: TextField, Input, Left Align */}
          <div className='form-group'>
            <label htmlFor='userID'>UserID</label>
            <input
              id='userID'
              type='text'
              value={userID}
              onChange={handleUserIDChange}
              placeholder='Enter User ID'
              disabled={isLoading}
              autoComplete='username'
            />
          </div>

          {/* Password: TextField, Input, Left Align, Masked */}
          <div className='form-group'>
            <label htmlFor='password'>Password</label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={handlePasswordChange}
              placeholder='Enter Password'
              disabled={isLoading}
              autoComplete='current-password'
            />
          </div>

          {/* Login Button: Center Align, Active/Disabled Control */}
          <button type='submit' className='login-button' disabled={isLoading}>
            {isLoading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
