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
  SyncOutlined,
} from '@ant-design/icons';
import './WorkStatus.css';
import { PERSON_MAIN_PROJECT } from '../data/mockData';
import { Department, Personnel, Project, AssignmentMap } from './types';

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

/** 表示年（当年）。グリッドは「当年1月1日を含む週」〜「12月31日を含む週」のみを表示する */
const DISPLAY_YEAR = dayjs().year();

/** セルキー（要員ID|週キー）を組み立てる */
const cellKey = (personId: string, weekKey: string) =>
  `${personId}${KEY_SEP}${weekKey}`;

/** セルキー（要員ID|週キー）を 要員ID と 週キー に分解する */
const parseCellKey = (key: string): { personId: string; weekKey: string } => {
  const i = key.indexOf(KEY_SEP);
  return { personId: key.slice(0, i), weekKey: key.slice(i + 1) };
};

/** 1週（月曜〜日曜）の情報 */
interface WeekCol {
  /** 週キー = 月曜日 'YYYY-MM-DD' */
  key: string;
  monday: Dayjs;
  sunday: Dayjs;
  index: number;
}

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

/** 指定日が属する週の月曜日を返す */
const mondayOf = (d: Dayjs): Dayjs => d.subtract((d.day() + 6) % 7, 'day');

/**
 * 当年の週列を列挙する（月曜始まり）。
 * 1月1日を含む週 〜 12月31日を含む週（前年12月・翌年1月にまたがる週も含む）
 */
const buildYearWeeks = (year: number): WeekCol[] => {
  const firstMonday = mondayOf(dayjs(`${year}-01-01`));
  const lastMonday = mondayOf(dayjs(`${year}-12-31`));
  const weeks: WeekCol[] = [];
  let cur = firstMonday;
  let guard = 0;
  while (!cur.isAfter(lastMonday, 'day') && guard < 80) {
    weeks.push({
      key: cur.format('YYYY-MM-DD'),
      monday: cur,
      sunday: cur.add(6, 'day'),
      index: weeks.length,
    });
    cur = cur.add(7, 'day');
    guard += 1;
  }
  return weeks;
};

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

/** WorkStatus の props（要員・プロジェクト・部門は App（メニュー側）で管理する） */
interface WorkStatusProps {
  /** 要員一覧（メニューの「要員情報」で増える） */
  personnel: Personnel[];
  /** プロジェクト一覧（メニューの「プロジェクト管理」で増える） */
  projects: Project[];
  /** 部門マスタ（要員検索の「部署」の選択肢） */
  departments: Department[];
  /**
   * 「社員番号」列で社員番号を入力したとき（社員マスタから 役割・名前・所属 を自動取得）
   * 戻り値 false = 処理中止（一覧内で社員番号が重複）。入力値は元の値に戻す
   */
  onChangePersonnelEmployeeNo: (personId: string, employeeNo: string) => boolean;
  /** 「退場予定」列で退場予定を変更したとき */
  onChangePersonnelLeavePlan: (personId: string, leavePlan: string) => void;
  /** 行追加（全項目が空の行を追加する） */
  onAddRow: () => void;
  /** 行削除 */
  onDeleteRow: (personId: string) => void;
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
      title={isUnpaid ? '無償支援（契約外・非計費）' : undefined}
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
        // 無償支援のセルは矢印アイコンの位置に「無償」バッジを表示する
        suffixIcon={isUnpaid ? <span className='ws-unpaid-badge'>無償</span> : undefined}
      />
    </div>
  ),
);

/**
 * 要員 × 週 のプロジェクト割当グリッド（週単位・当年 1月〜12月 の 1年度分）
 */
