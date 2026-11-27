import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
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
import {
  PROJECT_IMPORT_ACCEPT,
  PROJECT_IMPORT_FORMAT_HINT,
  ProjectImportRow,
  parseProjectFile,
} from './projectImport';
import {
  ProjectApiInfo,
  ProjectImportAbortedError,
  ProjectImportApiResult,
  ProjectImportWarning,
  createProject,
  deleteProject,
  fetchProjects,
  importProjectRows,
  updateProject,
} from './projectApi';
import { notifySystemError } from '../utils/systemError';
import { apiErrorMessage } from '../utils/errorMessage';
import { messageInfo as t } from '../constants/messages';
import './ProjectManagementScreen.css';

const { Title, Text } = Typography;

/** 画面で使う固定文言（定数化して散在を防ぐ） */
const LABELS = {
  /**
   * 一括読み込みの不備確認ダイアログ。
   * NOTE: 不備の内容はバックエンド（dryRun の warnings）が返すものをそのまま並べる。
   */
  importFormatErrorTitle: '取り込めない行があります',
  importFormatErrorLead:
    '以下の内容を直してから取り込んでください。中止した場合は 1 件も反映されません。',
  /** 一括読み込み：ファイル内に完全一致行が複数あり中止したときの表示 */
  importAbortedMessage:
    'このファイルは取り込めません（ファイル内に完全に同じ行が複数あります）',
  /** 一括読み込み：エラーが複数あった場合の「ほか」 */
  more: ' ほか',
} as const;

/** チーム / Subチーム の未入力は DB 上 "-" として扱う */
const TEAM_EMPTY = '-';

/**
 * 略称で「未入力」とみなす値。
 * DB は半角 '-' だが、空欄・全角 '－'・ハイフン類・全角スペースなども未入力として扱う
 * （そうしないと「顧客・案件・－・－」のように余計な区切りが付く）。
 */
const ABBR_EMPTY_VALUES: ReadonlySet<string> = new Set([
  '',
  '-',
  'ー',
  '‐',
  '‑',
  '–',
  '—',
  '―',
  '－',
  '−',
  'ｰ',
]);

/** 略称用の1項目を整形する（未入力なら空文字を返す） */
const abbrPart = (value: string | null | undefined): string => {
  const v = (value ?? '').replace(/\u3000/g, ' ').trim();
  return ABBR_EMPTY_VALUES.has(v) ? '' : v;
};

/**
 * プロジェクトの「略称」を組み立てる。
 * 顧客の1番目の文字 ＋「・」＋ 案件 ＋「・」＋ チーム ＋「・」＋ Subチーム
 * ※自動生成のみ（画面からは編集不可）
 * ※チーム / Subチーム は任意入力のため、未入力の項目は連結しない
 * ※DB では未入力を半角 '-' で保持しているため、それも「未入力」として扱う
 *   （そうしないと「顧客・案件・-・-」のように余計な区切りが付く）
 */
export const buildProjectAbbr = (
  customer: string,
  caseName: string,
  team: string,
  subTeam: string,
): string =>
  [
    abbrPart(customer).charAt(0),
    abbrPart(caseName),
    abbrPart(team),
    abbrPart(subTeam),
  ]
    .filter((part) => part !== '')
    .join('・');

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
  /** 有効稼働（true = 有効） */
  validFlg: boolean;
  /** 教育かどうか（true = 教育） */
  educationFlg: boolean;
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
  // 既定値：「有効」はチェック済み、「非教育」は未チェックで表示する。
  // - validFlg=true   → 「有効」がチェック済みになる（= 有効）
  // - educationFlg は「非教育」チェックの反転値なので true（=教育）にすると未チェック
  validFlg: true,
  educationFlg: true,
};

/**
 * API のプロジェクト（ProjectApiInfo）を画面用の Project へ変換する。
 * 略称は画面側で組み立てる（サーバーが古い値を返していても「-・-」を出さない）。
 */
const toProjectFromApi = (p: ProjectApiInfo): Project => ({
  projectId: p.projectId ?? '',
  projectCode: p.projectCode ?? '',
  customer: p.customer ?? '',
  caseName: p.caseName ?? '',
  team: p.team ?? '',
  subTeam: p.subTeam ?? '',
  abbr: buildProjectAbbr(
    p.customer ?? '',
    p.caseName ?? '',
    p.team ?? '',
    p.subTeam ?? '',
  ),
  departmentId: p.departmentId ?? '',
  name: p.project_name ?? '',
  validFlg: p.validFlg ?? true,
  educationFlg: p.educationFlg ?? false,
});

/** 必須項目（入力順）。この3項目以外は任意入力 */
const REQUIRED_FIELDS: [keyof ProjectFormValues, string][] = [
  ['customer', '顧客'],
  ['caseName', '案件'],
  ['departmentId', '所属部門'],
];

/** 入力項目ごとの最大長（DB 定義に合わせる） */
const FIELD_LIMITS: Partial<Record<keyof ProjectFormValues, [number, string]>> = {
  customer: [100, '顧客'],
  caseName: [100, '案件'],
  team: [30, 'チーム'],
  subTeam: [30, 'Subチーム'],
  projectCode: [20, '項目ID'],
  name: [100, 'Project名称'],
};

/**
 * 1項目分の入力チェック（必須のみ）。
 *
 * NOTE: 桁数チェックは行わない。入力欄は maxLength により上限に達したら
 *       入力不可にしてあるため、桁数超過は発生しない。
 *
 * @param key     チェック対象の項目
 * @param value   入力値
 * @param options.required 必須チェックを行うか（登録・修正時のみ true）
 * @returns エラー文言。問題なければ undefined
 */
const validateField = (
  key: keyof ProjectFormValues,
  value: string | boolean,
  options: { required: boolean },
): string | undefined => {
  if (typeof value !== 'string') return undefined;
  // 必須チェック（登録・修正時のみ）
  if (options.required) {
    const required = REQUIRED_FIELDS.find(([k]) => k === key);
    if (required && !value.trim()) {
      const label = required[1];
      // 文言は messages.ts に集約する（入力＝W_KADOU_001 / 選択＝W_KADOU_002）
      return key === 'departmentId'
        ? t('W_KADOU_002', [label])
        : t('W_KADOU_001', [label]);
    }
  }

  return undefined;
};

