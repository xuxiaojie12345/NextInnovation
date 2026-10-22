/**
 * ログインユーザー（モック）
 *
 * バックエンド未接続のため、フロント内に固定ユーザーを持つ。
 * 想定ユーザー:
 *  - 部長       × 3（第一開発部 / 第二開発部 / 第三開発部 に 1 名ずつ）
 *  - 事業部長   × 1（部長の上位。全部門を閲覧できる）
 *  - 管理者     × 1（全部門を閲覧できる）
 *
 * ※実運用では認証 API（api-ud）に置き換える。
 */

/** ロール */
export type UserRole = 'bucho' | 'jigyo-bucho' | 'admin';

/** ログインユーザー */
export interface AuthUser {
  /** ログインID */
  userId: string;
  /** パスワード（モック。実運用ではバックエンドで照合する） */
  password: string;
  /** 氏名 */
  name: string;
  /** ロール */
  role: UserRole;
  /** ロール表示名（部長 / 事業部長 / 管理者） */
  roleLabel: string;
  /** 部長のみ：担当部門（部門マスタの部門名）。事業部長・管理者は未設定（＝全部門） */
  department?: string;
}

/** モックログインユーザー一覧（パスワードはすべて pass1234） */
export const MOCK_USERS: AuthUser[] = [
  // 部長（担当部門ごとに 1 名）
  {
    userId: 'bucho1',
    password: 'pass1234',
    name: '山田 一郎',
    role: 'bucho',
    roleLabel: '部長',
    department: '第一開発部',
  },
  {
    userId: 'bucho2',
    password: 'pass1234',
    name: '佐藤 二郎',
    role: 'bucho',
    roleLabel: '部長',
    department: '第二開発部',
  },
  {
    userId: 'bucho3',
    password: 'pass1234',
    name: '鈴木 三郎',
    role: 'bucho',
    roleLabel: '部長',
    department: '第三開発部',
  },
  // 事業部長（部長の上位）
  {
    userId: 'jigyo',
    password: 'pass1234',
    name: '高橋 事業',
    role: 'jigyo-bucho',
    roleLabel: '事業部長',
  },
  // 管理者
  {
    userId: 'admin',
    password: 'pass1234',
    name: 'システム管理者',
    role: 'admin',
    roleLabel: '管理者',
  },
];

/**
 * ログイン直後に絞り込んでおく部門（初期表示の既定値）を返す。
 *
 *  - 部長          → 自部門のみ（＝自部門のデータを初期表示）
 *  - 事業部長/管理者 → []（＝絞り込みなし＝全部門）
 *
 * ※権限ではない。部署の選択肢は常に全部門を表示し、他部門を選んで
 *   閲覧できる（データ集約）。あくまで画面を開いたときの既定値。
 */
export const defaultDepartmentsOf = (user: AuthUser): string[] =>
  user.role === 'bucho' && user.department ? [user.department] : [];
