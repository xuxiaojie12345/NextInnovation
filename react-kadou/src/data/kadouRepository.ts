/**
 * データアクセス層（バックエンドの代わり）
 *
 * 現段階は「メモリ上に保存する」実装。
 * 将来バックエンドができたら、この interface の実装を HTTP 版に差し替えるだけで
 * 画面側は変更不要になる（保存＝POST、取得＝GET ?year=）。
 */
import { AssignmentMap, Personnel } from '../WorkStatus/types';
import {
  UnpaidMap,
  YearStore,
  createYearStore,
} from './yearStore';

/** 要員稼動管理の保存ペイロード */
export interface WorkStatusPayload {
  personnel: Personnel[];
  assignment: AssignmentMap;
  unpaid: UnpaidMap;
}

/** 年度のマスタ系データ（部門・要員・項目・休日）の保存パッチ */
export type YearMasterPatch = Partial<
  Pick<YearStore, 'departments' | 'personnel' | 'projects' | 'holidays'>
>;

export interface KadouRepository {
  /** 年度データの取得（将来: GET /api/kadou?year=） */
  loadYear(year: number): Promise<YearStore>;
  /** 年度のマスタ系データの保存（将来: PUT） */
  saveMaster(year: number, patch: YearMasterPatch): Promise<void>;
  /** 要員稼動管理の保存（将来: POST） */
  saveWorkStatus(year: number, payload: WorkStatusPayload): Promise<void>;
}

/**
 * メモリ実装（＝バックエンドの代わり）
 * 保存した内容はメモリ上に保持し、同じ年度に戻ってきたときに復元される。
 */
class MemoryKadouRepository implements KadouRepository {
  private data: Record<number, YearStore> = {};

  /** 同期で年度ストアを用意する（初回描画用） */
  ensure(year: number): YearStore {
    if (!this.data[year]) this.data[year] = createYearStore(year);
    return this.data[year];
  }

  /** アプリ起動時の初期 state を作る（同期） */
  snapshot(years: number[]): Record<number, YearStore> {
    const out: Record<number, YearStore> = {};
    years.forEach((y) => {
      out[y] = this.ensure(y);
    });
    return out;
  }

  async loadYear(year: number): Promise<YearStore> {
    return this.ensure(year);
  }

  async saveMaster(year: number, patch: YearMasterPatch): Promise<void> {
    Object.assign(this.ensure(year), patch);
  }

  async saveWorkStatus(
    year: number,
    payload: WorkStatusPayload,
  ): Promise<void> {
    const store = this.ensure(year);
    store.personnel = payload.personnel;
    store.workStatus = {
      assignment: payload.assignment,
      unpaid: payload.unpaid,
    };
  }
}

/** アプリ全体で使う repository（将来 HTTP 実装に差し替える） */
export const kadouRepository = new MemoryKadouRepository();
