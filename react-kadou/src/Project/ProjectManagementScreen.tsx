import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
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
import { findDepartment } from '../data/departmentUtils';
import { fetchDepartments } from '../api/departmentManagement';
import { buildProjectAbbr } from './projectAbbr';
import {
  PROJECT_IMPORT_ACCEPT,
  PROJECT_IMPORT_FORMAT_HINT,
  ProjectImportRow,
  parseProjectFile,
} from './projectImport';
import {
  ProjectApiInfo,
  ProjectImportApiResult,
  createProject,
  deleteProject,
  fetchProjects,
  importProjectRows,
  updateProject,
} from './projectApi';
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

/**
 * API のプロジェクト（ProjectApiInfo）を画面用の Project へ変換する。
 * 略称はサーバー側で生成されるが、未設定なら画面側で組み立てる。
 */
const toProjectFromApi = (p: ProjectApiInfo): Project => ({
  projectId: p.projectId ?? '',
  projectCode: p.projectCode ?? '',
  customer: p.customer ?? '',
  caseName: p.caseName ?? '',
  team: p.team ?? '',
  subTeam: p.subTeam ?? '',
  abbr:
    p.abbr ??
    buildProjectAbbr(
      p.customer ?? '',
      p.caseName ?? '',
      p.team ?? '',
      p.subTeam ?? '',
    ),
  departmentId: p.departmentId ?? '',
  name: p.project_name ?? '',
});

/** 必須項目（入力順）。この3項目以外は任意入力 */
const REQUIRED_FIELDS: [keyof ProjectFormValues, string][] = [
  ['customer', '顧客'],
  ['caseName', '案件'],
  ['departmentId', '所属部門'],
];

