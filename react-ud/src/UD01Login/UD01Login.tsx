// Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UD01Login.css";

// 定义后端返回的数据结构接口
interface BackendLoginResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    userId: "",
    password: "",
    authentication: "",
  });

  // 验证函数
  const validateForm = () => {
    let valid = true;
    const newErrors = { userId: "", password: "", authentication: "" };

    if (!userId.trim()) {
      newErrors.userId = "Username and password are required.";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Username and password are required.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 登录处理函数
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 验证表单
    if (!validateForm()) {
      return;
    }

    // 禁用按钮防止重复提交
    setIsLoading(true);
    // 清除之前的认证错误
    setErrors((prev) => ({ ...prev, authentication: "" }));

    try {
      // 调用真实的后端 API
      const response = await authenticateUser(userId, password);

      if (response.success) {
        // 登录成功，保存用户 ID 到 localStorage
        localStorage.setItem("currentUser", userId.trim());

        // 跳转到菜单页面
        navigate("/menu");
      } else {
        // 登录失败，显示后端返回的错误信息或默认信息
        setErrors((prev) => ({
          ...prev,
          authentication:
            "We didn't recognize the username or password you entered. Please try again.",
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        authentication:
          "Network error or server unavailable. Please try again later.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 真实认证 API 调用
  const authenticateUser = async (
    userId: string,
    password: string,
  ): Promise<BackendLoginResponse> => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        password: password,
      }),
    });

    const data: BackendLoginResponse = await response.json();
    return data;
  };

  // 输入框变化处理
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserId(value);

    // 清除错误信息
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, userId: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    // 清除错误信息
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  return (
    <div className="login-container">
      {/* 左侧内容 */}
      <div className="left-content">
        <h1 className="main-title">EDB Engineering Database</h1>
        <p className="sub-title">Use Outlook id and password</p>
        <p className="support-text">
          Support, authorization request or improvement suggestions, send mail
          to Support.TPI
        </p>
      </div>

      {/* 右侧表单 */}
      <div className="right-form">
        <form onSubmit={handleLogin} className="login-form">
          {/* 用户ID输入框 */}
          <div className="input-group">
            <input
              type="text"
              id="userId"
              name="userId"
              value={userId}
              onChange={handleUserIdChange}
              placeholder="Enter your user ID"
              maxLength={10}
              disabled={isLoading}
              className={`input-field ${errors.userId ? "error" : ""}`}
            />
            {errors.userId && (
              <span className="error-message">{errors.userId}</span>
            )}
          </div>

          {/* 密码输入框 */}
          <div className="input-group">
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              maxLength={32}
              disabled={isLoading}
              className={`input-field ${errors.password ? "error" : ""}`}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* 登录按钮 */}
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {/* 错误提示 */}
          {errors.authentication && (
            <div className="error-message">{errors.authentication}</div>
          )}
        </form>

        {/* 新增：登录按钮下方的红色提示信息 - 单独显示 */}
        <div className="login-help-text">
          If you get error message: "Your account is locked. Please contact your
          system administrator"
          <br />
          Please try this alternative login link before contacting support:{" "}
          <a href="/alternative-login" style={{ color: "red" }}>
            Login
          </a>
          <br />
          We are working to find root cause of problem.
        </div>
      </div>
    </div>
  );
};

export default Login;
