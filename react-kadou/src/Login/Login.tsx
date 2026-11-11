import React, { useState } from 'react';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import type { AuthUser } from '../types/user';
import { loginApi } from '../api/login';
import { isApiError } from '../utils/ApiError';
import { apiErrorMessage } from '../utils/errorMessage';
import { t } from '../constants/messages';
import { validatePassword, PASSWORD_MAX_LENGTH } from './passwordRules';
import './Login.css';

const { Title, Text } = Typography;

/** ユーザーIDで許可する文字（半角英数のみ） */
const HALF_WIDTH_ONLY = /^[a-zA-Z0-9]+$/;
const HALF_WIDTH_CHARS = /[^a-zA-Z0-9]/g;

/** 通信不可を表す kind（認証失敗 vs 通信異常を区別する） */
const NETWORK_KINDS = ['timeout', 'offline', 'network'] as const;

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
  // エラーの種類（'auth' = 認証失敗 / 'network' = 通信異常 / null = なし）
  const [errorKind, setErrorKind] = useState<'auth' | 'network' | null>(null);
  // ログイン処理中フラグ
  const [loading, setLoading] = useState(false);

  /** 入力値を許可文字だけで構成する（許可外の文字は削除） */
  const sanitize = (value: string, invalidChars: RegExp) => value.replace(invalidChars, '');

  /** ユーザーID：半角英数のみ入力できるように制限 */
  const restrictUserId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const limited = sanitize(e.target.value, HALF_WIDTH_CHARS);
    if (limited !== e.target.value) form.setFieldValue('userId', limited);
    if (error) {
      setError('');
      setErrorKind(null);
    }
  };

  /** パスワード：エラー表示を消しつつ、入力そのものは passwordRules のルールに任せる */
  const onChangePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (error) {
      setError('');
      setErrorKind(null);
    }
  };

  /** ユーザーID：必須・半角英数のみ（入力中に即時検証） */
  const userIdValidator = (_: unknown, value: string | undefined) => {
    const input = (value ?? '').trim();
    if (input === '') return Promise.reject(new Error(t('W_KADOU_005')));
    if (!HALF_WIDTH_ONLY.test(input)) return Promise.reject(new Error(t('W_KADOU_004')));
    return Promise.resolve();
  };

  /** ログイン実行（バックエンドのログインAPIで照合する） */
  const handleFinish = async (values: { userId: string; password: string }) => {
    // ユーザーID・パスワードはフォームの検証ルールで既に検証済み。
    // パスワードは仕様どおり trim せず、入力値をそのまま照合する。
    const userId = values.userId.trim();
    const password = values.password;
    setLoading(true);
    setError('');
    try {
      const user = await loginApi(userId, password);
      onLogin(user);
    } catch (err) {
      // 認証失敗（401・AUTH_REQUIRED）と通信異常（タイムアウト/ネットワーク断/サーバー障害）を
      // 区別して表示する。メッセージ本文はバックエンドが返すものをそのまま使う（単一性源）。
      const kind = isApiError(err) && (NETWORK_KINDS as readonly string[]).includes(err.kind)
        ? 'network'
        : 'auth';
      setErrorKind(kind);
      setError(apiErrorMessage(err));
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

        {/* 認証エラー / 通信異常 */}
        {error && (
          <Alert
            type={errorKind === 'network' ? 'warning' : 'error'}
            showIcon
            message={error}
            className='login-error'
          />
        )}

        <Form layout='vertical' requiredMark={false} onFinish={handleFinish}>
          <Form.Item
            label='ユーザーID'
            name='userId'
            rules={[{ validator: userIdValidator }]}
          >
            <Input
              size='large'
              prefix={<UserOutlined />}
              placeholder='ユーザーID'
              autoComplete='username'
              maxLength={5}
              onChange={restrictUserId}
            />
          </Form.Item>
          <Form.Item
            label='パスワード'
            name='password'
            rules={[
              {
                validator: (_, value) => {
                  const msg = validatePassword(value);
                  return msg ? Promise.reject(new Error(msg)) : Promise.resolve();
                },
              },
            ]}
          >
            <Input.Password
              size='large'
              prefix={<LockOutlined />}
              placeholder='パスワード'
              autoComplete='current-password'
              maxLength={PASSWORD_MAX_LENGTH}
              onChange={onChangePassword}
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