/**
 * 入力値を検証し、最初の不備だけを返す。
 *
 * 判定順は画面の上から下・左から右：
 *   顧客 → 案件 → チーム → Subチーム → Project名称 → 所属部門 → 項目ID
 * ユーザーが上から順に直していけるよう、1 件見つかった時点で打ち切る。
 *
 * NOTE: 桁数チェックは行わない（入力欄の maxLength で入力自体を止めるため）。
 */
const findFirstFormProblem = (
  form: ProjectFormValues,
  options: { required: boolean },
): string | null => {
  /** 画面の表示順（上→下 / 左→右） */
  const order: Array<keyof ProjectFormValues> = [
    'customer',
    'caseName',
    'team',
    'subTeam',
    'name',
    'departmentId',
    'projectCode',
  ];
  for (const key of order) {
    const message = validateField(key, form[key], options);
    if (message) return message;
  }
  return null;
};

/** 一括読み込みの1行を API 送信形式へ変換する */
const toApiRow = (row: ProjectImportRow) => ({
  customer: row.customer,
  caseName: row.caseName,
  team: row.team,
  subTeam: row.subTeam,
  department: row.department,
  projectCode: row.projectCode,
  project_name: row.name,
  // NOTE: line は「プレビュー表での行番号」。バックエンドが返す警告の
  //       「n行目」もこの値になるため、ユーザーが見ている表の行と一致する。
  //       （空行などをスキップした Excel の行番号ではない）
  line: row.line,
});

/**
 * 重複判定用のキー。
 * 比較時は前後空白のみ除去する（全角/半角・大文字/小文字は区別する）。
 * バックエンド（app/services/project.py の _unique_key）と同一規則に揃える。
 */
const dupKey = (value: string): string => (value ?? '').trim();

/**
 * 一意キー (顧客 / 案件 / チーム / Subチーム) を組み立てる。
 * チーム / Subチーム の空欄は "-" として扱う（空欄同士は同一）。
 */
const uniqueKey = (
  customer: string,
  caseName: string,
  team: string,
  subTeam: string,
): string =>
  [
    dupKey(customer),
    dupKey(caseName),
    dupKey(team) || TEAM_EMPTY,
    dupKey(subTeam) || TEAM_EMPTY,
  ].join('\u001f');

/**
 * 一括読み込みの行が既存データと重複するか（行番号 → 理由）。
 *
 * 判定条件は一意キー (顧客/案件/チーム/Subチーム) の一致のみ。
 * 所属部門 / 項目ID / Project名称 / フラグ類は判定に含めない。
 * NOTE: ファイル内の重複はバックエンドが全体中止で返すため、ここでは扱わない。
 */
const detectDuplicateReasons = (
  rows: ProjectImportRow[],
  existing: Project[],
): string[][] => {
  const keys = new Set(
    existing.map((p) =>
      uniqueKey(p.customer, p.caseName, p.team, p.subTeam),
    ),
  );

  return rows.map((row) => {
    const key = uniqueKey(row.customer, row.caseName, row.team, row.subTeam);
    return keys.has(key) ? ['既存データと重複'] : [];
  });
};

/**
 * ファイル内で重複している行（同じ一意キーが 2 行以上）を検出する。
 *
 * 戻り値:
 *   lines  … 重複した行番号（1 行目も含む）
 *   groups … 重複グループ（行番号のまとまり）
 *
 * NOTE: バックエンドが aborted で返す場合はそちらを優先し、
 *       ここは後方互換（fileDuplicateLines 未返却）のためのフォールバック。
 */
const detectFileDuplicates = (
  rows: ProjectImportRow[],
): { lines: Set<number>; groups: number[][] } => {
  const grouped = new Map<string, number[]>();
  rows.forEach((row, i) => {
    const key = uniqueKey(row.customer, row.caseName, row.team, row.subTeam);
    const list = grouped.get(key) ?? [];
    // NOTE: 行番号は「プレビュー表での行番号」（row.line）を使う
    list.push(row.line ?? i + 1);
    grouped.set(key, list);
  });

  const groups = Array.from(grouped.values())
    .filter((list) => list.length > 1)
    .sort((a, b) => a[0] - b[0]);
  const lines = new Set<number>(groups.flat());
  return { lines, groups };
};
/** 画面表示用のプロジェクト名（Project名称 → 略称 の順にフォールバック） */
const projectLabel = (p: Project): string =>
  p.name || p.abbr || '（名称未設定）';

/**
 * 登録・修正・削除の完了メッセージ用ラベル。略称を優先する。
 * NOTE: 処理結果の通知は「どのプロジェクトか」を略称で示す仕様のため、
 *       projectLabel（Project名称優先）とは別に用意する。
 */
const projectAbbrLabel = (p: Project): string =>
  buildProjectAbbr(p.customer, p.caseName, p.team, p.subTeam) ||
  p.name ||
  '（名称未設定）';

/**
 * バックエンドが返した行警告（messageId + params）を表示用の文言へ変換する。
 *
 * NOTE: 文言は messages.ts に一元管理している。バックエンドは messageId と
 *       位置引数だけを返し、ここで t() により翻訳する（画面と API で文言を共有）。
 *       行番号があれば「3行目：〜」の形式に整える。
 */
