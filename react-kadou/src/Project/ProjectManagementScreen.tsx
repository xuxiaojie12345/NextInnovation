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
  validateProjectImportRows,
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

/** 入力項目ごとの最大長（DB 定義に合わせる） */
const FIELD_LIMITS: Partial<Record<keyof ProjectFormValues, [number, string]>> = {
  customer: [100, '顧客'],
  caseName: [100, '案件'],
  team: [30, 'チーム'],
  subTeam: [30, 'Subチーム'],
  projectCode: [20, '項目ID'],
  name: [30, 'Project名称'],
};

/** フォームの入力エラー（キーごとの赤字メッセージ。'' = エラーなし） */
type FormErrors = Partial<Record<keyof ProjectFormValues, string>>;

/**
 * 1項目分の入力チェック（最大長 + 必須）。
 *
 * NOTE: フォーカスを失った時点（onBlur）でこの関数だけを呼び、
 *       その項目の赤字メッセージを即時に出せるようにしている。
 *
 * @param key     チェック対象の項目
 * @param value   入力値
 * @param options.required 必須チェックを行うか（登録・修正時のみ true）
 * @returns エラー文言。問題なければ undefined
 */
const validateField = (
  key: keyof ProjectFormValues,
  value: string,
  options: { required: boolean },
): string | undefined => {
  // 1) 最大長チェック
  const limit = FIELD_LIMITS[key];
  if (limit) {
    const [max, label] = limit;
    if (value.trim().length > max) {
      return `${label}は${max}文字以内で入力してください。`;
    }
  }

  // 2) 必須チェック（登録・修正時のみ）
  if (options.required) {
    const required = REQUIRED_FIELDS.find(([k]) => k === key);
    if (required) {
      const label = required[1];
      if (!String(value ?? '').trim()) {
        return key === 'departmentId'
          ? `${label}を選択してください。`
          : `${label}を入力してください。`;
      }
    }
  }

  return undefined;
};

/**
 * 入力値を検証する（必須チェック + 最大長チェック）。
 * 1項目ずつ validateField に委譲し、画面全体のエラー表を組み立てる。
 */
const validateForm = (
  form: ProjectFormValues,
  options: { required: boolean },
): FormErrors => {
  const errors: FormErrors = {};

  (Object.keys(FIELD_LIMITS) as Array<keyof ProjectFormValues>).forEach(
    (key) => {
      const message = validateField(key, form[key], options);
      if (message) errors[key] = message;
    },
  );

  return errors;
};

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

/**
 * 重複判定用のキー（前後空白・全角スペース除去 + 小文字化）。
 * バックエンド（app/services/project.py の _norm）と同じ規則に揃える。
 */
const dupKey = (value: string): string =>
  (value ?? '').replace(/\u3000/g, ' ').trim().toLowerCase();

/**
 * 一括読み込みの行が重複かどうかを判定する。
 * 次のいずれかが既存（画面の一覧・プレビュー内の先行行）と一致すれば重複。
 *   1) 略称（顧客の1文字目・案件・チーム・Subチーム）
 *   2) 項目ID
 *   3) Project名称
 * 空欄の項目は比較対象外（未入力同士を重複扱いしない）。
 * 戻り値は該当した条件の配列（空配列 = 重複ではない。複数該当時はすべて返す）。
 */
const detectDuplicateReasons = (
  rows: ProjectImportRow[],
  existing: Project[],
): string[][] => {
  const abbrs = new Set<string>();
  const codes = new Set<string>();
  const names = new Set<string>();
  existing.forEach((p) => {
    const abbr = dupKey(p.abbr);
    if (abbr) abbrs.add(abbr);
    const code = dupKey(p.projectCode);
    if (code) codes.add(code);
    const name = dupKey(p.name);
    if (name) names.add(name);
  });

  return rows.map((row) => {
    const abbr = dupKey(rowAbbr(row));
    const code = dupKey(row.projectCode);
    const name = dupKey(row.name);
    const reasons: string[] = [];
    if (abbr !== '' && abbrs.has(abbr)) reasons.push('略称');
    if (code !== '' && codes.has(code)) reasons.push('項目ID');
    if (name !== '' && names.has(name)) reasons.push('Project名称');
    // 先行行のキーを登録し、ファイル内の重複も検出する
    if (reasons.length === 0) {
      if (abbr) abbrs.add(abbr);
      if (code) codes.add(code);
      if (name) names.add(name);
    }
    return reasons;
  });
};

