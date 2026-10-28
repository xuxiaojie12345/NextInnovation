import React, { useState } from "react";
import { Button, Card, Form, Input, Typography } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import "./Login.css";

const { Title, Text } = Typography;

// 后端返回user结构
export interface LoginUser {
  userId: string;
  shimei: string;
  yakushokuKubun: string;
  departmentId: string;
}
interface LoginResp {
  token: string;
  user: LoginUser;
}

const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

interface LoginProps {
  onLogin: (user: LoginUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { userId: string; password: string }) => {
    const userId = values.userId.trim();
    const password = values.password;
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/login/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, password }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const msg = errJson?.detail ?? "ログイン処理に失敗しました";
        setError(msg);
        return;
      }

      const data: LoginResp = await res.json();

      onLogin(data.user);
    } catch (err) {
      console.error(err);
      setError(
        "サーバーに接続できません。ネットワークまたはサーバー起動状況を確認してください。",
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

        {error && <div className='login-error'>{error}</div>}

        <Form layout='vertical' requiredMark={false} onFinish={handleFinish}>
          <Form.Item
            label='ユーザーID'
            name='userId'
            rules={[
              { required: true, message: "ユーザーIDを入力してください。" },
            ]}
          >
            <Input
              size='large'
              prefix={<UserOutlined />}
              placeholder='ユーザーID'
              autoComplete='username'
              maxLength={20}
              onChange={() => {
                if (error) setError("");
              }}
            />
          </Form.Item>
          <Form.Item
            label='パスワード'
            name='password'
            rules={[
              { required: true, message: "パスワードを入力してください。" },
            ]}
          >
            <Input.Password
              size='large'
              prefix={<LockOutlined />}
              placeholder='パスワード'
              autoComplete='current-password'
              maxLength={32}
              onChange={() => {
                if (error) setError("");
              }}
            />
          </Form.Item>
          <Button
            type='primary'
            size='large'
            htmlType='submit'
            block
            loading={loading}
          >
            ログイン
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
