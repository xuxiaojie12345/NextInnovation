import React, { useState } from 'react';
import './Login.css';
import { LoginRequest, LoginResponse } from './Login.types';

const Login: React.FC = () => {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 前端校验
    if (!userid.trim() || !password.trim()) {
      setMessage('Username and password are required.');
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    
    try {
      const loginRequest: LoginRequest = {
        userid: userid.trim(),
        password: password.trim()
      };

      const response = await fetch('/api/v1/hdoc/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginRequest),
      });

      const contentType = response.headers.get('content-type') || '';
      let result: LoginResponse | null = null;

      if (contentType.includes('application/json')) {
        try {
          // safe-parse JSON in case server returns non-standard body
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          result = await response.json();
        } catch (e) {
          console.error('Failed parsing JSON login response:', e);
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON login response:', response.status, response.statusText, text);
        setMessage(`Login failed: ${response.status} ${response.statusText}`);
        return;
      }

      if (response.ok && result && result.code === 200 && result.data) {
        // 登录成功，保存token并跳转
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('userId', result.data.userId);
        localStorage.setItem('username', result.data.username);
        window.location.href = '/menu';
      } else {
        // 登录失败 — prefer server message when available
        const serverMsg = result && result.msg ? result.msg : `Login failed: ${response.status} ${response.statusText}`;
        console.warn('Login failed response:', response.status, serverMsg, result);
        setMessage(serverMsg || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-info-panel">
        <div className="left-content">
          <h1><strong>EDB</strong> Engineering Database</h1>
          <p>Use Outlook id and password</p>
          <p>
            Support, authorization request or improvement suggestions, send mail to: Support TPI
          </p>
        </div>
      </div>
      
      <div className="login-form-panel">
        <div className="login-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="text"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                placeholder="UserID"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isLoading}
              />
            </div>
            {message && <div className="error-message">{message}</div>}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
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

export default Login;