/**
 * 全項目（顧客/案件/チーム/Subチーム/所属部門/項目ID/Project名称）が
 * 完全一致する行を抽出する（完全重複と部分重複を区別するため）。
 * 空欄同士も含めて全項目を比較する（行の内容がまるごと一致していることを表す）。
 */
const detectFullDuplicatedRows = (
  rows: ProjectImportRow[],
  existing: Project[],
  departments: Department[],
): Set<number> => {
  const key = (v: {
    customer: string;
    caseName: string;
    team: string;
    subTeam: string;
    departmentId: string;
    projectCode: string;
    name: string;
  }) =>
    [
      dupKey(v.customer),
      dupKey(v.caseName),
      dupKey(v.team),
      dupKey(v.subTeam),
      dupKey(v.departmentId),
      dupKey(v.projectCode),
      dupKey(v.name),
    ].join('\u001f');

  const existingKeys = new Set(
    existing.map((p) =>
      key({
        customer: p.customer,
        caseName: p.caseName,
        team: p.team,
        subTeam: p.subTeam,
        departmentId: p.departmentId,
        projectCode: p.projectCode,
        name: p.name,
      }),
    ),
  );

  // ファイル側の「所属部門」は部門名/別名で記述されるため、部門IDへ解決して比較する
  const resolveDepartmentId = (value: string): string => {
    const v = dupKey(value);
    if (!v) return '';
    const found = departments.find(
      (d) => dupKey(d.departmentId) === v,
    );
    if (found) return dupKey(found.departmentId);
    const byAlisa = departments.find(
      (d) => dupKey(d.alisa ?? '') === v || dupKey(d.name) === v,
    );
    return byAlisa ? dupKey(byAlisa.departmentId) : v;
  };

  const result = new Set<number>();
  rows.forEach((row, i) => {
    const k = key({
      customer: row.customer,
      caseName: row.caseName,
      team: row.team,
      subTeam: row.subTeam,
      departmentId: resolveDepartmentId(row.department),
      projectCode: row.projectCode,
      name: row.name,
    });
    if (existingKeys.has(k)) {
      result.add(i + 1);
    } else {
      // 同一ファイル内の先行行も「既存」として扱う
      existingKeys.add(k);
    }
  });
  return result;
};

