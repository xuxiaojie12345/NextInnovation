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
  Upload,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { Department, Project } from '../WorkStatus/types';
import {
  departmentLabelOf,
  resolveDepartmentIdByName,
} from '../data/departmentUtils';
import { buildProjectAbbr } from './projectAbbr';
import {
  PROJECT_IMPORT_ACCEPT,
  PROJECT_IMPORT_FORMAT_HINT,
  ProjectImportRow,
  parseProjectFile,
} from './projectImport';
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
  /** 所属部門ID */
  departmentId: string;
  /** 項目ID */
  projectCode: string;
  /** Project名称 */
  name: string;
}

/** フォームの初期値（新規登録モード） */
const EMPTY_FORM: ProjectFormValues = {
  customer: '',
  caseName: '',
  team: '',
  subTeam: '',
  departmentId: '',
  projectCode: '',
  name: '',
};

/** 必須項目（入力順）。この3項目以外は任意入力 */
const REQUIRED_FIELDS: [keyof ProjectFormValues, string][] = [
  ['customer', '顧客'],
  ['caseName', '案件'],
  ['departmentId', '所属部門'],
];

/**
 * 内部キーの採番（既存の pj-xxxx の最大値 + 1）。
 * 項目ID は任意入力（空欄・重複可）のため、一意キーは内部で自動採番する。
 */
const nextProjectNumber = (list: Project[]): number => {
  const numbers = list
    .map((p) => /^pj-(\d+)$/.exec(p.projectId))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => Number(m[1]));
  return (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
};

/** 次の内部キー（例：pj-0008） */
const buildNextProjectId = (list: Project[]): string =>
  `pj-${String(nextProjectNumber(list)).padStart(4, '0')}`;

