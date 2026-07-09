import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { z } from 'zod';
import axios from 'axios';
import './Login.css';

const Login: React.FC = () => {
  const [userId, setUserId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  // 使用Zod定义数据验证规则
  const loginSchema = z.object({
    userId: z.string().min(1, 'Username and password are required.'),
    password: z.string().min(1, 'Username and password are required.'),
  });

  // 执行表单验证
  const validateForm = (): boolean => {
    const result = loginSchema.safeParse({
      userId: userId.trim(),
      password: password,
    });
    if (!result.success) {
      const firstError = result.error.errors[0];
      setMessage(firstError.message);
      return false;
    }
    return true;
  };

  // 处理登录按钮点击事件
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setMessage('');
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/AuthenticationApi', {
        userId: userId.trim(),
        password: password,
      });
      if (response.data.status === 'success') {
        sessionStorage.setItem('userInfo', JSON.stringify(response.data.data));
        navigate('/menu');
      } else {
        setMessage("We didn't recognize the username or password you entered. Please try again.");
        setPassword('');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401) {
          setMessage("We didn't recognize the username or password you entered. Please try again.");
          setPassword('');
        } else if (error.response.status >= 500) {
          setMessage('System is busy, please try again later.');
        } else {
          setMessage('An unexpected error occurred. Please contact support.');
        }
      } else if (error.request) {
        setMessage('Network error, please try again later.');
      } else {
        setMessage('An unexpected error occurred. Please contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘按键事件支持回车键登录
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      {/* 左侧标题区域 */}
      <div className="login-left-section">
        <h1 className="login-title">
          <span className="title-full">EDB Engineering Database</span>
        </h1>
        <p className="login-subtitle">Use Outlook id and password</p>
        <p className="login-support">
          Support, authorization request or improvement suggestions, send mail to: Support.TPI
        </p>
      </div>
      {/* 右侧登录表单区域 */}
      <div className="login-right-section">
        <form className="login-form" onSubmit={handleLogin}>
          {/* 用户ID输入框 */}
          <Input
            size="large"
            className="login-input"
            placeholder="User ID"
            prefix={<UserOutlined />}
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={10}
          />
          {/* 密码输入框 */}
          <Input.Password
            size="large"
            className="login-input"
            placeholder="Password"
            prefix={<LockOutlined />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={32}
          />
          {/* 错误消息显示区域 */}
          {message && <div className="login-message">{message}</div>}
          {/* 登录按钮 */}
          <Button
            type="primary"
            size="large"
            className="login-button"
            htmlType="submit"
            loading={isLoading}
            block
          >
            Login
          </Button>
          <div className="login-hint">
            <p>
              If you get error message. &ldquo;Your account is locked, Please contact yout sysiem
              administrator&rdquo;
            </p>
            <p>
              Please try this alterative login link before contacting support.{' '}
              <a href="/login">Login</a>
            </p>
            <p>We are working to find root cause of problem.</p>
            
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
