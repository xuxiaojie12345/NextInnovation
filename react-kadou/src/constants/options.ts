/**
 * 画面共通の選択リスト定数と、その表示名ヘルパーを集約する。
 *
 * 各画面で定義していた options / label helper をここへ集約し、
 * 「値」はデータ、それ以外の選択肢情報はここで一元管理する。
 * ※派生値（YEAR_OPTIONS 等）や列名別名マップ（HEADER_ALIASES 等）は対象外。
 */
import type { DepartmentKind, DepartmentLocation } from '../WorkStatus/types';
import type { UserRole } from '../types/user';
import type { HolidayKind } from '../data/yearStore';

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

// ---------------------------------------------------------------------------
// 休日区分
// ---------------------------------------------------------------------------
/** 休日の区分一覧 */
export const HOLIDAY_KINDS: HolidayKind[] = ['祝日', '会社休日', '振替休日'];

export const HOLIDAY_KINDS_COUNT: HolidayKind[] = ['祝日', '会社休日', '振替休日','未指定'];

/** 休日設定の「区分」選択肢 */
export const HOLIDAY_KIND_OPTIONS: { value: HolidayKind; label: string }[] =
  HOLIDAY_KINDS.map((k) => ({ value: k, label: k }));