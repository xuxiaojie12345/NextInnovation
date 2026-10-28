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
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Department,
  DepartmentKind,
  DepartmentLocation,
} from '../WorkStatus/types';
import { departmentLabelOf } from '../data/departmentUtils';
import {
  addDepartment,
  deleteDepartment,
  fetchDepartments,
  updateDepartment,
} from '../api/departmentManagement';

const { Title, Text } = Typography;

/** 種別の選択肢 */
const KIND_OPTIONS: { value: DepartmentKind; label: string }[] = [
  { value: 'dept', label: '部門' },
  { value: 'partner', label: '協力会社' },
];

/** 拠点の選択肢（固定 2 択） */
const LOCATION_OPTIONS: { value: DepartmentLocation; label: string }[] = [
  { value: '天津', label: '天津' },
  { value: '済南', label: '済南' },
];

/** 種別の表示名（未設定は部門扱い） */
const kindLabelOf = (kind?: DepartmentKind): string =>
  kind === 'partner' ? '協力会社' : '部門';

interface DepartmentManagementScreenProps {
  /** 表示する年度 */
  year: number;
  /** 部門マスタ（App 側で年度ごとに保持。協力会社も含む） */
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  /** 操作者（登録・更新者）のユーザーID */
  operatorId?: string | null;
}

/**
 * 部門管理 画面（メニュー「部門管理」で切り替わる画面）
 * 部門と協力会社は同じマスタで平級に管理する（種別 = 部門 / 協力会社）。
 * 名称・拠点・種別を管理し、主キーの部門ID は内部キーとして扱う。
 * ※部門名は一意制約を持たないため、同名部門がある場合のみ一覧で部門IDを併記する。
 * ここで登録した名称が、要員稼動管理画面の「所属」列と
 * プロジェクト管理画面の「所属部門」の選択肢になる。
 * ※拠点は必須（天津 / 済南）で、済南稼働率統計は拠点が済南の部門のみを対象にする。
 * ※協力会社は稼働率統計の集計対象外（済南稼働率統計には出さない）。
 */
