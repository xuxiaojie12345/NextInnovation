/**
 * App 组件 - 应用根组件（路由配置）
 * ------------------------------------------------------------------
 * 详细设计 7.4：未认证用户访问 Menu 时应重定向回 Login。
 *  - /login  → 登录页面（默认路由）
 *  - /menu   → 主菜单页面（登录成功后的跳转目标）
 *  - 其他    → 重定向到 /login
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './Login/Login';
import Menu from './Menu/Menu';
import './App.css';

/**
 * 路由入口
 * @returns {React.JSX.Element} 应用路由结构
 */
function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
