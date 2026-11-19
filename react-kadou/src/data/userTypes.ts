/**
 * ログインユーザー / ユーザー管理 画面で共通に使う型と純関数。
 *
 * ユーザー情報はバックエンド（jn_user_table）が保持する。
 * ロール（UserRole）は画面側の表現で、API とは役職区分コードで変換する
 * （変換は constants/options.ts の YAKUSHOKU_ROLE_MAP / ROLE_TO_KUBUN）。
 */

/** ロール */
export type UserRole = 'bucho' | 'jigyo-bucho' | 'admin';

/** ログインユーザー（ユーザー管理画面の一覧とも共通） */
export interface AuthUser {
  /** ログインID */
  userId: string;
  /** パスワード（バックエンドで管理） */
  password: string;
  /** 氏名 */
  name: string;
  /** ロール */
  role: UserRole;
  /** ロール表示名（部長 / 事業部長 / 管理者） */
  roleLabel: string;
  /** 部長のみ：担当部門ID（部門マスタの departmentId）。事業部長・管理者は未設定（＝全部門） */
  departmentId?: string;
}

/**
 * ログイン直後に絞り込んでおく部門（初期表示の既定値）を返す。
 *
 *  - 部長              → 自部門のみ（＝自部門のデータを初期表示）
 *  - 事業部長/管理者   → []（＝絞り込みなし＝全部門）
 *
 * ※権限ではない。部署の選択肢は常に全部門を表示し、他部門を選んで
 *   閲覧できる（データ集約）。あくまで画面を開いたときの既定値。
 */
export const defaultDepartmentsOf = (user: AuthUser): string[] =>
  user.role === 'bucho' && user.departmentId ? [user.departmentId] : [];
