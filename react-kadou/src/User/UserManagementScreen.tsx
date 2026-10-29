import React, { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { AuthUser, UserRole } from '../data/mockUsers';
import type { Department } from '../WorkStatus/types';
import { departmentLabelOf } from '../data/departmentUtils';
import {
  departmentExists,
  normalizeUserDepartmentId,
} from '../data/departmentRules';
import './UserManagementScreen.css';

const { Title, Text } = Typography;

/** 職級（ロール）の選択肢 */
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'bucho', label: '部長' },
  { value: 'jigyo-bucho', label: '事業部長' },
  { value: 'admin', label: '管理者' },
];

/** 職級（ロール）→ 表示名 */
const roleLabelOf = (role: UserRole): string =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;

/** 職級（ロール）→ Tag 色 */
const ROLE_COLOR: Record<UserRole, string> = {
  bucho: 'blue',
  'jigyo-bucho': 'geekblue',
  admin: 'red',
};

interface UserManagementScreenProps {
  /** ログインユーザー一覧（App 側で保持） */
  users: AuthUser[];
  setUsers: React.Dispatch<React.SetStateAction<AuthUser[]>>;
  /** ログイン中のユーザーID（自分自身の削除・降格を禁止するため） */
  currentUserId: string | null;
  /** 所属部門の選択肢（現在選択中の年度の部門マスタ） */
  departments: Department[];
  /** 管理権限（管理者のみ true） */
  allowManage: boolean;
}

/**
 * ユーザー管理 画面（管理者のみ）
 *
 * ログインユーザーの 追加 / 変更 / 削除 と職級（部長・事業部長・管理者）の設定を行う。
 * ※ユーザー自体は全年度共通。所属部門は選択中年度の部門マスタを参照する。
 */
