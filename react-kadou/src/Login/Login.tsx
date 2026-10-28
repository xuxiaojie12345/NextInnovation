import React, { useState } from 'react';
import { Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { AuthUser } from '../types/user';
import { loginApi } from '../api/login';
import './Login.css';

const { Title, Text } = Typography;

interface LoginProps {
  /** 認証成功時にログインユーザーを通知する */
  onLogin: (user: AuthUser) => void;
}

/**
 * ログイン画面
 * バックエンドのログインAPI（POST /api/v1/login）でユーザーID・パスワードを照合する。
 */
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // 認証エラーのメッセージ（空 = エラーなし）
  const [error, setError] = useState('');
  // ログイン処理中フラグ
  const [loading, setLoading] = useState(false);

  /** ログイン実行（バックエンドのログインAPIで照合する） */
  const handleFinish = async (values: { userId: string; password: string }) => {
    const userId = values.userId.trim();
    const password = values.password.trim();
    setLoading(true);
    setError('');
    try {
      const user = await loginApi(userId, password);
      onLogin(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'ユーザーIDまたはパスワードが正しくありません。',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-page'>
      <Card className='login-card'>
        <div className='login-brand'>
          <span className='login-mark'>稼</span>
          <Title level={4} style={{ margin: 0 }}>
            要員稼動管理
          </Title>
        </div>
        <Text type='secondary' className='login-lead'>
          ログインしてください。
        </Text>

        {/* 認証エラー */}
        {error && <div className='login-error'>{error}</div>}

        <Form layout='vertical' requiredMark={false} onFinish={handleFinish}>
          <Form.Item
            label='ユーザーID'
            name='userId'
            rules={[{ required: true, message: 'ユーザーIDを入力してください。' }]}
          >
            <Input
              size='large'
              prefix={<UserOutlined />}
              placeholder='ユーザーID'
              autoComplete='username'
              maxLength={20}
              onChange={() => {
                if (error) setError('');
              }}
            />
          </Form.Item>
          <Form.Item
            label='パスワード'
            name='password'
            rules={[
              { required: true, message: 'パスワードを入力してください。' },
            ]}
          >
            <Input.Password
              size='large'
              prefix={<LockOutlined />}
              placeholder='パスワード'
              autoComplete='current-password'
              maxLength={32}
              onChange={() => {
                if (error) setError('');
              }}
            />
          </Form.Item>
          <Button type='primary' size='large' htmlType='submit' block loading={loading}>
            ログイン
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;