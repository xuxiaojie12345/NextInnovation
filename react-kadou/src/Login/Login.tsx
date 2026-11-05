import React, { useState } from 'react';
import { Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { AuthUser } from '../types/user';
import { loginApi, loginErrorMessage } from '../api/login';
import './Login.css';

const { Title, Text } = Typography;

/** ユーザーID / パスワードで許可する文字（半角英数のみ） */
const HALF_WIDTH_ONLY = /^[a-zA-Z0-9]+$/;
const HALF_WIDTH_CHARS = /[^a-zA-Z0-9]/g;
const HALF_WIDTH_MSG = '半角英数字のみ入力できます。';

interface LoginProps {
  /** 認証成功時にログインユーザーを通知する */
  onLogin: (user: AuthUser) => void;
}

/**
 * ログイン画面
 * バックエンドのログインAPI（POST /api/v1/login）でユーザーID・パスワードを照合する。
 */
const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // フォームインスタンス（入力文字の制御に使う）
  const [form] = Form.useForm();
  // 認証エラーのメッセージ（空 = エラーなし）
  const [error, setError] = useState('');
  // ログイン処理中フラグ
  const [loading, setLoading] = useState(false);

  /** 入力値から半角英数字以外を取り除く（それ以外の文字は入力させない） */
  const sanitizeHalfWidth = (value: string) => value.replace(HALF_WIDTH_CHARS, '');

  /** 入力文字列を半角英数字のみに制限し、エラー表示も消す */
  const restrictHalfWidth = (name: 'userId' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const limited = sanitizeHalfWidth(e.target.value);
    if (limited !== e.target.value) {
      form.setFieldValue(name, limited);
    }
    if (error) setError('');
  };

  /** ログイン実行（バックエンドのログインAPIで照合する） */
  const handleFinish = async (values: { userId: string; password: string }) => {
    const userId = values.userId.trim();
    const password = values.password.trim();
    if (!HALF_WIDTH_ONLY.test(userId) || !HALF_WIDTH_ONLY.test(password)) {
      setError(HALF_WIDTH_MSG);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginApi(userId, password);
      onLogin(user);
    } catch (err) {
      // 認証失敗（401）と通信異常（タイムアウト / ネットワーク断 / CORS 等）を区別して表示
      setError(loginErrorMessage(err));
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
            rules={[
              { required: true, message: 'ユーザーIDを入力してください。' },
              { pattern: HALF_WIDTH_ONLY, message: HALF_WIDTH_MSG },
            ]}
          >
            <Input
              size='large'
              prefix={<UserOutlined />}
              placeholder='ユーザーID'
              autoComplete='username'
              maxLength={5}
              onChange={restrictHalfWidth('userId')}
            />
          </Form.Item>
          <Form.Item
            label='パスワード'
            name='password'
            rules={[
              { required: true, message: 'パスワードを入力してください。' },
              { pattern: HALF_WIDTH_ONLY, message: HALF_WIDTH_MSG },
            ]}
          >
            <Input.Password
              size='large'
              prefix={<LockOutlined />}
              placeholder='パスワード'
              autoComplete='current-password'
              maxLength={50}
              onChange={restrictHalfWidth('password')}
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