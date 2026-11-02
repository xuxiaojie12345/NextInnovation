/**
 * ログイン状態・表示状態のセッション保存（ブラウザのリロード対策）
 *
 * NOTE: 従来はすべて React のメモリ上に保持していたため、ブラウザを
 *       リロードするとログイン画面へ戻ってしまっていた。
 *       ここでは sessionStorage に最小限の状態だけを保存し、起動時に復元する。
 *
 *       sessionStorage を選ぶ理由：
 *         - タブを閉じれば消える（＝ログアウト相当。localStorage より安全）
 *         - 同じタブ内のリロード／F5 では残る（＝要望の「リロードしても画面維持」を満たす）
 *
 *       パスワードは保存しない（loginApi は password を空で返す）。
 */
import type { AuthUser } from '../types/user';
import type { MenuKey } from '../Menu/Menu';
import type { YearStore } from './yearStore';

const KEY_SESSION = 'kadou.session.v1';

/** sessionStorage に保存する内容 */
interface PersistedSession {
  /** ログイン中のユーザー（null = 未ログイン） */
  user: AuthUser | null;
  /** 表示中の年度 */
  year: number;
  /** 表示中の画面 */
  view: MenuKey;
  /**
   * 年度ごとのストア。
   * メモリ実装の kadouRepository はリロードで消えるため、
   * 保存した内容を復元して画面上の編集結果を維持する。
   */
  stores: Record<number, YearStore>;
}

/** 保存済みのセッションを読み込む（無い・壊れている場合は null） */
export function loadSession(): PersistedSession | null {
  try {
    const raw = window.sessionStorage.getItem(KEY_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.year !== 'number') return null;
    return {
      user: parsed.user ?? null,
      year: parsed.year,
      view: (parsed.view ?? 'work-status') as MenuKey,
      stores:
        parsed.stores && typeof parsed.stores === 'object'
          ? (parsed.stores as Record<number, YearStore>)
          : {},
    };
  } catch {
    // JSON 破損・ストレージ無効（プライベートモード等）は未ログイン扱い
    return null;
  }
}

/** セッションを保存する（失敗しても画面は動かす） */
export function saveSession(session: PersistedSession): void {
  try {
    window.sessionStorage.setItem(KEY_SESSION, JSON.stringify(session));
  } catch {
    // 容量超過・ストレージ無効時は何もしない（メモリ動作にフォールバック）
  }
}

/** セッションを削除する（ログアウト時） */
export function clearSession(): void {
  try {
    window.sessionStorage.removeItem(KEY_SESSION);
  } catch {
    // 何もしない
  }
}
