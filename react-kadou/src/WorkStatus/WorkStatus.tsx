import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Button,
  DatePicker,
  Input,
  Menu,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
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
  SwapOutlined,
} from '@ant-design/icons';
import './WorkStatus.css';
import {
  AssignmentMap,
  Department,
  Personnel,
  Project,
  WorkStatusRow,
} from './types';
import { departmentLabelOf } from '../data/departmentUtils';
import {
  WEEK_COL_WIDTH,
  FIXED_LEFT_WIDTH,
  WeekCol,
  buildYearWeeks,
  mondayOf,
} from '../data/yearWeeks';
import type { UnpaidMap, WorkStatusData } from '../data/yearStore';
import type { WorkStatusPayload } from '../data/kadouRepository';
import {
  currentWeekKey,
  hasPastActualsForEmployee,
  hasPastActualsForRow,
  hasWorkData,
  isPastWeek,
} from './pastActuals';
import type { SavedBaseline } from './pastActuals';

const { Title, Text } = Typography;

/** 複数セル選択時に使うセルキーの区切り */
const KEY_SEP = '|';

/**
 * 「内・退職」を表すプロジェクト名
 * 週セルでこの項目を選ぶと、その週から最終週までを一括で「内・退職」にし、行をグレー表示する
 */
const LEAVE_PROJECT_NAME = '内・退職';

/** セルキー（行キー|週キー）を組み立てる */
const cellKey = (rowKey: string, weekKey: string) =>
  `${rowKey}${KEY_SEP}${weekKey}`;

/** セルキー（行キー|週キー）を 行キー と 週キー に分解する */
const parseCellKey = (key: string): { rowKey: string; weekKey: string } => {
  const i = key.indexOf(KEY_SEP);
  return { rowKey: key.slice(0, i), weekKey: key.slice(i + 1) };
};

/** その週が行の有効期間内か（未指定 = 年度全体） */
const isWeekActive = (
  row: { activeFrom?: string; activeTo?: string },
  weekKey: string,
): boolean =>
  (!row.activeFrom || weekKey >= row.activeFrom) &&
  (!row.activeTo || weekKey <= row.activeTo);

/** 2つの行の有効期間が重なるか（未指定 = 年度全体） */
const periodsOverlap = (
  a: { activeFrom?: string; activeTo?: string },
  b: { activeFrom?: string; activeTo?: string },
): boolean => {
  const aFrom = a.activeFrom ?? '';
  const aTo = a.activeTo ?? '9999-12-31';
  const bFrom = b.activeFrom ?? '';
  const bTo = b.activeTo ?? '9999-12-31';
  return aFrom <= bTo && bFrom <= aTo;
};

/** 月ごとの週グループ（ヘッダー2段組み用） */
interface MonthGroup {
  key: string;
  label: string;
  weeks: WeekCol[];
}

/** 表示行を要員マスタと結合したもの */
interface PersonRow extends WorkStatusRow {
  name: string;
  role: string;
  leavePlan?: string;
}

