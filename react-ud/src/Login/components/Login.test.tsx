import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // 旧版本直接导入使用
import Login from './Login';

// 模拟图片导入，防止测试环境报错
jest.mock('../assets/images/fTRYDXFAD.jpeg', () => 'mock-image-path');

// 模拟 window.alert，防止测试时弹出阻塞对话框
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Login Component Tests', () => {
  
  test('1. 初期表示：输入框为空，无错误/警告信息', () => {
    render(<Login />);

    const userIdInput = screen.getByLabelText(/User ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    expect(userIdInput).toBeInTheDocument();
    expect(userIdInput).toHaveValue('');
    
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveValue('');

    expect(screen.queryByText(/Username and password are required/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/We didn't recognize/i)).not.toBeInTheDocument();
  });

  test('2. 必填校验：用户名为空时点击登录，显示 Warning', async () => {
    render(<Login />);

    const loginButton = screen.getByRole('button', { name: /Login/i });
    
    // 【修改点】直接使用 userEvent.click，不再使用 setup
    await userEvent.click(loginButton);

    // 等待 Warning 出现
    expect(await screen.findByText(/Username and password are required/i)).toBeInTheDocument();
    
    expect(screen.queryByText(/We didn't recognize/i)).not.toBeInTheDocument();
  });

  test('3. 必填校验：密码为空时点击登录，显示 Warning', async () => {
    render(<Login />);

    const userIdInput = screen.getByLabelText(/User ID/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    // 【修改点】直接使用 userEvent.type
    await userEvent.type(userIdInput, 'testuser');
    await userEvent.click(loginButton);

    expect(await screen.findByText(/Username and password are required/i)).toBeInTheDocument();
  });

  test('4. 认证成功：输入正确账号密码，调用 API 并成功', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(); 

    render(<Login />);

    const userIdInput = screen.getByLabelText(/User ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    // 输入正确的测试账号 (admin/123456)
    await userEvent.type(userIdInput, 'admin');
    await userEvent.type(passwordInput, '123456');
    
    await userEvent.click(loginButton);

    // 验证按钮变为加载中状态
    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent(/Logging in.../i);

    // 等待 API 返回（模拟延迟 800ms）
    // 注意：因为代码里用了 alert，我们需要等待 alert 被调用，或者等待 UI 变化
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Login Successful! Redirecting...');
    }, { timeout: 2000 });

    consoleSpy.mockRestore();
  });

  test('5. 认证失败：输入错误账号密码，显示 Error Message', async () => {
    render(<Login />);

    const userIdInput = screen.getByLabelText(/User ID/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    await userEvent.type(userIdInput, 'wronguser');
    await userEvent.type(passwordInput, 'wrongpass');
    
    await userEvent.click(loginButton);

    // 等待 Error 出现
    const errorMessage = await screen.findByText(/We didn't recognize the username or password/i);
    expect(errorMessage).toBeInTheDocument();

    // 验证按钮恢复可用状态
    expect(loginButton).not.toBeDisabled();
    expect(loginButton).toHaveTextContent(/Login/i);
  });

  test('6. 交互体验：输入内容后，自动清除错误/警告信息', async () => {
    render(<Login />);

    const userIdInput = screen.getByLabelText(/User ID/i);
    const loginButton = screen.getByRole('button', { name: /Login/i });

    // 1. 触发 Warning
    await userEvent.click(loginButton);
    expect(await screen.findByText(/Username and password are required/i)).toBeInTheDocument();

    // 2. 开始输入 UserID
    await userEvent.type(userIdInput, 'a');

    // 3. Warning 应该消失
    expect(screen.queryByText(/Username and password are required/i)).not.toBeInTheDocument();
  });
});