const formatWarningDetails = (
  result: { warningDetails?: ProjectImportWarning[] } | null | undefined,
): string[] =>
  (result?.warningDetails ?? []).map((w) => {
    const line = w.line ? `${w.line}行目：` : '';
    return `${line}${t(w.messageId, w.params ?? [])}`;
  });

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
  /**
   * この画面が表示中か。
   * 全画面は常時マウントされているため、部門管理で部門を追加して戻ってきても
   * 再取得が走らない。「表示中」になったタイミングで部門マスタを取り直す。
   */
  active?: boolean;
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
  active = true,
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
  // 一覧の列ヘッダーフィルタ（有効稼働 / 教育かどうか）
  const [validFilter, setValidFilter] = useState<string[]>([]);
  const [educationFilter, setEducationFilter] = useState<string[]>([]);
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

  /**
   * 一括読み込み：重複行（一意キーが既存データと一致）の行番号。
   * API（dryRun）の結果を優先し、無ければ画面側で判定する。
   * この行は取り込まない（画面ではグレー表示）。
   *
   * NOTE: ファイル内重複で中止になった場合は、既存データとの重複を表示しない。
   *        （ファイル自体の問題を先に直す必要があり、混ざると原因が分からないため）
   */
  const importFullDupLines = useMemo<Set<number>>(() => {
    if (!importRows) return new Set();
    if (importCheck?.aborted) return new Set();
    const fromApi = importCheck?.fullDuplicateLines;
    if (fromApi && fromApi.length > 0) return new Set(fromApi);
    const detected = detectDuplicateReasons(importRows, projects);
    const lines = new Set<number>();
    detected.forEach((reasons, i) => {
      // NOTE: 行番号は「プレビュー表での行番号」（row.line）を使う
      if (reasons.length > 0) lines.add(importRows[i].line ?? i + 1);
    });
    return lines;
  }, [importRows, importCheck, projects]);

  /**
   * 一括読み込み：ファイル内で重複している行（同じ一意キーが 2 行以上）。
   * 中止の原因を「この行たち」と特定できるよう、グループ単位で保持する。
   */
  const importFileDuplicates = useMemo(() => {
    const empty = { lines: new Set<number>(), groups: [] as number[][] };
    if (!importRows) return empty;
    const fromApi = importCheck?.fileDuplicateLines;
    if (fromApi && fromApi.length > 0) {
      return {
        lines: new Set(fromApi),
        groups: (importCheck?.fileDuplicateGroups ?? []).map((g) => [...g]),
      };
    }
    if (!importCheck?.aborted) return empty;
    return detectFileDuplicates(importRows);
  }, [importRows, importCheck]);

  /** 一括読み込み：旧仕様（部分重複）は廃止したため、常に空 */
  const importPartialDupLines = useMemo<Set<number>>(
    () => new Set<number>(),
    [],
  );
  // NOTE: 旧仕様の名残（将来削除予定）。未使用警告を避けるため参照だけ残す。
  void importPartialDupLines;

  /** 一括読み込み：実際に取り込む行数（重複ではない行） */
  const importCounts = useMemo(() => {
    const total = importRows?.length ?? 0;
    const full = importFullDupLines.size;
    const partial = 0;
    const skipByUser = 0;
    return {
      total,
      /** 既存データと重複（スキップ） */
      full,
      /** 部分重複（旧仕様。常に 0） */
      partial,
      /** ユーザーが取り込まない選択をした件数（旧仕様。常に 0） */
      skipByUser,
      /** 実際に登録される件数 */
      willAdd: Math.max(0, total - full),
      /** 新規追加（重複なし）件数 */
      added: Math.max(0, total - full),
    };
  }, [importRows, importFullDupLines]);

  /**
   * 一括読み込み：ファイル全体を中止したか。
   * ルール③（ファイル内に全項目完全一致の行が 2 行以上ある）に該当した場合。
   * この場合、行の選択に関係なく 1 件も登録できない。
   */
  const importAborted = importCheck?.aborted === true;

  /**
   * 一括読み込み：1 件も追加されない状態か。
   * 中止（aborted）または ユーザーが全行のチェックを外した場合。
   * この場合「取り込む」を押しても何も登録されないため、画面で明示する。
   */
  const importNothingToAdd = !importAborted && importCounts.willAdd === 0;

  /**
   * 一括読み込み：所属部門が確定していない行
   * （ファイルの値が部門マスタに一致せず、プレビューでも未選択）。
   * NOTE: 重複行（取り込まない行）は対象外。
   */
  const unresolvedDeptRows = useMemo(
    () =>
      (importRows ?? []).filter((row, index) => {
        // NOTE: 行番号は「プレビュー表での行番号」（row.line）を使う
        const lineNo = row.line ?? index + 1;
        return (
          !row.departmentId &&
          !importFullDupLines.has(lineNo) &&
          !importFileDuplicates.lines.has(lineNo)
        );
      }),
    [importRows, importFullDupLines, importFileDuplicates],
  );

  // 年度が変わったとき・この画面が表示されたときに部門マスタを取り直す。
  // ※全画面は常時マウントされているため、部門管理で部門を追加して戻ってきても
  //   再取得が走らない。「表示中（active）」になったタイミングで取り直す。
  useEffect(() => {
    if (!active) return;
    let alive = true;
    setLoadingDepartments(true);
    fetchDepartments(year)
      .then((list) => {
        if (alive) setDeptMaster(list);
      })
      .catch((e) => {
        // システムエラー（DB 接続不可など）はログイン画面と同じく全画面エラーへ遷移させる
        if (notifySystemError(e)) return;
        if (alive) setDeptMaster([]);
      })
      .finally(() => {
        if (alive) setLoadingDepartments(false);
      });
    return () => {
      alive = false;
    };
  }, [year, active]);

  /**
   * 所属部門の選択肢（値 = 部門番号、表示 = 部門名称（department_name））。
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
   * 部門番号（department_id）で表示用の部門名称を返す（修正フォームの選択値確認用）。
   * 部門マスタに無い場合は undefined。
   */
  const departmentNameOfId = useCallback(
    (departmentId: string): string | undefined => {
      const found = findDepartment(deptMaster, departmentId);
      return found ? found.name : undefined;
    },
    [deptMaster],
  );

  /**
   * 一括読み込みの「所属部門」列を部門マスタと照合して部門IDを確定する。
   * 部門名称（department_name）または部門別名（department_alisa）と一致した
   * 1 件だけを確定し、一致しない場合は未確定（プルダウン選択）にする。
   * 照合時は全角/半角スペースを除去し、大文字小文字を無視する。
   * バックエンド（app/services/project.py の _dept_match_key）と同一規則。
   */
  const resolveImportDepartment = useCallback(
    (row: ProjectImportRow): ProjectImportRow => {
      const normalize = (v: string | undefined) =>
        (v ?? '').replace(/[\s\u3000]/g, '').toLowerCase();
      const key = normalize(row.department);

      if (!key) {
        return {
          ...row,
          department: '',
          departmentId: undefined,
          departmentAutoMatched: false,
        };
      }
      // 社員番号と同じく、数字のみは部門IDとして扱う（バックエンドと同じ規則）
      if (/^[0-9]+$/.test(key)) {
        const byId = findDepartment(deptMaster, row.department.trim());
        if (byId) {
          return {
            ...row,
            department: byId.name,
            departmentId: byId.departmentId,
            departmentAutoMatched: true,
          };
        }
      }

      const hit = deptMaster.filter(
        (d) =>
          normalize(d.name) === key || normalize(d.alisa) === key,
      );

      // 一致が 1 件に絞れたときだけ確定する（同名が複数ある場合は選ばせる）
      if (hit.length === 1) {
        return {
          ...row,
          department: hit[0].name,
          departmentId: hit[0].departmentId,
          departmentAutoMatched: true,
        };
      }
      return {
        ...row,
        department: '',
        departmentId: undefined,
        departmentAutoMatched: false,
      };
    },
    [deptMaster],
  );

  /** 一括読み込み：プレビュー行の所属部門を手動で選び直す（一致しなかった行のみ） */
  const handleImportDepartmentChange = useCallback(
    (lineNo: number, departmentId: string) => {
      const dept = findDepartment(deptMaster, departmentId);
      setImportRows((prev) =>
        prev
          ? prev.map((r, i) =>
              (r.line ?? i + 1) === lineNo
                ? {
                    ...r,
                    departmentId,
                    department: dept?.name ?? '',
                    // 手動選択はプルダウンのまま維持する（自動確定とは区別）
                    departmentAutoMatched: false,
                  }
                : r,
            )
          : prev,
      );
    },
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
      // システムエラー（5xx / タイムアウト / ネットワーク断）は異常画面へ遷移させる
      if (notifySystemError(e)) return;
      // NOTE: 文言はバックエンドが返す messageId を t() で翻訳する。
      //       フロント独自の既定文言（fallback）は持たない。
      message.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [year]);

  // 年度が変わったら一覧を取得し直す（画面初期データ取得 API）。
  // さらに表示中（active）になったタイミングでも再取得する。
  // ※全画面は常時マウントされているため、これが無いと一度取得したきりになり、
  //   他画面での変更や DB の直接更新が一覧に反映されない
  //   （有効稼働 / 教育かどうか の更新がリロードで元に戻る不具合の原因）。
  useEffect(() => {
    if (!active) return;
    void reloadProjects();
  }, [active, reloadProjects]);

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

  /**
   * フォームの1項目を更新する。
   *
   * NOTE: 文字列項目は最大長で切り捨てる（＝達したらそれ以上入力できない）。
   *       上限を超える入力があっても弾窗は出さず、静かに切り捨てる。
   */
  const setField = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) => {
    let next = value;
    const limit = FIELD_LIMITS[key];
    if (limit && typeof value === 'string' && value.length > limit[0]) {
      next = value.slice(0, limit[0]) as ProjectFormValues[K];
    }
    setForm((prev) => ({ ...prev, [key]: next }));
  };

  /**
   * クリア：入力内容をすべて消去する（エラー表示も解除）。
   * 修正モードは維持するため、項目を入力し直して「修正する」を押せる。
   */
  const clearForm = useCallback(() => {
    setForm(EMPTY_FORM);
  }, []);

  /**
   * キャンセル：修正を中止して新規登録モードへ戻る（入力内容は消去）。
   * クリアとの違いは「修正モードを解除するかどうか」。キャンセルは解除する。
   */
  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setForm(EMPTY_FORM);
  }, []);

  /**
   * 保存成功後にフォームを初期状態へ戻す（新規登録モードへ）。
   */
  const handleResetForm = useCallback(() => {
    setEditingKey(null);
    setForm(EMPTY_FORM);
  }, []);

  /** 修正（選択したプロジェクトをフォームへ読み込む） */
  const handleEdit = useCallback((row: Project) => {
    setEditingKey(row.projectId);
    /**
     * チーム / Subチーム は DB 上、未入力を半角 '-' で保持している。
     * そのままフォームへ入れると入力欄に「-」が表示されてしまうため、
     * 編集時は未入力（空文字）へ戻す。
     */
    const toFormTeam = (v: string | undefined | null) => {
      const s = (v ?? '').trim();
      return s === TEAM_EMPTY ? '' : s;
    };
    setForm({
      customer: row.customer,
      caseName: row.caseName,
      team: toFormTeam(row.team),
      subTeam: toFormTeam(row.subTeam),
      departmentId: row.departmentId,
      projectCode: row.projectCode,
      name: row.name,
      validFlg: row.validFlg,
      educationFlg: row.educationFlg,
    });
    // 修正ボタン押下時は画面を最上部（初期表示位置）へ戻す。
    // NOTE: scrollIntoView だとフォーム位置までしか戻らないため使わない。
    //       対象要素が画面内にあると何もしないなど挙動も環境依存になる。
    //       ページ全体をスクロールする要素（window / documentElement）を直接 0 にする。
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTop = 0;
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
        message.success(t('I_KADOU_040', [projectAbbrLabel(row)]));
      } catch (e) {
        // システムエラー（5xx / タイムアウト / ネットワーク断）は異常画面へ遷移させる
        if (notifySystemError(e)) return;
        // NOTE: 文言はバックエンドが返す messageId を t() で翻訳する。
        //       フロント独自の既定文言（fallback）は持たない。
        message.error(apiErrorMessage(e));
      } finally {
        setDeleting(false);
      }
    },
    [year, setProjects],
  );

  /**
   * 入力の不備を画面へ知らせる。
   *
   * NOTE: 部門管理画面と完全に同じ表示方法（antd の message.warning）にする。
   *       すなわち画面上部にメッセージ 1 文を表示し、数秒で自動的に消える。
   *       タイトル黒体字もボタン（弾窗）も付けない。
   */
  const showInputProblem = (messageText: string) => {
    message.warning(messageText);
  };

  /** 新規登録 / 修正の実行（DB の jn_project_master へ保存する） */
  const handleSubmit = async () => {
    // 入力チェック（必須）。最初の不備 1 件だけを弾窗で知らせる
    // NOTE: 桁数チェックは入力欄の maxLength で入力自体を止めているため行わない。
    //       弾窗はタイトル・リスト・ボタンを付けず、メッセージ 1 文だけを表示する。
    const problem = findFirstFormProblem(form, { required: true });
    if (problem) {
      showInputProblem(problem);
      return;
    }

    const payload = {
      customer: form.customer.trim(),
      caseName: form.caseName.trim(),
      // チーム / Subチーム は任意。空欄は DB 上 "-" として登録する
      team: form.team.trim() || TEAM_EMPTY,
      subTeam: form.subTeam.trim() || TEAM_EMPTY,
      departmentId: form.departmentId,
      // 項目ID は任意入力（空欄可・重複可。主キーではない）
      projectCode: form.projectCode.trim(),
      project_name: form.name.trim(),
      validFlg: form.validFlg,
      educationFlg: form.educationFlg,
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
        message.success(t('I_KADOU_041', [projectAbbrLabel(values)]));
      } else {
        // 新規登録（システム項目ID はサーバー側で採番）
        const created = await createProject(year, payload, operatorId);
        const values = toProjectFromApi(created);
        setProjects((prev) => [...prev, values]);
        message.success(t('I_KADOU_042', [projectAbbrLabel(values)]));
      }
      handleResetForm();
    } catch (e) {
      // システムエラー（5xx / タイムアウト / ネットワーク断）は異常画面へ遷移させる
      if (notifySystemError(e)) return;
      // NOTE: 文言はバックエンドが返す messageId を t() で翻訳する。
      //       フロント独自の既定文言（fallback）は持たない。
      message.error(apiErrorMessage(e));
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
    // catch 節（409 中止）でプレビューを復元するために、
    // 解析結果を try の外へ保持しておく。
    let parsed: Awaited<ReturnType<typeof parseProjectFile>> | null = null;
    try {
      parsed = await parseProjectFile(file);
      if (parsed.rows.length === 0) {
        const detail =
          parsed.warnings.length > 0
            ? `（${parsed.warnings[0]}${
                parsed.warnings.length > 1 ? LABELS.more : ''
              }）`
            : '';
        message.error(t('E_KADOU_048', [file.name]) + detail);
        return;
      }

      setImportFileName(file.name);
      setImportSource(parsed.source);
      setImportWarnings(parsed.warnings);

      // 所属部門（部門名称 / 部門別名）を部門マスタと照合して部門IDを確定する
      // 一致しない行はプレビュー上でプルダウン選択させる
      const resolved = parsed.rows.map(resolveImportDepartment);

      // 事前検証（DB へは書き込まない）
      const check = await importProjectRows(
        year,
        resolved.map(toApiRow),
        { dryRun: true, opUser: operatorId },
      );
      setImportCheck(check);
      // NOTE: 行単位の不備はバックエンドが messageId + params で返す。
      //       文言は messages.ts から引く（画面と API で文言定義を共有する）。
      setImportWarnings((prev) => [
        ...new Set([...prev, ...formatWarningDetails(check)]),
      ]);
      setImportRows(resolved);
    } catch (e) {
      // 409（ファイル全体中止）はプレビューを開いて理由を表示する
      if (e instanceof ProjectImportAbortedError) {
        const abortResult = e.result;
        setImportFileName(file.name);
        // 中止時は取り込み対象が無いため、プレビューは空のまま理由だけ表示する
        // （解析に成功していれば、その行を復元して画面に表示する）
        setImportRows(parsed ? parsed.rows.map(resolveImportDepartment) : []);
        setImportCheck(abortResult);
        setImportWarnings((prev) => [
          ...new Set([...prev, ...formatWarningDetails(abortResult)]),
        ]);
        return;
      }
      // システムエラー（5xx / タイムアウト / ネットワーク断）は異常画面へ遷移させる
      if (notifySystemError(e)) return;
      // NOTE: 文言はバックエンドが返す messageId を t() で翻訳する。
      //       フロント独自の既定文言（fallback）は持たない。
      message.error(apiErrorMessage(e));
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
   *
   *   - ファイル内に一意キーが同じ行がある場合は中止（1 件も登録しない）
   *   - 既存データと重複する行（一意キー一致）は取り込まない
   */
  const handleImportConfirm = async () => {
    if (!importRows) return;
    // NOTE: 桁数チェックはバックエンド（services/project.py の _validate / _check_length）に
    //       一本化した。フロントでは同じ検証を二重に行わず、dryRun が返した
    //       warnings（不備の内容）をそのまま表示する。

    // 所属部門が確定していない行（部門マスタに一致せず、画面でも未選択）。
    // 重複行は取り込まないため対象外。
    const unresolvedDeptProblems = importRows
      .map((row, index) =>
        !row.departmentId &&
        !importFullDupLines.has(row.line ?? index + 1)
          ? `${row.line ? `${row.line}行目：` : ''}所属部門を特定できません（ファイルの値が部門マスタの部門名称・部門別名と一致しません。プレビューで選択してください）`
          : '',
      )
      .filter(Boolean);

    // 取り込めない内容はバックエンド（dryRun）の warnings を単一の判定源にする
    const problems = [...importWarnings, ...unresolvedDeptProblems];
    if (problems.length > 0) {
      Modal.warning({
        title: LABELS.importFormatErrorTitle,
        width: 620,
        okText: '閉じる',
        content: (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Text>{LABELS.importFormatErrorLead}</Text>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                maxHeight: 260,
                overflow: 'auto',
              }}
            >
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Space>
        ),
      });
      return;
    }
    if (importAborted) {
      message.error(t('W_KADOU_010'));
      return;
    }
    if (importCounts.willAdd === 0) {
      message.info(t('W_KADOU_011'));
      return;
    }
    // 重複行（一意キーが既存データと一致）は一切取り込まない
    const skipLines = Array.from(importFullDupLines);
    setSubmittingImport(true);
    try {
      const result = await importProjectRows(year, importRows.map(toApiRow), {
        opUser: operatorId,
        skipLines,
      });

      // 取り込み後の一覧を DB から取り直す（システム項目ID はサーバー採番のため）
      await reloadProjects();

      message.success(
        t('I_KADOU_043', [
          result.added,
          result.fullDuplicateLines && result.fullDuplicateLines.length > 0
            ? t('I_KADOU_044', [result.fullDuplicateLines.length])
            : '',
          skipLines.length > 0 ? t('I_KADOU_045', [skipLines.length]) : '',
          result.skipped > 0 ? t('I_KADOU_046', [result.skipped]) : '',
        ]),
      );

      const warnings = [...importWarnings, ...formatWarningDetails(result)];
      if (warnings.length > 0) {
        message.warning(
          t('I_KADOU_047', [
            warnings.length,
            warnings[0],
            warnings.length > 1 ? LABELS.more : '',
          ]),
        );
      }
      handleImportCancel();
    } catch (e) {
      // システムエラー（5xx / タイムアウト / ネットワーク断）は異常画面へ遷移させる
      if (notifySystemError(e)) return;
      // NOTE: 文言はバックエンドが返す messageId を t() で翻訳する。
      //       フロント独自の既定文言（fallback）は持たない。
      message.error(apiErrorMessage(e));
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
        // NOTE: DB では空欄を半角 '-' で保持しているため、
        //       画面では他の未設定項目と同じ全角 '－' で表示する。
        render: (v: string) =>
          v && v.trim() !== TEAM_EMPTY ? (
            v
          ) : (
            <Text type='secondary'>－</Text>
          ),
      },
      {
        title: 'Subチーム',
        dataIndex: 'subTeam',
        key: 'subTeam',
        width: 110,
        render: (v: string) =>
          v && v.trim() !== TEAM_EMPTY ? (
            v
          ) : (
            <Text type='secondary'>－</Text>
          ),
      },
      {
        title: '略称',
        dataIndex: 'abbr',
        key: 'abbr',
        width: 240,
        // NOTE: サーバーが返す abbr に依存せず、画面の行データから毎回組み立てる。
        //       （古い略称が DB/キャッシュに残っていても「顧客・案件・-・-」を出さない）
        render: (_v: string, row: Project) => (
          <span className='project-abbr'>
            {buildProjectAbbr(
              row.customer,
              row.caseName,
              row.team,
              row.subTeam,
            )}
          </span>
        ),
      },
      {
        title: '所属部門',
        dataIndex: 'departmentId',
        key: 'departmentId',
        width: 140,
        // 一覧は部門マスタ（jn_department_master）の「部門名称（department_name）」を表示する
        render: (v: string) => {
          if (!v) return <Text type='secondary'>－</Text>;
          const found = findDepartment(deptMaster, v);
          // 部門マスタに無い値（旧データなど）は赤字で示して修正を促す
          if (!found) return <Text type='danger'>{v}</Text>;
          // 部門名称が未設定の場合は空欄に見えるため「－」を表示する
          return found.name ? found.name : <Text type='secondary'>－</Text>;
        },
      },
      {
        // 有効稼働（DB: valid_flg / '1' = 有効, '0' = 無効）
        title: '有効稼働',
        dataIndex: 'validFlg',
        key: 'validFlg',
        width: 110,
        filters: [
          { text: '有効', value: 'valid' },
          { text: '無効', value: 'invalid' },
        ],
        filterMultiple: false,
        filteredValue: validFilter.length > 0 ? validFilter : null,
        onFilter: (value, row) => (value === 'valid') === row.validFlg,
        // 一覧は文字のみ（チェックボックスはフォームで入力する）
        render: (v: boolean) => (v ? '有効' : '無効'),
      },
      {
        // 教育かどうか（DB: education_flg / '1' = 教育, '0' = 非教育）
        title: '教育かどうか',
        dataIndex: 'educationFlg',
        key: 'educationFlg',
        width: 150,
        filters: [
          { text: '教育', value: 'edu' },
          { text: '非教育', value: 'non-edu' },
        ],
        filterMultiple: false,
        filteredValue: educationFilter.length > 0 ? educationFilter : null,
        onFilter: (value, row) => (value === 'edu') === row.educationFlg,
        render: (v: boolean) => (v ? '教育' : '非教育'),
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
        // DB の sys_project_id（INT）を「pj-00000」の形式で表示する（5桁ゼロ埋め）
        render: (v: string) =>
          v ? `pj-${v.padStart(5, '0')}` : <Text type='secondary'>－</Text>,
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
    [handleEdit, handleDelete, deptMaster, validFilter, educationFilter],
  );

  /** 一括読み込み：プレビュー表の列 */
  const importColumns: TableColumnsType<ProjectImportRow> = [
    {
      // 行番号（＝エラーメッセージの「n行目」と一致する）
      title: '行',
      key: 'line',
      width: 56,
      align: 'right',
      render: (_, row, index) => row.line ?? index + 1,
    },
    {
      title: '区分',
      key: 'kind',
      width: 130,
      /**
       * 区分は行単位で判定する。
       *   ファイル内重複 … 同じ一意キー（顧客/案件/チーム/Subチーム）の行がファイル内に複数ある
       *                    → ファイル全体を中止（最優先。既存データとの重複は表示しない）
       *   重複           … 一意キーが既存データと一致 → 取り込まない
       *   追加           … 重複なし（そのまま追加）
       */
      render: (_, row, index) => {
        // NOTE: 行番号は「プレビュー表での行番号」（row.line）を使う。
        //       indexOf(row) は参照変化に弱いため使わない。
        const lineNo = row.line ?? index + 1;
        if (importFileDuplicates.lines.has(lineNo)) {
          return <Tag color='magenta'>ファイル内重複</Tag>;
        }
        if (importFullDupLines.has(lineNo)) {
          return <Tag color='red'>重複</Tag>;
        }
        return <Tag color='green'>追加</Tag>;
      },
    },
    { title: '顧客', dataIndex: 'customer', key: 'customer', width: 130 },
    { title: '案件', dataIndex: 'caseName', key: 'caseName', width: 130 },
    { title: 'チーム', dataIndex: 'team', key: 'team', width: 90 },
    { title: 'Subチーム', dataIndex: 'subTeam', key: 'subTeam', width: 100 },
    {
      title: '所属部門',
      dataIndex: 'department',
      key: 'department',
      width: 170,
      /**
       * 所属部門の表示（要員情報の一括読み込みと同じ規則）：
       *   1) ファイルの値が部門マスタに一致（自動確定）→ テキスト表示
       *   2) 一致しない行 → プルダウンで選択させる（未選択は赤字）
       *   3) 重複行（取り込まない）→ 参照のみ（プルダウンは出さない）
       */
      render: (_, row, index) => {
        // NOTE: 行番号は「プレビュー表での行番号」（row.line）を使う
        const lineNo = row.line ?? index + 1;
        // ファイル内重複・既存データ重複の行は取り込まないので選択させない
        const notImported =
          importFileDuplicates.lines.has(lineNo) ||
          importFullDupLines.has(lineNo);

        if (notImported) {
          return (
            <Text>
              {row.departmentId
                ? departmentNameOfId(row.departmentId) ?? row.departmentId
                : row.department || '－'}
            </Text>
          );
        }
        // 自動照合で確定した行だけテキスト表示
        if (row.departmentAutoMatched && row.departmentId) {
          return row.department || '－';
        }
        return (
          <Select
            size='small'
            showSearch
            optionFilterProp='label'
            placeholder='所属部門を選択'
            status={row.departmentId ? undefined : 'error'}
            style={{ width: '100%' }}
            value={row.departmentId || undefined}
            options={departmentOptions}
            onChange={(v: string) => handleImportDepartmentChange(lineNo, v)}
          />
        );
      },
    },
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
            プロジェクト（顧客・案件・チーム・Subチーム・所属部門・項目ID・Project名称）を管理します。必須は 顧客 / 案件 / 所属部門 の 3 項目で、略称 は「顧客の1文字目・案件・チーム・Subチーム」で自動生成されます。有効稼働・教育かどうかは統計の集計にだけ影響します（既定：有効 / 非教育）。下の「一括読み込む」から Excel / CSV を取り込めます（所属部門は部門マスタと照合し、一致しない場合はプレビューで選択します）。
          </Text>
        </div>
      </div>

      {/* プロジェクト情報（Excel / CSV）の一括読み込み（タイトルの下） */}
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
        </Space>
        <Text type='secondary' className='project-import-hint'>
          {PROJECT_IMPORT_FORMAT_HINT}
        </Text>
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
                  maxLength={FIELD_LIMITS.customer?.[0]}
                  onChange={(e) => setField('customer', e.target.value)}
                />
              </div>
              <div>
                <div className='form-label'>案件（必須）</div>
                <Input
                  placeholder='例：基幹刷新'
                  value={form.caseName}
                  maxLength={FIELD_LIMITS.caseName?.[0]}
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
                    maxLength={FIELD_LIMITS.team?.[0]}
                    onChange={(e) => setField('team', e.target.value)}
                  />
                </div>
                <div>
                  <div className='form-label'>Subチーム（任意）</div>
                  <Input
                    placeholder='例：A'
                    value={form.subTeam}
                    maxLength={FIELD_LIMITS.subTeam?.[0]}
                    onChange={(e) => setField('subTeam', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <div className='form-label'>Project名称（任意）</div>
                <Input
                  placeholder='例：次期基幹システム'
                  value={form.name}
                  maxLength={FIELD_LIMITS.name?.[0]}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div className='project-field-abbr'>
                <div className='form-label'>略称（自動生成・編集不可）</div>
                <Input
                  value={abbr}
                  readOnly
                  disabled
                  placeholder='顧客・案件・チーム・Subチーム から自動生成'
                />
              </div>
              <div className='project-field-dept'>
                <div className='form-label'>所属部門（必須）</div>
                  {/*
                    選択肢は部門名称を表示し、内部値は部門番号を保持する。
                    必須エラーは送信時に彈窗で出す（入力欄の下には出さない）。
                  */}
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
                    // ドロップダウンの表示件数を 5 件に固定（1 件 = 32px）
                    listHeight={160}
                    style={{ width: '100%' }}
                  />
                {/*
                  既存データの部門番号が部門マスタに無い場合、
                  選択肢に無いため空表示になる。修正を促すメッセージを出す。
                  NOTE: 絶対配置にして、メッセージが出ても下のボタン群が
                        下にずれないようにする。
                */}
                {form.departmentId &&
                  !loadingDepartments &&
                  !departmentNameOfId(form.departmentId) && (
                    <Text
                      type='danger'
                      className='project-field-dept-error'
                      style={{ fontSize: 12 }}
                    >
                      登録済みの所属部門ID「{form.departmentId}」が部門マスタにありません。選択し直してください。
                    </Text>
                  )}
              </div>
              {/*
                項目ID / 有効稼働 / 教育かどうか は 2 行目にまとめて表示する。
                （1 行目の 顧客・案件・チーム・Subチーム・Project名称・略称・所属部門 の下）
              */}
              <div className='project-field-row2'>
                <div className='project-field-code'>
                  <div className='form-label'>項目ID（任意）</div>
                  <Input
                    placeholder='例：PRJ-0006'
                    value={form.projectCode}
                    maxLength={FIELD_LIMITS.projectCode?.[0]}
                    onChange={(e) => setField('projectCode', e.target.value)}
                  />
                </div>
                {/* 有効稼働 / 教育かどうか は隣接して各半分の幅で表示する */}
                <div className='project-field-pair'>
                  <div>
                    <div className='form-label'>有効稼働</div>
                    {/* NOTE: チェックボックスの文言は状態で変えず固定にする。
                        選択状態はチェックの有無で表す（オン=有効 / オフ=無効）。 */}
                    <Checkbox
                      checked={form.validFlg}
                      onChange={(e) => setField('validFlg', e.target.checked)}
                    >
                      有効
                    </Checkbox>
                  </div>
                  <div>
                    <div className='form-label'>教育かどうか</div>
                    {/* NOTE: 文言は「非教育」で固定。チェック ON = 非教育、OFF = 教育。
                        DB の education_flg は「教育かどうか」を持つ（'1'=教育）ため、
                        チェック状態とは真偽が反転する。ここで反転して整合させる。 */}
                    <Checkbox
                      checked={!form.educationFlg}
                      onChange={(e) =>
                        setField('educationFlg', !e.target.checked)
                      }
                    >
                      非教育
                    </Checkbox>
                  </div>
                </div>
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
              {isEditing && <Button onClick={cancelEdit}>キャンセル</Button>}
              <Button type='text' onClick={clearForm}>
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
          // 列ヘッダーフィルタ（有効稼働 / 教育かどうか）→ 絞り込み条件へ反映する
          onChange={(_pagination, filters) => {
            const rawValid = filters.validFlg;
            setValidFilter(
              Array.isArray(rawValid) ? rawValid.map((v) => String(v)) : [],
            );
            const rawEducation = filters.educationFlg;
            setEducationFilter(
              Array.isArray(rawEducation)
                ? rawEducation.map((v) => String(v))
                : [],
            );
          }}
          scroll={{ x: 1720 }}
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
        okText={
          importAborted
            ? '閉じる'
            : importNothingToAdd
              ? '取り込む行がありません'
              : `取り込む（${importCounts.willAdd} 件）`
        }
        cancelText='中止'
        okButtonProps={{ disabled: importAborted || importNothingToAdd }}
        confirmLoading={submittingImport}
        onOk={() => void handleImportConfirm()}
        onCancel={handleImportCancel}
        width={1020}
      >
        {importRows && (
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <Alert
              type={
                importAborted
                  ? 'error'
                  : importCounts.full > 0
                    ? 'warning'
                    : 'info'
              }
              showIcon
              message={
                importAborted
                  ? LABELS.importAbortedMessage
                  : [
                      `対象 ${importCounts.total} 件`,
                      `新規追加 ${importCounts.added} 件`,
                      `重複 ${importCounts.full} 件`,
                      `登録予定 ${importCounts.willAdd} 件`,
                    ].join(' / ')
              }
              description={
                importAborted
                  ? importFileDuplicates.groups.length > 0
                    ? `${importFileName}（${importSource}）：同じプロジェクト（顧客・案件・チーム・Subチーム）がファイル内に複数あります。${importFileDuplicates.groups
                        .map(
                          (g, i) =>
                            `グループ${i + 1}：${g
                              .map((n) => `${n}行目`)
                              .join('・')}`,
                        )
                        .join(' / ')}。重複行を削除してから、もう一度取り込んでください（このファイルは 1 件も登録していません）。`
                    : importCheck?.abortReason
                      ? `${importFileName}（${importSource}）：${importCheck.abortReason}`
                      : `${importFileName}（${importSource}）：一括取り込みを中止しました。ファイルを修正してから、もう一度取り込んでください。`
                  : importCounts.full > 0
                    ? `${importFileName}（${importSource}）のうち、同じプロジェクト（顧客・案件・チーム・Subチーム）が既に登録されている行（${importCounts.full} 件）は取り込みません（グレー表示）。`
                    : `${importFileName}（${importSource}）を読み込みました。重複を除く${importCounts.willAdd} 件を登録します。`
              }
            />
            <Space size='large' wrap>
              <Text>
                対象 <Text strong>{importCounts.total}</Text> 件
              </Text>
              <Text>
                新規追加{' '}
                <Text strong style={{ color: '#389e0d' }}>
                  {importCounts.added}
                </Text>{' '}
                件
              </Text>
              <Text>
                重複{' '}
                <Text strong style={{ color: '#cf1322' }}>
                  {importCounts.full}
                </Text>{' '}
                件
              </Text>
              <Text>
                登録予定{' '}
                <Text strong style={{ color: '#1677ff' }}>
                  {importCounts.willAdd}
                </Text>{' '}
                件
              </Text>
            </Space>
            <Text type='secondary' style={{ fontSize: 12 }}>
              判定ルール：① ファイル内に同じ一意キー（顧客・案件・チーム・Subチーム）の行が 2
              行以上ある → ファイル全体を中止（該当行だけ「ファイル内重複」と表示）　②
              一意キーが既存データと一致 → 取り込まない（グレー表示）　③ それ以外 → 追加。
              チーム・Subチームの空欄は「-」として比較します。
            </Text>
            {unresolvedDeptRows.length > 0 && (
              <Alert
                type='error'
                showIcon
                message={`所属部門を特定できない行が ${unresolvedDeptRows.length} 件あります`}
                description='ファイルの「所属部門」が部門マスタの部門名称・部門別名と一致しませんでした。プレビュー表の「所属部門」で選択してください。未選択のままでは取り込めません。'
              />
            )}
            {importWarnings.length > 0 && (
              <Alert
                type='warning'
                showIcon
                message={t('W_KADOU_013', [importWarnings.length])}
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {importWarnings.slice(0, 5).map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                    {importWarnings.length > 5 && (
                      <li>{t('I_KADOU_049', [importWarnings.length - 5])}</li>
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
              rowClassName={(_, index) => {
                const line = index + 1;
                if (importFileDuplicates.lines.has(line)) return '';
                if (importFullDupLines.has(line)) return '';
                return '';
              }}
              pagination={{ pageSize: 5, size: 'small', showSizeChanger: false }}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ProjectManagementScreen;
