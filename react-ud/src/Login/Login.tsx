/**
 * Login组件 - 用户登录认证功能
 * 
 * @description 提供用户登录认证功能，通过输入UserID和Password进行身份验证，
 *              认证成功后迁移到系统主菜单页面。
 * 
 * @features
 * - 左右布局设计（左侧：项番6-8，右侧：项番1-5）
 * - UserID和Password输入验证（半角英数字/符号限制）
 * - Password字段掩码处理（使用•显示）
 * - 前端空值校验和字符格式校验
 * - API身份验证调用（POST /api/authentication/login）
 * - 错误信息统一提示（不区分用户名和密码错误）
 * - 成功后跳转到Menu页面并传递UserID参数
 * - 背景图支持（fTRYDXFAD.jpeg，整体背景只用该背景图）
 * - 无背景色设计（左右面板均透明）
 * 
 * @security
 * - Password字段进行掩码处理，防止明文显示
 * - 传输过程使用HTTPS加密协议
 * - 不在客户端存储明文密码
 * - 统一的错误提示信息，避免泄露具体失败原因
 * - 实时字符过滤，防止注入攻击
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import './Login.css';

/**
 * 登录表单数据接口定义
 */
interface LoginFormData {
  userID: string;
  password: string;
}

/**
 * API响应成功数据结构
 */
interface LoginSuccessResponse {
  code: number;
  msg: string;
  data: {
    token: string;
    userId: string;
    username: string;
    role: string;
    loginTime: string;
  };
}

/**
 * API响应错误数据结构
 */
interface LoginErrorResponse {
  code: number;
  msg: string;
  errorCode?: string;
}

/**
 * Login组件 - 用户登录页面（左右布局，无背景色）
 * 
 * @component
 * @returns {JSX.Element} 登录页面组件
 * @description 根据詳細設計UD01.md实现完整的登录功能
 *              按照添附文件要求实现左右布局：
 *              - 左侧：项番6、7、8（EDB标题、Outlook提示、Support信息），无背景色
 *              - 右侧：项番1、2、3、4、5（UserID、Password、Message、Login按钮、账户锁定警告），按项番顺序，无背景色
 */
