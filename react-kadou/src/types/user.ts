/** ログインユーザーのロール */
export type UserRole = 'bucho' | 'jigyo-bucho' | 'admin';

/** ログインユーザー（バックエンドのログインAPIから返るユーザー情報） */
export interface AuthUser {
  /** ログインID */
  userId: string;
  /** パスワード（実運用ではバックエンドで照合する） */
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