/** テーブル行（要員） */
interface Row {
  /** 行キー（画面だけの識別子。保存しない） */
  key: string;
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
  /** 所属部門ID（部門マスタの departmentId） */
  departmentId: string;
  /** 所属部門の表示名 */
  departmentName: string;
  /** 有効開始週（月曜） */
  activeFrom?: string;
  /** 有効終了週（月曜） */
  activeTo?: string;
  /** 異動で分割された行のマーカー（社員番号は 2 行まとめて変更する） */
  employeeNoLocked?: boolean;
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
  /** 社員マスタ（社員番号 → 要員）。氏名・役割・所属の参照に使う（マスタ編集は要員情報画面のみ） */
  employeeMaster: Map<string, Personnel>;
  /** 保存済みの稼働表（表示行 rows・割当・BUFFER） */
  initialWorkStatus: WorkStatusData;
  /** 保存（下書きを確定して親へ渡す） */
  onSave: (payload: WorkStatusPayload) => void;
  /** 退場予定（備考）の変更。要員マスタの項目なので即時保存する */
  onUpdateLeavePlan: (employeeNo: string, leavePlan: string) => void;
  /** 所属変更（異動）で要員マスタの現在所属を更新する */
  onUpdateDepartment: (employeeNo: string, departmentId: string) => void;
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
  projects,
  departments,
  defaultDepartments,
  employeeMaster,
  initialWorkStatus,
  onSave,
  onUpdateLeavePlan,
  onUpdateDepartment,
  onDirtyChange,
  registerSaveHandler,
}) => {
  // ---- 下書き（保存するまで確定しない編集内容）------------------------
  // 未保存の変更があるか
  const [dirty, setDirty] = useState(false);

  // ---- 表示行（要員マスタとは別。行追加・行削除はこの並びだけを変える）----
  // employeeNo が空の行は「社員番号未入力」の空行。
  // 行は所属と有効期間を持ち、年途中の部門異動は 2 行に分けて表現する。
  const [draftRows, setDraftRows] = useState<WorkStatusRow[]>(() =>
    (initialWorkStatus.rows ?? []).map((row, i) => ({
      ...row,
      key: row.key || `r-${i + 1}`,
      departmentId:
        row.departmentId ||
        employeeMaster.get(row.employeeNo)?.departmentId ||
        '',
    })),
  );
  // 行キーの連番（既存キーの最大値から再開する）
  const rowIdRef = useRef(
    (initialWorkStatus.rows ?? []).reduce((max, row) => {
      const n = Number((row.key ?? '').replace(/^r-/, ''));
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0),
  );

  /** 下書きの行を要員マスタ（氏名・役割・退場予定）と結合した表示用の行 */
  const draftPersonnel: PersonRow[] = useMemo(
    () =>
      draftRows.map((row) => {
        const master = row.employeeNo
          ? employeeMaster.get(row.employeeNo)
          : undefined;
        return {
          ...row,
          name: master?.name ?? '',
          role: master?.role ?? '',
          leavePlan: master?.leavePlan,
        };
      }),
    [draftRows, employeeMaster],
  );

  // この画面で「行追加」した行のキー。
  // 追加した行はフィルタ条件に一致しなくても、次にフィルタを適用するまで表示する
  // （Excel のオートフィルタと同じく、行の追加・編集では再判定しない）
  const [addedRowKeys, setAddedRowKeys] = useState<Set<string>>(
    () => new Set(),
  );

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

  // 行削除で業務データ（割当・BUFFER）を削除した要員。
  // 保存時にバックエンドへ渡し、DB 側でも当該年度の業務データを削除する
  const [deletedEmployeeNos, setDeletedEmployeeNos] = useState<string[]>([]);

  // 保存済みデータ（過去実績の判定基準）。保存時に更新する
  // ※判定は未保存の下書きではなく保存済みデータで行う（設計 7.4）
  const [savedBaseline, setSavedBaseline] = useState<SavedBaseline>(() => ({
    assignment: initialWorkStatus.assignment,
    unpaid: initialWorkStatus.unpaid,
  }));

  // 今週の月曜（過去週の判定基準）。週が変わったら 1 分以内に再計算する
  const [currentMonday, setCurrentMonday] = useState<string>(() =>
    currentWeekKey(),
  );
  // 現在の年（過年度判定用）。週の切り替えと同じタイマーで更新する
  const [currentYear, setCurrentYear] = useState<number>(() => dayjs().year());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentMonday((prev) => {
        const next = currentWeekKey();
        return next === prev ? prev : next;
      });
      setCurrentYear((prev) => {
        const next = dayjs().year();
        return next === prev ? prev : next;
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // 過年度（現在年より前）は参照のみ
  const pastYear = year < currentYear;

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

  // ---- 所属変更（異動）ダイアログ ----
  // 対象行・新しい所属・適用開始週（月曜キー）
  const [transferRowKey, setTransferRowKey] = useState<string | null>(null);
  const [transferDeptId, setTransferDeptId] = useState<string | undefined>();
  const [transferWeekKey, setTransferWeekKey] = useState<string | undefined>();

  // ---- グリッドの初期表示位置（当月の列を左端に表示する） ----
  // テーブル全体のラッパー（.ant-table-body を探して水平スクロールする）
  const tableWrapRef = useRef<HTMLDivElement>(null);
  // 初期スクロールを 1 度だけ実行するためのフラグ
  const didInitScrollRef = useRef(false);
  // 行追加後に最下部（追加行）へスクロールするためのフラグ
  const scrollToBottomRef = useRef(false);

  // ---- 下書き（表示行・割当・BUFFER）の操作 -------------------------

  /** 新しい行キーを発行する（画面だけの識別子） */
  const nextRowKey = useCallback(() => {
    rowIdRef.current += 1;
    return `r-${rowIdRef.current}`;
  }, []);

  /**...r,
          departmentId: r.departmentId || master?.departmentId || '',
          name: master?.name ?? '',
          role: master?.roleo(
    () =>
      draftRows.map((r) => {
        const master = r.employeeNo
          ? employeeMaster.get(r.employeeNo)
          : undefined;
        return {
          key: r.key,
          employeeNo: r.employeeNo,
          name: master?.name ?? '',
          role: master?.role ?? '',
          departmentId: master?.departmentId ?? '',
          leavePlan: master?.leavePlan,
        };
      }),
    [draftRows, employeeMaster],
  );

  /** 未保存かどうかを親（年度切替・ログアウトの確認）へ通知する */
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  /**
   * 社員番号の確定（表示行の employeeNo を差し替える。要員マスタは変更しない）
   * 戻り値: true = 採用 / false = 処理中止
   * （過去実績・重複・マスタ未登録・データありのクリア・異動中のクリア）
   */
  const commitEmployeeNo = useCallback(
    (rowKey: string, employeeNo: string): boolean => {
      const no = employeeNo.trim();
      const current = draftRows.find((r) => r.key === rowKey);
      if (!current) return false;
      // 過年度は参照のみ
      if (pastYear) return false;
      const currentNo = current.employeeNo;

      // 変更なし
      if (no === currentNo) return true;

      // 過去実績がある社員は変更できない（入力欄も無効化されているが念のため）
      if (
        currentNo &&
        hasPastActualsForEmployee(
          draftRows,
          currentNo,
          savedBaseline,
          currentMonday,
        )
      ) {
        message.error('過去実績があるため社員番号を変更できません。');
        return false;
      }

      // 同じ社員の行（異動の 2 行）はまとめて変更する
      const myRows = currentNo
        ? draftRows.filter((r) => r.employeeNo === currentNo)
        : [current];

      // 社員番号を空にする場合は空行に戻す
      if (no === '') {
        // 異動中の 2 行は空にできない（行削除で対応）
        if (myRows.length > 1) {
          message.error(
            '異動中の行は社員番号を空にできません。行削除で対応してください。',
          );
          return false;
        }
        // 業務データ（割当・BUFFER）がある場合は空にできない
        // （下書き・保存済みのどちらかにデータがあれば不可）
        if (
          hasWorkData(currentNo, assignment, unpaid) ||
          hasWorkData(
            currentNo,
            savedBaseline.assignment,
            savedBaseline.unpaid,
          )
        ) {
          message.error(
            '割当・BUFFERが登録されているため、社員番号を空にできません。行を削除してください。',
          );
          return false;
        }
        setDraftRows((prev) =>
          prev.map((r) =>
            r.key === rowKey
              ? {
                  ...r,
                  employeeNo: '',
                  departmentId: '',
                  employeeNoLocked: undefined,
                  splitFromKey: undefined,
                }
              : r,
          ),
        );
        setDirty(true);
        return true;
      }

      // 要員マスタに存在する社員番号のみ表示できる（マスタは作成・更新しない）
      if (!employeeMaster.has(no)) {
        message.warning(
          `社員番号「${no}」は要員マスタに存在しません。要員情報画面で登録してください。`,
        );
        return false;
      }

      // 重複チェック：同じ社員番号は「有効期間が重ならない場合のみ」許可する
      // （異動の 2 行も含めて、変更後の行すべてで判定する）
      const targetRows = draftRows.filter(
        (r) => r.employeeNo === no && !myRows.some((my) => my.key === r.key),
      );
      const conflict = targetRows.some((target) =>
        myRows.some((my) => periodsOverlap(my, target)),
      );
      if (conflict) {
        message.error(
          `社員番号「${no}」は同じ期間に既に表示されているため、処理を中止しました。`,
        );
        return false;
      }
      // 同一社員の行は 1 年度につき最大 2 行（異動 1 回）
      if (targetRows.length + myRows.length > 2) {
        message.error(
          `社員番号「${no}」の行が 2 行を超えるため、処理を中止しました。`,
        );
        return false;
      }

      const master = employeeMaster.get(no);
      // 割当・BUFFER を新しい社員番号へ引き継ぐ
      // （新しい社員番号に既存データがある場合は、引き継いだデータで上書きする）
      setAssignment((prev) => {
        if (!currentNo || !prev[currentNo]) return prev;
        const next = { ...prev };
        next[no] = { ...(next[no] ?? {}), ...prev[currentNo] };
        delete next[currentNo];
        return next;
      });
      setUnpaid((prev) => {
        if (!currentNo || !prev[currentNo]) return prev;
        const next = { ...prev };
        next[no] = { ...(next[no] ?? {}), ...prev[currentNo] };
        delete next[currentNo];
        return next;
      });
      // 旧社員番号の当年度データは残さない（API は削除→payload 反映の順）
      if (currentNo) {
        setDeletedEmployeeNos((prev) =>
          prev.includes(currentNo) ? prev : [...prev, currentNo],
        );
      }
      // 異動で分割されている場合は 2 行まとめて同じ社員番号に変更する
      setDraftRows((prev) =>
        prev.map((r) =>
          myRows.some((my) => my.key === r.key)
            ? {
                ...r,
                employeeNo: no,
                // 空行から社員番号を確定したときはマスタの現在所属を採用する
                departmentId: r.departmentId || master?.departmentId || '',
              }
            : r,
        ),
      );
      setDirty(true);
      return true;
    },
    [
      assignment,
      unpaid,
      draftRows,
      employeeMaster,
      savedBaseline,
      currentMonday,
      pastYear,
    ],
  );

  /** 退場予定（備考）の変更。要員マスタの項目なので即時保存する */
  const commitLeavePlan = useCallback(
    (rowKey: string, leavePlan: string) => {
      // 過年度は参照のみ
      if (pastYear) return;
      const row = draftRows.find((r) => r.key === rowKey);
      if (!row?.employeeNo) return;
      onUpdateLeavePlan(row.employeeNo, leavePlan);
    },
    [draftRows, onUpdateLeavePlan, pastYear],
  );

  /** 行追加（社員番号未入力の行を表示行に追加する。要員マスタは変更しない） */
  const handleAddRow = useCallback(() => {
    // 過年度は参照のみ
    if (pastYear) return;
    const key = nextRowKey();
    setDraftRows((prev) => [
      ...prev,
      { key, employeeNo: '', departmentId: '' },
    ]);
    // 追加した行は次にフィルタを適用するまでフィルタ条件外でも表示する
    setAddedRowKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    // 追加した行（表の最下部）が見えるようスクロールする
    scrollToBottomRef.current = true;
    setDirty(true);
    message.success(
      '空の行を追加しました（フィルタ適用中でも表示されます。未保存・社員番号を入力してください）。',
    );
  }, [nextRowKey, pastYear]);

  /**
   * 行削除（要員マスタは削除せず、その行の業務データだけを削除する）
   * ・過去実績（保存済みデータ）がある行は削除できない
   * ・異動で分割された行はどちらでも削除でき、残った行が期間を吸収する
   * ・最後の行を削除した場合は当年度の業務データを全件削除する
   */
  const handleDeleteRow = useCallback(
    (rowKey: string) => {
      const target = draftRows.find((r) => r.key === rowKey);
      if (!target) return;
      // 過年度は参照のみ
      if (pastYear) return;
      // 過去実績（保存済みデータ）がある行は削除できない
      if (hasPastActualsForRow(target, savedBaseline, currentMonday)) {
        message.error('過去実績がある行は削除できません。');
        return;
      }
      const employeeNo = target.employeeNo;
      // その社員の最後の行を削除するか（＝再追加時に全週「未割当」で表示する）
      const isLastRowOfEmployee =
        employeeNo !== '' &&
        !draftRows.some((r) => r.key !== rowKey && r.employeeNo === employeeNo);
      // 業務データ（割当・BUFFER）を削除する。要員マスタは削除しない
      // ・異動で分割された行は、有効期間外の週（別の行の期間）の実績を残す
      // ・最後の行を削除した場合は、再追加しても過去の割当が戻らないよう全件削除する
      if (isLastRowOfEmployee) {
        setAssignment((prev) => {
          if (!prev[employeeNo]) return prev;
          const next = { ...prev };
          delete next[employeeNo];
          return next;
        });
        setUnpaid((prev) => {
          if (!prev[employeeNo]) return prev;
          const next = { ...prev };
          delete next[employeeNo];
          return next;
        });
      } else if (employeeNo) {
        setAssignment((prev) => {
          const weeksOfEmployee = prev[employeeNo];
          if (!weeksOfEmployee) return prev;
          const remain: Record<string, string | null> = {};
          Object.keys(weeksOfEmployee).forEach((weekKey) => {
            if (!isWeekActive(target, weekKey)) {
              remain[weekKey] = weeksOfEmployee[weekKey];
            }
          });
          if (
            Object.keys(remain).length === Object.keys(weeksOfEmployee).length
          ) {
            return prev;
          }
          const next = { ...prev };
          if (Object.keys(remain).length === 0) {
            delete next[employeeNo];
          } else {
            next[employeeNo] = remain;
          }
          return next;
        });
        setUnpaid((prev) => {
          const weeksOfEmployee = prev[employeeNo];
          if (!weeksOfEmployee) return prev;
          const remain: Record<string, boolean> = {};
          Object.keys(weeksOfEmployee).forEach((weekKey) => {
            if (!isWeekActive(target, weekKey)) {
              remain[weekKey] = weeksOfEmployee[weekKey];
            }
          });
          if (
            Object.keys(remain).length === Object.keys(weeksOfEmployee).length
          ) {
            return prev;
          }
          const next = { ...prev };
          if (Object.keys(remain).length === 0) {
            delete next[employeeNo];
          } else {
            next[employeeNo] = remain;
          }
          return next;
        });
      }
      // 保存時は「削除 → payload 反映」の順で処理するため、
      // 残りの行がある場合（一部の行の削除）も対象社員を削除リストに入れる
      if (employeeNo) {
        setDeletedEmployeeNos((prev) =>
          prev.includes(employeeNo) ? prev : [...prev, employeeNo],
        );
      }
      setDraftRows((prev) => {
        const deleted = prev.find((r) => r.key === rowKey);
        if (!deleted) return prev;
        let next = prev.filter((r) => r.key !== rowKey);
        // 削除した行の後段（異動先）があれば、その行が削除した行の期間を吸収する
        const child = next.find((r) => r.splitFromKey === rowKey);
        if (child) {
          next = next.map((r) =>
            r.key === child.key
              ? {
                  ...r,
                  activeFrom: deleted.activeFrom,
                  splitFromKey: deleted.splitFromKey,
                  employeeNoLocked: deleted.splitFromKey ? true : undefined,
                }
              : r,
          );
        } else if (deleted.splitFromKey) {
          // 異動先を削除した場合は、異動元が期間を吸収して異動前の状態に戻す
          const parentKey = deleted.splitFromKey;
          const hasOtherChild = next.some((r) => r.splitFromKey === parentKey);
          next = next.map((r) =>
            r.key === parentKey
              ? {
                  ...r,
                  activeTo: deleted.activeTo,
                  ...(hasOtherChild
                    ? {}
                    : { splitFromKey: undefined, employeeNoLocked: undefined }),
                }
              : r,
          );
        }
        return next;
      });
      // 追加行の表示継続対象からも外す
      setAddedRowKeys((prev) => {
        if (!prev.has(rowKey)) return prev;
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
      setDirty(true);
      message.success(
        '行と業務データ（割当・BUFFER）を削除しました（未保存）。要員マスタは変更していません。',
      );
    },
    [draftRows, savedBaseline, currentMonday, pastYear],
  );

  /** 保存（下書きを確定して親へ渡す。要員マスタは含めない） */
  const handleSave = useCallback(() => {
    // 過年度は参照のみ
    if (pastYear) {
      message.error('過年度は参照のみです。');
      return;
    }
    // 社員番号が空の行があると保存できない（マスタ未登録の行は表示できない）
    if (draftRows.some((r) => r.employeeNo === '')) {
      message.error(
        '社員番号が未入力の行があります。社員番号を入力するか、行を削除してください。',
      );
      return;
    }

    onSave({
      // 行は「社員番号・所属・有効期間」を持つ（年途中の部門異動は2行）
      rows: draftRows.map((r) => ({
        ...r,
        departmentId:
          r.departmentId ||
          employeeMaster.get(r.employeeNo)?.departmentId ||
          '',
      })),
      assignment,
      unpaid,
      // 行削除で業務データを消した要員（DB 側でも当該年度の分を削除する）
      deletedEmployeeNos,
    });
    // 保存した内容を過去実績判定の基準に反映する
    // （メモリ実装のため即時。API 接続時は保存成功後に更新する）
    setSavedBaseline({ assignment, unpaid });
    // 保存済みの削除情報はクリアする（次回の保存で再送しない）
    setDeletedEmployeeNos((prev) => (prev.length === 0 ? prev : []));
    // ※保存では追加行の表示を解除しない（次にフィルタを適用したときに解除する）
    setDirty(false);
  }, [
    draftRows,
    assignment,
    unpaid,
    deletedEmployeeNos,
    onSave,
    employeeMaster,
    pastYear,
  ]);

  /** 未保存確認ダイアログから呼べるように「保存」処理を登録する */
  useEffect(() => {
    registerSaveHandler(handleSave);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, handleSave]);

  /**
   * フィルタの「OK」を押した時点で、追加行の表示継続を解除する。
   *
   * antd の Table は「フィルタ条件が変わらない OK」では onChange を発火しない
   * （FilterDropdown の internalTriggerFilter が同一条件をスキップするため）。
   * Excel と同じく「OK = フィルタの再適用」としたいので、OK ボタンのクリックを直接検知する。
   * ※列フィルタ付きのテーブルはこの画面だけなので、document 全体で監視しても誤検知しない。
   */
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.closest('.ant-table-filter-dropdown-btns .ant-btn-primary')) {
        return;
      }
      setAddedRowKeys((prev) => (prev.size === 0 ? prev : new Set()));
    };
    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, []);

  // プロジェクトの選択肢と参照マップ（メニューの「プロジェクト管理」で増える）
  // ※セルには「略称」を表示する
  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.projectId, label: p.abbr || p.name })),
    [projects],
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.projectId, p])),
    [projects],
  );

  /** 「内・退職」プロジェクトのID（見つからない場合は undefined） */
  const leaveProjectKey = useMemo(
    () =>
      projects.find(
        (p) => p.name === LEAVE_PROJECT_NAME || p.abbr === LEAVE_PROJECT_NAME,
      )?.projectId,
    [projects],
  );

  // 所属列の列ヘッダーフィルタ項目（部門マスタ）※未絞り込み時の候補
  const deptFilterItems = useMemo(
    () =>
      departments.map((d) => ({
        text: departmentLabelOf(departments, d.departmentId),
        value: d.departmentId,
      })),
    [departments],
  );

  // 週列の列ヘッダーフィルタ項目（プロジェクト = 略称）※未絞り込み時の候補
  const projectFilterItems = useMemo(
    () => projects.map((p) => ({ text: p.abbr || p.name, value: p.projectId })),
    [projects],
  );

  // 対象年度（1月1日を含む週 〜 12月31日を含む週）の全週列
  const allWeeks: WeekCol[] = useMemo(() => buildYearWeeks(year), [year]);

  /** 所属変更（異動）ダイアログを開く */
  const openTransfer = useCallback(
    (rowKey: string) => {
      // 過年度は参照のみ
      if (pastYear) return;
      const row = draftRows.find((r) => r.key === rowKey);
      if (!row?.employeeNo) {
        message.warning('社員番号を入力してから所属変更してください。');
        return;
      }
      // 同一社員は 1 年度につき 1 回まで（すでに 2 行なら異動できない）
      if (draftRows.filter((r) => r.employeeNo === row.employeeNo).length >= 2) {
        message.error('1年度につき異動は1回までです。');
        return;
      }
      const firstWeek = row.activeFrom ?? allWeeks[0]?.key ?? '';
      // 開始週の候補 = 行の有効期間内かつ「行の初週より後」かつ「今週以降」
      const candidates = allWeeks.filter(
        (w) =>
          isWeekActive(row, w.key) &&
          w.key > firstWeek &&
          w.key >= currentMonday,
      );
      if (candidates.length === 0) {
        message.warning(
          'この行には所属変更できる週がありません（適用開始週は今週以降のみです）。',
        );
        return;
      }
      const initial =
        candidates.find((w) => w.key === currentMonday) ??
        candidates[candidates.length - 1];
      setTransferRowKey(rowKey);
      setTransferDeptId(undefined);
      setTransferWeekKey(initial.key);
    },
    [draftRows, allWeeks, currentMonday, pastYear],
  );

  /** 所属変更（異動）を確定する */
  const handleTransfer = useCallback(() => {
    if (!transferRowKey) return;
    const row = draftRows.find((r) => r.key === transferRowKey);
    if (!row) return;
    // 同一社員は 1 年度につき 1 回まで
    if (draftRows.filter((r) => r.employeeNo === row.employeeNo).length >= 2) {
      message.error('1年度につき異動は1回までです。');
      return;
    }
    if (!transferDeptId) {
      message.error('新しい所属を選択してください。');
      return;
    }
    if (!transferWeekKey) {
      message.error('適用開始週を選択してください。');
      return;
    }
    const firstWeek = row.activeFrom ?? allWeeks[0]?.key ?? '';
    if (transferWeekKey <= firstWeek) {
      message.error('適用開始週は、この行の初週より後にしてください。');
      return;
    }
    if (row.activeTo && transferWeekKey > row.activeTo) {
      message.error('適用開始週が、この行の有効期間外です。');
      return;
    }
    // 適用開始週は今週の月曜以降のみ（過去週には異動できない）
    if (transferWeekKey < currentMonday) {
      message.error('適用開始週は今週の月曜以降にしてください。');
      return;
    }
    const prevWeekKey = dayjs(transferWeekKey)
      .subtract(7, 'day')
      .format('YYYY-MM-DD');
    const newKey = nextRowKey();
    const deptName = departmentLabelOf(departments, transferDeptId);
    setDraftRows((prev) => {
      const index = prev.findIndex((r) => r.key === transferRowKey);
      if (index < 0) return prev;
      const oldRow = prev[index];
      const next = [...prev];
      // 旧所属の行は開始週の前週まで
      next[index] = {
        ...oldRow,
        activeTo: prevWeekKey,
        employeeNoLocked: true,
      };
      // 新所属の行を旧行の直後に追加（開始週から）
      next.splice(index + 1, 0, {
        key: newKey,
        employeeNo: oldRow.employeeNo,
        departmentId: transferDeptId,
        activeFrom: transferWeekKey,
        activeTo: oldRow.activeTo,
        employeeNoLocked: true,
        splitFromKey: oldRow.key,
      });
      return next;
    });
    // 要員マスタの「現在の所属」を新しい所属に更新する
    onUpdateDepartment(row.employeeNo, transferDeptId);
    setTransferRowKey(null);
    setDirty(true);
    message.success(
      `${row.employeeNo} の所属を ${deptName} に変更しました（${dayjs(
        transferWeekKey,
      ).format('YYYY/M/D')} の週から・未保存）。`,
    );
  }, [
    transferRowKey,
    transferDeptId,
    transferWeekKey,
    draftRows,
    allWeeks,
    nextRowKey,
    departments,
    onUpdateDepartment,
    currentMonday,
  ]);

  /** 所属変更ダイアログの対象行 */
  const transferRow = transferRowKey
    ? draftRows.find((r) => r.key === transferRowKey)
    : undefined;

  /** 所属変更の開始週候補 */
  const transferWeekOptions = useMemo(() => {
    if (!transferRow) return [];
    const firstWeek = transferRow.activeFrom ?? allWeeks[0]?.key ?? '';
    return allWeeks
      .filter(
        (w) =>
          isWeekActive(transferRow, w.key) &&
          w.key > firstWeek &&
          w.key >= currentMonday,
      )
      .map((w) => ({
        value: w.key,
        label: `${w.monday.format('YYYY/M/D')} 〜 ${w.sunday.format('M/D')}`,
      }));
  }, [transferRow, allWeeks, currentMonday]);

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
          !deptFilter.includes(p.departmentId)
        ) {
          return false;
        }
        const cell = assignment[p.employeeNo] ?? {};
        return activeWeekFilters.every(([key, wanted]) => {
          if (key === exceptWeekKey) return true;
          const pid = cell[key];
          return !!pid && wanted.includes(pid);
        });
      });

    /** その週に実際に割り当てがあるプロジェクトを候補にする */
    const weekOptions = (weekKey: string, rows: PersonRow[]) => {
      const used = new Set<string>();
      rows.forEach((p) => {
        const pid = assignment[p.employeeNo]?.[weekKey];
        if (pid) used.add(pid);
      });
      return projects
        .filter((p) => used.has(p.projectId))
        .map((p) => ({ text: p.abbr || p.name, value: p.projectId }));
    };

    // 所属列: 週列の条件を満たす要員に存在する部門
    // 週列:   その週に実在するプロジェクト（自分の列の条件は除く）
    const week: Record<string, { text: string; value: string }[]> = {};
    weeks.forEach((w) => {
      week[w.key] = weekOptions(w.key, rowsWithout(w.key, true));
    });

    const deptUsed = new Set(
      rowsWithout(null, false).map((p) => p.departmentId),
    );
    const dept = departments
      .filter((d) => deptUsed.has(d.departmentId))
      .map((d) => ({
        text: departmentLabelOf(departments, d.departmentId),
        value: d.departmentId,
      }));

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
   *  - 空行（社員番号未入力）と「行追加」した行は、次にフィルタを適用するまで
   *    絞り込みの対象外（Excel のオートフィルタと同じ）
   *  ※Excel のオートフィルタと同じく、列ごとの条件は AND で結合する（1 列内は OR）
   */
  const visiblePersonnel = useMemo(() => {
    /** フィルタ条件に関係なく表示する行か（空行 / この画面で行追加した行） */
    const isAlwaysVisible = (p: PersonRow) =>
      p.employeeNo === '' || addedRowKeys.has(p.key);

    const rows =
      deptFilter.length === 0
        ? draftPersonnel
        : draftPersonnel.filter(
            (p) =>
              isAlwaysVisible(p) || deptFilter.includes(p.departmentId),
          );

    // プロジェクトが選択されている週列（表示中の週のみを対象にする）
    const activeWeeks = weeks.filter(
      (w) => (weekProjectFilter[w.key]?.length ?? 0) > 0,
    );
    if (activeWeeks.length === 0) return rows;

    return rows.filter((p) => {
      if (isAlwaysVisible(p)) return true;
      const cell = assignment[p.employeeNo] ?? {};
      // すべての週列の条件を満たす行だけを表示する（AND）
      return activeWeeks.every((w) => {
        // その週が行の有効期間外なら、その行は条件を満たさない
        if (!isWeekActive(p, w.key)) return false;
        const wanted = weekProjectFilter[w.key] ?? [];
        const pid = cell[w.key];
        return !!pid && wanted.includes(pid);
      });
    });
  }, [
    deptFilter,
    draftPersonnel,
    weeks,
    weekProjectFilter,
    assignment,
    addedRowKeys,
  ]);

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
    if (!personId) return;
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
      if (!personId) return;
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
    (personId: string, weekKey: string) =>
      !!personId && !!unpaid[personId]?.[weekKey],
    [unpaid],
  );

  /** 1セル（要員×週）の割当を更新（クリア時は削除）
   *  ※プロジェクトを変更したため「無償支援」は自動解除する */
  const setAssignmentAt = useCallback(
    (personId: string, weekKey: string, projectId: string | null) => {
      if (!personId) return;
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
      if (!personId) return;
      // 過去週は変更できない（念のためのガード）
      if (isPastWeek(weekKey, currentMonday)) {
        message.warning('過去の週は変更できません。');
        return;
      }
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
    [leaveProjectKey, setAssignmentAt, weeks, clearUnpaidAt, currentMonday],
  );

  /** 「内・退職」が設定されている行（該当行をグレー表示する） */
  const leaveRowKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!leaveProjectKey) return keys;
    draftPersonnel.forEach((p) => {
      const cells = assignment[p.employeeNo];
      if (
        cells &&
        weeks.some(
          (w) => isWeekActive(p, w.key) && cells[w.key] === leaveProjectKey,
        )
      ) {
        keys.add(p.key);
      }
    });
    return keys;
  }, [assignment, weeks, draftPersonnel, leaveProjectKey]);

  /** 週ごとの割当人数（表示中要員のみ） */
  const weeklyAssignedCounts: number[] = useMemo(
    () =>
      weeks.map((w) =>
        visiblePersonnel.reduce(
          (c, p) =>
            c +
            (isWeekActive(p, w.key) && assignment[p.employeeNo]?.[w.key]
              ? 1
              : 0),
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
      ...projects.map((p) => ({ value: p.projectId, label: p.abbr || p.name })),
      { value: CLEAR_VALUE, label: '（未割当）クリア' },
    ],
    [projects],
  );

  /** 行キー → 表示順 / 週キー → 列順（Shift+クリック矩形選択用） */
  const rowIndexByKey = useMemo(
    () => new Map(visiblePersonnel.map((p, i) => [p.key, i])),
    [visiblePersonnel],
  );
  // 行キー → 社員番号（選択セルの割当更新用）
  const employeeNoByRowKey = useMemo(
    () => new Map(draftPersonnel.map((p) => [p.key, p.employeeNo])),
    [draftPersonnel],
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
      const r0 = rowIndexByKey.get(a.rowKey);
      const c0 = weekIndexByKey.get(a.weekKey);
      const r1 = rowIndexByKey.get(b.rowKey);
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
        const row = visiblePersonnel[r];
        if (!row.employeeNo) continue;
        for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c += 1) {
          const weekKey = weeks[c].key;
          // 行の有効期間外・過去週のセルは選択しない
          if (!isWeekActive(row, weekKey)) continue;
          if (isPastWeek(weekKey, currentMonday)) continue;
          next.add(cellKey(row.key, weekKey));
        }
      }
      return next;
    },
    [rowIndexByKey, weekIndexByKey, visiblePersonnel, weeks, currentMonday],
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
    (rowKey: string, weekKey: string, shift: boolean) => {
      // 過去週は選択・編集できない
      if (isPastWeek(weekKey, currentMonday)) return;
      const key = cellKey(rowKey, weekKey);
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
    [anchorCell, buildRange, currentMonday],
  );

  /** ドラッグ中に別セルへ入ったら 起点→現在セル の矩形へ選択を更新 */
  const handleCellDragEnter = useCallback(
    (rowKey: string, weekKey: string) => {
      // 過去週は選択・編集できない
      if (isPastWeek(weekKey, currentMonday)) return;
      const startKey = dragStartRef.current;
      if (!startKey) return;
      dragMovedRef.current = true;
      const rect = buildRange(startKey, cellKey(rowKey, weekKey));
      if (rect) setSelectedCells(rect);
    },
    [buildRange, currentMonday],
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

  /** 週が変わって過去になったセルは選択から外す */
  useEffect(() => {
    setSelectedCells((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      let changed = false;
      prev.forEach((key) => {
        const { weekKey } = parseCellKey(key);
        if (isPastWeek(weekKey, currentMonday)) changed = true;
        else next.add(key);
      });
      return changed ? next : prev;
    });
  }, [currentMonday]);

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
          const { rowKey, weekKey } = parseCellKey(key);
          // 過去週は変更しない
          if (isPastWeek(weekKey, currentMonday)) return;
          const employeeNo = employeeNoByRowKey.get(rowKey);
          if (!employeeNo) return;
          const cell = { ...(next[employeeNo] ?? {}) };
          if (projectId === null) delete cell[weekKey];
          else cell[weekKey] = projectId;
          next[employeeNo] = cell;
        });
        return next;
      });
      selectedCells.forEach((key) => {
        const { rowKey, weekKey } = parseCellKey(key);
        // 過去週は変更しない
        if (isPastWeek(weekKey, currentMonday)) return;
        const employeeNo = employeeNoByRowKey.get(rowKey);
        if (employeeNo) clearUnpaidAt(employeeNo, weekKey);
      });
      setDirty(true);
    },
    [selectedCells, clearUnpaidAt, employeeNoByRowKey, currentMonday],
  );

  /** 選択セル（割当済みのみ）の「無償支援」を一括設定/解除する */
  const applyUnpaidToSelected = useCallback(
    (on: boolean) => {
      if (selectedCells.size === 0) return;
      setUnpaid((prev) => {
        const next = { ...prev };
        selectedCells.forEach((key) => {
          const { rowKey, weekKey } = parseCellKey(key);
          // 過去週は変更しない
          if (isPastWeek(weekKey, currentMonday)) return;
          const employeeNo = employeeNoByRowKey.get(rowKey);
          if (!employeeNo) return;
          const cell = { ...(next[employeeNo] ?? {}) };
          // 未割当のセルは対象外（割当があるセルのみ無償支援にできる）
          if (on && assignment[employeeNo]?.[weekKey]) cell[weekKey] = true;
          else delete cell[weekKey];
          next[employeeNo] = cell;
        });
        return next;
      });
      setDirty(true);
    },
    [selectedCells, assignment, employeeNoByRowKey, currentMonday],
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
      const { rowKey, weekKey } = parseCellKey(key);
      const employeeNo = employeeNoByRowKey.get(rowKey);
      if (!employeeNo) return;
      const v = assignment[employeeNo]?.[weekKey];
      if (v) {
        value = v;
        unpaidFlag = isUnpaidAt(employeeNo, weekKey);
      }
    });
    setClipboard(value);
    setPasteUnpaid(unpaidFlag);
    const label = value
      ? projectMap.get(value)?.abbr ?? value
      : '未割当（クリア）';
    message.info(`コピーしました: ${label}${unpaidFlag ? '（BUFFER）' : ''}`);
  }, [
    selectedCells,
    assignment,
    projectMap,
    isUnpaidAt,
    employeeNoByRowKey,
  ]);

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
      const { rowKey, weekKey } = parseCellKey(key);
      const employeeNo = employeeNoByRowKey.get(rowKey);
      if (employeeNo && assignment[employeeNo]?.[weekKey]) n += 1;
    });
    return n;
  }, [selectedCells, assignment, employeeNoByRowKey]);

  // ---- セルの右クリックメニュー（無償支援の設定/解除・コピー・クリア） ----
  /** セルの右クリックメニューを開く */
  const openCellMenu = useCallback(
    (personId: string, weekKey: string, e: React.MouseEvent) => {
      e.preventDefault();
      // 過去週は「コピー」だけのメニューを開く（項目は cellMenuItems 側で制御）
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

  /** 右クリックメニューの項目（過去週は「コピー」のみ） */
  const cellMenuItems = useMemo(() => {
    const personId = cellMenu?.personId ?? '';
    const weekKey = cellMenu?.weekKey ?? '';
    const hasProject = !!assignment[personId]?.[weekKey];
    const unpaidCell = isUnpaidAt(personId, weekKey);
    const copyItem = {
      key: 'copy',
      label: 'コピー',
      icon: <CopyOutlined />,
      disabled: !hasProject,
    };
    // 過去週はコピー（読み取り）だけを許可する
    if (isPastWeek(weekKey, currentMonday)) {
      return [copyItem];
    }
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
      copyItem,
      {
        key: 'clear',
        label: '未割当にする',
        icon: <DeleteOutlined />,
        disabled: !hasProject,
      },
    ];
  }, [cellMenu, assignment, isUnpaidAt, currentMonday]);

  /** 右クリックメニューの実行 */
  const handleCellMenuClick = useCallback(
    ({ key }: { key: string }) => {
      if (!cellMenu) return;
      const { personId, weekKey } = cellMenu;
      // 過去週はコピーのみ（古いメニューが残っていても編集系は実行しない）
      if (isPastWeek(weekKey, currentMonday) && key !== 'copy') {
        setCellMenu(null);
        return;
      }
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
    [
      cellMenu,
      assignment,
      isUnpaidAt,
      projectMap,
      setUnpaidAt,
      setAssignmentAt,
      currentMonday,
    ],
  );

  /** 過去実績がある社員（社員番号）。社員番号欄の編集可否に使う */
  const employeesWithPastActuals = useMemo(() => {
    const set = new Set<string>();
    draftRows.forEach((row) => {
      if (!row.employeeNo || set.has(row.employeeNo)) return;
      if (
        hasPastActualsForEmployee(
          draftRows,
          row.employeeNo,
          savedBaseline,
          currentMonday,
        )
      ) {
        set.add(row.employeeNo);
      }
    });
    return set;
  }, [draftRows, savedBaseline, currentMonday]);

  /** 社員ごとの表示行数（行削除のメッセージ用） */
  const rowCountByEmployee = useMemo(() => {
    const counts = new Map<string, number>();
    draftRows.forEach((r) => {
      if (!r.employeeNo) return;
      counts.set(r.employeeNo, (counts.get(r.employeeNo) ?? 0) + 1);
    });
    return counts;
  }, [draftRows]);

  /** テーブル列定義（要員 + 月グループ配下の週列 + 集計列） */
  const columns: TableColumnsType<Row> = useMemo(() => {
    const cols: TableColumnsType<Row> = [
      {
        title: '番号',
        key: 'no',
        fixed: 'left',
        width: 60,
        align: 'center',
        render: (_, row) => row.no,
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
          // 入力中は再描画しないよう uncontrolled にし、フォーカスアウト / Enter で確定する
          // （グリッド全体の再描画でタイプが重くなるのを避けるため）
          // 備考は要員マスタの項目のため、確定時に即時保存する
          // 社員番号が未入力の行は編集できない
          return (
            <Input
              key={`${row.key}:${row.employeeNo}`}
              size='small'
              defaultValue={row.leavePlan ?? ''}
              maxLength={30}
              disabled={pastYear || !row.employeeNo}
              placeholder={`例：${year}/10/31`}
              onBlur={(e) => commitLeavePlan(row.key, e.target.value)}
              onPressEnter={(e) =>
                commitLeavePlan(row.key, e.currentTarget.value)
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
          // 過年度・過去実績がある社員は社員番号を変更できない（読み取り専用）
          if (
            pastYear ||
            (row.employeeNo && employeesWithPastActuals.has(row.employeeNo))
          ) {
            return (
              <Tooltip
                title={
                  pastYear
                    ? '過年度は参照のみです'
                    : '過去実績があるため社員番号を変更できません'
                }
              >
                <span className='ws-employee-no-locked'>{row.employeeNo}</span>
              </Tooltip>
            );
          }
          // 入力確定（フォーカスアウト / Enter）で社員マスタから 役割・名前・所属 を自動取得する。
          // 重複などで処理中止の場合は入力値を元の値に戻す
          return (
            <EmployeeNoInput
              value={row.employeeNo}
              onCommit={(next) => commitEmployeeNo(row.key, next)}
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
        render: (v: string) => v || '－',
      },
      {
        // 所属＝該当社員の所属（部門マスタの部門名）。社員番号の入力で自動セットされる（表示のみ）
        // 列ヘッダーのフィルタで部門を自由に選択できる
        // （候補は他の列の絞り込み結果に追随する = Excel のオートフィルタと同じ）
        title: '所属',
        dataIndex: 'departmentId',
        key: 'departmentId',
        fixed: 'left',
        width: 90,
        filters: filterOptions.dept,
        filterMultiple: true,
        filteredValue: deptFilter.length > 0 ? deptFilter : null,
        // 行の絞り込みは visiblePersonnel 側で行うため、ここでは全行を表示する
        onFilter: () => true,
        render: (v: string) =>
          v ? departmentLabelOf(departments, v) : '－',
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
            // 社員番号が未入力の行には割当できない
            if (!row.employeeNo) {
              return (
                <span className='ws-week-cell' title='社員番号を入力してください'>
                  －
                </span>
              );
            }
            // 所属変更（異動）の有効期間外の週は編集できない（空欄）
            if (!isWeekActive(row, w.key)) {
              return (
                <span
                  className='ws-week-cell ws-week-cell-inactive'
                  title='所属変更（異動）の前後の期間のため入力できません'
                />
              );
            }
            // 過去週（今週の月曜より前）は読み取り専用
            // （略称を表示し、クリック・選択・プルダウン・BUFFER 切替・貼り付けは不可）
            if (isPastWeek(w.key, currentMonday)) {
              const pid = assignment[row.employeeNo]?.[w.key];
              const prj = pid ? projectMap.get(pid) : undefined;
              const unpaidCell = isUnpaidAt(row.employeeNo, w.key);
              const label = prj ? prj.abbr || prj.name : pid || '－';
              return (
                <div
                  className='ws-week-cell ws-week-cell-past'
                  title={`${label}（過去の週は変更できません）`}
                  onContextMenu={(e) => openCellMenu(row.employeeNo, w.key, e)}
                >
                  <span className='cell-chip-text'>{label}</span>
                  {unpaidCell ? (
                    <span className='ws-unpaid-badge ws-unpaid-badge-corner'>
                      BUFFER
                    </span>
                  ) : null}
                </div>
              );
            }
            // 複数セル選択モード: クリックで選択 / Shift+クリックで矩形選択
            if (selectMode) {
              const pid = assignment[row.employeeNo]?.[w.key];
              const prj = pid ? projectMap.get(pid) : undefined;
              const sel = selectedCells.has(cellKey(row.key, w.key));
              const unpaidCell = isUnpaidAt(row.employeeNo, w.key);
              return (
                <div
                  className={`ws-week-cell${
                    unpaidCell ? ' ws-week-cell-unpaid' : ''
                  }`}
                  onContextMenu={(e) =>
                    openCellMenu(row.employeeNo, w.key, e)
                  }
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
                      handleCellMouseDown(row.key, w.key, e.shiftKey);
                    }}
                    onMouseEnter={() => handleCellDragEnter(row.key, w.key)}
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
            const val = assignment[row.employeeNo]?.[w.key];
            return (
              <WeekCell
                personId={row.employeeNo}
                weekKey={w.key}
                value={val ?? undefined}
                isUnpaid={isUnpaidAt(row.employeeNo, w.key)}
                options={projectOptions}
                onChangeProject={handleChangeCellProject}
                onOpenMenu={openCellMenu}
              />
            );
          },
        })),
      });
    });

    // 右端固定: 行削除と所属変更（異動）
    cols.push({
      title: '操作',
      key: 'rowAction',
      fixed: 'right',
      width: 150,
      align: 'center',
      render: (_, row) => {
        // 過年度は参照のみ。過去実績（保存済みデータ）がある行は削除できない
        const deleteBlocked =
          pastYear ||
          (!!row.employeeNo &&
            hasPastActualsForRow(row, savedBaseline, currentMonday));
        const transferBlockedByCount =
          !!row.employeeNo &&
          (rowCountByEmployee.get(row.employeeNo) ?? 0) >= 2;
        const hasRemainingRows =
          !!row.employeeNo &&
          (rowCountByEmployee.get(row.employeeNo) ?? 0) > 1;
        const description = !row.employeeNo
          ? 'この行を削除します。'
          : hasRemainingRows
          ? 'この行と、この行の期間の業務データ（割当・BUFFER）を削除します。要員マスタは削除されません。残りの行は期間が自動で延長されます。'
          : 'この行と、当年度の業務データ（割当・BUFFER）をすべて削除します。要員マスタは削除されません。';
        return (
          <Space size={0}>
            {deleteBlocked ? (
              <Tooltip
                title={
                  pastYear
                    ? '過年度は参照のみです'
                    : '過去実績があるため削除できません'
                }
              >
                <span className='ws-disabled-action'>
                  <Button
                    type='text'
                    danger
                    size='small'
                    icon={<DeleteOutlined />}
                    disabled
                  >
                    削除
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Popconfirm
                title='行削除の確認'
                description={description}
                okText='削除'
                cancelText='キャンセル'
                okButtonProps={{ danger: true }}
                onConfirm={() => handleDeleteRow(row.key)}
              >
                <Button
                  type='text'
                  danger
                  size='small'
                  icon={<DeleteOutlined />}
                >
                  削除
                </Button>
              </Popconfirm>
            )}
            {pastYear || transferBlockedByCount ? (
              <Tooltip
                title={
                  pastYear
                    ? '過年度は参照のみです'
                    : '1年度につき異動は1回までです'
                }
              >
                <span className='ws-disabled-action'>
                  <Button
                    type='text'
                    size='small'
                    icon={<SwapOutlined />}
                    disabled
                  >
                    異動
                  </Button>
                </span>
              </Tooltip>
            ) : (
              <Button
                type='text'
                size='small'
                icon={<SwapOutlined />}
                disabled={!row.employeeNo}
                title='所属変更（異動）'
                onClick={() => openTransfer(row.key)}
              >
                異動
              </Button>
            )}
          </Space>
        );
      },
    });

    return cols;
  }, [
    monthGroups,
    year,
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
    openTransfer,
    departments,
    currentMonday,
    savedBaseline,
    rowCountByEmployee,
    employeesWithPastActuals,
    pastYear,
  ]);

  /** テーブルデータ（表示中の要員） */
  const tableRows: Row[] = useMemo(
    () =>
      visiblePersonnel.map((p, i) => ({
        key: p.key,
        no: i + 1,
        leavePlan: p.leavePlan,
        role: p.role,
        employeeNo: p.employeeNo,
        name: p.name,
        departmentId: p.departmentId,
        departmentName: departmentLabelOf(departments, p.departmentId),
        activeFrom: p.activeFrom,
        activeTo: p.activeTo,
        employeeNoLocked: p.employeeNoLocked,
      })),
    [visiblePersonnel, departments],
  );

  // 固定列（fixed left/right）利用時は scroll.y を指定する必要がある。
  // 行数が少ないとヘッダー/本体の幅計測が振動して「チラつき」を起こすため、
  // 本体の縦スクロール高さを行数に応じた固定値にする（少ない行は余白を最小化）。
  const tableScrollY = Math.min(
    620,
    Math.max(120, (tableRows.length + 1) * 40),
  );

  /**
   * 行追加後: 追加した行（表の最下部）が見えるように縦スクロールする。
   * ※レイアウト確定後にスクロールするためフレームを 2 回待つ
   */
  useEffect(() => {
    if (!scrollToBottomRef.current) return;
    scrollToBottomRef.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const body = tableWrapRef.current?.querySelector('.ant-table-body');
        if (!(body instanceof HTMLElement)) return;
        body.scrollTop = body.scrollHeight;
      });
    });
  }, [tableRows]);

  /** 表示期間ラベル（From/To 指定時は括り込み先の週で表示） */
  const rangeLabel = weeks.length
    ? `${weeks[0].monday.format('YYYY/M/D')} 〜 ${weeks[
        weeks.length - 1
      ].monday.format('YYYY/M/D')}`
    : '（該当する週なし）';
  // 空行（社員番号未入力）は「要員」に数えない（異動で2行になっても行数で数える）
  const visiblePersonCount = visiblePersonnel.filter(
    (p) => p.employeeNo !== '',
  ).length;
  const summaryLabel = `表示範囲：${rangeLabel}（${weeks.length} / ${allWeeks.length} 週） ・ 要員表示 ${visiblePersonCount} 名 ・ 割当延べ ${rangeTotalAssignments} 人週`;

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
    // 追加行の表示継続も解除する（次にフィルタを適用したときに判定される）
    setAddedRowKeys((prev) => (prev.size === 0 ? prev : new Set()));
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
          {pastYear && <Tag color='default'>過年度は参照のみ</Tag>}
          <Button
            icon={<PlusOutlined />}
            onClick={handleAddRow}
            disabled={pastYear}
          >
            行追加
          </Button>
          <Button
            type={selectMode ? 'primary' : 'default'}
            icon={<SelectOutlined />}
            onClick={() => toggleSelectMode(!selectMode)}
            disabled={pastYear}
          >
            {selectMode ? '複数選択解除' : '複数選択'}
          </Button>
          {dirty && <Tag color='orange'>未保存の変更あり</Tag>}
          <Button
            type={dirty ? 'primary' : 'default'}
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!dirty || pastYear}
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
          「行追加」した行は、次に列フィルタを適用するまで絞り込みの対象外として表示されます。
          過去の週（今週の月曜より前）は読み取り専用です。
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
          rowKey={(r) => r.key}
          columns={columns}
          dataSource={tableRows}
          size='small'
          pagination={false}
          rowClassName={(r) => {
            if (r.employeeNo === '') return 'row-draft';
            return leaveRowKeys.has(r.key) ? 'row-leave-planned' : '';
          }}
          // 列ヘッダーフィルタ → 所属列（部署）・週列（プロジェクト）へ反映する
          onChange={(_pagination, filters) => {
            // フィルタを再適用（OK / Reset）した時点で、追加行の表示継続を解除する
            // （条件が同じでも再適用とみなす = Excel のオートフィルタと同じ）
            setAddedRowKeys((prev) => (prev.size === 0 ? prev : new Set()));
            // 所属列（部署）→ 検索条件
            const rawDept = filters.departmentId;
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
            // + 週列 + 右固定（操作 150）
            x: FIXED_LEFT_WIDTH + weeks.length * WEEK_COL_WIDTH + 150,
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
        <br />
        <Text type='secondary'>
          ※年途中で所属が変わる場合は、行の「異動」から新しい所属と適用開始週を指定してください。旧所属と新所属の2行に分かれ、期間外の週は入力できません。
        </Text>
      </div>

      {/* 所属変更（異動）ダイアログ */}
      <Modal
        open={!!transferRowKey}
        title='所属変更（異動）'
        okText='変更する'
        cancelText='キャンセル'
        onOk={handleTransfer}
        onCancel={() => setTransferRowKey(null)}
      >
        {transferRow && (
          <div className='ws-transfer-form'>
            <div className='ws-transfer-row'>
              <span className='ws-transfer-label'>対象</span>
              <span>
                {transferRow.employeeNo}{' '}
                {employeeMaster.get(transferRow.employeeNo)?.name ?? ''}
                （現在：
                {departmentLabelOf(departments, transferRow.departmentId)}）
              </span>
            </div>
            <div className='ws-transfer-row'>
              <span className='ws-transfer-label'>新しい所属</span>
              <Select
                value={transferDeptId}
                onChange={setTransferDeptId}
                placeholder='新しい所属を選択'
                style={{ width: 220 }}
                options={departments
                  .filter((d) => d.departmentId !== transferRow.departmentId)
                  .map((d) => ({
                    value: d.departmentId,
                    label: departmentLabelOf(departments, d.departmentId),
                  }))}
              />
            </div>
            <div className='ws-transfer-row'>
              <span className='ws-transfer-label'>適用開始週</span>
              <Select
                value={transferWeekKey}
                onChange={setTransferWeekKey}
                style={{ width: 220 }}
                options={transferWeekOptions}
              />
            </div>
            <div className='ws-transfer-note'>
              ※適用開始週の前週までを旧所属、開始週からを新所属の行に分けます。
              期間外の週は空欄（編集不可）になります。
              異動週以降の既存の割当は、そのまま新所属の行に引き継がれます。
            </div>
          </div>
        )}
      </Modal>

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
