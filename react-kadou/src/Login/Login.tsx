import React, { useState } from 'react';
import { Button, Card, Form, Input, Tag, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { AuthUser, UserRole } from '../data/mockUsers';
import type { Department } from '../WorkStatus/types';
import { departmentNameOf } from '../data/departmentUtils';
import request from '../request';
import './Login.css';
import { LoginRequest,LoginResponse } from './LoginModel';
import { roleMap, roleLabelMap } from '../common/commonUtils';

const { Title, Text, Paragraph } = Typography;
const loginUrl = '/api/auth/login';

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
 * ログイン画面（モック）
 * フロント内の固定ユーザー（MOCK_USERS）でユーザーID・パスワードを照合する。
 * バックエンド実装時は認証 API に置き換える。
 */
const Login: React.FC<LoginProps> = ({ users, departments, onLogin }) => {
  // 認証エラーのメッセージ（空 = エラーなし）
  const [error, setError] = useState('');

  /** ログイン実行（ユーザーID・パスワードを MOCK_USERS と照合する） */
  const handleFinish = async (values: { userId: string; password: string }) => {
    const userId = values.userId.trim();
    const password = values.password.trim();

    const loginRequest: LoginRequest = {
      userId: userId,
      password: password,
    };

    const user = await request.post<LoginResponse>(loginUrl,loginRequest);

    const loginResponse: LoginResponse = user.data;

    if (!loginResponse) {
      setError('ユーザーIDまたはパスワードが正しくありません。');
      return;
    }
        
    setError('');
    onLogin({
      userId: loginResponse.userId,
      password: password,
      name: loginResponse.name,
      role: roleMap[loginResponse.yakushokukubun],
      roleLabel: roleLabelMap[loginResponse.yakushokukubun],
      departmentId: loginResponse.department
    });
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
          <Button type='primary' size='large' htmlType='submit' block>
            ログイン
          </Button>
        </Form>

        {/* テスト用アカウント（モックのため画面上に案内する） */}
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
