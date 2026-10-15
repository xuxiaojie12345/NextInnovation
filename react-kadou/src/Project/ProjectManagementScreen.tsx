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
import dayjs, { Dayjs } from 'dayjs';
import { Department, Project } from '../WorkStatus/types';
import { buildProjectAbbr } from './projectAbbr';
import './ProjectManagementScreen.css';

const { Title, Text } = Typography;

/** 1ページの表示件数 */
const PAGE_SIZE = 15;

/** 登録・修正フォームの入力値（略称 は自動生成するため保持しない） */
interface ProjectFormValues {
  /** 顧客 */
  customer: string;
  /** 案件 */
  caseName: string;
  /** チーム */
  team: string;
  /** Subチーム */
  subTeam: string;
  /** 所属部門 */
  department: string;
  /** 項目ID */
  id: string;
  /** Project名称 */
  name: string;
}

/** フォームの初期値（新規登録モード） */
const EMPTY_FORM: ProjectFormValues = {
  customer: '',
  caseName: '',
  team: '',
  subTeam: '',
  department: '',
  id: '',
  name: '',
};

/** 必須項目（入力順）。この3項目以外は任意入力 */
const REQUIRED_FIELDS: [keyof ProjectFormValues, string][] = [
  ['customer', '顧客'],
  ['caseName', '案件'],
  ['department', '所属部門'],
];

/**
 * 内部キーの採番（既存の pj-xxxx の最大値 + 1）。
 * 項目ID は任意入力（空欄・重複可）のため、一意キーは内部で自動採番する。
 */
const buildNextProjectKey = (list: Project[]): string => {
  const numbers = list
    .map((p) => /^pj-(\d+)$/.exec(p.key))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `pj-${String(next).padStart(4, '0')}`;
};

/** 画面表示用のプロジェクト名（Project名称 → 略称 の順にフォールバック） */
const projectLabel = (p: Project): string =>
  p.name || p.abbr || '（名称未設定）';

/** ISO 8601 の週番号（月曜始まり・第1週は1/4を含む週）を求める */
const getIsoWeek = (date: Dayjs): number => {
  const d = date.startOf('day');
  // その週の木曜日（ISO では木曜日が属する年が「週の年」になる）
  const thursday = d.add(3 - ((d.day() + 6) % 7), 'day');
  const dayOfYear = thursday.diff(thursday.startOf('year'), 'day') + 1;
  return Math.floor((dayOfYear - 1) / 7) + 1;
};

interface ProjectManagementScreenProps {
  /** 表示する年度 */
  year: number;
  /** プロジェクト一覧（App 側で年度ごとに保持） */
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  /** 部門マスタ（「所属部門」「部門」の選択肢） */
  departments: Department[];
}

/**
 * プロジェクト管理 画面（メニュー「プロジェクト管理」で切り替わる画面）
 * 顧客・案件・チーム・Subチーム・略称・所属部門・項目ID・Project名称 を管理する。
 * 必須は 顧客 / 案件 / 所属部門 の 3 項目のみ。
 * 略称 は「顧客の1文字目・案件・チーム・Subチーム」で自動生成（編集不可）。
 * 主キーのシステム項目ID はシステム採番（一覧の最右に表示・編集不可）。
 */
