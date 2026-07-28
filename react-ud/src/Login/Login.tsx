import React, { useState, useEffect } from "react";
import "./Login.css";
import { LoginRequest } from "./Login.types";
import { api } from "../services/api";

const Login: React.FC = () => {
  const [userid, setUserid] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面挂载时强制清空表单（防浏览器自动填充）
  useEffect(() => {
    setUserid("");
    setPassword("");
  }, []);

  // 登录：校验 → API调用 → 保存token
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const useridVal = userid.trim();
    const passwordVal = password.trim();

    // 前端校验
    if (useridVal.length === 0 || passwordVal.length === 0) {
      setMessage("Username and password are required.");
      return;
    }

    // UserID半角英数字校验（仅允许 a-z, A-Z, 0-9）
    const useridReg = /^[A-Za-z0-9]+$/;
    if (!useridReg.test(useridVal)) {
      setMessage("UserID must be alphanumeric characters.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const loginRequest: LoginRequest = {
        userid: useridVal,
        password: passwordVal,
      };

      // 通过 api.post 调用登录（自动带 30 秒超时、JSON 解析、错误处理）
      const result = await api.post<{ token: string; userid: string; username: string }>("/login", loginRequest);

      if (result.code === 200 && result.data) {
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("userId", result.data.userid);
        localStorage.setItem("username", result.data.username);
        window.location.href = "/menu";
      } else {
        setMessage(
          result.message || "We didn't recognize the username or password you entered. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 左侧信息面板 */}
      <div className="login-info-panel">
        <div className="left-content">
          <div style={{fontSize: "4em", fontWeight: "normal", margin: "0.67em 0 0.34em 0"}}>
            <span style={{fontWeight: "bold"}}>EDB</span> Engineering Database
          </div>
          <p style={{marginLeft: "250px"}}>Use Outlook id and password</p>
          <p>
            Support, authorization request or improvement suggestions, send mail
            to: <span style={{ textDecoration: "underline" }}>Support TPI</span>
          </p>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="login-form-panel" style={{marginLeft: "-300px"}}>
        <div className="login-form">
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <input
                type="text"
                value={userid}
                onChange={(e) => setUserid(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                placeholder="UserID"
                maxLength={10}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                maxLength={32}
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
            {message && <div className="error-message">{message}</div>}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="alternative-login-info">
            <p>
              If you get error message: "Your account is locked. Please contact
              your system administrator."
            </p>
            <p>
              Please try this alternative login link before contacting support.
            </p>
            <p>We are working to find root cause of problem.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
