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

/**
 * sessionStorage に保存する内容
 *
 * NOTE: 主データ（部門 / プロジェクト / 要員 / 休日）は保存しない。
 *       これらは各画面が表示されたときに API から取得して最新化するため、
 *       古いスナップショットを復元すると「保存したのにリロードで元に戻る」
 *       不整合の原因になる（有効稼働 / 教育かどうか の不具合がこれに該当）。
 *       ここでは「ログイン状態・年度・表示画面」と、
 *       画面内で編集中の状態（要員稼動管理の稼働表）だけを保持する。
 */
interface PersistedSession {
  /** ログイン中のユーザー（null = 未ログイン） */
  user: AuthUser | null;
  /** 表示中の年度 */
  year: number;
  /** 表示中の画面 */
  view: MenuKey;
  /**
   * 年度ごとの「編集中の状態」（要員稼動管理の稼働表のみ）。
   * 主データ（部門 / プロジェクト / 要員 / 休日）は含めない。
   */
  stores: Record<number, PersistedStore>;
}

/** 保存対象のストア部分（主データを含めない） */
export type PersistedStore = Pick<YearStore, 'year' | 'workStatus'>;

/** ストアから保存対象の項目だけを取り出す */
export const toPersistedStore = (store: YearStore): PersistedStore => ({
  year: store.year,
  workStatus: store.workStatus,
});

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
          ? (parsed.stores as Record<number, PersistedStore>)
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
