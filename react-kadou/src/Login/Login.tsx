import React, { useState } from 'react';
import { Button, Card, Form, Input, Tag, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { AuthUser } from '../data/mockUsers';
import type { Department } from '../WorkStatus/types';
import { departmentNameOf } from '../data/departmentUtils';
import { loginApi } from '../api/auth';
import './Login.css';

const { Title, Text, Paragraph } = Typography;

interface LoginProps {
  /** ログインユーザー一覧（ユーザー管理画面で追加・変更・削除される） */
  users: AuthUser[];
  /** 部門マスタ（ユーザーの担当部門名の表示に使用） */
  departments: Department[];
  /** 認証成功時にログインユーザーを通知する */
  onLogin: (user: AuthUser) => void;
}

/** ロール → Tag の色 */
const ROLE_COLOR: Record<AuthUser['role'], string> = {
  bucho: 'blue',
  'jigyo-bucho': 'geekblue',
  admin: 'red',
};

/**
 * ログイン画面
 * バックエンドのログインAPI（POST /api/v1/login）でユーザーID・パスワードを照合する。
 */
const Login: React.FC<LoginProps> = ({ users, departments, onLogin }) => {
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

        {/* 開発用テストアカウント（バックエンドに登録済み） */}
        <div className='login-hint'>
          <Text type='secondary'>
            テスト用アカウント（パスワードはすべて <code>pass1234</code>）
          </Text>
          <ul className='login-hint-list'>
            {users.map((u) => (
              <li key={u.userId}>
                <Tag color={ROLE_COLOR[u.role]}>{u.roleLabel}</Tag>
                <code>{u.userId}</code>
                <Text type='secondary'>
                  {u.name}
                  {u.departmentId
                    ? `（${departmentNameOf(departments, u.departmentId)}）`
                    : ''}
                </Text>
              </li>
            ))}
          </ul>
          <Paragraph type='secondary' className='login-hint-note'>
            ※部長はログイン直後に自部門のデータを表示します。他の部門も選んで閲覧できます（権限ではなく表示の既定値）。
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default Login;
