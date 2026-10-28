export interface  LoginRequest {
  /** ログインID */
  userId: string;
  /** パスワード */
  password: string;
}

export interface  LoginResponse {
  /** ログインID */
  userId: string;
  /** 氏名 */
  name: string;
  /** 職級区分 */
  yakushokukubun: string;
  /** 所属部門 */
  department: string;
  /**  */
  token?: string;
}