const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  users,
  setUsers,
  currentUserId,
  departments,
  allowManage,
}) => {
  // 編集中のユーザーID（null = 新規追加モード / '' = 未選択）
  const [editingId, setEditingId] = useState<string | null>(null);
  // フォーム
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('bucho');
  const [departmentId, setDepartmentId] = useState<string | undefined>(
    undefined,
  );
  const [password, setPassword] = useState('pass1234');

  const isEditing = editingId !== null;

  /** 管理者の人数（最後の管理者を守るため） */
  const adminCount = useMemo(
    () => users.filter((u) => u.role === 'admin').length,
    [users],
  );

  const deptOptions = departments.map((d) => ({
    value: d.departmentId,
    label: departmentLabelOf(departments, d.departmentId),
  }));

  /** フォームの初期化 */
  const resetForm = () => {
    setEditingId(null);
    setUserId('');
    setName('');
    setRole('bucho');
    setDepartmentId(undefined);
    setPassword('pass1234');
  };

  /** 行の編集開始 */
  const handleEdit = (user: AuthUser) => {
    setEditingId(user.userId);
    setUserId(user.userId);
    setName(user.name);
    setRole(user.role);
    setDepartmentId(user.departmentId);
    setPassword(user.password);
  };

  /** 登録（新規追加 / 更新） */
  const handleSubmit = () => {
    const id = userId.trim();
    const nm = name.trim();
    if (!id) {
      message.error('ユーザーIDを入力してください。');
      return;
    }
    if (!nm) {
      message.error('氏名を入力してください。');
      return;
    }
    // ユーザーID の重複チェック（編集中の自分自身は除く）
    if (users.some((u) => u.userId === id && u.userId !== editingId)) {
      message.error(`ユーザーID「${id}」は既に登録されています。`);
      return;
    }

    // 選択中の年度に存在しない部門は「未設定（全ての部門）」として保存する
    const normalizedDepartmentId = normalizeUserDepartmentId(
      departments,
      departmentId,
    );

    if (isEditing && editingId) {
      const target = users.find((u) => u.userId === editingId);
      // 最後の管理者を降格させない
      if (
        target?.role === 'admin' &&
        role !== 'admin' &&
        adminCount <= 1
      ) {
        message.error('管理者が 1 名だけのため、降格できません。');
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === editingId
            ? {
                ...u,
                userId: id,
                name: nm,
                role,
                roleLabel: roleLabelOf(role),
                departmentId: normalizedDepartmentId,
                password,
              }
            : u,
        ),
      );
      message.success(`ユーザー「${nm}」を更新しました。`);
      resetForm();
      return;
    }

    setUsers((prev) => [
      ...prev,
      {
        userId: id,
        name: nm,
        role,
        roleLabel: roleLabelOf(role),
        departmentId: normalizedDepartmentId,
        password: password || 'pass1234',
      },
    ]);
    message.success(`ユーザー「${nm}」を追加しました。`);
    resetForm();
  };

  /** 削除 */
  const handleDelete = (user: AuthUser) => {
    if (user.userId === currentUserId) {
      message.error('ログイン中の自分自身は削除できません。');
      return;
    }
    if (user.role === 'admin' && adminCount <= 1) {
      message.error('管理者が 1 名だけのため、削除できません。');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
    message.success(`ユーザー「${user.name}」を削除しました。`);
    if (editingId === user.userId) resetForm();
  };

  const columns: TableColumnsType<AuthUser> = [
    {
      title: 'ユーザーID',
      dataIndex: 'userId',
      key: 'userId',
      width: 140,
      render: (v: string, row) => (
        <Space size={4}>
          <UserOutlined />
          <span>{v}</span>
          {row.userId === currentUserId && <Tag color='green'>ログイン中</Tag>}
        </Space>
      ),
    },
    { title: '氏名', dataIndex: 'name', key: 'name', width: 160 },
    {
      title: '職級',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (_: unknown, row) => (
        <Tag color={ROLE_COLOR[row.role]}>{roleLabelOf(row.role)}</Tag>
      ),
    },
    {
      title: '所属部門',
      dataIndex: 'departmentId',
      key: 'departmentId',
      width: 140,
      render: (v?: string) =>
        v && departmentExists(departments, v)
          ? departmentLabelOf(departments, v)
          : '（全部門）',
    },
    { title: 'パスワード（モック）', dataIndex: 'password', key: 'password', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, row) => (
        <Space>
          <Button
            type='text'
            size='small'
            icon={<EditOutlined />}
            onClick={() => handleEdit(row)}
          >
            編集
          </Button>
          <Popconfirm
            title='ユーザー削除の確認'
            description={`「${row.name}」を削除しますか？`}
            okText='削除'
            cancelText='キャンセル'
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(row)}
          >
            <Button type='text' danger size='small' icon={<DeleteOutlined />}>
              削除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!allowManage) {
    return (
      <div className='screen-page'>
        <div className='screen-header'>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              ユーザー管理
            </Title>
            <Text type='secondary'>
              この画面は管理者のみ利用できます。
            </Text>
          </div>
        </div>
        <Card className='screen-card' style={{ marginTop: 12 }}>
          <Text type='danger'>
            権限がありません。管理者アカウントでログインしてください。
          </Text>
        </Card>
      </div>
    );
  }

  return (
    <div className='screen-page'>
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            ユーザー管理
          </Title>
          <Text type='secondary'>
            ログインユーザーの追加・変更・削除と、職級（部長｜事業部長｜管理者）の設定を行います。
            ユーザー自体は全年度共通ですが、所属部門は選択中の年度の部門マスタを参照します。
          </Text>
        </div>
        <Tag color='red'>管理者のみ</Tag>
      </div>

      {/* 登録フォーム */}
      <Card
        className='screen-card'
        title={isEditing ? 'ユーザーの変更' : 'ユーザーの追加'}
        style={{ marginTop: 12 }}
      >
        <div className='user-form'>
          <div className='form-field'>
            <span className='form-label'>ユーザーID</span>
            <Input
              value={userId}
              placeholder='例：bucho4'
              maxLength={20}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>氏名</span>
            <Input
              value={name}
              placeholder='例：山田 一郎'
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>職級</span>
            <Select
              value={role}
              options={ROLE_OPTIONS}
              onChange={(v) => setRole(v)}
              style={{ width: '100%' }}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>所属部門</span>
            <Select
              value={departmentId}
              options={deptOptions}
              allowClear
              placeholder='（未選択＝全部門）'
              onChange={(v?: string) => setDepartmentId(v)}
              style={{ width: '100%' }}
            />
            {departmentId &&
              !departmentExists(departments, departmentId) && (
                <Text type='warning'>
                  選択中の所属部門は選択中の年度に存在しません。保存すると「全部門」になります。
                </Text>
              )}
          </div>
          <div className='form-field'>
            <span className='form-label'>パスワード</span>
            <Input
              value={password}
              maxLength={32}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Space className='user-form-actions'>
            <Button type='primary' icon={<PlusOutlined />} onClick={handleSubmit}>
              {isEditing ? '更新' : '追加'}
            </Button>
            <Button onClick={resetForm}>クリア</Button>
          </Space>
        </div>
        <Text type='secondary' className='user-note'>
          ※ 部長は「所属部門」を設定すると、ログイン直後にその部門で絞り込まれます（未設定＝全部門）。
          所属部門が削除された場合は、保存時に「未設定（全ての部門）」になります。
          パスワードはモック表示です（実運用ではバックエンドで管理）。
        </Text>
      </Card>

      {/* 一覧 */}
      <Card
        className='screen-card'
        title={`ユーザー一覧（${users.length} 名）`}
        style={{ marginTop: 12 }}
      >
        <Table<AuthUser>
          rowKey='userId'
          size='small'
          columns={columns}
          dataSource={users}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default UserManagementScreen;
