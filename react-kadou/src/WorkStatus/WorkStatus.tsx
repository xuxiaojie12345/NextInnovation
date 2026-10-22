import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Button,
  DatePicker,
  Input,
  Menu,
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
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SelectOutlined,
} from '@ant-design/icons';
import './WorkStatus.css';
import { Department, Personnel, Project, AssignmentMap } from './types';
import {
  WEEK_COL_WIDTH,
  FIXED_LEFT_WIDTH,
  WeekCol,
  buildYearWeeks,
  mondayOf,
} from '../data/yearWeeks';
import type { UnpaidMap, WorkStatusData } from '../data/yearStore';
import type { WorkStatusPayload } from '../data/kadouRepository';

const { Title, Text } = Typography;

/** 集計行（最終行）用の特別な ID */
const TOTAL_ROW_ID = '__total__';

/** 複数セル選択時に使うセルキーの区切り */
const KEY_SEP = '|';

/**
 * 「内・退職」を表すプロジェクト名
 * 週セルでこの項目を選ぶと、その週から最終週までを一括で「内・退職」にし、行をグレー表示する
 */
const LEAVE_PROJECT_NAME = '内・退職';

/** セルキー（要員ID|週キー）を組み立てる */
const cellKey = (personId: string, weekKey: string) =>
  `${personId}${KEY_SEP}${weekKey}`;

/** セルキー（要員ID|週キー）を 要員ID と 週キー に分解する */
const parseCellKey = (key: string): { personId: string; weekKey: string } => {
  const i = key.indexOf(KEY_SEP);
  return { personId: key.slice(0, i), weekKey: key.slice(i + 1) };
};

/** 月ごとの週グループ（ヘッダー2段組み用） */
interface MonthGroup {
  key: string;
  label: string;
  weeks: WeekCol[];
}

/** テーブル行（要員 or 合計行） */
interface Row {
  id: string;
  /** 番号（1〜） */
  no: number;
  /** 退場予定（自由入力） */
  leavePlan?: string;
  /** 役割コード（例: T11E03） */
  role: string;
  /** 社員番号 */
  employeeNo: string;
  /** 名前 */
  name: string;
  /** 所属（該当社員の所属＝部門マスタの部門名） */
  department: string;
  isTotal: boolean;
}

/** 週キー（月曜 'YYYY-MM-DD'）の配列を 開始週〜終了週 で生成する */
const buildWeekKeys = (fromMonday: Dayjs, toMonday: Dayjs): string[] => {
  const keys: string[] = [];
  let cur = fromMonday.startOf('day');
  let guard = 0;
  while (!cur.isAfter(toMonday, 'day') && guard < 200) {
    keys.push(cur.format('YYYY-MM-DD'));
    cur = cur.add(7, 'day');
    guard += 1;
  }
  return keys;
};

/** WorkStatus の props（年度データは App 側で管理する） */
interface WorkStatusProps {
  /** 表示する年度 */
  year: number;
  /** 要員一覧（保存済み。画面での編集は下書きとして保持し、保存で確定する） */
  personnel: Personnel[];
  /** プロジェクト一覧（メニューの「プロジェクト管理」で増える） */
  projects: Project[];
  /** 部門マスタ（所属列のフィルタの選択肢） */
  departments: Department[];
  /**
   * 初期表示で選択しておく部署（空 = 全部署）。
   * ログインユーザーが部長なら自部門が初期選択される。
   * 部署の選択肢は常に全部門（他部門へ切り替えて閲覧できる＝データ集約）。
   */
  defaultDepartments?: string[];
  /** 社員マスタ（社員番号 → 要員）。社員番号入力時に 役割・名前・所属 を引く */
  employeeMaster: Map<string, Personnel>;
  /** 保存済みのグリッド内容（割当・BUFFER） */
  initialWorkStatus: WorkStatusData;
  /** 保存（下書きを確定して親へ渡す） */
  onSave: (payload: WorkStatusPayload) => void;
  /** 未保存の変更があるかの通知 */
  onDirtyChange: (dirty: boolean) => void;
  /** 「保存」処理を親へ登録する（未保存確認ダイアログから呼ばれる） */
  registerSaveHandler: (fn: (() => void) | null) => void;
}

/**
 * 「社員番号」セルの入力欄
 * 入力確定（フォーカスアウト / Enter）時に重複チェックを行い、
 * 処理中止（戻り値 false）の場合は表示を元の値に戻す。
 */
const EmployeeNoInput: React.FC<{
  /** 現在確定している社員番号 */
  value: string;
  /** 入力確定。true = 採用 / false = 処理中止（表示を元の値に戻す） */
  onCommit: (next: string) => boolean;
}> = ({ value, onCommit }) => {
  // 入力中の文字列（この入力欄のみ再描画される）
  const [text, setText] = useState(value);
  // 最後に確定した値（Enter→Blur の二重確定を防止し、中止時の戻し先にする）
  const committedRef = useRef(value);

  // 行の値が変わったら表示を同期する
  useEffect(() => {
    committedRef.current = value;
    setText(value);
  }, [value]);

  /** 入力確定 */
  const commit = () => {
    if (text === committedRef.current) return;
    if (onCommit(text)) {
      committedRef.current = text;
    } else {
      // 処理中止 → 入力前の値に戻す
      setText(committedRef.current);
    }
  };

  return (
    <Input
      size='small'
      value={text}
      maxLength={10}
      placeholder='例：10001'
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onPressEnter={commit}
    />
  );
};

/**
 * 週セル（プロジェクトの選択）
 * 全年（53週×要員）のセルがあるため、memo 化して「値が変わったセル」だけ再描画する
 */
interface WeekCellProps {
  personId: string;
  weekKey: string;
  /** 選択中のプロジェクトID */
  value?: string;
  /** 無償支援（契約外・非計費）のセルか */
  isUnpaid: boolean;
  /** 選択肢（略称） */
  options: { value: string; label: string }[];
  onChangeProject: (personId: string, weekKey: string, projectId?: string) => void;
  /** セルの右クリックメニューを開く */
  onOpenMenu: (personId: string, weekKey: string, e: React.MouseEvent) => void;
}

const WeekCell = React.memo(
  ({
    personId,
    weekKey,
    value,
    isUnpaid,
    options,
    onChangeProject,
    onOpenMenu,
  }: WeekCellProps) => (
    <div
      className={`ws-week-cell${isUnpaid ? ' ws-week-cell-unpaid' : ''}`}
      title={isUnpaid ? 'BUFFER（契約外・非計費）' : undefined}
      // 右クリックはコンテキストメニューのみ（項目の選択リストを開かない）
      onMouseDownCapture={(e) => {
        if (e.button !== 0) e.stopPropagation();
      }}
      onContextMenu={(e) => onOpenMenu(personId, weekKey, e)}
    >
      <Select
        size='small'
        allowClear
        placeholder='－'
        value={value ?? undefined}
        options={options}
        onChange={(v?: string) => onChangeProject(personId, weekKey, v)}
        style={{ width: '100%' }}
        showSearch
        optionFilterProp='label'
        popupMatchSelectWidth={false}
        // 無償支援のセルは矢印アイコンの位置に「BUFFER」バッジを表示する
        suffixIcon={isUnpaid ? <span className='ws-unpaid-badge'>BUFFER</span> : undefined}
      />
    </div>
  ),
);