/** 一括読み込みの1行を API 送信形式へ変換する */
const toApiRow = (row: ProjectImportRow, index: number) => ({
  customer: row.customer,
  caseName: row.caseName,
  team: row.team,
  subTeam: row.subTeam,
  department: row.department,
  projectCode: row.projectCode,
  project_name: row.name,
  // 画面に出す行番号は見出し行を除いた 1 始まり
  line: index + 1,
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
  /**
   * プロジェクト一覧（App 側で年度ごとに保持）
   * ※DB（jn_project_master）と同期する。画面での追加・更新・削除を反映する。
   */
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  /** 部門マスタ（「所属部門」「部門」の選択肢） */
  departments: Department[];
  /** 操作者（登録・更新者）。リクエストヘッダー X-User-Id に付与する */
  operatorId?: string | null;
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
  operatorId,
}) => {
  // 登録 / 修正フォームの入力値
  const [form, setForm] = useState<ProjectFormValues>(EMPTY_FORM);
  // 修正中の内部キー（null = 新規登録モード）
  const [editingKey, setEditingKey] = useState<string | null>(null);
  // 一括読み込み：ファイル解析中フラグ
  const [importing, setImporting] = useState(false);
  // 一覧取得中フラグ
  const [loading, setLoading] = useState(false);
  // 保存（登録・修正）中フラグ
  const [saving, setSaving] = useState(false);
  // 削除中フラグ
  const [deleting, setDeleting] = useState(false);
  // 一括読み込み：プレビュー（null = ダイアログ非表示）
  const [importRows, setImportRows] = useState<ProjectImportRow[] | null>(null);
  // 一括読み込み：ファイル名 / 読み取り元 / 取り込まなかった行の警告
  const [importFileName, setImportFileName] = useState('');
  const [importSource, setImportSource] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  // 一括読み込み：事前検証（dryRun）結果
  const [importCheck, setImportCheck] =
    useState<ProjectImportApiResult | null>(null);
  // 一括取り込みをバックエンドへ送信中フラグ
  const [submittingImport, setSubmittingImport] = useState(false);
  // 修正開始時にフォームへスクロールするための参照
  const formRef = useRef<HTMLDivElement>(null);

  /**
   * 部門マスタ（所属部門の選択肢）。
   *
   * NOTE: App から受け取る departments はフロントのモックで、
   *       departmentId が 'dept-0001' 形式のため DB の値（1,2,3…）と一致しない。
   *       そのため要員情報画面と同じく、この画面で DB から取得する。
   */
  const [deptMaster, setDeptMaster] = useState<Department[]>([]);
  // 部門マスタ取得中フラグ
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // 年度が変わったら部門マスタを取り直す
  useEffect(() => {
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
  }, [year]);

  /**
   * 所属部門の選択肢（値 = 部門番号、表示 = 部門名称）。
   * 部門番号は DB の department_id（3桁ゼロ埋め文字列）を使う。
   */
  const departmentOptions = useMemo(
    () =>
      deptMaster.map((d) => ({
        value: d.departmentId,
        label: d.name,
      })),
    [deptMaster],
  );

  /**
   * 部門番号（department_id）で表示用の部門名を返す（修正フォームの選択値確認用）。
   * 部門マスタに無い場合は undefined。
   */
  const departmentNameOfId = useCallback(
    (departmentId: string): string | undefined =>
      findDepartment(deptMaster, departmentId)?.name,
    [deptMaster],
  );

  /**
   * 最新の setProjects を保持する ref。
   * setProjects（App の setYearProjects）はストア更新のたびに再生成されるため、
   * effect の依存に含めると「取得→setProjects→再レンダー→取得…」の無限ループになる。
   * ここでは常に最新のものを参照する。
   */
  const setProjectsRef = useRef(setProjects);
  setProjectsRef.current = setProjects;

  const isEditing = editingKey !== null;

  /**
   * 年度分のプロジェクト一覧を DB（jn_project_master）から取得して画面へ反映する。
   * 画面を開いたとき（年度変更時）に呼ぶ。
   * ※ setProjects を依存に含めない（ref 経由で参照する）
   */
  const reloadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchProjects(year);
      setProjectsRef.current(list.map(toProjectFromApi));
    } catch (e) {
      message.error(
        e instanceof Error
          ? `プロジェクト一覧の取得に失敗しました：${e.message}`
          : 'プロジェクト一覧の取得に失敗しました。',
      );
    } finally {
      setLoading(false);
    }
  }, [year]);

  // 年度が変わったら一覧を取得し直す（画面初期データ取得 API）
  // 依存は year のみ。setProjects は ref 経由で常に最新を参照する
  useEffect(() => {
    void reloadProjects();
  }, [reloadProjects]);

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

  /** 削除（DB の jn_project_master から削除する） */
  const handleDelete = useCallback(
    async (row: Project) => {
      setDeleting(true);
      try {
        await deleteProject(year, row.projectId);
        setProjects((prev) =>
          prev.filter((p) => p.projectId !== row.projectId),
        );
        setEditingKey((prev) => (prev === row.projectId ? null : prev));
        message.success(`プロジェクト「${projectLabel(row)}」を削除しました。`);
      } catch (e) {
        message.error(
          e instanceof Error
            ? `削除に失敗しました：${e.message}`
            : '削除に失敗しました。',
        );
      } finally {
        setDeleting(false);
      }
    },
    [year, setProjects],
  );

  /** 新規登録 / 修正の実行（DB の jn_project_master へ保存する） */
  const handleSubmit = async () => {
    const missing = REQUIRED_FIELDS.find(([key]) => !String(form[key]).trim());
    if (missing) {
      message.warning(`${missing[1]} を入力してください。`);
      return;
    }

    const payload = {
      customer: form.customer.trim(),
      caseName: form.caseName.trim(),
      team: form.team.trim(),
      subTeam: form.subTeam.trim(),
      departmentId: form.departmentId,
      // 項目ID は任意入力（空欄可・重複可。主キーではない）
      projectCode: form.projectCode.trim(),
      project_name: form.name.trim(),
    };

    setSaving(true);
    try {
      if (editingKey) {
        // 修正（主キー：年度 + システム項目ID）
        const updated = await updateProject(
          year,
          editingKey,
          payload,
          operatorId,
        );
        const values = toProjectFromApi(updated);
        setProjects((prev) =>
          prev.map((p) => (p.projectId === editingKey ? values : p)),
        );
        message.success(
          `プロジェクト「${projectLabel(values)}」を修正しました。`,
        );
      } else {
        // 新規登録（システム項目ID はサーバー側で採番）
        const created = await createProject(year, payload, operatorId);
        const values = toProjectFromApi(created);
        setProjects((prev) => [...prev, values]);
        message.success(
          `プロジェクト「${projectLabel(values)}」を登録しました。`,
        );
      }
      handleResetForm();
    } catch (e) {
      message.error(
        e instanceof Error
          ? `保存に失敗しました：${e.message}`
          : '保存に失敗しました。',
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * 一括読み込み：プロジェクト情報ファイル（Excel / CSV）を解析し、
   * バックエンドで事前検証（dryRun）してからプレビューを表示する。
   */
  const handleImportFile = async (file: File) => {
    setImporting(true);
    try {
      const parsed = await parseProjectFile(file);
      if (parsed.rows.length === 0) {
        const detail =
          parsed.warnings.length > 0
            ? `（${parsed.warnings[0]}${parsed.warnings.length > 1 ? ' ほか' : ''}）`
            : '';
        message.error(
          `一括読み込み：取り込めるプロジェクトがありませんでした（${file.name}）${detail}`,
        );
        return;
      }

      setImportFileName(file.name);
      setImportSource(parsed.source);
      setImportWarnings(parsed.warnings);

      // 事前検証（DB へは書き込まない）
      const check = await importProjectRows(
        year,
        parsed.rows.map(toApiRow),
        { dryRun: true, opUser: operatorId },
      );
      setImportCheck(check);
      setImportRows(parsed.rows);
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

  /** 一括読み込み：プレビューを閉じる */
  const handleImportCancel = () => {
    setImportRows(null);
    setImportCheck(null);
    setImportWarnings([]);
    setImportFileName('');
    setImportSource('');
  };

  /**
   * 一括読み込み：プレビュー内容をバックエンドへ送信して DB を更新する。
   * 取り込んだ行はすべて新しいプロジェクトとして追加される。
   */
  const handleImportConfirm = async () => {
    if (!importRows) return;
    setSubmittingImport(true);
    try {
      const result = await importProjectRows(year, importRows.map(toApiRow), {
        opUser: operatorId,
      });

      // 取り込み後の一覧を DB から取り直す（システム項目ID はサーバー採番のため）
      await reloadProjects();

      message.success(
        `プロジェクトを一括読み込みしました：追加 ${result.added} 件` +
          (result.skipped > 0 ? ` / スキップ ${result.skipped} 件` : '') +
          '。',
      );

      const warnings = [...importWarnings, ...result.warnings];
      if (result.skipped > 0 && warnings.length === 0) {
        warnings.push(`取り込まなかった行が ${result.skipped} 件あります。`);
      }
      if (warnings.length > 0) {
        message.warning(
          `警告が ${warnings.length} 件あります（${warnings[0]}${
            warnings.length > 1 ? ' ほか' : ''
          }）。`,
        );
      }
      handleImportCancel();
    } catch (e) {
      message.error(
        e instanceof Error
          ? `一括読み込みに失敗しました：${e.message}`
          : '一括読み込みに失敗しました。',
      );
    } finally {
      setSubmittingImport(false);
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
        // 一覧は部門「名称」ではなく部門「番号（department_id）」を表示する
        render: (v: string) => {
          if (!v) return <Text type='secondary'>－</Text>;
          const found = findDepartment(deptMaster, v);
          // 部門マスタに無い値（旧データなど）は赤字で示して修正を促す
          return found ? (
            found.departmentId
          ) : (
            <Text type='danger'>{v}</Text>
          );
        },
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
    [handleEdit, handleDelete],
  );

  /** 一括読み込み：プレビュー表の列 */
  const importColumns: TableColumnsType<ProjectImportRow> = [
    { title: '顧客', dataIndex: 'customer', key: 'customer', width: 130 },
    { title: '案件', dataIndex: 'caseName', key: 'caseName', width: 130 },
    { title: 'チーム', dataIndex: 'team', key: 'team', width: 90 },
    { title: 'Subチーム', dataIndex: 'subTeam', key: 'subTeam', width: 100 },
    { title: '所属部門', dataIndex: 'department', key: 'department', width: 120 },
    { title: '項目ID', dataIndex: 'projectCode', key: 'projectCode', width: 110 },
    { title: 'Project名称', dataIndex: 'name', key: 'name', width: 150 },
  ];

  return (
    <div className='screen-page'>
      {/* 画面ヘッダー */}
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {year}年度　プロジェクト管理
          </Title>
          <Text type='secondary'>
            プロジェクト（顧客・案件・チーム・Subチーム・所属部門・項目ID・Project名称）を管理します。必須は 顧客 / 案件 / 所属部門 の 3 項目で、略称 は「顧客の1文字目・案件・チーム・Subチーム」で自動生成されます。右上の「一括読み込む」から Excel / CSV を取り込めます（所属部門は部門別名と照合します）。
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
                // サーバーへは送信せず、フロントで解析してから API へ送る
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
            <Tag color='green'>バックエンド連携</Tag>
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
                  maxLength={100}
                  onChange={(e) => setField('customer', e.target.value)}
                />
              </div>
              <div>
                <div className='form-label'>案件（必須）</div>
                <Input
                  placeholder='例：基幹刷新'
                  value={form.caseName}
                  maxLength={100}
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
                    maxLength={30}
                    onChange={(e) => setField('team', e.target.value)}
                  />
                </div>
                <div>
                  <div className='form-label'>Subチーム（任意）</div>
                  <Input
                    placeholder='例：A'
                    value={form.subTeam}
                    maxLength={30}
                    onChange={(e) => setField('subTeam', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className='form-label'>Project名称（任意）</div>
                <Input
                  placeholder='例：次期基幹システム'
                  value={form.name}
                  maxLength={30}
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
                {/* 選択肢は部門名称を表示し、内部値は部門番号を保持する */}
                <Select
                  value={form.departmentId || undefined}
                  placeholder={
                    loadingDepartments ? '部門を読み込み中...' : '部門を選択'
                  }
                  loading={loadingDepartments}
                  showSearch
                  optionFilterProp='label'
                  notFoundContent={
                    loadingDepartments
                      ? '読み込み中...'
                      : '部門が登録されていません'
                  }
                  onChange={(v: string) => setField('departmentId', v)}
                  options={departmentOptions}
                  style={{ width: '100%' }}
                />
                {/*
                  既存データの部門番号が部門マスタに無い場合、
                  選択肢に無いため空表示になる。修正を促すメッセージを出す。
                */}
                {form.departmentId &&
                  !loadingDepartments &&
                  !departmentNameOfId(form.departmentId) && (
                    <Text type='danger' style={{ fontSize: 12 }}>
                      登録済みの部門番号「{form.departmentId}
                      」が部門マスタにありません。選択し直してください。
                    </Text>
                  )}
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
                loading={saving}
                onClick={() => void handleSubmit()}
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
          loading={loading}
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

      {/* 一括読み込み：プレビュー（内容を確認してから取り込む） */}
      <Modal
        open={importRows !== null}
        title='プロジェクト情報の一括読み込み'
        okText='取り込む'
        cancelText='中止'
        confirmLoading={submittingImport}
        onOk={() => void handleImportConfirm()}
        onCancel={handleImportCancel}
        width={760}
      >
        {importRows && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Alert
              type='info'
              showIcon
              message='取り込み内容の確認'
              description={`${importFileName}（${importSource}）を読み込みました。新規 ${
                importCheck?.added ?? importRows.length
              } 件を追加します。`}
            />
            {(importCheck?.skipped ?? 0) > 0 && (
              <Alert
                type='error'
                showIcon
                message={`取り込まない行：${importCheck?.skipped} 件`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(importCheck?.warnings ?? []).slice(0, 5).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                    {(importCheck?.warnings.length ?? 0) > 5 && (
                      <li>ほか {(importCheck?.warnings.length ?? 0) - 5} 件</li>
                    )}
                  </ul>
                }
              />
            )}
            {importWarnings.length > 0 && (
              <Alert
                type='warning'
                showIcon
                message={`ファイル側で取り込まなかった行：${importWarnings.length} 件`}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {importWarnings.slice(0, 5).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                    {importWarnings.length > 5 && (
                      <li>ほか {importWarnings.length - 5} 件</li>
                    )}
                  </ul>
                }
              />
            )}
            <Table<ProjectImportRow>
              rowKey={(row, index) => `${row.customer}-${row.caseName}-${index}`}
              size='small'
              columns={importColumns}
              dataSource={importRows}
              pagination={{ pageSize: 5, size: 'small', showSizeChanger: false }}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ProjectManagementScreen;