const ProjectManagementScreen: React.FC<ProjectManagementScreenProps> = ({
  year,
  projects,
  setProjects,
  departments,
}) => {
  // 登録 / 修正フォームの入力値
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_FORM);
  // 修正中の内部キー（null = 新規登録モード）
  const [editingKey, setEditingKey] = useState<string | null>(null);
  // 修正開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  const isEditing = editingKey !== null;

  /** 当週の週数（画面右上に表示） */
  const week = useMemo(() => {
    const today = dayjs();
    const monday = today.subtract((today.day() + 6) % 7, 'day');
    return {
      no: getIsoWeek(today),
      year: today.year(),
      monday,
      sunday: monday.add(6, 'day'),
    };
  }, []);

  /** 略称（顧客の1文字目・案件・チーム・Subチーム から自動生成） */
  const abbr = buildProjectAbbr(
    form.customer,
    form.caseName,
    form.team,
    form.subTeam,
  );

  /** フォームの1項目を更新 */
  const setField = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  /** フォームを初期化（修正モードも解除） */
  const handleResetForm = useCallback(() => {
    setEditingKey(null);
    setForm(EMPTY_FORM);
  }, []);

  /** 修正（選択したプロジェクトをフォームへ読み込む） */
  const handleEdit = useCallback((row: Project) => {
    setEditingKey(row.key);
    setForm({
      customer: row.customer,
      caseName: row.caseName,
      team: row.team,
      subTeam: row.subTeam,
      department: row.department,
      id: row.id,
      name: row.name,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除 */
  const handleDelete = useCallback(
    (row: Project) => {
      setProjects((prev) => prev.filter((p) => p.key !== row.key));
      setEditingKey((prev) => (prev === row.key ? null : prev));
      message.success(
        `プロジェクト「${projectLabel(row)}」を削除しました（モック）。`,
      );
    },
    [setProjects],
  );

  /** 新規登録 / 修正の実行 */
  const handleSubmit = () => {
    const missing = REQUIRED_FIELDS.find(([key]) => !String(form[key]).trim());
    if (missing) {
      message.warning(`${missing[1]} を入力してください。`);
      return;
    }

    const values: Project = {
      // 内部キーは一意な自動採番（修正時は元のキーを維持）
      key: editingKey ?? buildNextProjectKey(projects),
      // 項目ID は任意入力（空欄可・重複可。主キーではない）
      id: form.id.trim(),
      customer: form.customer.trim(),
      caseName: form.caseName.trim(),
      team: form.team.trim(),
      subTeam: form.subTeam.trim(),
      abbr: buildProjectAbbr(form.customer, form.caseName, form.team, form.subTeam),
      department: form.department,
      name: form.name.trim(),
    };

    if (editingKey) {
      setProjects((prev) =>
        prev.map((p) => (p.key === editingKey ? values : p)),
      );
      message.success(
        `プロジェクト「${projectLabel(values)}」を修正しました（モック）。`,
      );
    } else {
      setProjects((prev) => [...prev, values]);
      message.success(
        `プロジェクト「${projectLabel(values)}」を登録しました（モック）。`,
      );
    }
    handleResetForm();
  };

  const columns: TableColumnsType<Project> = useMemo(
    () => [
      {
        title: '顧客',
        dataIndex: 'customer',
        key: 'customer',
        width: 140,
      },
      {
        title: '案件',
        dataIndex: 'caseName',
        key: 'caseName',
        width: 140,
      },
      {
        title: 'チーム',
        dataIndex: 'team',
        key: 'team',
        width: 100,
        render: (v: string) => v || <Text type='secondary'>－</Text>,
      },
      {
        title: 'Subチーム',
        dataIndex: 'subTeam',
        key: 'subTeam',
        width: 110,
        render: (v: string) => v || <Text type='secondary'>－</Text>,
      },
      {
        title: '略称',
        dataIndex: 'abbr',
        key: 'abbr',
        width: 240,
        render: (v: string) => <span className='project-abbr'>{v}</span>,
      },
      {
        title: '所属部門',
        dataIndex: 'department',
        key: 'department',
        width: 140,
      },
      {
        title: '項目ID',
        dataIndex: 'id',
        key: 'id',
        width: 120,
        render: (v: string) => v || <Text type='secondary'>－</Text>,
      },
      {
        title: 'Project名称',
        dataIndex: 'name',
        key: 'name',
        width: 170,
        render: (v: string) => v || <Text type='secondary'>－</Text>,
      },
      {
        // 主キー（システム採番）。一覧の最右に表示する
        title: 'システム項目ID',
        dataIndex: 'key',
        key: 'key',
        width: 140,
        fixed: 'right',
      },
      {
        title: '操作',
        key: 'action',
        width: 150,
        fixed: 'right',
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
              description={`「${projectLabel(row)}」を削除しますか？`}
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
            {year}年度　プロジェクト管理
          </Title>
          <Text type='secondary'>
            プロジェクト（顧客・案件・チーム・Subチーム・所属部門・項目ID・Project名称）を管理します。必須は 顧客 / 案件 / 所属部門 の 3 項目で、略称 は「顧客の1文字目・案件・チーム・Subチーム」で自動生成されます。
          </Text>
        </div>
      </div>

      <div ref={formRef}>
        {/* 新規登録 / 修正フォーム（右側に当週の週数） */}
        <div className='project-form-row'>
          <Card
            title={isEditing ? 'プロジェクトの修正' : 'プロジェクトの新規登録'}
            className='screen-card project-form-card'
            extra={isEditing ? <Tag color='blue'>修正中：{abbr}</Tag> : undefined}
          >
            <div className='project-form-grid'>
              <div>
                <div className='form-label'>顧客（必須）</div>
                <Input
                  placeholder='例：桜井商事'
                  value={form.customer}
                  maxLength={30}
                  onChange={(e) => setField('customer', e.target.value)}
                />
              </div>
              <div>
                <div className='form-label'>案件（必須）</div>
                <Input
                  placeholder='例：基幹刷新'
                  value={form.caseName}
                  maxLength={30}
                  onChange={(e) => setField('caseName', e.target.value)}
                />
              </div>
              {/* チーム / Subチーム は隣接して各半分の幅で表示する */}
              <div className='project-field-pair'>
                <div>
                  <div className='form-label'>チーム（任意）</div>
                  <Input
                    placeholder='例：第一'
                    value={form.team}
                    maxLength={20}
                    onChange={(e) => setField('team', e.target.value)}
                  />
                </div>
                <div>
                  <div className='form-label'>Subチーム（任意）</div>
                  <Input
                    placeholder='例：A'
                    value={form.subTeam}
                    maxLength={20}
                    onChange={(e) => setField('subTeam', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className='form-label'>Project名称（任意）</div>
                <Input
                  placeholder='例：次期基幹システム'
                  value={form.name}
                  maxLength={40}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div>
                <div className='form-label'>略称（自動生成・編集不可）</div>
                <Input
                  value={abbr}
                  readOnly
                  disabled
                  placeholder='顧客・案件・チーム・Subチーム から自動生成'
                />
              </div>
              <div>
                <div className='form-label'>所属部門（必須）</div>
                <Select
                  value={form.department || undefined}
                  placeholder='部門を選択'
                  onChange={(v: string) => setField('department', v)}
                  options={departments.map((d) => ({
                    value: d.name,
                    label: d.name,
                  }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div className='form-label'>項目ID（任意）</div>
                <Input
                  placeholder='例：PRJ-0006'
                  value={form.id}
                  maxLength={20}
                  onChange={(e) => setField('id', e.target.value)}
                />
              </div>
            </div>

            <Space wrap style={{ marginTop: 16 }}>
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

          {/* 当週の週数（フォームと同じ行に表示） */}
          <Card size='small' className='project-week-card'>
            <div className='project-week'>
              <Text type='secondary'>当週の週数</Text>
              <div className='project-week-value'>
                {week.year}年 第{week.no}週
              </div>
              <Text type='secondary'>
                {week.monday.format('M/D')} 〜 {week.sunday.format('M/D')}
              </Text>
            </div>
          </Card>
        </div>
      </div>

      {/* 一覧（1ページ15件） */}
      <Card
        title='プロジェクト一覧'
        className='screen-card project-list-card'
        style={{ marginTop: 12 }}
        extra={
          <Text type='secondary'>
            全 {projects.length} 件（1ページ {PAGE_SIZE} 件）
          </Text>
        }
      >
        <Table<Project>
          rowKey='key'
          size='small'
          columns={columns}
          dataSource={projects}
          rowClassName={(row) =>
            row.key === editingKey ? 'project-row-editing' : ''
          }
          scroll={{ x: 1440 }}
          pagination={{
            pageSize: PAGE_SIZE,
            showSizeChanger: false,
            size: 'small',
          }}
        />
      </Card>
    </div>
  );
};

export default ProjectManagementScreen;
