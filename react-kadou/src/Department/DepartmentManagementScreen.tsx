import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Department, DepartmentKind } from '../WorkStatus/types';

const { Title, Text } = Typography;

/** 種別の選択肢 */
const KIND_OPTIONS: { value: DepartmentKind; label: string }[] = [
  { value: 'dept', label: '部門' },
  { value: 'partner', label: '協力会社' },
];

/** 種別の表示名（未設定は部門扱い） */
const kindLabelOf = (kind?: DepartmentKind): string =>
  kind === 'partner' ? '協力会社' : '部門';

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
  /** 表示する年度 */
  year: number;
  /** 部門マスタ（App 側で年度ごとに保持。協力会社も含む） */
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}

/**
 * 部門管理 画面（メニュー「部門管理」で切り替わる画面）
 * 部門と協力会社は同じマスタで平級に管理する（種別 = 部門 / 協力会社）。
 * 画面には名称のみを表示し、主キーの部門ID は内部キーとして隠す。
 * ここで登録した名称が、要員稼動管理画面の「所属」列と
 * プロジェクト管理画面の「所属部門」の選択肢になる。
 * ※協力会社は稼働率統計の集計対象外（済南稼働率統計には出さない）。
 */
const DepartmentManagementScreen: React.FC<DepartmentManagementScreenProps> = ({
  year,
  departments,
  setDepartments,
}) => {
  // 名称（新規登録 / 修正で共用）
  const [name, setName] = useState('');
  // 種別（新規登録 / 修正で共用）
  const [kind, setKind] = useState<DepartmentKind>('dept');
  // 修正中の部門ID（null = 新規登録モード）
  const [editingId, setEditingId] = useState<string | null>(null);
  // 修正開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  const isEditing = editingId !== null;

  /** フォームを初期化（修正モードも解除） */
  const handleResetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setKind('dept');
  }, []);

  /** 修正（選択した部門をフォームへ読み込む） */
  const handleEdit = useCallback((row: Department) => {
    setEditingId(row.id);
    setName(row.name);
    setKind(row.kind ?? 'dept');
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除 */
  const handleDelete = useCallback(
    (row: Department) => {
      setDepartments((prev) => prev.filter((d) => d.id !== row.id));
      setEditingId((prev) => (prev === row.id ? null : prev));
      message.success(
        `${kindLabelOf(row.kind)}「${row.name}」を削除しました（モック）。`,
      );
    },
    [setDepartments],
  );

  /** 新規登録 / 修正の実行（名称は必須・重複不可） */
  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning('名称を入力してください。');
      return;
    }
    if (departments.some((d) => d.name === trimmed && d.id !== editingId)) {
      message.warning(`「${trimmed}」は既に登録されています。`);
      return;
    }

    if (editingId) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === editingId ? { ...d, name: trimmed, kind } : d)),
      );
      message.success(`${kindLabelOf(kind)}「${trimmed}」を修正しました（モック）。`);
    } else {
      setDepartments((prev) => [
        ...prev,
        { id: buildNextDepartmentId(prev), name: trimmed, kind },
      ]);
      message.success(`${kindLabelOf(kind)}「${trimmed}」を登録しました（モック）。`);
    }
    handleResetForm();
  };

  const columns: TableColumnsType<Department> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        // 種別（部門 / 協力会社）。協力会社は稼働率統計の対象外
        title: '種別',
        dataIndex: 'kind',
        key: 'kind',
        width: 120,
        render: (v: DepartmentKind | undefined) =>
          v === 'partner' ? (
            <Tag color='purple'>協力会社</Tag>
          ) : (
            <Tag>部門</Tag>
          ),
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
              description={`${kindLabelOf(row.kind)}「${row.name}」を削除しますか？`}
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
            {year}年度　部門管理
          </Title>
          <Text type='secondary'>
            要員の「所属」・プロジェクトの「所属部門」として選択できる部門と協力会社を管理します（主キーの部門ID は内部キーのため画面には表示しません）。協力会社は部門と平級の単位ですが、稼働率統計の対象外です。
          </Text>
        </div>
        <Tag color='orange'>フロント モック（バックエンド未接続）</Tag>
      </div>

      <div ref={formRef}>
        {/* 新規登録 / 修正フォーム */}
        <Card
          title={isEditing ? '部門／協力会社の修正' : '部門／協力会社の新規登録'}
          className='screen-card'
          extra={isEditing ? <Tag color='blue'>修正中</Tag> : undefined}
        >
          <Space wrap align='end' size='middle'>
            <div>
              <div className='form-label'>種別</div>
              <Select
                value={kind}
                onChange={(v: DepartmentKind) => setKind(v)}
                options={KIND_OPTIONS}
                style={{ width: 140 }}
              />
            </div>
            <div>
              <div className='form-label'>名称（必須）</div>
              <Input
                placeholder='例：人事部／協力会社B'
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

      {/* 一覧（名称と種別のみ表示。協力会社も同じ一覧） */}
      <Card
        title='部門一覧（協力会社を含む）'
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