const Login: React.FC = () => {
  // 路由跳转hook
  const navigate = useNavigate();

  // 表单数据状态
  const [formData, setFormData] = useState<LoginFormData>({
    userID: '',
    password: ''
  });

  // 错误消息状态
  const [message, setMessage] = useState<string>('');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 处理输入框变化事件
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入框变化事件对象
   * @description 根据输入框的name属性更新对应的表单数据
   *              实时过滤不允许的字符：
   *              - UserID: 只允许半角英数字（a-z, A-Z, 0-9）
   *              - Password: 只允许半角英数字+符号
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let filteredValue = value;

    // UserID: 只允许半角英数字（a-z, A-Z, 0-9）
    if (name === 'userID') {
      filteredValue = value.replace(/[^a-zA-Z0-9]/g, '');
    }
    // Password: 只允许半角英数字+符号
    else if (name === 'password') {
      // 允许的符号：!@#$%^&*()_+-=[]{}|;:',.<>?/~` 和空格
      filteredValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\~`\s]/g, '');
    }

    // 更新表单数据
    setFormData(prevData => ({
      ...prevData,
      [name]: filteredValue
    }));

    // 清除之前的错误消息
    if (message) {
      setMessage('');
    }
  };

  /**
   * 前端表单校验 - 空值检查和字符格式验证
   * 
   * @returns {boolean} 校验结果，true表示通过，false表示失败
   * @description 按照詳細設計UD01.md的校验规则：
   *              1. 检查UserID和Password是否为空
   *              2. UserID是否只包含半角英数字（a-z, A-Z, 0-9）
   *              3. Password是否只包含半角英数字+符号
   *              校验失败时设置对应的错误消息
   */
  const validateForm = (): boolean => {
    // 校验UserID是否为空（No.1）
    if (!formData.userID.trim()) {
      setMessage('Username and password are required.');
      return false;
    }

    // 校验Password是否为空（No.2）
    if (!formData.password.trim()) {
      setMessage('Username and password are required.');
      return false;
    }

    // 校验UserID字符格式：只允许半角英数字（No.3）
    const userIDPattern = /^[a-zA-Z0-9]+$/;
    if (!userIDPattern.test(formData.userID)) {
      setMessage("We didn't recognize the username or password you entered. Please try again.");
      return false;
    }

    // 校验Password字符格式：只允许半角英数字+符号（No.4）
    const passwordPattern = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{}|;:'",.<>?/\\~`]+$/;
    if (!passwordPattern.test(formData.password)) {
      setMessage("We didn't recognize the username or password you entered. Please try again.");
      return false;
    }

    return true;
  };

  /**
   * 调用身份验证API
   * 
   * @async
   * @returns {Promise<void>}
   * @description 按照全体APIのプロンプト.txt的API规范：
   *              - Method: POST
   *              - Endpoint: /api/authentication/login
   *              - Content-Type: application/json
   *              - 请求参数：{ userid, password }
   *              
   *              成功时（200状态码）：
   *              - 保存token到localStorage
   *              - 跳转到Menu页面并传递userId和username参数
   *              
   *              失败时：
   *              - 500：认证失败，显示统一错误消息
   *              - 网络异常：显示网络错误消息
   *              - 超时：显示超时消息
   *              - 其他：显示系统错误消息
   */
  const callAuthenticationApi = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // 调用AuthenticationApi进行身份验证
      // Endpoint: POST /api/authentication/login
      // Content-Type: application/json
      // 注意：后端期望的参数名是userid和password
      const response = await apiClient.post<LoginSuccessResponse>('/api/authentication/login', {
        userid: formData.userID,  // 后端期望userid字段
        password: formData.password
      });

      // 处理成功响应（响应体 code 字段为 200）
      if (response.data.code === 200) {
        // 保存token到localStorage
        localStorage.setItem('authToken', response.data.data.token);
        
        // 迁移到Menu画面（画面ID：02），并传递userId和username参数
        navigate('/Menu', { 
          state: { 
            userID: response.data.data.userId,
            userName: response.data.data.username 
          } 
        });
        return;
      }

      // 处理后端返回的业务错误响应
      setMessage(response.data.msg || "We didn't recognize the username or password you entered. Please try again.");
    } catch (error: any) {
      // 处理API调用失败
      if (error.response) {
        // 服务器返回错误响应
        const errorData: LoginErrorResponse = error.response.data;
        
        // 500状态码：认证失败或其他服务器错误
        if (error.response.status === 500) {
          // 使用后端返回的错误消息，如果为空则使用默认消息
          setMessage(errorData.msg || "We didn't recognize the username or password you entered. Please try again.");
        } else {
          // 其他服务器错误
          setMessage(errorData.msg || 'System error. Please contact support.');
        }
      } else if (error.request) {
        // 网络异常：请求已发出但没有收到响应
        setMessage('Network error. Please check your connection and try again.');
      } else {
        // 其他错误（超时等）
        setMessage('Request timeout. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理登录按钮点击事件
   * 
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - 表单提交事件对象
   * @description 按照詳細設計UD01.md的处理流程：
   *              1. 阻止表单默认提交行为
   *              2. 清空之前的错误消息
   *              3. 执行前端空值校验和字符格式校验
   *              4. 校验通过后调用身份验证API
   */
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    // 阻止表单默认提交行为
    e.preventDefault();

    // 清空之前的错误消息
    setMessage('');

    // 执行前端空值校验和字符格式校验
    if (!validateForm()) {
      return;
    }

    // 校验通过，调用API进行身份验证
    await callAuthenticationApi();
  };

  return (
    <div className="login-container">
      {/* 左右布局容器 */}
      <div className="login-layout">
        {/* 左侧布局：项番6、7、8（固定文言），无背景色 */}
        <div className="login-left-panel">
          {/* 项番6: EDB Engineering Database */}
          <h1 className="left-title">EDB Engineering Database</h1>
          
          {/* 项番7: Use Outlook id and password */}
          <p className="left-text">Use Outlook id and password</p>
          
          {/* 项番8: Support联系信息 */}
          <p className="left-text">
            Support, authorization request or improvement suggestions, send mail to: Support TPI
          </p>
        </div>

        {/* 右侧布局：项番1、2、3、4、5（按项番顺序），无背景色 */}
        <div className="login-right-panel">
          <form className="login-form" onSubmit={handleLogin}>
            {/* 项番1: UserID输入框 */}
            <div className="login-form-group">
              <label htmlFor="userID" className="login-form-label">UserID</label>
              <input
                type="text"
                id="userID"
                name="userID"
                className="login-form-input"
                value={formData.userID}
                onChange={handleInputChange}
                maxLength={10}
                placeholder="Enter UserID"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            {/* 项番2: Password输入框 */}
            <div className="login-form-group">
              <label htmlFor="password" className="login-form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="login-form-input"
                value={formData.password}
                onChange={handleInputChange}
                maxLength={32}
                placeholder="Enter Password"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            {/* 项番3: Message（错误消息显示区域） */}
            {message && (
              <div className="error-message">
                {message}
              </div>
            )}

            {/* 项番4: Login按钮 */}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            {/* 项番5: 账户锁定警告 */}
            <div className="warning-section">
              <p>If you get error message: "Your account is locked. Please contact your system administrator."</p>
              <p>Please try this alternative login link before contacting support: Login</p>
              <p>We are working to find root cause of problem.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
