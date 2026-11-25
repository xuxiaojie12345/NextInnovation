/**
 * 画面共通の選択リスト定数と、その表示名ヘルパーを集約する。
 *
 * 各画面で定義していた options / label helper をここへ集約し、
 * 「値」はデータ、それ以外の選択肢情報はここで一元管理する。
 * ※派生値（YEAR_OPTIONS 等）や列名別名マップ（HEADER_ALIASES 等）は対象外。
 */
import { HolidayImportRow, HolidayKind } from '../Holiday/HolidaySettingMode';
import type { DepartmentKind, DepartmentLocation } from '../WorkStatus/types';
import type { UserRole } from '../types/user';
import dayjs from 'dayjs';


// ---------------------------------------------------------------------------
// 部門種別（部門 / 協力会社）
// ---------------------------------------------------------------------------
/** 部門管理の「種別」選択肢。値 = DepartmentKind */
export const DEPT_KIND_OPTIONS: { value: DepartmentKind; label: string }[] = [
  { value: 'dept', label: '部門' },
  { value: 'partner', label: '協力会社' },
];

/** 部門種別の表示名（未設定 = 部門扱い） */
export const kindLabelOf = (kind?: DepartmentKind): string =>
  kind === 'partner' ? '協力会社' : '部門';

// ---------------------------------------------------------------------------
// 拠点（固定 2 択）
// ---------------------------------------------------------------------------
/** 部門管理の「拠点」選択肢。値 = DepartmentLocation */
export const LOCATION_OPTIONS: {
  value: DepartmentLocation;
  label: string;
}[] = [
  { value: 'TJ', label: '天津' },
  { value: 'JN', label: '済南' },
];

/**
 * 外部ファイル・画面入力の「拠点」表記を DepartmentLocation（'JN' / 'TJ'）へ正規化する。
 *
 * 取込ファイルの N 列【労働関係所属地】は「済南」「天津」のような日本語表記だが、
 * 部門マスタの location は「JN」「TJ」の英字 2 文字で保持している。
 * そのため両者を比較する前に、どちらの表記でも同じ値になるよう変換する。
 *
 * 対応表記（全角/半角・大文字/小文字・前後空白は吸収）：
 *   済南 / 济南 / 濟南 / JN / Jinan          → 'JN'
 *   天津 / TJ / Tianjin                     → 'TJ'
 * 上記以外は undefined（照合しない）。
 */
export const normalizeLocation = (
  value: string | undefined | null,
): DepartmentLocation | undefined => {
  // 前後空白（全角スペース含む）を除去し、大文字化して比較する
  const key = (value ?? '').replace(/\u3000/g, ' ').trim().toUpperCase();
  if (!key) return undefined;
  switch (key) {
    case 'JN':
    case '済南':
    case '济南': // 簡体字（中国語 Excel で入力される場合がある）
    case '濟南': // 旧字体
    case 'JINAN':
      return 'JN';
    case 'TJ':
    case '天津':
    case 'TIANJIN':
      return 'TJ';
    default:
      return undefined;
  }
};

/** 拠点コード（'JN' / 'TJ'）から画面表示用の日本語名を返す */
export const locationLabelOf = (location: string | undefined): string =>
  location === 'TJ' ? '天津' : location === 'JN' ? '済南' : (location ?? '');

// ---------------------------------------------------------------------------
// 職級（ロール）
// ---------------------------------------------------------------------------
/** ユーザー管理の「職級」選択肢。値 = UserRole */
export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'bucho', label: '部長' },
  { value: 'jigyo-bucho', label: '事業部長' },
  { value: 'admin', label: '管理者' },
];

/** 職級（ロール）の表示名 */
export const roleLabelOf = (role: UserRole): string =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;

/**
 * 役職区分（jn_user_table）→ ロール・表示名の変換。
 * 個別のロール判定（部長／事業部長／管理者）はこのマップで行う。
 * ※jn_user_table の区分値：部長=0 / 管理者=1 / 事業部長=2 に合わせる。
 */
export const YAKUSHOKU_ROLE_MAP: Record<
  string,
  { role: UserRole; roleLabel: string }
> = {
  '0': { role: 'bucho', roleLabel: '部長' },
  '1': { role: 'admin', roleLabel: '管理者' },
  '2': { role: 'jigyo-bucho', roleLabel: '事業部長' },
};

/** 役職区分が未知の場合の回退ロール */
export const DEFAULT_ROLE = { role: 'bucho', roleLabel: '部長' };

/**
 * ロール（UserRole）→ 役職区分コード（jn_user_table.yakushoku_kubun）の変換。
 * YAKUSHOKU_ROLE_MAP の逆変換で、ユーザー管理画面のリクエスト送信時に使う。
 */
export const ROLE_TO_KUBUN: Record<UserRole, string> = {
  bucho: '0',
  admin: '1',
  'jigyo-bucho': '2',
};

/**
 * 画面＿休日設置
 */

// 休日の区分一覧
export const HOLIDAY_KINDS: HolidayKind[] = ['祝日', '会社休日', '振替休日'];
// 休日の区分一覧Count利用
export const HOLIDAY_KINDS_COUNT: HolidayKind[] = ['祝日', '会社休日', '振替休日','未指定'];

// 休日設定の「区分」選択肢（空は選べないため、未分類は「未指定」を選ぶ）
export const HOLIDAY_KIND_OPTIONS: { value: HolidayKind; label: string }[] =
  HOLIDAY_KINDS_COUNT.map((k) => ({ value: k, label: k }));

// 休日区分ごとの表示色
export const KIND_COLOR: Record<HolidayKind, string> = {
  祝日: 'red',
  会社休日: 'blue',
  振替休日: 'orange',
  未指定: 'default',
};

// 日付の表示形式
export const formatDate = (date: string) => dayjs(date).format('YYYY/MM/DD (ddd)');

// CSV 出力用に値をエスケープする
export const csvEscape = (v: string): string =>/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

/** ファイル選択ダイアログで許可する拡張子 */
export const HOLIDAY_IMPORT_ACCEPT =
  '.xlsx,.xlsm,.xls,.csv,text/csv,' +
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
  'application/vnd.ms-excel';

/** 見出し（列名）の候補。表記ゆれを吸収して判定する */
export const HEADER_ALIASES: Record<keyof HolidayImportRow, string[]> = {
  date: ['日付', '休日', '休日付', 'date'],
};