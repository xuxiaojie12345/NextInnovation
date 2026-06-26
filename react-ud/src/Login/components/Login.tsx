import React, { useState } from 'react';
import { z } from 'zod';
import '../assets/styles/Login.css'
import { useNavigate } from 'react-router-dom';

// --- 1. 定义 Zod Schema ---
// 这里定义了 UserID 和 passWord 的校验规则
const loginSchema = z.object({
  userId: z.string()
    .min(1, { message: "Username and password are required." }) // 非空校验
    .max(10, { message: "UserID must be 10 characters or less" }) // 长度校验
    .regex(/^[a-zA-Z0-9]*$/, { message: "UserID must contain only alphanumeric characters" }), // 许容文字校验：只允许半角英数字 [a-zA-Z0-9]
  passWord: z.string()
    .min(1, { message: "Username and password are required." }) // 非空校验
    .max(32, { message: "passWord must be 32 characters or less" }) // 长度校验
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]*$/, { message: "passWord contains invalid characters" }), // 许容文字校验：半角英数字 + 記号 (Special Chars)
});

// 推断类型，用于 TypeScript 类型提示
type LoginFormData = z.infer<typeof loginSchema>;

// --- 2. 类型定义 & API 接口 ---
interface LoginResponse {
  code: number;
  msg: string;
  data: {
    userId: string;
    username: string;
    responsible?: string;
    userPosition?: string;
    email?: string;
  };
}

// 真实后台 API 接口（调用 Spring Boot 后端）
const loginApi = async (userId: string, passWord: string): Promise<LoginResponse> => {
  try {
    const response = await fetch('http://localhost:8081/api/ud01/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, passWord }),
    });
    
    const data = await response.json();

    if (!response.ok) {
      // 处理 HTTP 错误（如 400 参数校验失败 / 401 认证失败）
      throw new Error(data.msg || 'Network response was not ok');
    }

    return data;
  } catch (error) {
    // 网络错误或服务器错误
    console.error('Login API Error:', error);
    throw error;
  }
};

// --- 3. 组件主体 ---
const Login: React.FC = () => {
  // 状态管理
  const [userId, setUserId] = useState<string>('');
  const [passWord, setpassWord] = useState<string>('');
  const Navigate = useNavigate();
  // 消息状态
  const [warningMessage, setWarningMessage] = useState<string>(''); // Zod 校验失败警告
  const [errorMessage, setErrorMessage] = useState<string>('');     // API 认证失败错误
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 清除消息辅助函数
  const clearMessages = () => {
    setWarningMessage('');
    setErrorMessage('');
  };

  // 输入处理
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserId(e.target.value);
    if (warningMessage || errorMessage) clearMessages();
  };


  const handlepassWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setpassWord(e.target.value);
    if (warningMessage || errorMessage) clearMessages();
  };

  // 提交处理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // 1. 使用 Zod 进行前端校验
    const result = loginSchema.safeParse({ userId, passWord });

    if (!result.success) {
      // 校验失败，提取第一个错误信息作为 Warning 显示
      const firstError = result.error.errors[0];
      setWarningMessage(firstError.message);
      return;
    }

    // 2. 校验通过，调用后台 API
    setIsLoading(true);
    try {
      const response = await loginApi(userId, passWord);
      
      if (response.code === 200) {
        console.log('Login Success:', response.data);
        // 保存用户信息到sessionStorage
        if (response.data) {
          sessionStorage.setItem('userId', response.data.userId);
          sessionStorage.setItem('username', response.data.username);
        }
        Navigate('/HdocMenu');
       
      } else {
        // 3. API 返回认证失败
        setErrorMessage(response.msg || "Login failed.");
      }
    } catch (error: any) {
      // 显示后端返回的具体错误信息（如账号不存在、密码错误等）
      setErrorMessage(error.message || "Network error. Please try again later.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
     <div className="container">
      <div className="backgroundLayer" ></div>
 
      <div className="card">

       

        <form onSubmit={handleSubmit}>
          {/* UserID Input */}
          <div className="formGroup">
            <input
              type="text"
              placeholder="User ID"
              value={userId}
              onChange={handleUserIdChange}
              maxLength={10}
              disabled={isLoading}
              className="input"
              aria-label="User ID"
            />
          </div>


          {/* passWord Input */}
          <div className="formGroup">
            <input
              type="password"
              placeholder="Password"
              value={passWord}
              onChange={handlepassWordChange}
              maxLength={32}
              disabled={isLoading}
              className="input"
              aria-label="Password"
            />
          </div>
           <div className="messageContainer">
          {/* Warning Message (Zod Validation Failed) */}
          {warningMessage && (
            <div className="warningBox" role="alert">
              {warningMessage}
            </div>
          )}

          {/* Error Message (API Auth Failed) */}
          {errorMessage && (
            <div className="errorBox" role="alert">
              {errorMessage}
            </div>
          )}
          </div>
          {/* Login Button */}
          <button 
            type="submit" 
            className="button" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {/* Footer Note */}
        <div className="footer">
          <p>
            If you get error message: "Your account is locked. Please contact your system administrator."
          </p>
          <p>
            Please try this alternative login link before contacting support:{' '}
            <span className="link" onClick={(e) => e.preventDefault()}>
              Login
            </span>
          </p>
          <p>
            We are working to find root cause of problem.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
