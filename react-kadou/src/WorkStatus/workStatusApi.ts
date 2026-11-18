/**
 * 要員稼動管理 画面のバックエンド API 呼び出し
 *
 * 対象 API: GET /api/kadou/workStatus/{year}
 * バックエンドは「1 社員 × 1 週 = 1 レコード」で返すため、
 * 画面用に「1 社員 × 所属期間 = 1 行」＋ 週ごとの割当／BUFFER へ変換する。
 */
import axios from 'axios';
import { AssignmentMap, WorkStatusRow } from './types';
import type { UnpaidMap, WorkStatusData } from '../data/yearStore';
import { buildYearWeeks } from '../data/yearWeeks';

/**
 * API クライアント。
 * 開発時はバックエンド（FastAPI）の既定アドレスへ直接アクセスする。
 * 別オリジン / 別ポートに送る場合は REACT_APP_API_BASE_URL で上書きする。
 */
const api = axios.create({
  baseURL: (
    process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000'
  ).replace(/\/+$/, ''),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/** 未配分（未アサイン）を表す予約プロジェクトコード（バックエンドと共通） */
export const UNASSIGN_PROJECT_ID = 'UNASSIGN';

/** 稼働状況取得 API のレスポンス 1 件（バックエンドの WorkStatusOut に対応） */
export interface WorkStatusRecord {
  /** 社員番号 */
  employeeNo: string;
  /** 氏名（要員マスタから解決済み。未登録は null） */
  personName: string | null;
  /** 所属部門ID */
  departmentId: string;
  /** 所属部門名（部門マスタから解決済み。未登録は null） */
  departmentName: string | null;
  /** システム項目ID（'UNASSIGN' = 未配分） */
  sysProjectId: string;
  /** 項目名（未登録は null） */
  projectName: string | null;
  /** 開始週（月曜 'YYYYMMDD'） */
  weekStartDate: string;
  /** 終了週（日曜 'YYYYMMDD'） */
  weekEndDate: string;
  /** 無償支援（'1' = あり） */
  isUnpaid: string | null;
  /** バージョン番号 */
  version: number | null;
}

/** その年度の稼働状況（週単位）を取得する */
export const fetchWorkStatus = async (
  year: number,
): Promise<WorkStatusRecord[]> => {
  const { data } = await api.get(
    `/api/kadou/workStatus/${encodeURIComponent(String(year))}`,
  );
  return Array.isArray(data) ? (data as WorkStatusRecord[]) : [];
};

/** 'YYYYMMDD' → 画面の週キー 'YYYY-MM-DD'（月曜） */
const toWeekKey = (yyyymmdd: string): string =>
  yyyymmdd.length === 8
    ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
    : yyyymmdd;

/**
 * 週単位のレコードを画面用データへ変換する。
 *
 * - 行（rows）: 同一社員の連続する同じ所属の週を 1 行にまとめる。
 *   年度初めから続く行は activeFrom を、年度末まで続く行は activeTo を省略する
 *   （画面側は未指定 = 年度初め／年度末として扱う）。
 * - 割当（assignment）: 週キー → システム項目ID。'UNASSIGN' は未割当として空ける。
 * - BUFFER（unpaid）: isUnpaid = '1' の週だけ true。
 *
 * 表示する行は DB に保存されている週次データだけから作る
 * （DB が空なら画面も空。要員マスタからの行の自動生成は行わない）。
 * 新規に割当を入力する場合は、画面の「行追加」で社員番号を入力する。
 */
export const toWorkStatusData = (
  year: number,
  records: WorkStatusRecord[],
): WorkStatusData => {
  const weekKeys = buildYearWeeks(year).map((week) => week.key);
  const firstWeekKey = weekKeys[0] ?? '';
  const lastWeekKey = weekKeys[weekKeys.length - 1] ?? '';

  // 社員番号 → 週キー昇順のレコード
  const recordsByEmployee = new Map<string, WorkStatusRecord[]>();
  records.forEach((record) => {
    const list = recordsByEmployee.get(record.employeeNo);
    if (list) {
      list.push(record);
    } else {
      recordsByEmployee.set(record.employeeNo, [record]);
    }
  });
  recordsByEmployee.forEach((list) => {
    list.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
  });

  const rows: WorkStatusRow[] = [];
  const assignment: AssignmentMap = {};
  const unpaid: UnpaidMap = {};

  recordsByEmployee.forEach((weekly, employeeNo) => {
    assignment[employeeNo] = {};
    unpaid[employeeNo] = {};

    // 連続する同じ所属の週を 1 行にまとめる
    let segmentStart = toWeekKey(weekly[0].weekStartDate);
    let segmentDepartment = weekly[0].departmentId;
    let segmentEnd = segmentStart;

    const pushSegment = (start: string, end: string, departmentId: string) => {
      rows.push({
        key: `r-${rows.length + 1}`,
        employeeNo,
        departmentId,
        activeFrom: start === firstWeekKey ? undefined : start,
        activeTo: end === lastWeekKey ? undefined : end,
      });
    };

    weekly.forEach((record, index) => {
      const weekKey = toWeekKey(record.weekStartDate);

      // 割当・BUFFER（未配分は割当なし）
      if (record.sysProjectId !== UNASSIGN_PROJECT_ID) {
        assignment[employeeNo][weekKey] = record.sysProjectId;
      }
      if (record.isUnpaid === '1' && record.sysProjectId !== UNASSIGN_PROJECT_ID) {
        unpaid[employeeNo][weekKey] = true;
      }

      if (index === 0) return;
      if (record.departmentId === segmentDepartment) {
        segmentEnd = weekKey;
        return;
      }
      // 所属が変わった週で行を分割する（前の行の activeTo = 前週）
      pushSegment(segmentStart, segmentEnd, segmentDepartment);
      segmentStart = weekKey;
      segmentEnd = weekKey;
      segmentDepartment = record.departmentId;
    });
    pushSegment(segmentStart, segmentEnd, segmentDepartment);
  });

  return { rows, assignment, unpaid };
};
