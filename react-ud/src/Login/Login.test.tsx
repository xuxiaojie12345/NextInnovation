import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * 登录组件单元测试
 */
describe('Login Component', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    // 清除所有mock
    jest.clearAllMocks();
    
    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
  });

  /**
   * 测试1：渲染登录页面基本元素
   */
  test('renders login page with all elements', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    // 检查标题是否存在
    expect(screen.getByText(/EDB/i)).toBeInTheDocument();
    expect(screen.getByText(/Engineering Database/i)).toBeInTheDocument();
    
    // 检查副标题
    expect(screen.getByText(/Use Outlook id and password/i)).toBeInTheDocument();
    
    // 检查支持信息
    expect(screen.getByText(/Support.TPI/i)).toBeInTheDocument();
    
    // 检查输入框
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(2);
    
    // 检查登录按钮
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  /**
   * 测试2：用户ID为空时显示错误消息
   */
  test('shows error message when userId is empty', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = screen.getAllByRole('textbox')[1];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 只输入密码，不输入用户ID
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/Username and password are required/i)).toBeInTheDocument();
    });

    // 验证API未被调用
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  /**
   * 测试3：密码为空时显示错误消息
   */
  test('shows error message when password is empty', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 只输入用户ID，不输入密码
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.click(loginButton);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/Username and password are required/i)).toBeInTheDocument();
    });

    // 验证API未被调用
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  /**
   * 测试4：认证成功时跳转到菜单页面
   */
  test('navigates to menu on successful login', async () => {
    // Mock成功的API响应
    mockedAxios.post.mockResolvedValue({
      data: {
        status: 'success',
        code: 200,
        data: {
          userId: 'testuser',
          name: 'Test User',
          role: 'USER'
        },
        message: 'success'
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const passwordInput = screen.getAllByRole('textbox')[1];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 输入用户ID和密码
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // 等待API调用和跳转
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/AuthenticationApi', {
        userId: 'testuser',
        password: 'password123'
      });
    });

    // 验证sessionStorage中保存了用户信息
    expect(sessionStorage.getItem('userInfo')).toBeTruthy();
    
    // 验证跳转到菜单页面
    expect(mockNavigate).toHaveBeenCalledWith('/menu');
  });

  /**
   * 测试5：认证失败时显示错误消息
   */
  test('shows error message on authentication failure', async () => {
    // Mock失败的API响应（401）
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 401,
        data: {
          message: 'Invalid username or password.'
        }
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const passwordInput = screen.getAllByRole('textbox')[1];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 输入用户ID和密码
    fireEvent.change(userIdInput, { target: { value: 'wronguser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(loginButton);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/We didn't recognize the username or password/i)).toBeInTheDocument();
    });

    // 验证密码框被清空
    expect(passwordInput).toHaveValue('');
  });

  /**
   * 测试6：网络错误时显示相应消息
   */
  test('shows network error message on network failure', async () => {
    // Mock网络错误
    mockedAxios.post.mockRejectedValue({
      request: {}
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const passwordInput = screen.getAllByRole('textbox')[1];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 输入用户ID和密码
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  /**
   * 测试7：服务器500错误时显示相应消息
   */
  test('shows system busy message on server 500 error', async () => {
    // Mock服务器500错误
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 500
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const passwordInput = screen.getAllByRole('textbox')[1];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 输入用户ID和密码
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // 等待错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/System is busy/i)).toBeInTheDocument();
    });
  });

  /**
   * 测试8：按Enter键触发登录
   */
  test('triggers login on Enter key press', async () => {
    // Mock成功的API响应
    mockedAxios.post.mockResolvedValue({
      data: {
        status: 'success',
        code: 200,
        data: {
          userId: 'testuser',
          name: 'Test User',
          role: 'USER'
        },
        message: 'success'
      }
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const passwordInput = screen.getAllByRole('textbox')[1];

    // 输入用户ID和密码
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // 在密码框按Enter键
    fireEvent.keyDown(passwordInput, { key: 'Enter' });

    // 等待API调用
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });

  /**
   * 测试9：加载状态时按钮禁用
   */
  test('disables button during loading state', async () => {
    // Mock一个延迟的API响应
    mockedAxios.post.mockImplementation(() => 
      new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    const passwordInput = screen.getAllByRole('textbox')[1];
    const loginButton = screen.getByRole('button', { name: /login/i });

    // 输入用户ID和密码并点击登录
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // 验证按钮在加载期间被禁用
    expect(loginButton).toBeDisabled();
  });

  /**
   * 测试10：用户ID最大长度限制为10
   */
  test('limits userId input to 10 characters', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const userIdInput = screen.getAllByRole('textbox')[0];
    
    // 尝试输入超过10个字符
    fireEvent.change(userIdInput, { 
      target: { value: '123456789012345' } 
    });

    // 验证maxLength属性
    expect(userIdInput).toHaveAttribute('maxLength', '10');
  });

  /**
   * 测试11：密码最大长度限制为32
   */
  test('limits password input to 32 characters', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const passwordInput = screen.getAllByRole('textbox')[1];
    
    // 验证maxLength属性
    expect(passwordInput).toHaveAttribute('maxLength', '32');
  });
});
