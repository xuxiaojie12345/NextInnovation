import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
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
import type { AuthUser, UserRole } from '../types/user';
import type { Department } from '../WorkStatus/types';
import { ROLE_OPTIONS, roleLabelOf } from '../constants/options';
import { departmentLabelOf, findDepartment } from '../data/departmentUtils';
import { fetchDepartments } from '../api/departmentManagement';
import { messageInfo } from '../constants/messages';
import { apiErrorMessage } from '../utils/errorMessage';
import { notifySystemError } from '../utils/systemError';
import { validatePassword, PASSWORD_MAX_LENGTH } from '../Login/passwordRules';
import {
  addUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from '../api/userManagement';
import './UserManagementScreen.css';

const { Title, Text } = Typography;

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
  /** 表示する年度（所属部門マスタをDBから取得するために使う） */
  year: number;
  /** 管理権限（管理者のみ true） */
  allowManage: boolean;
  /** 操作者（登録・更新者）のユーザーID */
  operatorId?: string | null;
  /** この画面が表示中かどうか（表示中になったときに一覧をDBから再取得する） */
  active: boolean;
}

/**
 * ユーザー管理 画面（管理者のみ）
 *
 * ログインユーザーの 追加 / 変更 / 削除 と職級（部長・事業部長・管理者）の設定を行う。
 * ※ユーザー自体は全年度共通。所属部門は選択中年度の部門マスタを参照する。
 * データはバックエンド（jn_user_table）から取得・保存する。
 */
