import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Department } from '../WorkStatus/types';

const { Title, Text } = Typography;

/** 部門ID の採番（既存の dept-xxxx の最大値 + 1） */
const buildNextDepartmentId = (list: Department[]): string => {
  const numbers = list
    .map((d) => /^dept-(\d+)$/.exec(d.id))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `dept-${String(next).padStart(4, '0')}`;
};

interface DepartmentManagementScreenProps {
  /** 部門マスタ（App 側で保持） */
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}

/**
 * 部門管理 画面（メニュー「部門管理」で切り替わる画面）
 * 画面には部門名のみを表示し、主キーの部門ID は内部キーとして隠す。
 * ここで登録した部門が、要員稼動管理画面の「部門」列と
 * プロジェクト管理画面の「所属部門」「部門」の選択肢になる。
 */
const DepartmentManagementScreen: React.FC<DepartmentManagementScreenProps> = ({
  departments,
  setDepartments,
}) => {
  // 部門名（新規登録 / 修正で共用）
  const [name, setName] = useState('');
  // 修正中の部門ID（null = 新規登録モード）
  const [editingId, setEditingId] = useState<string | null>(null);
  // 修正開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  const isEditing = editingId !== null;

  /** フォームを初期化（修正モードも解除） */
  const handleResetForm = useCallback(() => {
    setEditingId(null);
    setName('');
  }, []);

  /** 修正（選択した部門をフォームへ読み込む） */
  const handleEdit = useCallback((row: Department) => {
    setEditingId(row.id);
    setName(row.name);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除 */
  const handleDelete = useCallback(
    (row: Department) => {
      setDepartments((prev) => prev.filter((d) => d.id !== row.id));
      setEditingId((prev) => (prev === row.id ? null : prev));
      message.success(`部門「${row.name}」を削除しました（モック）。`);
    },
    [setDepartments],
  );

  /** 新規登録 / 修正の実行（部門名は必須・重複不可） */
  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning('部門名を入力してください。');
      return;
    }
    if (departments.some((d) => d.name === trimmed && d.id !== editingId)) {
      message.warning(`部門「${trimmed}」は既に登録されています。`);
      return;
    }

    if (editingId) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingId ? { ...d, name: trimmed } : d)),
      );
      message.success(`部門「${trimmed}」を修正しました（モック）。`);
    } else {
      setDepartments((prev) => [
        ...prev,
        { id: buildNextDepartmentId(prev), name: trimmed },
      ]);
      message.success(`部門「${trimmed}」を登録しました（モック）。`);
    }
    handleResetForm();
  };

  const columns: TableColumnsType<Department> = useMemo(
    () => [
      {
        title: '部門名',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        align: 'center',
        render: (_, row) => (
          <Space size={0}>
            <Button
              type='link'
              size='small'
              icon={<EditOutlined />}
              onClick={() => handleEdit(row)}
            >
              修正
            </Button>
            <Popconfirm
              title='削除の確認'
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
    ],
    [handleEdit, handleDelete],
  );

  return (
    <div className='screen-page'>
      {/* 画面ヘッダー */}
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            部門管理
          </Title>
          <Text type='secondary'>
            要員の部門・プロジェクトの部門として選択できる部門を管理します（主キーの部門ID は内部キーのため画面には表示しません）。
          </Text>
        </div>
        <Tag color='orange'>フロント モック（バックエンド未接続）</Tag>
      </div>

      <div ref={formRef}>
        {/* 新規登録 / 修正フォーム */}
        <Card
          title={isEditing ? '部門の修正' : '部門の新規登録'}
          className='screen-card'
          extra={isEditing ? <Tag color='blue'>修正中</Tag> : undefined}
        >
          <Space wrap align='end' size='middle'>
            <div>
              <div className='form-label'>部門名（必須）</div>
              <Input
                placeholder='例：人事部'
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                onPressEnter={handleSubmit}
                style={{ width: 260 }}
              />
            </div>
            <Button
              type='primary'
              icon={isEditing ? <CheckOutlined /> : <PlusOutlined />}
              onClick={handleSubmit}
            >
              {isEditing ? '修正する' : '登録する'}
            </Button>
            {isEditing && <Button onClick={handleResetForm}>キャンセル</Button>}
            <Button type='text' onClick={handleResetForm}>
              クリア
            </Button>
          </Space>
        </Card>
      </div>

      {/* 部門一覧（部門名のみ表示） */}
      <Card
        title='部門一覧'
        className='screen-card'
        style={{ marginTop: 12 }}
        extra={<Text type='secondary'>全 {departments.length} 件</Text>}
      >
        <Table<Department>
          rowKey='id'
          size='small'
          columns={columns}
          dataSource={departments}
          rowClassName={(row) => (row.id === editingId ? 'project-row-editing' : '')}
          pagination={{ pageSize: 15, size: 'small', showSizeChanger: false }}
        />
      </Card>
    </div>
  );
};

export default DepartmentManagementScreen;