/**
 * 要員 × 週 のプロジェクト割当グリッド（週単位・当年 1月〜12月 の 1年度分）
 */
const WorkStatus: React.FC<WorkStatusProps> = ({
  year,
  personnel,
  projects,
  departments,
  defaultDepartments,
  employeeMaster,
  initialWorkStatus,
  onSave,
  onDirtyChange,
  registerSaveHandler,
}) => {
  // ---- 下書き（保存するまで確定しない編集内容）------------------------
  // 未保存の変更があるか
  const [dirty, setDirty] = useState(false);
  // 要員行の変更（要員ID -> 変更項目）
  const [personnelEdits, setPersonnelEdits] = useState<
    Record<string, Partial<Personnel>>
  >({});
  // 行追加した要員
  const [personnelAdded, setPersonnelAdded] = useState<Personnel[]>([]);
  // 行削除した要員ID
  const [personnelDeleted, setPersonnelDeleted] = useState<string[]>([]);

  // 割当: 要員ID -> (週キー 'YYYY-MM-DD' -> プロジェクトID or null)
  const [assignment, setAssignment] = useState<AssignmentMap>(() => ({
    ...initialWorkStatus.assignment,
  }));

  // ---- 検索条件（部署で表示要員を絞り込む） ----
  // 選択した部署（空 = 全部署）。初期値はログインユーザーの既定部門
  // （部長 = 自部門／事業部長・管理者 = 全部門）
  // ※所属列の列ヘッダーフィルタと連動する
  const [deptFilter, setDeptFilter] = useState<string[]>(
    () => defaultDepartments ?? [],
  );

  // 週列（キー = 週キー 'YYYY-MM-DD'）ごとの「プロジェクト」列フィルタ（空 = 絞り込みなし）
  // ※所属列と同様、Excel のオートフィルタと同じ位置付け（列ごとの条件は AND）
  const [weekProjectFilter, setWeekProjectFilter] = useState<
    Record<string, string[]>
  >({});

  // ---- 複数セル選択 & プロジェクト名のコピー/貼り付け ----
  // 複数セル選択モード（ON の間はクリックでセルを選択できる）
  const [selectMode, setSelectMode] = useState(false);
  // 選択中のセル: セルキー（要員ID|週キー）の集合
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  // 矩形選択の基準セル（シフトクリック用）
  const [anchorCell, setAnchorCell] = useState<string | null>(null);
  // コピーしたプロジェクトID（貼り付け元: undefined=未設定 / null=未割当クリア）
  const [clipboard, setClipboard] = useState<string | null | undefined>(
    undefined,
  );
  // 貼り付け時に無償支援を付けるか（コピー元セル / 右クリックの「コピー」に合わせる）
  const [pasteUnpaid, setPasteUnpaid] = useState(false);

  // ---- 無償支援（契約外・非計費）: 要員ID -> (週キー -> true) ----
  const [unpaid, setUnpaid] = useState<UnpaidMap>(() => ({
    ...initialWorkStatus.unpaid,
  }));

  // ---- セルの右クリックメニュー ----
  // 対象セルと表示位置（画面座標）
  const [cellMenu, setCellMenu] = useState<{
    personId: string;
    weekKey: string;
    x: number;
    y: number;
  } | null>(null);

  // ---- 表示期間（From / To とも任意） ----
  const [rangeFrom, setRangeFrom] = useState<Dayjs | null>(null);
  const [rangeTo, setRangeTo] = useState<Dayjs | null>(null);

  // ---- グリッドの初期表示位置（当月の列を左端に表示する） ----
  // テーブル全体のラッパー（.ant-table-body を探して水平スクロールする）
  const tableWrapRef = useRef<HTMLDivElement>(null);
  // 初期スクロールを 1 度だけ実行するためのフラグ
  const didInitScrollRef = useRef(false);

  // ---- 下書き（要員行・割当・BUFFER）の操作 -------------------------

  /** 下書きを反映した要員一覧（＝画面上の要員） */
  const draftPersonnel = useMemo(() => {
    const deleted = new Set(personnelDeleted);
    const edited = (p: Personnel) =>
      personnelEdits[p.id] ? { ...p, ...personnelEdits[p.id] } : p;
    const rows = personnel.filter((p) => !deleted.has(p.id)).map(edited);
    const added = personnelAdded.filter((p) => !deleted.has(p.id)).map(edited);
    return [...rows, ...added];
  }, [personnel, personnelEdits, personnelAdded, personnelDeleted]);

  /** 未保存かどうかを親（年度切替・ログアウトの確認）へ通知する */
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  /** 要員行の項目を変更する（下書き） */
  const updatePersonnelField = useCallback(
    (personId: string, patch: Partial<Personnel>) => {
      setPersonnelEdits((prev) => ({
        ...prev,
        [personId]: { ...(prev[personId] ?? {}), ...patch },
      }));
      setDirty(true);
    },
    [],
  );

  /**
   * 社員番号の確定（社員マスタから 役割・名前・所属 を取得して下書きに反映）
   * 戻り値: true = 採用 / false = 処理中止（下書き内で社員番号が重複）
   */
  const commitEmployeeNo = useCallback(
    (personId: string, employeeNo: string): boolean => {
      const no = employeeNo.trim();

      // 重複チェック：下書き内の他の行で既に使われている社員番号は登録できない
      if (
        no !== '' &&
        draftPersonnel.some((p) => p.id !== personId && p.employeeNo === no)
      ) {
        message.error(
          `社員番号「${no}」は一覧に既に登録されているため、処理を中止しました。`,
        );
        return false;
      }

      const master = employeeMaster.get(no);
      if (!master) {
        if (no !== '') {
          message.warning(`社員番号「${no}」は社員マスタに存在しません。`);
        }
        updatePersonnelField(personId, {
          employeeNo: no,
          name: '',
          role: '',
          department: '',
          projectKey: undefined,
        });
        return true;
      }
      updatePersonnelField(personId, {
        employeeNo: no,
        name: master.name,
        role: master.role,
        department: master.department,
        projectKey: master.projectKey,
      });
      return true;
    },
    [draftPersonnel, employeeMaster, updatePersonnelField],
  );

  /** 退場予定の変更（下書き） */
  const commitLeavePlan = useCallback(
    (personId: string, leavePlan: string) =>
      updatePersonnelField(personId, { leavePlan }),
    [updatePersonnelField],
  );

  /** 行追加（全項目が空の行を下書きに追加する） */
  const handleAddRow = useCallback(() => {
    setPersonnelAdded((prev) => [
      ...prev,
      {
        id: `p-new-${Date.now()}`,
        employeeNo: '',
        name: '',
        role: '',
        department: '',
      },
    ]);
    setDirty(true);
    message.success('空の行を追加しました（未保存・社員番号を入力してください）。');
  }, []);

  /** 行削除（下書き） */
  const handleDeleteRow = useCallback((personId: string) => {
    setPersonnelAdded((prev) => prev.filter((p) => p.id !== personId));
    setPersonnelDeleted((prev) =>
      prev.includes(personId) ? prev : [...prev, personId],
    );
    setDirty(true);
    message.success('行を削除しました（未保存）。');
  }, []);

  /** 保存（下書きを確定して親へ渡す） */
  const handleSave = useCallback(() => {
    // 削除した要員の割当・BUFFER は保存対象から外す
    const alive = new Set(draftPersonnel.map((p) => p.id));
    const assignmentOut: AssignmentMap = {};
    Object.keys(assignment).forEach((pid) => {
      if (alive.has(pid)) assignmentOut[pid] = assignment[pid];
    });
    const unpaidOut: UnpaidMap = {};
    Object.keys(unpaid).forEach((pid) => {
      if (alive.has(pid)) unpaidOut[pid] = unpaid[pid];
    });

    onSave({
      personnel: draftPersonnel,
      assignment: assignmentOut,
      unpaid: unpaidOut,
    });
    // 下書きをクリア（＝保存済みになった）
    setPersonnelEdits({});
    setPersonnelAdded([]);
    setPersonnelDeleted([]);
    setDirty(false);
  }, [draftPersonnel, assignment, unpaid, onSave]);

  /** 未保存確認ダイアログから呼べるように「保存」処理を登録する */
  useEffect(() => {
    registerSaveHandler(handleSave);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, handleSave]);

  // プロジェクトの選択肢と参照マップ（メニューの「プロジェクト管理」で増える）
  // ※セルには「略称」を表示する
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.key, label: p.abbr || p.name })),
    [projects],
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.key, p])),
    [projects],
  );

  /** 「内・退職」プロジェクトのキー（見つからない場合は undefined） */
  const leaveProjectKey = useMemo(
    () =>
      projects.find(
        (p) => p.name === LEAVE_PROJECT_NAME || p.abbr === LEAVE_PROJECT_NAME,
      )?.key,
    [projects],
  );

  // 所属列の列ヘッダーフィルタ項目（部門マスタ）※未絞り込み時の候補
  const deptFilterItems = useMemo(
    () => departments.map((d) => ({ text: d.name, value: d.name })),
    [departments],
  );

  // 週列の列ヘッダーフィルタ項目（プロジェクト = 略称）※未絞り込み時の候補
  const projectFilterItems = useMemo(
    () => projects.map((p) => ({ text: p.abbr || p.name, value: p.key })),
    [projects],
  );

  // 対象年度（1月1日を含む週 〜 12月31日を含む週）の全週列
  const allWeeks: WeekCol[] = useMemo(() => buildYearWeeks(year), [year]);

  // 表示期間（From / To）で絞り込んだ週列（From / To とも未指定なら全週）
  const weeks: WeekCol[] = useMemo(() => {
    if (!rangeFrom && !rangeTo) return allWeeks;
    return allWeeks.filter((w) => {
      // 週（月〜日）が指定期間と重なるものだけを表示する
      if (rangeFrom && w.sunday.isBefore(rangeFrom, 'day')) return false;
      if (rangeTo && w.monday.isAfter(rangeTo, 'day')) return false;
      return true;
    });
  }, [allWeeks, rangeFrom, rangeTo]);

  // 週列を月ごとにグループ化（ヘッダー2段組み / 当年 1月 〜 12月）
  const monthGroups: MonthGroup[] = useMemo(() => {
    const map = new Map<
      string,
      { key: string; order: number; label: string; weeks: WeekCol[] }
    >();
    weeks.forEach((w) => {
      // 週列は「開始日（月曜日）」の属する月へ分類する
      const monday = w.monday;
      const ym = { year: monday.year(), month: monday.month() };
      const key = `${ym.year}-${ym.month}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          order: ym.year * 12 + ym.month,
          // 年をまたぐ月（前年12月・翌年1月）は「YYYY年M月」と表示して日付の誤解を防ぐ
          label:
            ym.year === year
              ? `${ym.month + 1}月`
              : `${ym.year}年${ym.month + 1}月`,
          weeks: [],
        });
      }
      map.get(key)!.weeks.push(w);
    });
    return Array.from(map.values())
      .sort((a, b) => a.order - b.order)
      .map(({ key, label, weeks: groupWeeks }) => ({ key, label, weeks: groupWeeks }));
  }, [weeks, year]);

  /**
   * 列ヘッダーフィルタの候補（Excel のオートフィルタと同じ挙動）。
   *
   * どこかの列で絞り込むと、他の列の候補は「その絞り込み結果に実際に存在する値」だけになる。
   * 例: ある週で「桜・基幹刷新…」を選ぶと、他の週の候補はその担当者が実際に
   *     入っているプロジェクトだけに絞られる。
   *
   *  - dept: 所属列の候補（他の条件を満たす要員に実際に存在する部門）
   *  - week: 週列ごとの候補（その週に実際に割り当てがあるプロジェクト）
   *
   * ※候補を求めるときは「その列自身の条件」は除外する（自分の選択肢を広げられるように）。
   * ※まだ何も絞り込んでいないときはマスタ全件を候補にする
   *   （データがまだ無い週で候補が空になるのを避けるため）。
   */
  const filterOptions = useMemo(() => {
    const visibleWeekKeys = new Set(weeks.map((w) => w.key));
    // 適用中の週列条件（表示中の週のみ）
    const activeWeekFilters = Object.entries(weekProjectFilter).filter(
      ([key, vals]) => vals.length > 0 && visibleWeekKeys.has(key),
    );

    // まだ何も絞り込んでいない → マスタ全件を候補にする
    if (deptFilter.length === 0 && activeWeekFilters.length === 0) {
      const week: Record<string, { text: string; value: string }[]> = {};
      weeks.forEach((w) => {
        week[w.key] = projectFilterItems;
      });
      return { dept: deptFilterItems, week };
    }

    /** exceptWeekKey 以外の条件と（withDept なら）部署条件を満たす要員 */
    const rowsWithout = (exceptWeekKey: string | null, withDept: boolean) =>
      draftPersonnel.filter((p) => {
        if (
          withDept &&
          deptFilter.length > 0 &&
          !deptFilter.includes(p.department)
        ) {
          return false;
        }
        const cell = assignment[p.id] ?? {};
        return activeWeekFilters.every(([key, wanted]) => {
          if (key === exceptWeekKey) return true;
          const pid = cell[key];
          return !!pid && wanted.includes(pid);
        });
      });

    /** その週に実際に割り当てがあるプロジェクトを候補にする */
    const weekOptions = (weekKey: string, rows: Personnel[]) => {
      const used = new Set<string>();
      rows.forEach((p) => {
        const pid = assignment[p.id]?.[weekKey];
        if (pid) used.add(pid);
      });
      return projects
        .filter((p) => used.has(p.key))
        .map((p) => ({ text: p.abbr || p.name, value: p.key }));
    };

    // 所属列: 週列の条件を満たす要員に存在する部門
    // 週列:   その週に実在するプロジェクト（自分の列の条件は除く）
    const week: Record<string, { text: string; value: string }[]> = {};
    weeks.forEach((w) => {
      week[w.key] = weekOptions(w.key, rowsWithout(w.key, true));
    });

    const deptUsed = new Set(rowsWithout(null, false).map((p) => p.department));
    const dept = departments
      .filter((d) => deptUsed.has(d.name))
      .map((d) => ({ text: d.name, value: d.name }));

    return { dept, week };
  }, [
    weeks,
    draftPersonnel,
    departments,
    projects,
    assignment,
    deptFilter,
    weekProjectFilter,
    deptFilterItems,
    projectFilterItems,
  ]);

  /**
   * 実際に表へ表示する要員。
   *  - 所属列の列ヘッダーフィルタ（部署）で絞り込み（未選択 = 全部署）
   *  - 週列の列ヘッダーフィルタ（プロジェクト名）で絞り込み
   *  ※Excel のオートフィルタと同じく、列ごとの条件は AND で結合する（1 列内は OR）
   */
  const visiblePersonnel = useMemo(() => {
    const rows =
      deptFilter.length === 0
        ? draftPersonnel
        : draftPersonnel.filter((p) => deptFilter.includes(p.department));

    // プロジェクトが選択されている週列（表示中の週のみを対象にする）
    const activeWeeks = weeks.filter(
      (w) => (weekProjectFilter[w.key]?.length ?? 0) > 0,
    );
    if (activeWeeks.length === 0) return rows;

    return rows.filter((p) => {
      const cell = assignment[p.id] ?? {};
      // すべての週列の条件を満たす行だけを表示する（AND）
      return activeWeeks.every((w) => {
        const wanted = weekProjectFilter[w.key] ?? [];
        const pid = cell[w.key];
        return !!pid && wanted.includes(pid);
      });
    });
  }, [deptFilter, draftPersonnel, weeks, weekProjectFilter, assignment]);

  /**
   * 初期表示: 左固定列のすぐ右に「当年は当月、それ以外の年度は第 1 週」が並ぶ位置まで
   * 水平スクロールする。
   * ※マウント直後の 1 回だけ実行する（以降の操作では位置を保持する）。
   */
  useEffect(() => {
    if (didInitScrollRef.current) return;
    if (monthGroups.length === 0) return;
    // 当年だけ「当月」を左端にする（それ以外の年度は第 1 週のまま）
    let weeksBefore = 0;
    if (year === dayjs().year()) {
      const currentMonthKey = `${year}-${dayjs().month()}`;
      for (const g of monthGroups) {
        if (g.key === currentMonthKey) break;
        weeksBefore += g.weeks.length;
      }
    }
    didInitScrollRef.current = true;
    // レイアウト確定後にスクロールする（フレームを 2 回待つ）
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const body = tableWrapRef.current?.querySelector('.ant-table-body');
        if (!(body instanceof HTMLElement)) return;
        const target = weeksBefore * WEEK_COL_WIDTH;
        const max = Math.max(0, body.scrollWidth - body.clientWidth);
        body.scrollLeft = Math.min(target, max);
      });
    });
  }, [monthGroups, year]);

  /** 1セルの「無償支援（契約外・非計費）」フラグを解除する */
  const clearUnpaidAt = useCallback((personId: string, weekKey: string) => {
    setUnpaid((prev) => {
      if (!prev[personId]?.[weekKey]) return prev;
      const cell = { ...prev[personId] };
      delete cell[weekKey];
      return { ...prev, [personId]: cell };
    });
    setDirty(true);
  }, []);

  /** 1セルの「無償支援（契約外・非計費）」フラグを設定/解除する */
  const setUnpaidAt = useCallback(
    (personId: string, weekKey: string, on: boolean) => {
      setUnpaid((prev) => {
        const cell = { ...(prev[personId] ?? {}) };
        if (on) cell[weekKey] = true;
        else delete cell[weekKey];
        return { ...prev, [personId]: cell };
      });
      setDirty(true);
    },
    [],
  );

  /** セルが「無償支援（契約外・非計費）」か */
  const isUnpaidAt = useCallback(
    (personId: string, weekKey: string) => !!unpaid[personId]?.[weekKey],
    [unpaid],
  );

  /** 1セル（要員×週）の割当を更新（クリア時は削除）
   *  ※プロジェクトを変更したため「無償支援」は自動解除する */
  const setAssignmentAt = useCallback(
    (personId: string, weekKey: string, projectId: string | null) => {
      setAssignment((prev) => {
        const cell = { ...(prev[personId] ?? {}) };
        if (projectId === null) {
          delete cell[weekKey];
        } else {
          cell[weekKey] = projectId;
        }
        return { ...prev, [personId]: cell };
      });
      clearUnpaidAt(personId, weekKey);
      setDirty(true);
    },
    [clearUnpaidAt],
  );

  /**
   * 週セルのプロジェクト変更。
   * 「内・退職」を選んだ場合は、その週から 12月31日（年末）を含む週まで
   * まとめて「内・退職」に設定する（表示範囲外の週も保持する）
   */
  const handleChangeCellProject = useCallback(
    (personId: string, weekKey: string, projectId?: string) => {
      const from = weeks.findIndex((w) => w.key === weekKey);
      if (projectId && projectId === leaveProjectKey && from >= 0) {
        // 選択した週 〜 12月31日を含む週 までを一括設定
        const startMonday = weeks[from].monday;
        const yearEndMonday = mondayOf(startMonday.endOf('year'));
        const keys = buildWeekKeys(startMonday, yearEndMonday);
        setAssignment((prev) => {
          const cell = { ...(prev[personId] ?? {}) };
          keys.forEach((k) => {
            cell[k] = projectId;
          });
          return { ...prev, [personId]: cell };
        });
        // プロジェクトを変更したため、対象週の「無償支援」は自動解除する
        keys.forEach((k) => clearUnpaidAt(personId, k));
        setDirty(true);
        return;
      }
      setAssignmentAt(personId, weekKey, projectId ?? null);
    },
    [leaveProjectKey, setAssignmentAt, weeks, clearUnpaidAt],
  );

  /** 「内・退職」が1つでも設定されている要員（該当行をグレー表示する） */
  const leavePersonIds = useMemo(() => {
    const ids = new Set<string>();
    if (!leaveProjectKey) return ids;
    draftPersonnel.forEach((p) => {
      const cells = assignment[p.id];
      if (cells && weeks.some((w) => cells[w.key] === leaveProjectKey)) {
        ids.add(p.id);
      }
    });
    return ids;
  }, [assignment, weeks, draftPersonnel, leaveProjectKey]);

  /** 週ごとの割当人数（表示中要員のみ） */
  const weeklyAssignedCounts: number[] = useMemo(
    () =>
      weeks.map((w) =>
        visiblePersonnel.reduce(
          (c, p) => c + (assignment[p.id]?.[w.key] ? 1 : 0),
          0,
        ),
      ),
    [weeks, visiblePersonnel, assignment],
  );

  /** 表示範囲（前月・当月・翌月）の割当延べ（人週） */
  const rangeTotalAssignments = useMemo(
    () => weeklyAssignedCounts.reduce((a, b) => a + b, 0),
    [weeklyAssignedCounts],
  );

  /** 「未割当（クリア）」を表す送信値 */
  const CLEAR_VALUE = '__clear__';

  /** コピー/貼り付け 用のプロジェクト選択肢（未割当クリア付き） */
  const clipboardOptions = useMemo(
    () => [
      ...projects.map((p) => ({ value: p.key, label: p.abbr || p.name })),
      { value: CLEAR_VALUE, label: '（未割当）クリア' },
    ],
    [projects],
  );

  // 要員ID → 表示順 / 週キー → 列順（Shift+クリック矩形選択用）
  const personIndexById = useMemo(
    () => new Map(visiblePersonnel.map((p, i) => [p.id, i])),
    [visiblePersonnel],
  );
  const weekIndexByKey = useMemo(
    () => new Map(weeks.map((w, i) => [w.key, i])),
    [weeks],
  );

  /** 2つのセル間を矩形範囲として含めて選択する（from 〜 to を含む） */
  const buildRange = useCallback(
    (fromKey: string, toKey: string): Set<string> | null => {
      const a = parseCellKey(fromKey);
      const b = parseCellKey(toKey);
      const r0 = personIndexById.get(a.personId);
      const c0 = weekIndexByKey.get(a.weekKey);
      const r1 = personIndexById.get(b.personId);
      const c1 = weekIndexByKey.get(b.weekKey);
      if (
        r0 === undefined ||
        c0 === undefined ||
        r1 === undefined ||
        c1 === undefined
      ) {
        return null;
      }
      const next = new Set<string>();
      for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r += 1) {
        const pid = visiblePersonnel[r].id;
        for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c += 1) {
          next.add(cellKey(pid, weeks[c].key));
        }
      }
      return next;
    },
    [personIndexById, weekIndexByKey, visiblePersonnel, weeks],
  );

  // ---- ドラッグで矩形選択（mousedown → 他セルへ mouseenter） ----
  // 押下したセル（ドラッグ/クリックの起点）
  const dragStartRef = useRef<string | null>(null);
  // 押下中に別セルへ移動したか（移動しなければ「クリック=1セルON/OFF」）
  const dragMovedRef = useRef(false);

  /**
   * 複数セル選択モード中のマウスダウン。
   * - 通常: ドラッグの起点を記録（動かさず離すとクリック = 1セル ON/OFF）
   * - Shift: 直前のアンカーからの矩形選択
   */
  const handleCellMouseDown = useCallback(
    (personId: string, weekKey: string, shift: boolean) => {
      const key = cellKey(personId, weekKey);
      if (shift) {
        dragStartRef.current = null;
        dragMovedRef.current = false;
        if (anchorCell) {
          const rect = buildRange(anchorCell, key);
          if (rect) setSelectedCells(rect);
        } else {
          setSelectedCells(new Set([key]));
        }
        return;
      }
      // 通常クリック / ドラッグ開始
      dragStartRef.current = key;
      dragMovedRef.current = false;
      setAnchorCell(key);
    },
    [anchorCell, buildRange],
  );

  /** ドラッグ中に別セルへ入ったら 起点→現在セル の矩形へ選択を更新 */
  const handleCellDragEnter = useCallback(
    (personId: string, weekKey: string) => {
      const startKey = dragStartRef.current;
      if (!startKey) return;
      dragMovedRef.current = true;
      const rect = buildRange(startKey, cellKey(personId, weekKey));
      if (rect) setSelectedCells(rect);
    },
    [buildRange],
  );

  /** マウスアップ: ドラッグせずに離した場合はクリック（1セル ON/OFF） */
  useEffect(() => {
    if (!selectMode) return;
    const onMouseUp = () => {
      const startKey = dragStartRef.current;
      const moved = dragMovedRef.current;
      dragStartRef.current = null;
      dragMovedRef.current = false;
      if (startKey && !moved) {
        setSelectedCells((prev) => {
          const next = new Set(prev);
          if (next.has(startKey)) next.delete(startKey);
          else next.add(startKey);
          return next;
        });
      }
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [selectMode]);

  /** 選択モードの ON/OFF（OFF 時は選択を初期化） */
  const toggleSelectMode = (on: boolean) => {
    setSelectMode(on);
    if (!on) {
      setSelectedCells(new Set());
      setAnchorCell(null);
      dragStartRef.current = null;
      dragMovedRef.current = false;
    }
  };

  /** 選択した全セルに projectId（null=未割当）を書き込む
   *  ※プロジェクトを変更したため「無償支援」は自動解除する */
  const applyProjectToSelected = useCallback(
    (projectId: string | null) => {
      if (selectedCells.size === 0) return;
      setAssignment((prev) => {
        const next: AssignmentMap = { ...prev };
        selectedCells.forEach((key) => {
          const { personId, weekKey } = parseCellKey(key);
          const cell = { ...(next[personId] ?? {}) };
          if (projectId === null) delete cell[weekKey];
          else cell[weekKey] = projectId;
          next[personId] = cell;
        });
        return next;
      });
      selectedCells.forEach((key) => {
        const { personId, weekKey } = parseCellKey(key);
        clearUnpaidAt(personId, weekKey);
      });
      setDirty(true);
    },
    [selectedCells, clearUnpaidAt],
  );

  /** 選択セル（割当済みのみ）の「無償支援」を一括設定/解除する */
  const applyUnpaidToSelected = useCallback(
    (on: boolean) => {
      if (selectedCells.size === 0) return;
      setUnpaid((prev) => {
        const next = { ...prev };
        selectedCells.forEach((key) => {
          const { personId, weekKey } = parseCellKey(key);
          const cell = { ...(next[personId] ?? {}) };
          // 未割当のセルは対象外（割当があるセルのみ無償支援にできる）
          if (on && assignment[personId]?.[weekKey]) cell[weekKey] = true;
          else delete cell[weekKey];
          next[personId] = cell;
        });
        return next;
      });
      setDirty(true);
    },
    [selectedCells, assignment],
  );

  /** 選択セルからコピー（先頭セルの値。未割当なら「未割当」扱い。無償支援も引き継ぐ） */
  const handleCopyFromSelected = useCallback(() => {
    if (selectedCells.size === 0) {
      message.warning('コピー元のセルを選択してください。');
      return;
    }
    let value: string | null = null;
    let unpaidFlag = false;
    selectedCells.forEach((key) => {
      if (value) return; // 最初に見つかった値を保持
      const { personId, weekKey } = parseCellKey(key);
      const v = assignment[personId]?.[weekKey];
      if (v) {
        value = v;
        unpaidFlag = isUnpaidAt(personId, weekKey);
      }
    });
    setClipboard(value);
    setPasteUnpaid(unpaidFlag);
    const label = value
      ? projectMap.get(value)?.abbr ?? value
      : '未割当（クリア）';
    message.info(`コピーしました: ${label}${unpaidFlag ? '（BUFFER）' : ''}`);
  }, [selectedCells, assignment, projectMap, isUnpaidAt]);

  /** コピーしたプロジェクト（と無償支援）を選択セルすべてへ貼り付け */
  const handlePasteToSelected = useCallback(() => {
    if (selectedCells.size === 0) {
      message.warning('貼り付け先のセルを選択してください。');
      return;
    }
    if (clipboard === undefined) {
      message.warning('先にコピー元（貼り付けるプロジェクト）を選択してください。');
      return;
    }
    applyProjectToSelected(clipboard);
    const withUnpaid = clipboard !== null && pasteUnpaid;
    if (withUnpaid) applyUnpaidToSelected(true);
    const label =
      clipboard === null
        ? '未割当（クリア）'
        : (projectMap.get(clipboard)?.abbr ?? clipboard);
    message.success(
      `選択中の ${selectedCells.size} セルに「${label}」${
        withUnpaid ? 'をBUFFERとして' : 'を'
      }貼り付けました。`,
    );
  }, [
    clipboard,
    selectedCells,
    applyProjectToSelected,
    applyUnpaidToSelected,
    pasteUnpaid,
    projectMap,
  ]);

  /** 選択セルのうち割当済みのセル数（無償支援にできるセル数） */
  const assignedSelectedCount = useMemo(() => {
    let n = 0;
    selectedCells.forEach((key) => {
      const { personId, weekKey } = parseCellKey(key);
      if (assignment[personId]?.[weekKey]) n += 1;
    });
    return n;
  }, [selectedCells, assignment]);

  // ---- セルの右クリックメニュー（無償支援の設定/解除・コピー・クリア） ----
  /** セルの右クリックメニューを開く */
  const openCellMenu = useCallback(
    (personId: string, weekKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      const MENU_W = 210;
      const MENU_H = 175;
      setCellMenu({
        personId,
        weekKey,
        x: Math.max(4, Math.min(e.clientX, window.innerWidth - MENU_W)),
        y: Math.max(4, Math.min(e.clientY, window.innerHeight - MENU_H)),
      });
    },
    [],
  );

  /** 右クリックメニューを閉じる（外側クリック / スクロール / Esc） */
  useEffect(() => {
    if (!cellMenu) return;
    const close = () => setCellMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCellMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [cellMenu]);

  /** 右クリックメニューの項目 */
  const cellMenuItems = useMemo(() => {
    const personId = cellMenu?.personId ?? '';
    const weekKey = cellMenu?.weekKey ?? '';
    const hasProject = !!assignment[personId]?.[weekKey];
    const unpaidCell = isUnpaidAt(personId, weekKey);
    return [
      {
        key: 'unpaid-on',
        label: 'BUFFERにする',
        icon: <CheckOutlined />,
        disabled: !hasProject || unpaidCell,
      },
      {
        key: 'unpaid-off',
        label: 'BUFFERを解除',
        icon: <CloseOutlined />,
        disabled: !unpaidCell,
      },
      { type: 'divider' as const },
      {
        key: 'copy',
        label: 'コピー',
        icon: <CopyOutlined />,
        disabled: !hasProject,
      },
      {
        key: 'clear',
        label: '未割当にする',
        icon: <DeleteOutlined />,
        disabled: !hasProject,
      },
    ];
  }, [cellMenu, assignment, isUnpaidAt]);

  /** 右クリックメニューの実行 */
  const handleCellMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (!cellMenu) return;
      const { personId, weekKey } = cellMenu;
      if (key === 'unpaid-on') {
        setUnpaidAt(personId, weekKey, true);
      } else if (key === 'unpaid-off') {
        setUnpaidAt(personId, weekKey, false);
      } else if (key === 'copy') {
        const v = assignment[personId]?.[weekKey] ?? null;
        const flag = isUnpaidAt(personId, weekKey);
        setClipboard(v);
        setPasteUnpaid(flag);
        const label = v ? projectMap.get(v)?.abbr ?? v : '未割当（クリア）';
        message.info(`コピーしました: ${label}${flag ? '（BUFFER）' : ''}`);
      } else if (key === 'clear') {
        setAssignmentAt(personId, weekKey, null);
      }
      setCellMenu(null);
    },
    [cellMenu, assignment, isUnpaidAt, projectMap, setUnpaidAt, setAssignmentAt],
  );

  /** テーブル列定義（要員 + 月グループ配下の週列 + 集計列） */
  const columns: TableColumnsType<Row> = useMemo(() => {
    const cols: TableColumnsType<Row> = [
      {
        title: '番号',
        key: 'no',
        fixed: 'left',
        width: 60,
        align: 'center',
        render: (_, row) => (row.isTotal ? '' : row.no),
      },
      {
        title: (
          <div className='leave-head'>
            備考
            <div className='leave-head-note'>
              （社員所属≠案件所属の場合入力必要）
            </div>
          </div>
        ),
        key: 'leavePlan',
        fixed: 'left',
        width: 190,
        render: (_, row) => {
          if (row.isTotal) return '';
          // 入力中は再描画しないよう uncontrolled にし、フォーカスアウト / Enter で確定する
          // （グリッド全体の再描画でタイプが重くなるのを避けるため）
          return (
            <Input
              size='small'
              defaultValue={row.leavePlan ?? ''}
              maxLength={30}
              placeholder={`例：${year}/10/31`}
              onBlur={(e) => commitLeavePlan(row.id, e.target.value)}
              onPressEnter={(e) =>
                commitLeavePlan(row.id, e.currentTarget.value)
              }
            />
          );
        },
      },
      {
        // 役割・社員番号・名前・所属 は同じ幅（内容がちょうど收まる幅）にする
        title: '役割',
        dataIndex: 'role',
        key: 'role',
        fixed: 'left',
        width: 90,
      },
      {
        title: '社員番号',
        key: 'employeeNo',
        fixed: 'left',
        width: 90,
        render: (_, row) => {
          if (row.isTotal) return '';
          // 入力確定（フォーカスアウト / Enter）で社員マスタから 役割・名前・所属 を自動取得する。
          // 重複などで処理中止の場合は入力値を元の値に戻す
          return (
            <EmployeeNoInput
              value={row.employeeNo}
              onCommit={(next) => commitEmployeeNo(row.id, next)}
            />
          );
        },
      },
      {
        title: '名前',
        dataIndex: 'name',
        key: 'name',
        fixed: 'left',
        width: 90,
        render: (v: string, row) =>
          row.isTotal ? <span className='total-label'>合計</span> : v || '－',
      },
      {
        // 所属＝該当社員の所属（部門マスタの部門名）。社員番号の入力で自動セットされる（表示のみ）
        // 列ヘッダーのフィルタで部門を自由に選択できる
        // （候補は他の列の絞り込み結果に追随する = Excel のオートフィルタと同じ）
        title: '所属',
        dataIndex: 'department',
        key: 'department',
        fixed: 'left',
        width: 90,
        filters: filterOptions.dept,
        filterMultiple: true,
        filteredValue: deptFilter.length > 0 ? deptFilter : null,
        // 行の絞り込みは visiblePersonnel 側で行うため、ここでは全行を表示する
        onFilter: () => true,
        render: (v: string, row) => (row.isTotal ? '' : v || '－'),
      },
    ];

    // 月グループ（例: 7月）→ 配下に週列
    monthGroups.forEach((g) => {
      cols.push({
        title: <div className='month-head'>{g.label}</div>,
        key: g.key,
        children: g.weeks.map((w) => ({
          title: (
            <div className='week-head'>
              <div>{w.monday.format('M/D')}</div>
              <div>〜 {w.sunday.format('M/D')}</div>
            </div>
          ),
          key: w.key,
          width: 96,
          align: 'center',
          // 列ヘッダーのフィルタ（Excel のオートフィルタと同じ絞り込み）。
          // その週に選択したプロジェクトを担当している要員だけを表示する。
          // 候補は他の列の絞り込み結果に追随する（自分の列の条件は除外）。
          // ※所属列のフィルタとは独立（列ごとの条件は AND で結合）
          filters: filterOptions.week[w.key],
          filterMultiple: true,
          filterSearch: true,
          filteredValue:
            (weekProjectFilter[w.key]?.length ?? 0) > 0
              ? weekProjectFilter[w.key]
              : null,
          // 行の絞り込みは visiblePersonnel 側で行うため、ここでは全行を表示する
          onFilter: () => true,
          onCell: () => ({}),
          render: (_, row) => {
            if (row.isTotal) {
              const n = weeklyAssignedCounts[w.index];
              return n > 0 ? <span className='total-value'>{n}</span> : '';
            }
            // 複数セル選択モード: クリックで選択 / Shift+クリックで矩形選択
            if (selectMode) {
              const pid = assignment[row.id]?.[w.key];
              const prj = pid ? projectMap.get(pid) : undefined;
              const sel = selectedCells.has(cellKey(row.id, w.key));
              const unpaidCell = isUnpaidAt(row.id, w.key);
              return (
                <div
                  className={`ws-week-cell${
                    unpaidCell ? ' ws-week-cell-unpaid' : ''
                  }`}
                  onContextMenu={(e) => openCellMenu(row.id, w.key, e)}
                  title={
                    unpaidCell
                      ? 'BUFFER（契約外・非計費）'
                      : prj
                      ? `${prj.abbr || prj.name}（ドラッグ / Shift+クリックで矩形選択）`
                      : '未割当（右クリックでメニュー）'
                  }
                >
                  <div
                    className={`cell-chip${sel ? ' cell-chip-selected' : ''}${
                      prj ? '' : ' cell-chip-empty'
                    }`}
                    onMouseDown={(e) => {
                      if (!e.shiftKey) e.preventDefault();
                      handleCellMouseDown(row.id, w.key, e.shiftKey);
                    }}
                    onMouseEnter={() => handleCellDragEnter(row.id, w.key)}
                    onMouseLeave={() => {
                      // ドラッグ中にセルの外へ出たら「ドラッグ」扱い（離した時にトグルしない）
                      if (dragStartRef.current) dragMovedRef.current = true;
                    }}
                  >
                    <span className='cell-chip-text'>
                      {prj ? prj.abbr || prj.name : '－'}
                    </span>
                    {sel ? <span className='cell-chip-mark'>✓</span> : null}
                  </div>
                  {unpaidCell ? (
                    <span className='ws-unpaid-badge ws-unpaid-badge-corner'>
                      BUFFER
                    </span>
                  ) : null}
                </div>
              );
            }
            // 通常モード: セル内プルダウンで個別編集
            const val = assignment[row.id]?.[w.key];
            return (
              <WeekCell
                personId={row.id}
                weekKey={w.key}
                value={val ?? undefined}
                isUnpaid={isUnpaidAt(row.id, w.key)}
                options={projectOptions}
                onChangeProject={handleChangeCellProject}
                onOpenMenu={openCellMenu}
              />
            );
          },
        })),
      });
    });

    // 右端固定: 行削除（確認ダイアログ付き）
    cols.push({
      title: '操作',
      key: 'rowAction',
      fixed: 'right',
      width: 90,
      align: 'center',
      render: (_, row) =>
        row.isTotal ? null : (
          <Popconfirm
            title='行削除の確認'
            description={`${row.name || '（社員番号未入力）'} の行を削除しますか？`}
            okText='削除'
            cancelText='キャンセル'
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteRow(row.id)}
          >
            <Button type='text' danger size='small' icon={<DeleteOutlined />}>
              削除
            </Button>
          </Popconfirm>
        ),
    });

    return cols;
  }, [
    monthGroups,
    year,
    weeklyAssignedCounts,
    assignment,
    projectOptions,
    projectMap,
    deptFilter,
    weekProjectFilter,
    filterOptions,
    handleChangeCellProject,
    isUnpaidAt,
    openCellMenu,
    selectMode,
    selectedCells,
    handleCellMouseDown,
    handleCellDragEnter,
    commitEmployeeNo,
    commitLeavePlan,
    handleDeleteRow,
  ]);

  /** テーブルデータ（表示中要員 + 合計行） */
  const tableRows: Row[] = useMemo(
    () => [
      ...visiblePersonnel.map((p, i) => ({
        id: p.id,
        no: i + 1,
        leavePlan: p.leavePlan,
        role: p.role,
        employeeNo: p.employeeNo,
        name: p.name,
        department: p.department,
        isTotal: false,
      })),
      {
        id: TOTAL_ROW_ID,
        no: 0,
        role: '',
        employeeNo: '',
        name: '合計',
        department: '',
        isTotal: true,
      },
    ],
    [visiblePersonnel],
  );

  // 固定列（fixed left/right）利用時は scroll.y を指定する必要がある。
  // 行数が少ないとヘッダー/本体の幅計測が振動して「チラつき」を起こすため、
  // 本体の縦スクロール高さを行数に応じた固定値にする（少ない行は余白を最小化）。
  const tableScrollY = Math.min(
    620,
    Math.max(120, (tableRows.length + 1) * 40),
  );

  /** 表示期間ラベル（From/To 指定時は括り込み先の週で表示） */
  const rangeLabel = weeks.length
    ? `${weeks[0].monday.format('YYYY/M/D')} 〜 ${weeks[
        weeks.length - 1
      ].monday.format('YYYY/M/D')}`
    : '（該当する週なし）';
  const summaryLabel = `表示範囲：${rangeLabel}（${weeks.length} / ${allWeeks.length} 週） ・ 要員表示 ${visiblePersonnel.length} / ${draftPersonnel.length} 名 ・ 割当延べ ${rangeTotalAssignments} 人週`;

  /** 「全表示」で解除する対象があるか（表示期間 or 列フィルタ） */
  const hasActiveFilter =
    !!rangeFrom ||
    !!rangeTo ||
    deptFilter.length > 0 ||
    Object.keys(weekProjectFilter).length > 0;

  /** 表示期間とすべての列フィルタ（所属列・各週列）をまとめて解除する */
  const resetAllFilters = () => {
    setRangeFrom(null);
    setRangeTo(null);
    setDeptFilter([]);
    setWeekProjectFilter({});
  };

  return (
    <div className='ws-page'>
      {/* ヘッダー */}
      <div className='ws-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {year}年度　要員 週別 プロジェクト稼働管理
          </Title>
          <Text type='secondary'>{summaryLabel}</Text>
        </div>
        <Tag color='blue'>フロント モック（バックエンド未接続）</Tag>
      </div>

      {/* ツールバー: 表示範囲は当年（1月1日の週 〜 12月31日の週）に固定 */}
      <div className='ws-toolbar ws-toolbar-top'>
        <Space wrap>
          <Tag color='green'>
            表示範囲：{rangeLabel}（{weeks.length} / {allWeeks.length} 週）
          </Tag>
        </Space>
        <Space wrap>
          <Button icon={<PlusOutlined />} onClick={handleAddRow}>
            行追加
          </Button>
          <Button
            type={selectMode ? 'primary' : 'default'}
            icon={<SelectOutlined />}
            onClick={() => toggleSelectMode(!selectMode)}
          >
            {selectMode ? '複数選択解除' : '複数選択'}
          </Button>
          {dirty && <Tag color='orange'>未保存の変更あり</Tag>}
          <Button
            type={dirty ? 'primary' : 'default'}
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!dirty}
          >
            保存（モック）
          </Button>
        </Space>
      </div>

      {/* 表示期間バー */}
      <div className='ws-filter-bar'>
        <Space wrap size={10}>
          <span className='filter-title'>表示期間</span>
          <DatePicker
            value={rangeFrom}
            onChange={(d) => setRangeFrom(d ?? null)}
            placeholder='From（未指定＝全期間）'
            format='YYYY/M/D'
            allowClear
          />
          <span className='filter-arrow'>〜</span>
          <DatePicker
            value={rangeTo}
            onChange={(d) => setRangeTo(d ?? null)}
            placeholder='To（未指定＝全期間）'
            format='YYYY/M/D'
            allowClear
          />
          <Button
            icon={<ReloadOutlined />}
            disabled={!hasActiveFilter}
            onClick={resetAllFilters}
          >
            全表示
          </Button>
        </Space>
        <Text type='secondary' className='filter-hint'>
          所属列・週列の列ヘッダーのフィルタ（漏斗）で表示する要員を絞り込めます（Excel と同じく列ごとの条件は AND）。
          From/To で表示する週を絞り込めます（From/To とも任意）。
          「全表示」で表示期間とすべての列フィルタを解除できます。
        </Text>
      </div>

      {/* 複数セル選択 → 一括コピー/貼り付け バー */}
      {selectMode && (
        <div className='ws-select-bar'>
          <Space wrap>
            <Tag color='blue'>選択中 {selectedCells.size} セル</Tag>
            <Select
              allowClear
              placeholder='コピー元（貼り付ける内容）を選択'
              value={
                clipboard === undefined
                  ? undefined
                  : clipboard === null
                  ? CLEAR_VALUE
                  : clipboard
              }
              onChange={(v?: string) => {
                setClipboard(
                  v === undefined
                    ? undefined
                    : v === CLEAR_VALUE
                    ? null
                    : v,
                );
                // 手動で選び直した場合は「無償支援」なしで貼り付ける
                setPasteUnpaid(false);
              }}
              options={clipboardOptions}
              style={{ minWidth: 200 }}
            />
            <Button
              type='primary'
              icon={<CopyOutlined />}
              disabled={selectedCells.size === 0 || clipboard === undefined}
              onClick={handlePasteToSelected}
            >
              選択セルへ貼り付け
            </Button>
            <Button
              disabled={selectedCells.size === 0}
              onClick={handleCopyFromSelected}
            >
              選択からコピー
            </Button>
            <Button
              danger
              disabled={selectedCells.size === 0}
              icon={<DeleteOutlined />}
              onClick={() => {
                applyProjectToSelected(null);
                message.success(
                  `選択中の ${selectedCells.size} セルを未割当にしました。`,
                );
              }}
            >
              未割当に
            </Button>
            <Button
              disabled={assignedSelectedCount === 0}
              onClick={() => {
                applyUnpaidToSelected(true);
                message.success(
                  `選択中の割当済み ${assignedSelectedCount} セルを BUFFER にしました。`,
                );
              }}
            >
              BUFFERに
            </Button>
            <Button
              disabled={assignedSelectedCount === 0}
              onClick={() => {
                applyUnpaidToSelected(false);
                message.success(
                  `選択中の割当済み ${assignedSelectedCount} セルの BUFFER を解除しました。`,
                );
              }}
            >
              BUFFERを解除
            </Button>
            <Button
              type='text'
              disabled={selectedCells.size === 0}
              onClick={() => {
                setSelectedCells(new Set());
                setAnchorCell(null);
              }}
            >
              選択解除
            </Button>
          </Space>
          <Text type='secondary'>
            ※セルをドラッグで範囲選択（クリック=1セル ON/OFF / Shift+クリック=矩形選択）。
            セルの右クリックメニューからも「BUFFER」を設定できます（貼り付けは BUFFER も引き継ぎます）。
          </Text>
        </div>
      )}

      {/* 凡例 */}
      <div className='ws-legend'>
        <span className='legend-item'>{LEAVE_PROJECT_NAME}</span>
        <span className='legend-item'>未割当（－）</span>
        <span
          className='legend-item ws-legend-unpaid'
          title='BUFFER（契約外・非計費）'
        >
          BUFFER
        </span>
        <Text type='secondary'>　※セルでプロジェクト（略称）を選択します。</Text>
      </div>

      {/* グリッド本体 */}
      <div
        ref={tableWrapRef}
        className={`ws-table-card${selectMode ? ' ws-table-card-select' : ''}`}
      >
        <Table<Row>
          rowKey={(r) => r.id}
          columns={columns}
          dataSource={tableRows}
          size='small'
          pagination={false}
          rowClassName={(r) =>
            r.isTotal
              ? 'total-row'
              : leavePersonIds.has(r.id)
              ? 'row-leave-planned'
              : ''
          }
          // 列ヘッダーフィルタ → 所属列（部署）・週列（プロジェクト）へ反映する
          onChange={(_pagination, filters) => {
            // 所属列（部署）→ 検索条件
            const rawDept = filters.department;
            const nextDept = Array.isArray(rawDept)
              ? rawDept.map((v) => String(v))
              : [];
            setDeptFilter((prev) =>
              prev.length === nextDept.length &&
              prev.every((v, i) => v === nextDept[i])
                ? prev
                : nextDept,
            );
            // 週列（プロジェクト）→ 週ごとの列フィルタ
            setWeekProjectFilter((prev) => {
              const next: Record<string, string[]> = {};
              weeks.forEach((w) => {
                const raw = filters[w.key];
                const vals = Array.isArray(raw) ? raw.map((v) => String(v)) : [];
                if (vals.length > 0) next[w.key] = vals;
              });
              const same =
                Object.keys(prev).length === Object.keys(next).length &&
                Object.keys(next).every((k) => {
                  const before = prev[k] ?? [];
                  const after = next[k];
                  return (
                    before.length === after.length &&
                    after.every((v, i) => v === before[i])
                  );
                });
              return same ? prev : next;
            });
          }}
          scroll={{
            // 左固定（番号60+備考190+役割90+社員番号90+名前90+所属90）
            // + 週列 + 右固定（操作 90）
            x: FIXED_LEFT_WIDTH + weeks.length * WEEK_COL_WIDTH + 90,
            y: tableScrollY,
          }}
        />
      </div>

      <div className='ws-legend'>
        <Text type='secondary'>
          凡例：各列は1週間（月曜〜日曜）。セルでプロジェクトを選択すると、その週の担当が登録されます（未来週は空欄 = 計画入力）。
        </Text>
        <br />
        <Text type='secondary'>
          {`※「${LEAVE_PROJECT_NAME}」を選ぶと、その週から12月31日を含む週までを一括で「${LEAVE_PROJECT_NAME}」に設定し、行をグレー表示します。`}
        </Text>
        <br />
        <Text type='secondary'>
          ※「BUFFER（契約外・非計費）」は、セルの右クリックメニューまたは「複数選択」の一括ボタンで設定/解除できます（ピンクの斜紋＋「BUFFER」バッジで表示。プロジェクトを変更すると自動解除されます）。
        </Text>
      </div>

      {/* セルの右クリックメニュー（無償支援の設定/解除・コピー・クリア） */}
      {cellMenu && (
        <div
          className='ws-cell-menu'
          style={{ left: cellMenu.x, top: cellMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Menu
            items={cellMenuItems}
            selectable={false}
            onClick={handleCellMenuClick}
          />
        </div>
      )}
    </div>
  );
};

export default WorkStatus;