const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  users,
  setUsers,
  currentUserId,
  year,
  allowManage,
  operatorId,
  active,
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
  // 初期データのロード中フラグ
  const [loading, setLoading] = useState(false);
  // 登録 / 修正 / 削除の実行中フラグ（二重送信防止）
  const [saving, setSaving] = useState(false);
  // 所属部門マスタ（DBから取得。App のモックには dept-0001 形式で id が一致しないため、
  // 他の画面と同じく DB から取り直す）。
  const [deptMaster, setDeptMaster] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  // 最新の setUsers を保持する ref（setUsers はストア更新のたびに再生成されるため）
  const setUsersRef = useRef(setUsers);
  setUsersRef.current = setUsers;

  const isEditing = editingId !== null;

  // この画面が表示されたときにバックエンドからユーザー一覧を取得する
  useEffect(() => {
    if (!active) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchUsers();
        if (alive) setUsersRef.current(list);
      } catch (err) {
        if (!notifySystemError(err)) {
          if (alive) message.error(apiErrorMessage(err, messageInfo('E_KADOU_020')));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // 依存は active。setUsers は ref 経由で常に最新を参照する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // 年度が変わったとき・この画面が表示中になったときに所属部門マスタをDBから取り直す。
  // ※App の departments はモック（dept-0001 形式）で DB の department_id と一致しない
  //   ため、プロジェクト管理画面と同じく DB から取得したものを利用する。
  useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoadingDepartments(true);
    fetchDepartments(year)
      .then((list) => {
        if (alive) setDeptMaster(list);
      })
      .catch(() => {
        if (alive) setDeptMaster([]);
      })
      .finally(() => {
        if (alive) setLoadingDepartments(false);
      });
    return () => {
      alive = false;
    };
  }, [year, active]);

  // 管理者の人数（最後の管理者を守るため）
  const adminCount = useMemo(
    () => users.filter((u) => u.role === 'admin').length,
    [users],
  );

  // 所属部門の選択肢。
  // DB から取得した部門マスタ（deptMaster）をそのまま利用する。
  // 部門名に一意制約はないため、同名部門がある場合は部門管理画面と同じく
  // departmentLabelOf で「部門名（部門ID）」を付けて区別する。
  const deptOptions = useMemo(
    () =>
      deptMaster.map((d) => ({
        value: d.departmentId,
        label: departmentLabelOf(deptMaster, d.departmentId),
      })),
    [deptMaster],
  );

  /** フォームの初期化 */
  const resetForm = useCallback(() => {
    setEditingId(null);
    setUserId('');
    setName('');
    setRole('bucho');
    setDepartmentId(undefined);
    setPassword('pass1234');
  }, []);

  /** 行の編集開始 */
  const handleEdit = useCallback((user: AuthUser) => {
    setEditingId(user.userId);
    setUserId(user.userId);
    setName(user.name);
    setRole(user.role);
    setDepartmentId(user.departmentId);
    setPassword(user.password);
  }, []);

  /** 登録（新規追加 / 更新） */
  const handleSubmit = useCallback(async () => {
    const id = userId.trim();
    const nm = name.trim();
    if (!id) {
      message.warning(messageInfo('W_KADOU_005'));
      return;
    }
    // ユーザーIDは半角英数字のみ許可（最大5文字。maxLengthで入力は制限済み）
    if (!/^[A-Za-z0-9]+$/.test(id)) {
      message.warning(messageInfo('W_KADOU_004'));
      return;
    }
    if (!nm) {
      message.warning(messageInfo('W_KADOU_001', ['氏名']));
      return;
    }
    // パスワード：ログイン画面と同じ検証ルール（必須・最大50文字・半角英数+記号のみ）
    const pwdMsg = validatePassword(password);
    if (pwdMsg) {
      message.warning(pwdMsg);
      return;
    }
    if (saving) return;

    setSaving(true);
    try {
      if (isEditing && editingId) {
        const target = users.find((u) => u.userId === editingId);
        // 最後の管理者を降格させない
        if (
          target?.role === 'admin' &&
          role !== 'admin' &&
          adminCount <= 1
        ) {
          message.error(messageInfo('E_KADOU_005'));
          return;
        }
        const updated = await updateUser(
          editingId,
          {
            name: nm,
            role,
            departmentId,
            password: password || 'pass1234',
          },
          operatorId,
        );
        setUsers((prev) =>
          prev.map((u) => (u.userId === editingId ? updated : u)),
        );
        message.success(messageInfo('E_KADOU_008', [nm]));
      } else {
        const created = await addUser(
          {
            userId: id,
            name: nm,
            role,
            departmentId,
            password: password || 'pass1234',
          },
          operatorId,
        );
        setUsers((prev) => [...prev, created]);
        message.success(messageInfo('E_KADOU_009', [nm]));
      }
      resetForm();
    } catch (err) {
      if (!notifySystemError(err)) {
        message.error(apiErrorMessage(err, messageInfo('E_KADOU_020')));
      }
    } finally {
      setSaving(false);
    }
  }, [
    userId,
    name,
    role,
    password,
    departmentId,
    saving,
    isEditing,
    editingId,
    users,
    adminCount,
    setUsers,
    operatorId,
    resetForm,
  ]);

  /** 削除 */
  const handleDelete = useCallback(
    async (user: AuthUser) => {
      if (user.userId === currentUserId) {
        message.error(messageInfo('E_KADOU_007'));
        return;
      }
      if (user.role === 'admin' && adminCount <= 1) {
        message.error(messageInfo('E_KADOU_006'));
        return;
      }
      if (saving) return;
      setSaving(true);
      try {
        await deleteUser(user.userId);
        setUsers((prev) =>
          prev.filter((u) => u.userId !== user.userId),
        );
        if (editingId === user.userId) resetForm();
        message.success(messageInfo('E_KADOU_010', [user.name]));
      } catch (err) {
        if (!notifySystemError(err)) {
          message.error(apiErrorMessage(err, messageInfo('E_KADOU_020')));
        }
      } finally {
        setSaving(false);
      }
    },
    [currentUserId, adminCount, saving, setUsers, editingId, resetForm],
  );

  const columns: TableColumnsType<AuthUser> = useMemo(
    () => [
      {
        title: 'ユーザーID',
        dataIndex: 'userId',
        key: 'userId',
        width: 150,
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
        width: 100,
        render: (_: unknown, row) => (
          <Tag color={ROLE_COLOR[row.role]}>{roleLabelOf(row.role)}</Tag>
        ),
      },
      {
        title: '所属部門',
        dataIndex: 'departmentId',
        key: 'departmentId',
        width: 170,
        render: (v?: string) => {
          if (!v) return '（全部門）';
          if (findDepartment(deptMaster, v)) {
            return departmentLabelOf(deptMaster, v);
          }
          return `（削除済み）${v}`;
        },
      },
      {
        title: 'パスワード',
        dataIndex: 'password',
        key: 'password',
        width: 160,
        ellipsis: { showTitle: true },
      },
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
              disabled={saving}
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
              <Button
                type='text'
                danger
                size='small'
                icon={<DeleteOutlined />}
                disabled={saving}
              >
                削除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [currentUserId, handleEdit, handleDelete, saving, deptMaster],
  );

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
            この画面の内容は年度に依存しません。
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
              placeholder='例：adm01'
              maxLength={5}
              onChange={(e) => setUserId(e.target.value)}
              disabled={saving || isEditing}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>氏名</span>
            <Input
              value={name}
              placeholder='例：山田　一郎'
              maxLength={10}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>職級</span>
            <Select
              value={role}
              options={ROLE_OPTIONS}
              onChange={(v: UserRole) => setRole(v)}
              style={{ width: '100%' }}
              disabled={saving}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>所属部門</span>
            <Select
              value={departmentId}
              options={deptOptions}
              allowClear
              showSearch
              optionFilterProp='label'
              placeholder='（未選択＝全部門）'
              notFoundContent={
                loadingDepartments
                  ? '読み込み中...'
                  : '部門が登録されていません'
              }
              onChange={(v?: string) => setDepartmentId(v)}
              style={{ width: '100%' }}
              disabled={saving || loadingDepartments}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>パスワード</span>
            <Input
              value={password}
              maxLength={PASSWORD_MAX_LENGTH}
              onChange={(e) => setPassword(e.target.value)}
              disabled={saving}
            />
          </div>
          <Space className='user-form-actions'>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={handleSubmit}
              loading={saving}
            >
              {isEditing ? '更新' : '追加'}
            </Button>
            <Button onClick={resetForm} disabled={saving}>
              クリア
            </Button>
          </Space>
        </div>
        <Text type='secondary' className='user-note'>
          ※ 部長は「所属部門」を設定すると、ログイン直後にその部門で絞り込まれます（未設定＝全部門）。
          パスワードは保存対象です（バックエンドで管理）。
        </Text>
      </Card>

      {/* 一覧 */}
      <Card
        className='screen-card'
        title={`ユーザー一覧（${users.length} 名）`}
        style={{ marginTop: 12 }}
      >
        <Spin spinning={loading}>
          <Table<AuthUser>
            rowKey='userId'
            size='small'
            tableLayout='fixed'
            columns={columns}
            dataSource={users}
            pagination={false}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default UserManagementScreen;