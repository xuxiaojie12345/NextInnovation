import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

/**
 * Login 组件 - 用户登录界面
 *
 * 功能：验证用户身份，允许授权用户进入系统
 *
 * @returns JSX.Element - 登录页面组件
 */
function Login() {
  const navigate = useNavigate();
  const [userID, setUserID] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<{
    text: string;
    type: 'warning' | 'error' | '';
  }>({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 表单提交处理函数
   * 根据内部设计文档的处理流程实现：
   * 1. 开始：用户点击 [Login] 按钮
   * 2. 前置处理：获取入力的userID和password
   * 3. 空值校验等 (Frontend Check)
   * 4. API 调用 (Backend Check)
   * 5. 结果处理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清空之前的消息
    setMessage({ text: '', type: '' });

    // 前置处理：获取入力的userID和password，并去除首尾空格
    const trimmedUserID = userID.trim();
    const trimmedPassword = password.trim();

    // 空值校验等 (Frontend Check)
    // 若[userID为空]：
    if (!trimmedUserID) {
      // 设置Message = ["Username and password are required."]
      // 错误类型：Warning
      // 终止流程
      setMessage({
        text: 'Username and password are required.',
        type: 'warning'
      });
      return;
    }

    // 若[password为空]：
    if (!trimmedPassword) {
      // 设置Message = ["Username and password are required."]
      // 错误类型：Warning
      // 终止流程
      setMessage({
        text: 'Username and password are required.',
        type: 'warning'
      });
      return;
    }

    // 格式校验：UserID 必须符合半角英数字格式
    if (!/^[a-zA-Z0-9]+$/.test(trimmedUserID)) {
      setMessage({
        text: 'UserID must contain only alphanumeric characters',
        type: 'warning'
      });
      return;
    }

    // 长度校验：UserID 长度不超过 10 字符
    if (trimmedUserID.length > 10) {
      setMessage({
        text: 'UserID must be at most 10 characters',
        type: 'warning'
      });
      return;
    }

    // 长度校验：Password 长度不超过 32 字符
    if (trimmedPassword.length > 32) {
      setMessage({
        text: 'Password must be at most 32 characters',
        type: 'warning'
      });
      return;
    }

    // API 调用 (Backend Check)
    // 调用[AuthenticationApi(userID, password)]
    setIsLoading(true);

    try {
      // 根据内部设计文档：API Endpoint 为 /login
      const response = await axios.get('/login', {
        params: {
          userId: trimmedUserID,
          password: trimmedPassword
        }
      });

      // 结果处理：
      // 成功：[200]
      if (
        response.status === 200 &&
        response.data &&
        response.data.code === 200
      ) {
        // 认证成功：用户输入userID和password正确，画面迁移到Menu画面，并把登陆的userID传给Menu画面
        setMessage({ text: '', type: '' });

        // 保存 userID 到 localStorage
        localStorage.setItem('userID', trimmedUserID);

        // 画面迁移到Menu画面，并把登陆的userID传递给Menu画面
        navigate('/Menu', { state: { userID: trimmedUserID } });
      } else {
        // 失败：[401] 或其他错误
        // 认证失败：用户输入userID和password不正确，则提示"We didn't recognize the username or password you entered. Please try again."
        setMessage({
          text: "We didn't recognize the username or password you entered. Please try again.",
          type: 'error'
        });
      }
    } catch (error: any) {
      // 异常处理
      if (error.response) {
        // 服务器返回错误状态码
        if (error.response.status === 401) {
          // 认证失败：用户输入userID和password不正确，则提示"We didn't recognize the username or password you entered. Please try again."
          setMessage({
            text: "We didn't recognize the username or password you entered. Please try again.",
            type: 'error'
          });
        } else if (error.response.status === 500) {
          // 服务器内部错误 (500)
          setMessage({
            text: 'System error. Please contact administrator.',
            type: 'error'
          });
        } else {
          // 其他服务器错误
          setMessage({
            text: 'Service unavailable. Please try again later.',
            type: 'error'
          });
        }
      } else if (error.request) {
        // 网络断开/超时
        setMessage({
          text: 'Connection timeout. Please check your network.',
          type: 'error'
        });
      } else {
        // 其他错误
        setMessage({
          text: 'An error occurred. Please try again.',
          type: 'error'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='login-container'>
      {/* 左侧：系统标题 */}
      <div className='login-text'>
        <div>
          <h1>EDB Engineering Database</h1>
        </div>
        <div>
          <h3 style={{ textAlign: 'center' }}>Use Outlook id and password</h3>
        </div>
        <div>
          <h3>
            Support, authorization request or improvement suggestions,send mail
            to: Support TPI
          </h3>
        </div>
      </div>

      {/* 右侧：登录表单 */}
      <div className='login-right'>
        <div className='login-box'>
          <form onSubmit={handleSubmit} className='login-form'>
            <div className='form-group'>
              <input
                id='userID'
                type='text'
                value={userID}
                onChange={(e) => setUserID(e.target.value)}
                maxLength={10}
                placeholder='Enter UserID'
                disabled={isLoading}
              />
            </div>

            <div className='form-group'>
              <input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={32}
                placeholder='Enter Password'
                disabled={isLoading}
              />
            </div>

            {/* 消息显示区域 - 仅在有消息时显示 */}
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.type === 'warning' && <span className='icon'>⚠️</span>}
                {message.type === 'error' && <span className='icon'>❌</span>}
                <span>{message.text}</span>
              </div>
            )}

            <button type='submit' className='login-button' disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* 账户锁定提示 */}
        <div className='login-hint'>
          <p>
            If you get an error message "Your account is locked Please contact
            your system administrator."
          </p>
          <p>
            Please try this alternative login link before contacting support:
            Login
          </p>
          <p>We are working to find root cause of problem.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
