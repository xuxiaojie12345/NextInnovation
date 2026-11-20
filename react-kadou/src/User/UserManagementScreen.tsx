import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "antd";
import type { TableColumnsType } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { AuthUser, UserRole } from "../data/userTypes";
import { ROLE_OPTIONS, roleLabelOf } from "../constants/options";
import type { Department } from "../WorkStatus/types";
import { departmentLabelOf } from "../data/departmentUtils";
import {
  departmentExists,
  normalizeUserDepartmentId,
} from "../data/departmentRules";
import { createUser, deleteUser, fetchUsers, updateUser } from "./userApi";
import "./UserManagementScreen.css";

const { Title, Text } = Typography;

/** 職級（ロール）→ Tag 色 */
const ROLE_COLOR: Record<UserRole, string> = {
  bucho: "blue",
  "jigyo-bucho": "geekblue",
  admin: "red",
};

/** エラーから表示用メッセージを取り出す */
const errorMessageOf = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * サーバーエラー（5xx / 通信失敗）かどうか。
 * Login 画面と同じ扱いで、5xx はエラー画面へ切り替え、4xx はメッセージ表示にする。
 */
const isServerError = (error: unknown): boolean => {
  const status = (error as { status?: number } | null)?.status;
  return status === undefined || status >= 500;
};

interface UserManagementScreenProps {
  /** ログイン中のユーザーID（自分自身の削除・降格を禁止するため） */
  currentUserId: string | null;
  /** 所属部門の選択肢（現在選択中の年度の部門マスタ） */
  departments: Department[];
  /** 管理権限（管理者のみ true） */
  allowManage: boolean;
  /** サーバーエラー（5xx / 通信失敗）時にログイン画面のエラー画面へ切り替える */
  onServerError: () => void;
}

/**
 * ユーザー管理 画面（管理者のみ）
 *
 * ログインユーザーの 追加 / 変更 / 削除 と職級（部長・事業部長・管理者）の設定を行う。
 * ユーザー情報はバックエンド（jn_user_table）が保持する。
 * ※ユーザー自体は全年度共通。所属部門は選択中年度の部門マスタを参照する。
 */
