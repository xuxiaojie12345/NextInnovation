import React, { useState, useRef } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/config";

/**
 * 登录页面组件
 * 
 * 功能说明：
 * - 用户身份验证，集成 ISAM 统一身份认证
 * - 提供简洁的登录界面，清晰的错误提示
 * - 密码输入掩码显示，保障安全性
 * - 登录成功后缓存 UserID 用于后续会话管理
 * 
 * @component
 * @returns {JSX.Element} 登录页面元素
 */
const Login: React.FC = () => {
  const navigate = useNavigate();

  // ==================== 状态管理 ====================
  // 对应设计书 6.1 状态管理
  const [userID, setUserID] = useState<string>("");           // 用户ID输入值
  const [password, setPassword] = useState<string>("");       // 密码输入值
  const [message, setMessage] = useState<string>("");         // 普通错误消息
  const [errorMessage, setErrorMessage] = useState<string>(""); // 账户锁定等特殊错误消息
  const [isLoading, setIsLoading] = useState<boolean>(false); // 加载状态标识

  // ==================== Ref 定义 ====================
  const userIDRef = useRef<HTMLInputElement>(null);   // UserID输入框引用
  const passwordRef = useRef<HTMLInputElement>(null); // Password输入框引用

  // ==================== 常量定义 ====================
  // 输入校验正则表达式（可复用）
  const USER_ID_REGEX = /^[a-zA-Z0-9]*$/;                    // 半角英数字
  // eslint-disable-next-line no-useless-escape
  const PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/; // 半角英数字+符号
  
  // 输入长度限制
  const MAX_USER_ID_LENGTH = 10;
  const MAX_PASSWORD_LENGTH = 32;

  // ==================== 事件处理函数 ====================
  /**
   * 处理 UserID 输入变化
   * 限制：只允许半角英数字，最大长度10字符
   * 用户体验优化：用户重新输入时清空错误提示
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handleUserIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：只允许半角英数字，且不超过最大长度
    if (USER_ID_REGEX.test(val) && val.length <= MAX_USER_ID_LENGTH) {
      setUserID(val);
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) setMessage("");
      if (errorMessage) setErrorMessage("");
    }
  };

  /**
   * 处理 Password 输入变化
   * 限制：只允许半角英数字及常见 ASCII 符号，最大长度32字符
   * 用户体验优化：用户重新输入时清空错误提示
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 正则校验：允许半角英数字及常见 ASCII 符号，且不超过最大长度
    if (PASSWORD_REGEX.test(val) && val.length <= MAX_PASSWORD_LENGTH) {
      setPassword(val);
      // 用户体验优化：用户重新输入时清空错误提示
      if (message) setMessage("");
      if (errorMessage) setErrorMessage("");
    }
  };

  /**
   * 点击 Login 按钮触发登录流程
   * 对应设计书 3. 业务逻辑与校验规则
   * 
   * 处理流程：
   * 1. 前置处理：去除首尾空格
   * 2. 空值校验（前端校验）
   * 3. API 调用（后端校验）
   * 4. 结果处理：认证成功跳转，认证失败显示错误
   */
  const handleLogin = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedUserID = userID.trim();
    const trimmedPassword = password.trim();

    // 2. 空值校验（前端校验）
    // 对应设计书 3.2 校验详细规格表 No.1 和 No.2
    if (!trimmedUserID) {
      setMessage("Username and password are required.");
      userIDRef.current?.focus(); // 焦点移到UserID
      return;
    }
    if (!trimmedPassword) {
      setMessage("Username and password are required.");
      passwordRef.current?.focus(); // 焦点移到Password
      return;
    }

    // 3. API 调用（后端校验）
    // 对应设计书 4.1 AuthenticationApi
    setIsLoading(true);
    setMessage("");      // 清除旧消息
    setErrorMessage(""); // 清除特殊错误消息

    try {
      // 调用真实 API 接口进行身份验证
      // Method: GET, Endpoint: /api/ud01/authentication
      // 使用GET请求，通过URL参数传递userId和password
      const response = await apiClient.get("/api/ud01/authentication", {
        params: {
          userId: trimmedUserID,
          password: trimmedPassword,
        },
      });

      // 4. 结果处理
      // 后端返回格式：{ code: 200, msg: "登录成功", data: { ... } }
      if (response.data.code === 200) {
        // 认证成功（Code 200）
        // 对应设计书 3.1.1 登录处理流程 - 认证成功分支
        
        // 缓存 UserID 到 localStorage（用于后续会话管理）
        localStorage.setItem("userID", trimmedUserID);
        
        // 保存用户信息到 localStorage
        if (response.data.data) {
          localStorage.setItem("userName", response.data.data.username || "");
          localStorage.setItem("userEmail", response.data.data.email || "");
          // 如果有token，也保存起来
          if (response.data.data.token) {
            localStorage.setItem("token", response.data.data.token);
          }
        }
        
        // 清空消息提示
        setMessage("");
        setErrorMessage("");
        
        // 画面迁移：跳转到 Menu 画面 (UD02)
        navigate("/Menu");
      } else {
        // 认证失败（Code != 200 或业务错误）
        // 对应设计书 3.2 校验详细规格表 No.3
        // 固定使用英文消息，不显示后端返回的 msg，避免暴露具体错误信息
        setMessage("We didn't recognize the username or password you entered. Please try again.");
        // 安全策略：清空密码字段
        setPassword("");
      }
    } catch (error: any) {
      // 异常处理
      // 对应设计书 5. 异常处理
      
      if (error.response) {
        // 服务器返回错误响应
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;
        if (statusCode >= 500) {
          // 服务器内部错误
          setMessage("System error. Please try again later.");
        } else {
          // 其他服务器错误
          setMessage(errorMsg || "System error. Please try again later.");
        }
      } else if (error.code === "ECONNABORTED") {
        // 请求超时
        // 对应设计书 5. 异常处理 - 请求超时
        setMessage("Request timeout. Please check your network connection.");
      } else {
        // 网络异常或其他错误
        // 对应设计书 5. 异常处理 - 网络异常、ISAM服务不可用
        setMessage("System error. Please try again later.");
      }
    } finally {
      // 无论成功或失败，都重置加载状态
      setIsLoading(false);
    }
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='login-container'>
      {/* 左侧：文言区域 */}
      <div className='login-left'>
        <div className='login-title'>
          <span className='login-title-bold'>EDB</span>
          <span className='login-title-normal'> Engineering Database</span>
        </div>
        <div className='login-subtitle'>Use Outlook id and password</div>
        <div className='login-support'>
          <span className='login-title-support'>Support, authorization request or improvement suggestions, send mail to:</span>
          <span className='login-title-stpi'>Support TPI</span>
        </div>
      </div>

      {/* 右侧：登录表单区域 */}
      <div className='login-right'>
        <div className='login-box'>
          {/* 账户锁定等特殊错误消息显示区域 */}
          {errorMessage && (
            <div className='static-error-message'>
              {errorMessage}
            </div>
          )}

          {/* 登录表单 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            {/* UserID 输入框 */}
            <div className='form-group'>
              <input
                id='userID'
                type='text'
                ref={userIDRef}
                value={userID}
                onChange={handleUserIDChange}
                placeholder='请输入用户ID'
                disabled={isLoading}
                autoComplete='username'
                maxLength={MAX_USER_ID_LENGTH}
              />
            </div>

            {/* Password 输入框 */}
            <div className='form-group'>
              <input
                id='password'
                type='password'
                ref={passwordRef}
                value={password}
                onChange={handlePasswordChange}
                placeholder='请输入密码'
                disabled={isLoading}
                autoComplete='current-password'
                maxLength={MAX_PASSWORD_LENGTH}
              />
            </div>

            {/* 普通错误消息显示区域 */}
            {message && (
              <div className='error-message'
                style={{
                    color: "#ff4d4f",
                    textAlign: "left",
                    marginBottom: "15px",
                    fontSize: "14px",
                    wordBreak: "break-word",
                  }}>
                {message}
              </div>
            )}

            {/* Login 登录按钮 */}
            <button
              type='submit'
              className='login-button'
              disabled={isLoading}
            >
              {isLoading ? "处理中..." : "Login"}
            </button>
          </form>

        </div>
        {/* StaticMessage 固定提示文字 */}
          <div className='static-message'>
            <span>If you get error message: "Your account is locked. Please contact your system administrator."</span><br />
            <span>Please try this alternative login link before contacting support: <a href="/" className='static-message-link'>Login</a></span><br />
            <span>We are working to find root cause of problem.</span><br />
          </div>
      </div>
    </div>
  );
};

export default Login;