const WorkStatus: React.FC<WorkStatusProps> = ({
  personnel,
  projects,
  departments,
  onChangePersonnelEmployeeNo,
  onChangePersonnelLeavePlan,
  onAddRow,
  onDeleteRow,
}) => {
  // 割当: 要員ID -> (週キー 'YYYY-MM-DD' -> プロジェクトID or null)
  const [assignment, setAssignment] = useState<AssignmentMap>({});

  // ---- 要員検索・絞り込み（部署 × 要員 の連動リスト） ----
  // 選択した部署（空 = 全部署）
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  // 選択した要員（空 = 部署内の全員）
  const [personFilter, setPersonFilter] = useState<string[]>([]);

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
  const [unpaid, setUnpaid] = useState<Record<string, Record<string, boolean>>>(
    {},
  );

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

  // 部門の選択肢（部門管理画面で管理する部門マスタから取得）
  const deptOptions = useMemo(
    () => departments.map((d) => ({ value: d.name, label: d.name })),
    [departments],
  );

  // 部署で絞り込んだ要員（「要員」リストの選択肢 = 部署との連動）
  const deptMembers = useMemo(
    () =>
      deptFilter.length === 0
        ? personnel
        : personnel.filter((p) => deptFilter.includes(p.department)),
    [deptFilter, personnel],
  );
  // 実際に表へ表示する要員（部署絞り込み かつ 要員指定）
  const visiblePersonnel = useMemo(
    () =>
      deptMembers.filter(
        (p) => personFilter.length === 0 || personFilter.includes(p.id),
      ),
    [deptMembers, personFilter],
  );

  // 「要員」セレクトの選択肢（部署に連動し、部署・役割も表示）
  const personOptions = useMemo(
    () =>
      deptMembers.map((p) => ({
        value: p.id,
        label: `${p.name}（${p.department}・${p.role}）`,
      })),
    [deptMembers],
  );

  // 当年（1月1日を含む週 〜 12月31日を含む週）の全週列
  const allWeeks: WeekCol[] = useMemo(() => buildYearWeeks(DISPLAY_YEAR), []);

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
            ym.year === DISPLAY_YEAR
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
  }, [weeks]);

  /**
   * 「開始済みの週（月曜 <= 今日）」まで主担当プロジェクトを自動セット（モック用）。
   * 明示的にクリアした週（null）は上書きしない。
   */
  useEffect(() => {
    setAssignment((prev) => {
      const today = dayjs();
      let changed = false;
      const next: AssignmentMap = {};
      personnel.forEach((p) => {
        const cell = { ...(prev[p.id] ?? {}) };
        weeks.forEach((w) => {
          if (w.monday.isAfter(today, 'day')) return; // 未来の週は未入力
          if (cell[w.key] === undefined) {
            cell[w.key] = PERSON_MAIN_PROJECT[p.id] ?? null;
            changed = true;
          }
        });
        next[p.id] = cell;
      });
      return changed ? next : prev;
    });
  }, [weeks, personnel]);

  /** 1セルの「無償支援（契約外・非計費）」フラグを解除する */
  const clearUnpaidAt = useCallback((personId: string, weekKey: string) => {
    setUnpaid((prev) => {
      if (!prev[personId]?.[weekKey]) return prev;
      const cell = { ...prev[personId] };
      delete cell[weekKey];
      return { ...prev, [personId]: cell };
    });
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
    personnel.forEach((p) => {
      const cells = assignment[p.id];
      if (cells && weeks.some((w) => cells[w.key] === leaveProjectKey)) {
        ids.add(p.id);
      }
    });
    return ids;
  }, [assignment, weeks, personnel, leaveProjectKey]);

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
    message.info(`コピーしました: ${label}${unpaidFlag ? '（無償支援）' : ''}`);
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
        withUnpaid ? 'を無償支援として' : 'を'
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
        label: '無償支援にする',
        icon: <CheckOutlined />,
        disabled: !hasProject || unpaidCell,
      },
      {
        key: 'unpaid-off',
        label: '無償支援を解除',
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
        message.info(`コピーしました: ${label}${flag ? '（無償支援）' : ''}`);
      } else if (key === 'clear') {
        setAssignmentAt(personId, weekKey, null);
      }
      setCellMenu(null);
    },
    [cellMenu, assignment, isUnpaidAt, projectMap, setUnpaidAt, setAssignmentAt],
  );

  /** 部署変更時、部署外の要員選択を自動で外す（部署→要員の連動） */
  const handleDeptFilterChange = (vals: string[]) => {
    setDeptFilter(vals);
    const set = new Set(vals);
    setPersonFilter((prev) =>
      prev.filter((id) => {
        const p = personnel.find((x) => x.id === id);
        return !p || set.size === 0 || set.has(p.department);
      }),
    );
  };

  /** 要員フィルタを初期化（全部署・全員を表示） */
  const resetFilters = () => {
    setDeptFilter([]);
    setPersonFilter([]);
  };

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
            退場予定
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
              placeholder='例：2026/10/31'
              onBlur={(e) => onChangePersonnelLeavePlan(row.id, e.target.value)}
              onPressEnter={(e) =>
                onChangePersonnelLeavePlan(row.id, e.currentTarget.value)
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
              onCommit={(next) => onChangePersonnelEmployeeNo(row.id, next)}
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
        title: '所属',
        dataIndex: 'department',
        key: 'department',
        fixed: 'left',
        width: 90,
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
                      ? '無償支援（契約外・非計費）'
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
                      無償
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
            onConfirm={() => onDeleteRow(row.id)}
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
    weeklyAssignedCounts,
    assignment,
    projectOptions,
    projectMap,
    handleChangeCellProject,
    isUnpaidAt,
    openCellMenu,
    selectMode,
    selectedCells,
    handleCellMouseDown,
    handleCellDragEnter,
    onChangePersonnelEmployeeNo,
    onChangePersonnelLeavePlan,
    onDeleteRow,
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

  /** 保存（現状はモック：コンソール出力のみ） */
  const handleSave = () => {
    // TODO: バックエンド実装後に /api/kadou/** へ送信する
    console.log('save payload', { personnel, assignment });
    message.success('保存しました（モック実装：サーバー未接続）。');
  };

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
  const summaryLabel = `表示範囲：${rangeLabel}（${weeks.length} / ${allWeeks.length} 週） ・ 要員表示 ${visiblePersonnel.length} / ${personnel.length} 名 ・ 割当延べ ${rangeTotalAssignments} 人週`;

  return (
    <div className='ws-page'>
      {/* ヘッダー */}
      <div className='ws-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            要員 週別 プロジェクト稼働管理
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
          <Button icon={<PlusOutlined />} onClick={onAddRow}>
            行追加
          </Button>
          <Button
            type={selectMode ? 'primary' : 'default'}
            icon={<SelectOutlined />}
            onClick={() => toggleSelectMode(!selectMode)}
          >
            複数セル選択
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave}>
            保存（モック）
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={() => {
              // TODO: 年度初期化の詳細仕様（対象範囲・初期値・確認方法）が確定後に実装する
              message.warning(
                '年度初期化：詳しい仕様を要確認のため、処理を中止しました。',
              );
            }}
          >
            年度初期化
          </Button>
        </Space>
      </div>

      {/* 要員検索・表示期間バー（2 つの条件を 1 行にまとめて余白を無くす） */}
      <div className='ws-filter-bar'>
        <Space wrap size={10}>
          <span className='filter-title'>要員検索</span>
          <Select
            mode='multiple'
            allowClear
            placeholder='部署（複数可・未選択=全部署）'
            value={deptFilter}
            onChange={handleDeptFilterChange}
            options={deptOptions}
            style={{ width: 260 }}
            maxTagCount={2}
          />
          <span className='filter-arrow'>→</span>
          <Select
            mode='multiple'
            allowClear
            showSearch
            placeholder='要員（部署に連動・複数可）'
            value={personFilter}
            onChange={(v: string[]) => setPersonFilter(v)}
            options={personOptions}
            optionFilterProp='label'
            style={{ width: 340 }}
            maxTagCount={2}
          />
          <Button icon={<ReloadOutlined />} onClick={resetFilters}>
            全表示
          </Button>
          <span className='filter-sep' />
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
            disabled={!rangeFrom && !rangeTo}
            onClick={() => {
              setRangeFrom(null);
              setRangeTo(null);
            }}
          >
            全期間
          </Button>
        </Space>
        <Text type='secondary' className='filter-hint'>
          部署を選ぶと要員リストが連動します。From/To で表示する週を絞り込めます（From/To とも任意）。
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
                  `選択中の割当済み ${assignedSelectedCount} セルを無償支援にしました。`,
                );
              }}
            >
              無償支援に
            </Button>
            <Button
              disabled={assignedSelectedCount === 0}
              onClick={() => {
                applyUnpaidToSelected(false);
                message.success(
                  `選択中の割当済み ${assignedSelectedCount} セルの無償支援を解除しました。`,
                );
              }}
            >
              無償支援を解除
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
            セルの右クリックメニューからも「無償支援」を設定できます（貼り付けは無償支援も引き継ぎます）。
          </Text>
        </div>
      )}

      {/* プロジェクト一覧（略称） */}
      <div className='ws-legend'>
        {projects.map((p) => (
          <span key={p.key} className='legend-item' title={p.name || p.abbr}>
            {p.abbr || p.name}
          </span>
        ))}
        <span className='legend-item'>未割当（－）</span>
        <span
          className='legend-item ws-legend-unpaid'
          title='無償支援（契約外・非計費）'
        >
          無償支援（斜紋＋無償）
        </span>
        <Text type='secondary'>　※セルでプロジェクト（略称）を選択します。</Text>
      </div>

      {/* グリッド本体 */}
      <div
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
          scroll={{
            // 左固定（番号60+退場予定190+役割90+社員番号90+名前90+所属90=610）
            // + 週列 + 右固定（操作 90）
            x: 610 + weeks.length * 96 + 90,
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
          ※「無償支援（契約外・非計費）」は、セルの右クリックメニューまたは「複数セル選択」の一括ボタンで設定/解除できます（ピンクの斜紋＋「無償」バッジで表示。プロジェクトを変更すると自動解除されます）。
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