/** 一括読み込みの1行から略称を組み立てる（バックエンドと同一規則） */
const rowAbbr = (row: ProjectImportRow): string =>
  buildProjectAbbr(row.customer, row.caseName, row.team, row.subTeam);

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
  /**
   * 一括読み込み：重複理由（行番号 → 該当条件の説明配列）。
   *
   * 優先順位:
   *   1) API（dryRun）が返した duplicatedReasons（行番号 → 理由）
   *   2) API が duplicatedLines だけ返す場合 → その行は「条件不明」として理由を付ける
   *   3) どちらも無い場合 → 画面側で既存一覧と照合して判定する
   */
  const importDupReasons = useMemo<Map<number, string[]>>(() => {
    if (!importRows) return new Map();

    const fromApi = importCheck?.duplicatedReasons;
    if (fromApi && Object.keys(fromApi).length > 0) {
      const map = new Map<number, string[]>();
      Object.entries(fromApi).forEach(([line, reasons]) => {
        map.set(Number(line), reasons);
      });
      return map;
    }

    // API が行番号だけ返す場合（旧バージョン互換）
    const lines = importCheck?.duplicatedLines;
    if (lines && lines.length > 0) {
      const map = new Map<number, string[]>();
      lines.forEach((line) => map.set(line, ['既存と重複']));
      return map;
    }

    // 画面側で判定（既存一覧・同一ファイル内の先行行と照合）
    const detected = detectDuplicateReasons(importRows, projects);
    const map = new Map<number, string[]>();
    detected.forEach((reasons, i) => {
      if (reasons.length > 0) map.set(i + 1, reasons);
    });
    return map;
  }, [importRows, importCheck, projects]);

  /**
   * 一括読み込み：ユーザーが取り込み対象に残した行番号（チェック ON）。
   * 初期値は次のとおり:
   *   - 追加行                … ON（取り込む）
   *   - 部分重複行            … ON（既定で取り込む。ユーザーが外せる）
   *   - 完全重複行            … OFF（強制。チェック不可）
   */
  const [importChecked, setImportChecked] = useState<Set<number>>(new Set());
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
   * 一括読み込み：全項目完全一致（既存データと全フィールド一致）の行番号。
   * API（dryRun）の結果を優先し、無ければ画面側で判定する。
   * この行は強制的に取り込まない（ユーザーが選択できない）。
   */
  const importFullDupLines = useMemo<Set<number>>(() => {
    if (!importRows) return new Set();
    const fromApi = importCheck?.fullDuplicateLines;
    if (fromApi && fromApi.length > 0) return new Set(fromApi);
    return detectFullDuplicatedRows(importRows, projects, deptMaster);
  }, [importRows, importCheck, projects, deptMaster]);

  /**
   * 一括読み込み：部分重複の行番号
   * （略称 / 項目ID / Project名称 のいずれかだけが一致）。
   * 既定では取り込み対象（チェック ON）で、ユーザーが外した行だけ取り込まない。
   */
  const importPartialDupLines = useMemo<Set<number>>(() => {
    if (!importRows) return new Set();
    const fromApi = importCheck?.partialDuplicateLines;
    const base =
      fromApi && fromApi.length > 0
        ? fromApi
        : Array.from(importDupReasons.keys());
    // 全項目一致の行は「完全重複」として扱うので部分重複から除く
    return new Set(base.filter((line) => !importFullDupLines.has(line)));
  }, [importRows, importCheck, importDupReasons, importFullDupLines]);

  // プレビューを開いたとき（importRows / 判定結果が変わったとき）に選択状態を初期化する
  useEffect(() => {
    if (!importRows) {
      setImportChecked(new Set());
      return;
    }
    const next = new Set<number>();
    importRows.forEach((_, i) => {
      const line = i + 1;
      if (!importFullDupLines.has(line)) next.add(line);
    });
    setImportChecked(next);
    // importFullDupLines は importRows / importCheck から派生するため、
    // これらが変わったときだけ初期化し直す
  }, [importRows, importFullDupLines]);

  /** 一括読み込み：実際に取り込む行数（チェック ON かつ完全重複ではない行） */
  const importCounts = useMemo(() => {
    const total = importRows?.length ?? 0;
    const full = importFullDupLines.size;
    const partial = importPartialDupLines.size;
    const skipByUser = Array.from(importPartialDupLines).filter(
      (line) => !importChecked.has(line),
    ).length;
    return {
      total,
      /** 完全重複（強制スキップ） */
      full,
      /** 部分重複（既定 ON / ユーザーが外せる） */
      partial,
      /** ユーザーが取り込まない選択をした件数（部分重複のうち） */
      skipByUser,
      /** 実際に登録される件数 */
      willAdd: Math.max(0, total - full - skipByUser),
      /** 新規追加（重複なし）件数 */
      added: Math.max(0, total - full - partial),
    };
  }, [importRows, importFullDupLines, importPartialDupLines, importChecked]);

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

  /** フォームの入力エラー（入力欄の下に赤字で表示する） */
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /** フォームの1項目を更新 */
  const setField = <K extends keyof ProjectFormValues>(
    key: K,
    value: ProjectFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 入力し直したらその項目のエラーを解除する
    setFormErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  /**
   * 入力欄からフォーカスが外れたときに、その項目の最大長だけをチェックして
   * 問題があれば赤字メッセージを即時表示する。
   *
   * NOTE: 必須チェックはここでは行わない（入力途中に「入力してください」が
   *       出ると煩わしいため）。必須チェックは「登録する」「修正する」押下時に
   *       validateForm(required: true) でまとめて判定する。
   *       部門（Select）は選択時に値が入るため対象外（onBlur を付けていない）。
   */
  const handleBlur = (key: keyof ProjectFormValues) => {
    // 必須チェックは押下時のみ。ここでは最大長だけを見る
    const message = validateField(key, form[key], { required: false });
    setFormErrors((prev) => {
      // 変化なしなら再レンダーを避ける
      if (prev[key] === message) return prev;
      return { ...prev, [key]: message };
    });
  };

  /**
   * クリア：入力内容をすべて消去する（エラー表示も解除）。
   * 修正モードは維持するため、項目を入力し直して「修正する」を押せる。
   */
  const clearForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormErrors({});
  }, []);

  /**
   * キャンセル：修正を中止して新規登録モードへ戻る（入力内容は消去）。
   * クリアとの違いは「修正モードを解除するかどうか」。キャンセルは解除する。
   */
  const cancelEdit = useCallback(() => {
    setEditingKey(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  }, []);

  /**
   * 保存成功後にフォームを初期状態へ戻す（新規登録モードへ）。
   */
  const handleResetForm = useCallback(() => {
    setEditingKey(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
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
    setFormErrors({});
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
    // 入力チェック（必須・最大長）。不正な場合は入力欄の下に赤字で表示する
    const errors = validateForm(form, { required: true });
    setFormErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

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
    setImportChecked(new Set());
  };

  /** 一括読み込み：1 行分のチェック状態を切り替える（完全重複行は不可） */
  const toggleImportRow = useCallback(
    (line: number, checked: boolean) => {
      if (importFullDupLines.has(line)) return;
      setImportChecked((prev) => {
        const next = new Set(prev);
        if (checked) next.add(line);
        else next.delete(line);
        return next;
      });
    },
    [importFullDupLines],
  );

  /**
   * 一括読み込み：プレビュー内容をバックエンドへ送信して DB を更新する。
   *
   *   - ファイル内に全項目完全一致の行がある場合は中止（1 件も登録しない）
   *   - 完全重複行は常に取り込まない
   *   - 部分重複行はユーザーがチェックした行だけ取り込む
   */
  const handleImportConfirm = async () => {
    if (!importRows) return;
    // 桁数チェック（画面上の入力欄と同じ制限）。不備があれば何行目の何が
    // 問題かを確認ダイアログに一覧表示し、取り込みは行わない。
    const formatProblems = validateProjectImportRows(importRows);
    if (formatProblems.length > 0) {
      Modal.warning({
        title: '取り込めない行があります',
        width: 620,
        okText: '閉じる',
        content: (
          <Space direction='vertical' style={{ width: '100%' }}>
            <Text>
              以下の行は入力欄と同じ桁数の制限を満たしていません。
              ファイルを修正してから取り込んでください。
            </Text>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                maxHeight: 260,
                overflow: 'auto',
              }}
            >
              {formatProblems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Space>
        ),
      });
      return;
    }
    if (importAborted) {
      message.error(
        '取り込みファイル内に完全に同じ行が複数あるため、このファイルは取り込めません。',
      );
      return;
    }
    if (importCounts.willAdd === 0) {
      message.info(
        '取り込む行が選択されていません。取り込みは行いませんでした。',
      );
      return;
    }
    // ユーザーがチェックを外した部分重複行だけを skipLines として送る
    const skipLines = Array.from(importPartialDupLines).filter(
      (line) => !importChecked.has(line),
    );
    setSubmittingImport(true);
    try {
      const result = await importProjectRows(year, importRows.map(toApiRow), {
        opUser: operatorId,
        skipLines,
      });

      // 取り込み後の一覧を DB から取り直す（システム項目ID はサーバー採番のため）
      await reloadProjects();

      message.success(
        `プロジェクトを一括読み込みしました：追加 ${result.added} 件` +
          (result.fullDuplicateLines && result.fullDuplicateLines.length > 0
            ? ` / 完全重複により除外 ${
                result.fullDuplicateLines.length
              } 件`
            : '') +
          (skipLines.length > 0
            ? ` / 選択により除外 ${skipLines.length} 件`
            : '') +
          (result.skipped > 0 ? ` / スキップ ${result.skipped} 件` : '') +
          '。',
      );

      const warnings = [...importWarnings, ...result.warnings];
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
        // DB の sys_project_id（INT）を「PJ.0000」の形式で表示する（4桁ゼロ埋め）
        render: (v: string) =>
          v ? `PJ.${v.padStart(4, '0')}` : <Text type='secondary'>－</Text>,
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
    {
      /**
       * 取り込み対象の選択。
       *   追加行      … 既定 ON（外すことも可能）
       *   部分重複行  … 既定 ON（ユーザーが外すと取り込まない）
       *   完全重複行  … OFF 固定（チェック不可。全項目が既存と同一のため）
       *   ファイル中止時 … すべてチェック不可
       */
      title: '取込',
      key: 'checked',
      width: 60,
      align: 'center',
      render: (_, row) => {
        const index = importRows ? importRows.indexOf(row) : -1;
        const lineNo = index >= 0 ? index + 1 : -1;
        if (lineNo <= 0) return null;
        const forcedOff = importFullDupLines.has(lineNo) || importAborted;
        return (
          <input
            type='checkbox'
            aria-label={`${lineNo}行目を取り込む`}
            checked={forcedOff ? false : importChecked.has(lineNo)}
            disabled={forcedOff}
            onChange={(e) => toggleImportRow(lineNo, e.target.checked)}
          />
        );
      },
    },
    {
      title: '区分',
      key: 'kind',
      width: 110,
      /**
       * 区分は行単位で判定する。
       *   追加           … 重複なし（そのまま追加）
       *   完全重複        … 全項目（顧客～Project名称）が既存と完全一致 → 取り込まない
       *   部分重複（N項目）… 略称 / 項目ID / Project名称 のいずれかが一致 → 既定で取り込む
       */
      render: (_, row) => {
        const index = importRows ? importRows.indexOf(row) : -1;
        const lineNo = index >= 0 ? index + 1 : -1;
        if (importFullDupLines.has(lineNo)) {
          return <Tag color='red'>完全重複</Tag>;
        }
        const reasons = lineNo > 0 ? importDupReasons.get(lineNo) : undefined;
        if (!reasons || reasons.length === 0) {
          return <Tag color='green'>追加</Tag>;
        }
        return (
          <Tag color={reasons.length >= 3 ? 'volcano' : 'gold'}>
            部分重複（{reasons.length}項目）
          </Tag>
        );
      },
    },
    {
      title: '重複理由',
      key: 'dupReason',
      width: 200,
      render: (_, row) => {
        // 重複理由は「重複」の行にだけ表示する（追加行には出さない）
        const index = importRows ? importRows.indexOf(row) : -1;
        const lineNo = index >= 0 ? index + 1 : -1;
        if (importFullDupLines.has(lineNo)) {
          return (
            <Tag color='red' style={{ marginInlineEnd: 0 }}>
              全項目一致
            </Tag>
          );
        }
        const reasons = lineNo > 0 ? importDupReasons.get(lineNo) : undefined;
        if (!reasons || reasons.length === 0) {
          return <Text type='secondary'>－</Text>;
        }
        return (
          <Space size={4} wrap>
            {reasons.map((r) => (
              <Tag key={r} color='volcano' style={{ marginInlineEnd: 0 }}>
                {r}
              </Tag>
            ))}
          </Space>
        );
      },
    },
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
            プロジェクト（顧客・案件・チーム・Subチーム・所属部門・項目ID・Project名称）を管理します。必須は 顧客 / 案件 / 所属部門 の 3 項目で、略称 は「顧客の1文字目・案件・チーム・Subチーム」で自動生成されます。右上の「一括読み込む」から Excel / CSV を取り込めます（所属部門は入力どおり登録します）。
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
                  maxLength={200}
                  status={formErrors.customer ? 'error' : undefined}
                  onChange={(e) => setField('customer', e.target.value)}
                  onBlur={() => handleBlur('customer')}
                />
                {formErrors.customer && (
                  <Text type='danger' style={{ fontSize: 12 }}>
                    {formErrors.customer}
                  </Text>
                )}
              </div>
              <div>
                <div className='form-label'>案件（必須）</div>
                <Input
                  placeholder='例：基幹刷新'
                  value={form.caseName}
                  maxLength={200}
                  status={formErrors.caseName ? 'error' : undefined}
                  onChange={(e) => setField('caseName', e.target.value)}
                  onBlur={() => handleBlur('caseName')}
                />
                {formErrors.caseName && (
                  <Text type='danger' style={{ fontSize: 12 }}>
                    {formErrors.caseName}
                  </Text>
                )}
              </div>
              {/* チーム / Subチーム は隣接して各半分の幅で表示する */}
              <div className='project-field-pair'>
                <div>
                  <div className='form-label'>チーム（任意）</div>
                  <Input
                    placeholder='例：第一'
                    value={form.team}
                    maxLength={60}
                    status={formErrors.team ? 'error' : undefined}
                    onChange={(e) => setField('team', e.target.value)}
                    onBlur={() => handleBlur('team')}
                  />
                  {formErrors.team && (
                    <Text type='danger' style={{ fontSize: 12 }}>
                      {formErrors.team}
                    </Text>
                  )}
                </div>
                <div>
                  <div className='form-label'>Subチーム（任意）</div>
                  <Input
                    placeholder='例：A'
                    value={form.subTeam}
                    maxLength={60}
                    status={formErrors.subTeam ? 'error' : undefined}
                    onChange={(e) => setField('subTeam', e.target.value)}
                    onBlur={() => handleBlur('subTeam')}
                  />
                  {formErrors.subTeam && (
                    <Text type='danger' style={{ fontSize: 12 }}>
                      {formErrors.subTeam}
                    </Text>
                  )}
                </div>
              </div>
              <div>
                <div className='form-label'>Project名称（任意）</div>
                <Input
                  placeholder='例：次期基幹システム'
                  value={form.name}
                  maxLength={60}
                  status={formErrors.name ? 'error' : undefined}
                  onChange={(e) => setField('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                />
                {formErrors.name && (
                  <Text type='danger' style={{ fontSize: 12 }}>
                    {formErrors.name}
                  </Text>
                )}
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
                  status={formErrors.departmentId ? 'error' : undefined}
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
                      登録済みの所属部門名「{form.departmentId}
                      」が部門マスタにありません。選択し直してください。
                    </Text>
                  )}
                {formErrors.departmentId && (
                  <Text
                    type='danger'
                    className='project-field-dept-error'
                    style={{ fontSize: 12 }}
                  >
                    {formErrors.departmentId}
                  </Text>
                )}
              </div>
              <div className='project-field-code'>
                <div className='form-label'>項目ID（任意）</div>
                <Input
                  placeholder='例：PRJ-0006'
                  value={form.projectCode}
                  maxLength={40}
                  status={formErrors.projectCode ? 'error' : undefined}
                  onChange={(e) => setField('projectCode', e.target.value)}
                  onBlur={() => handleBlur('projectCode')}
                />
                {formErrors.projectCode && (
                  <Text type='danger' style={{ fontSize: 12 }}>
                    {formErrors.projectCode}
                  </Text>
                )}
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
                    : importCounts.partial > 0
                      ? 'warning'
                      : 'info'
              }
              showIcon
              message={
                importAborted
                  ? 'このファイルは取り込めません（ファイル内に完全に同じ行が複数あります）'
                  : [
                      `対象 ${importCounts.total} 件`,
                      `新規追加 ${importCounts.added} 件`,
                      `部分重複 ${importCounts.partial} 件${
                        importCounts.skipByUser > 0
                          ? `（うち ${importCounts.skipByUser} 件は除外）`
                          : ''
                      }`,
                      `完全重複 ${importCounts.full} 件`,
                      `登録予定 ${importCounts.willAdd} 件`,
                    ].join(' / ')
              }
              description={
                importAborted
                  ? `${importFileName}（${importSource}）内に、全項目（顧客/案件/チーム/Subチーム/所属部門/項目ID/Project名称）が完全に一致する行が複数あります。すべての行を取り込むことはできません。ファイルを修正してから、もう一度取り込んでください。`
                  : importCounts.full > 0
                    ? `${importFileName}（${importSource}）のうち、全項目が既存データと完全一致する行（${importCounts.full} 件）は取り込みません（選択できません）。それ以外の行は「取込」列のチェックが ON の行だけ登録します。`
                    : `${importFileName}（${importSource}）を読み込みました。「取込」列のチェックが ON の行（${importCounts.willAdd} 件）を登録します。チェックを外した行は登録しません。`
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
                部分重複{' '}
                <Text strong style={{ color: '#d48806' }}>
                  {importCounts.partial}
                </Text>{' '}
                件
                {importCounts.skipByUser > 0 && (
                  <Text type='secondary'>
                    （うち {importCounts.skipByUser} 件は除外）
                  </Text>
                )}
              </Text>
              <Text>
                完全重複{' '}
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
              判定ルール：① 重複なし → 追加　② 全項目が既存と完全一致 → 追加しない（固定）　③
              ファイル内に完全に同じ行が 2 行以上ある → ファイル全体を中止　④
              略称 / 項目ID / Project名称 のいずれかだけが一致 → 既定で追加（チェックを外すと追加しない）
            </Text>
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
            {(importCheck?.skipped ?? 0) > 0 && (
              <Alert
                type='error'
                showIcon
                message={`サーバー側で取り込まない行：${importCheck?.skipped} 件`}
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
            <Table<ProjectImportRow>
              rowKey={(row, index) => `${row.customer}-${row.caseName}-${index}`}
              size='small'
              columns={importColumns}
              dataSource={importRows}
              rowClassName={(_, index) => {
                const line = index + 1;
                if (importFullDupLines.has(line)) return 'project-import-row-dup';
                if (importPartialDupLines.has(line) && !importChecked.has(line)) {
                  return 'project-import-row-dup';
                }
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