const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  currentUserId,
  departments,
  allowManage,
  onServerError,
}) => {
  // ユーザー一覧（バックエンドから取得する）
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 編集中のユーザーID（null = 新規追加モード / '' = 未選択）
  const [editingId, setEditingId] = useState<string | null>(null);
  // フォーム
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("bucho");
  const [departmentId, setDepartmentId] = useState<string | undefined>(
    undefined,
  );
  const [password, setPassword] = useState("pass1234");

  const isEditing = editingId !== null;
  const opUserId = currentUserId ?? "";

  /** 一覧を取得する */
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers(opUserId));
    } catch (error) {
      // 5xx / 通信失敗はログイン画面のエラー画面へ切り替える
      if (isServerError(error)) {
        onServerError();
        return;
      }
      message.error(
        errorMessageOf(error, "ユーザー一覧の取得に失敗しました。"),
      );
    } finally {
      setLoading(false);
    }
  }, [opUserId, onServerError]);

  useEffect(() => {
    if (!allowManage) return;
    void reload();
  }, [allowManage, reload]);

  /** 管理者の人数（最後の管理者を守るため） */
  const adminCount = useMemo(
    () => users.filter((u) => u.role === "admin").length,
    [users],
  );

  const deptOptions = departments.map((d) => ({
    value: d.departmentId,
    label: departmentLabelOf(departments, d.departmentId),
  }));

  /** フォームの初期化 */
  const resetForm = () => {
    setEditingId(null);
    setUserId("");
    setName("");
    setRole("bucho");
    setDepartmentId(undefined);
    setPassword("pass1234");
  };

  /** 行の編集開始 */
  const handleEdit = (user: AuthUser) => {
    setEditingId(user.userId);
    setUserId(user.userId);
    setName(user.name);
    setRole(user.role);
    // 一覧で「（全部門）」と表示しているユーザーは、選択中の年度に無い部門IDを持つ。
    // その場合はフォームでも未選択（＝全部門）として扱う。
    setDepartmentId(normalizeUserDepartmentId(departments, user.departmentId));
    setPassword(user.password);
  };

  /** 登録（新規追加 / 更新） */
  const handleSubmit = async () => {
    const id = userId.trim();
    const nm = name.trim();
    if (!id) {
      message.error("ユーザーIDを入力してください。");
      return;
    }
    if (!nm) {
      message.error("氏名を入力してください。");
      return;
    }
    if (!password) {
      message.error("パスワードを入力してください。");
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

    setSaving(true);
    if (isEditing && editingId) {
      const target = users.find((u) => u.userId === editingId);
      // 最後の管理者を降格させない
      if (target?.role === "admin" && role !== "admin" && adminCount <= 1) {
        message.error("管理者が 1 名だけのため、降格できません。");
        setSaving(false);
        return;
      }
      try {
        const updated = await updateUser(
          editingId,
          {
            name: nm,
            role,
            departmentId: normalizedDepartmentId,
            password,
          },
          opUserId,
        );
        setUsers((prev) =>
          prev.map((u) => (u.userId === editingId ? updated : u)),
        );
        message.success(`ユーザー「${nm}」を更新しました。`);
        resetForm();
      } catch (error) {
        if (isServerError(error)) {
          onServerError();
          return;
        }
        message.error(errorMessageOf(error, "ユーザーの更新に失敗しました。"));
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      const created = await createUser(
        {
          userId: id,
          name: nm,
          role,
          departmentId: normalizedDepartmentId,
          password,
        },
        opUserId,
      );
      setUsers((prev) => [...prev, created]);
      message.success(`ユーザー「${nm}」を追加しました。`);
      resetForm();
    } catch (error) {
      if (isServerError(error)) {
        onServerError();
        return;
      }
      message.error(errorMessageOf(error, "ユーザーの追加に失敗しました。"));
    } finally {
      setSaving(false);
    }
  };

  /** 削除 */
  const handleDelete = async (user: AuthUser) => {
    if (user.userId === currentUserId) {
      message.error("ログイン中の自分自身は削除できません。");
      return;
    }
    if (user.role === "admin" && adminCount <= 1) {
      message.error("管理者が 1 名だけのため、削除できません。");
      return;
    }
    try {
      await deleteUser(user.userId, opUserId);
      setUsers((prev) => prev.filter((u) => u.userId !== user.userId));
      message.success(`ユーザー「${user.name}」を削除しました。`);
      if (editingId === user.userId) resetForm();
    } catch (error) {
      if (isServerError(error)) {
        onServerError();
        return;
      }
      message.error(errorMessageOf(error, "ユーザーの削除に失敗しました。"));
    }
  };

  const columns: TableColumnsType<AuthUser> = [
    {
      title: "ユーザーID",
      dataIndex: "userId",
      key: "userId",
      // 列幅はデザイン画像の比率に合わせる（合計 100%）
      width: "16%",
      render: (v: string, row) => (
        <Space size={4}>
          <UserOutlined />
          <span>{v}</span>
          {row.userId === currentUserId && <Tag color='green'>ログイン中</Tag>}
        </Space>
      ),
    },
    {
      title: "氏名",
      dataIndex: "name",
      key: "name",
      width: "17%",
      ellipsis: true,
    },
    {
      title: "職級",
      dataIndex: "role",
      key: "role",
      width: "11%",
      render: (_: unknown, row) => (
        <Tag color={ROLE_COLOR[row.role]}>{roleLabelOf(row.role)}</Tag>
      ),
    },
    {
      title: "所属部門",
      dataIndex: "departmentId",
      key: "departmentId",
      width: "19%",
      ellipsis: true,
      render: (v?: string) =>
        v && departmentExists(departments, v)
          ? departmentLabelOf(departments, v)
          : "（全部門）",
    },
    {
      title: "パスワード",
      dataIndex: "password",
      key: "password",
      width: "17%",
      ellipsis: true,
    },
    {
      title: "操作",
      key: "action",
      width: "20%",
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
            <Text type='secondary'>この画面は管理者のみ利用できます。</Text>
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
        title={isEditing ? "ユーザーの変更" : "ユーザーの追加"}
        style={{ marginTop: 12 }}
      >
        <div className='user-form'>
          <div className='form-field'>
            <span className='form-label'>ユーザーID</span>
            <Input
              value={userId}
              placeholder='例：bucho'
              maxLength={5}
              disabled={isEditing}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>氏名</span>
            <Input
              value={name}
              placeholder='例：山田 太郎'
              maxLength={10}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='form-field'>
            <span className='form-label'>職級</span>
            <Select
              value={role}
              options={ROLE_OPTIONS}
              onChange={(v) => setRole(v)}
              style={{ width: "100%" }}
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
              style={{ width: "100%" }}
              popupMatchSelectWidth={false}
            />
            {departmentId && !departmentExists(departments, departmentId) && (
              <Text type='warning'>
                選択中の所属部門は選択中の年度に存在しません。保存すると「全部門」になります。
              </Text>
            )}
          </div>
          <div className='form-field'>
            <span className='form-label'>パスワード</span>
            <Input
              value={password}
              maxLength={50}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Space className='user-form-actions'>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              loading={saving}
              onClick={handleSubmit}
            >
              {isEditing ? "更新" : "追加"}
            </Button>
            <Button onClick={resetForm} disabled={saving}>
              クリア
            </Button>
          </Space>
        </div>
        <Text type='secondary' className='user-note'>
          ※
          部長は「所属部門」を設定すると、ログイン直後にその部門で絞り込まれます（未設定＝全部門）。
          所属部門が削除された場合は、保存時に「未設定（全ての部門）」になります。
          ユーザーはバックエンド（jn_user_table）に保存されます。
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
          loading={loading}
          tableLayout='fixed'
          columns={columns}
          dataSource={users}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default UserManagementScreen;