/** 一括読み込みの1行をプロジェクトへ変換する（略称は自動生成） */
const toProject = (
  row: ProjectImportRow,
  projectId: string,
  departmentId: string,
): Project => ({
  projectId,
  projectCode: row.projectCode,
  customer: row.customer,
  caseName: row.caseName,
  team: row.team,
  subTeam: row.subTeam,
  abbr: buildProjectAbbr(row.customer, row.caseName, row.team, row.subTeam),
  departmentId,
  name: row.name,
});

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
  // 一括読み込み：ファイル解析中フラグ
  const [importing, setImporting] = useState(false);
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
    setEditingKey(row.projectId);
    setForm({
      customer: row.customer,
      caseName: row.caseName,
      team: row.team,
      subTeam: row.subTeam,
      departmentId: row.departmentId,
      projectCode: row.projectCode,
      name: row.name,
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  /** 削除 */
  const handleDelete = useCallback(
    (row: Project) => {
      setProjects((prev) => prev.filter((p) => p.projectId !== row.projectId));
      setEditingKey((prev) => (prev === row.projectId ? null : prev));
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
      projectId: editingKey ?? buildNextProjectId(projects),
      // 項目ID は任意入力（空欄可・重複可。主キーではない）
      projectCode: form.projectCode.trim(),
      customer: form.customer.trim(),
      caseName: form.caseName.trim(),
      team: form.team.trim(),
      subTeam: form.subTeam.trim(),
      abbr: buildProjectAbbr(form.customer, form.caseName, form.team, form.subTeam),
      departmentId: form.departmentId,
      name: form.name.trim(),
    };

    if (editingKey) {
      setProjects((prev) =>
        prev.map((p) => (p.projectId === editingKey ? values : p)),
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

  /**
   * 一括読み込み：プロジェクト情報ファイル（Excel / CSV）を解析し、
   * そのまま一覧へ追加する（重複可・確認なし）。
   */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const result = await parseProjectFile(file);
      if (result.rows.length === 0) {
        const detail =
          result.warnings.length > 0
            ? `（${result.warnings[0]}${
                result.warnings.length > 1 ? ' ほか' : ''
              }）`
            : '';
        message.error(
          `一括読み込み：取り込めるプロジェクトがありませんでした（${file.name}）${detail}`,
        );
        return;
      }

      // 部門名から部門IDを解決できない行（未登録・同名重複）を警告する
      const unknownDepartments = Array.from(
        new Set(
          result.rows
            .map((r) => r.department)
            .filter(
              (name) =>
                name !== '' &&
                resolveDepartmentIdByName(departments, name) === null,
            ),
        ),
      );

      // 内部キーは既存の最大値 + 1 から連番で採番する
      setProjects((prev) => {
        const start = nextProjectNumber(prev);
        const added = result.rows.map((row, i) =>
          toProject(
            row,
            `pj-${String(start + i).padStart(4, '0')}`,
            resolveDepartmentIdByName(departments, row.department) ?? '',
          ),
        );
        return [...prev, ...added];
      });

      message.success(
        `プロジェクトを一括読み込みしました：${result.rows.length} 件を追加しました（モック）。`,
      );

      const notes: string[] = [];
      if (unknownDepartments.length > 0) {
        notes.push(
          `部門マスタに無い、または同名で特定できない所属部門：${unknownDepartments.join(
            '、',
          )}（部門管理画面で登録してください）`,
        );
      }
      if (result.warnings.length > 0) {
        notes.push(
          `取り込まなかった行：${result.warnings.length} 件（${result.warnings[0]}${
            result.warnings.length > 1 ? ' ほか' : ''
          }）`,
        );
      }
      if (notes.length > 0) {
        message.warning(notes.join(' / '));
      }
    } catch (e) {
      message.error(
        e instanceof Error
          ? `一括読み込みに失敗しました：${e.message}`
          : '一括読み込みに失敗しました。',
      );
    } finally {
      setImporting(false);
    }
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
        dataIndex: 'departmentId',
        key: 'departmentId',
        width: 140,
        render: (v: string) => departmentLabelOf(departments, v),
      },
      {
        title: '項目ID',
        dataIndex: 'projectCode',
        key: 'projectCode',
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
        dataIndex: 'projectId',
        key: 'projectId',
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
    [handleEdit, handleDelete, departments],
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
            プロジェクト（顧客・案件・チーム・Subチーム・所属部門・項目ID・Project名称）を管理します。必須は 顧客 / 案件 / 所属部門 の 3 項目で、略称 は「顧客の1文字目・案件・チーム・Subチーム」で自動生成されます。右上の「一括読み込む」から Excel / CSV を取り込めます。
          </Text>
        </div>

        {/* 右上：プロジェクト情報（Excel / CSV）の一括読み込み */}
        <div className='project-header-side'>
          <Space size={8} wrap align='center'>
            <Text strong>プロジェクト情報</Text>
            <Upload
              accept={PROJECT_IMPORT_ACCEPT}
              showUploadList={false}
              multiple={false}
              disabled={importing}
              beforeUpload={(file) => {
                // サーバーへは送信せず、フロントのみで解析する（モック）
                void handleImportFile(file);
                return false;
              }}
            >
              <Button
                type='primary'
                icon={<UploadOutlined />}
                loading={importing}
              >
                一括読み込む
              </Button>
            </Upload>
            <Tag color='blue'>フロント モック（バックエンド未接続）</Tag>
          </Space>
          <Text type='secondary' className='project-import-hint'>
            {PROJECT_IMPORT_FORMAT_HINT}
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
                  value={form.departmentId || undefined}
                  placeholder='部門を選択'
                  onChange={(v: string) => setField('departmentId', v)}
                  options={departments.map((d) => ({
                    value: d.departmentId,
                    label: departmentLabelOf(departments, d.departmentId),
                  }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div className='form-label'>項目ID（任意）</div>
                <Input
                  placeholder='例：PRJ-0006'
                  value={form.projectCode}
                  maxLength={20}
                  onChange={(e) => setField('projectCode', e.target.value)}
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
          rowKey='projectId'
          size='small'
          columns={columns}
          dataSource={projects}
          rowClassName={(row) =>
            row.projectId === editingKey ? 'project-row-editing' : ''
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
