/**
 * 用户认证 Context
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  userid: string;
  username: string;
  permissions?: any[];
}

interface AuthContextType {
  user: User | null;
  login: (userid: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 从 localStorage 恢复用户信息
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  // 登录函数
  const login = async (userid: string, password: string): Promise<boolean> => {
    try {
      // 调用后端 API
      const response = await fetch('http://localhost:8080/api/AuthenticationApi/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userid, password }),
      });

      const result = await response.json();

      if (result.code === 200 && result.data) {
        // 登录成功，保存用户信息
        const userData: User = {
          userid: result.data.userid || userid,
          username: result.data.username || userid,
          permissions: result.data.permissions || [],
        };
        
        setUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return true;
      } else {
        // 登录失败
        console.error('Login failed:', result.msg);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义 Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
