/* ═══════════════════════════════════════════
   common/utils.ts — 共通ユーティリティ関数
   各画面で重複するロジックをここに集約
   ═══════════════════════════════════════════ */

/**
 * 印刷機能：印刷前に document.title を設定し、印刷後に元に戻す。
 * @param title 印刷時のタイトル
 */
export const sharedPrint = (title: string): void => {
  const prevTitle = document.title;
  document.title = title;
  window.print();
  document.title = prevTitle;
};

/**
 * 現在ログイン中のユーザーIDを取得する。
 * 未ログイン時は空文字を返す。
 */
export const getCurrentUserId = (): string => {
  return localStorage.getItem("userId") || "";
};