const DepartmentManagementScreen: React.FC<DepartmentManagementScreenProps> = ({
  year,
  departments,
  setDepartments,
  operatorId,
}) => {
  // 名称（新規登録 / 修正で共用）
  const [name, setName] = useState('');
  // 種別（新規登録 / 修正で共用）
  const [kind, setKind] = useState<DepartmentKind>('dept');
  // 拠点（新規登録 / 修正で共用。必須のため未選択を許可する）
  const [location, setLocation] = useState<DepartmentLocation | undefined>(
    undefined,
  );
  // 修正中の部門ID（null = 新規登録モード）
  const [editingId, setEditingId] = useState<string | null>(null);
  // 初期データのロード中フラグ
  const [loading, setLoading] = useState(false);
  // 登録 / 修正 / 削除の実行中フラグ（二重送信防止）
  const [saving, setSaving] = useState(false);
  // 修正開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);
  // 最新の setDepartments を保持する ref。
  // setDepartments はストア更新のたびに再生成されるため、effect の依存に含めると
  // 「更新→再フェッチ→更新」の無限ループになる。ここでは常に最新のものを参照する。
  const setDepartmentsRef = useRef(setDepartments);
  setDepartmentsRef.current = setDepartments;

  // 年度が変わったらバックエンドから部門一覧を取得する
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchDepartments(year);
        if (alive) setDepartmentsRef.current(list);
      } catch (err) {
        if (alive) message.error(err instanceof Error ? err.message : '部門一覧を取得できませんでした。');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // 依存は year のみ。setDepartments は ref 経由で常に最新を参照する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const isEditing = editingId !== null;

  /** フォームを初期化（修正モードも解除） */
  const handleResetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setKind('dept');
    setLocation(undefined);
  }, []);

  /** 修正（選択した部門をフォームへ読み込む） */
  const handleEdit = useCallback((row: Department) => {
    setEditingId(row.departmentId);
    setName(row.name);
    setKind(row.kind ?? 'dept');
    setLocation(row.location);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除 */
  const handleDelete = useCallback(
    async (row: Department) => {
      setSaving(true);
      try {
        await deleteDepartment(year, row.departmentId);
        setDepartments((prev) =>
          prev.filter((d) => d.departmentId !== row.departmentId),
        );
        setEditingId((prev) => (prev === row.departmentId ? null : prev));
        message.success(
          `${kindLabelOf(row.kind)}「${row.name}」を削除しました。`,
        );
      } catch (err) {
        message.error(
          err instanceof Error ? err.message : '部門を削除できませんでした。',
        );
      } finally {
        setSaving(false);
      }
    },
    [year, setDepartments],
  );

  /** 新規登録 / 修正の実行（名称・拠点は必須） */
  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning('名称を入力してください。');
      return;
    }
    if (!location) {
      message.warning('拠点を選択してください。');
      return;
    }
    if (saving) return;

    const payload = { name: trimmed, location, kind };
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateDepartment(
          year,
          editingId,
          payload,
          operatorId,
        );
        setDepartments((prev) =>
          prev.map((d) => (d.departmentId === editingId ? updated : d)),
        );
        message.success(
          `${location}拠点の${kindLabelOf(kind)}「${trimmed}」を修正しました。`,
        );
      } else {
        const created = await addDepartment(year, payload, operatorId);
        setDepartments((prev) => [...prev, created]);
        message.success(
          `${location}拠点の${kindLabelOf(kind)}「${trimmed}」を登録しました。`,
        );
      }
      handleResetForm();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : '部門を保存できませんでした。',
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<Department> = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        render: (_: string, row) =>
          departmentLabelOf(departments, row.departmentId),
      },
      {
        // 拠点（天津 / 済南）
        title: '拠点',
        dataIndex: 'location',
        key: 'location',
        width: 100,
        render: (v: DepartmentLocation) =>
          v === '天津' ? <Tag color='cyan'>天津</Tag> : <Tag color='geekblue'>済南</Tag>,
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
    [handleEdit, handleDelete, departments],
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
            要員の「所属」・プロジェクトの「所属部門」として選択できる部門と協力会社を管理します。拠点（天津／済南）は必須で、済南稼働率統計は拠点が済南の部門のみを集計対象にします。部門名は同名可のため、同名部門がある場合は名称に部門IDを付けて表示します。協力会社は部門と平級の単位ですが、稼働率統計の対象外です。
          </Text>
        </div>
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
                disabled={saving}
              />
            </div>
            <div>
              <div className='form-label'>名称（必須・同名可）</div>
              <Input
                placeholder='例：人事部／協力会社B'
                value={name}
                maxLength={30}
                onChange={(e) => setName(e.target.value)}
                onPressEnter={handleSubmit}
                style={{ width: 260 }}
                disabled={saving}
              />
            </div>
            <div>
              <div className='form-label'>拠点（必須）</div>
              <Select
                placeholder='拠点を選択'
                value={location}
                onChange={(v: DepartmentLocation) => setLocation(v)}
                options={LOCATION_OPTIONS}
                style={{ width: 140 }}
                disabled={saving}
              />
            </div>
            <Button
              type='primary'
              icon={isEditing ? <CheckOutlined /> : <PlusOutlined />}
              onClick={handleSubmit}
              loading={saving}
            >
              {isEditing ? '修正する' : '登録する'}
            </Button>
            {isEditing && (
              <Button onClick={handleResetForm} disabled={saving}>
                キャンセル
              </Button>
            )}
            <Button type='text' onClick={handleResetForm} disabled={saving}>
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
        <Spin spinning={loading}>
          <Table<Department>
            rowKey='departmentId'
            size='small'
            columns={columns}
            dataSource={departments}
            rowClassName={(row) =>
              row.departmentId === editingId ? 'project-row-editing' : ''
            }
            pagination={{ pageSize: 8, size: 'small', showSizeChanger: false }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default DepartmentManagementScreen;