/**
 * データアクセス層（バックエンドの代わり）
 *
 * 現段階は「メモリ上に保存する」実装。
 * 将来バックエンドができたら、この interface の実装を HTTP 版に差し替えるだけで
 * 画面側は変更不要になる（保存＝POST、取得＝GET ?year=）。
 */
import { AssignmentMap, WorkStatusRows } from '../WorkStatus/types';
import {
  UnpaidMap,
  YearStore,
  createYearStore,
} from './yearStore';

/** 要員稼動管理の保存ペイロード（要員マスタは含めない） */
export interface WorkStatusPayload {
  /** 稼働表に表示する行（社員番号・所属・有効期間） */
  rows: WorkStatusRows;
  assignment: AssignmentMap;
  unpaid: UnpaidMap;
  /**
   * 行削除で業務データを削除した社員番号。
   * バックエンドは当該年度の割当・BUFFER を削除してから assignment / unpaid を反映する
   */
  deletedEmployeeNos?: string[];
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
  /**
   * 要員マスタの削除（将来: DELETE）
   * 当年度の稼働データ（行・割当・BUFFER）も同時に削除する（他年度は変更しない）
   */
  deletePersonnel(year: number, employeeNo: string): Promise<void>;
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
    // 要員マスタは変更しない（稼働表は表示行と割当のみ保存する）
    // ※メモリ実装は「保存内容＝そのまま正」で全量置換するため、
    //   deletedEmployeeNos は意識しなくても削除済みになる
    //   （HTTP 実装では当該年度の業務データを削除してから反映する）
    store.workStatus = {
      rows: payload.rows,
      assignment: payload.assignment,
      unpaid: payload.unpaid,
    };
  }

  async deletePersonnel(year: number, employeeNo: string): Promise<void> {
    const store = this.ensure(year);
    // 要員マスタを削除する
    store.personnel = store.personnel.filter(
      (p) => p.employeeNo !== employeeNo,
    );
    // 当年度の稼働データ（行・割当・BUFFER）も削除する（他年度は変更しない）
    const assignment = { ...store.workStatus.assignment };
    delete assignment[employeeNo];
    const unpaid = { ...store.workStatus.unpaid };
    delete unpaid[employeeNo];
    store.workStatus = {
      rows: store.workStatus.rows.filter(
        (r) => r.employeeNo !== employeeNo,
      ),
      assignment,
      unpaid,
    };
  }
}

/** アプリ全体で使う repository（将来 HTTP 実装に差し替える） */
export const kadouRepository = new MemoryKadouRepository();
