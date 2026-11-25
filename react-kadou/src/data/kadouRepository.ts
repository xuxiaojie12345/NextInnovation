/**
 * データアクセス層
 *
 * バックエンド（FastAPI）の HTTP 実装。
 * 取得は GET /api/kadou/{year}/work-status、保存は PUT /api/kadou/{year}/work-status。
 * アプリ起動時・年度切替時に loadYear を呼び、後端データを画面へ反映する。
 */
import {
  AssignmentMap,
  Department,
  Personnel,
  WorkStatusRow,
  WorkStatusRows,
} from '../WorkStatus/types';
import { httpRequest } from '../utils/http';
import {
  UnpaidMap,
  YearStore,
  createYearStore,
} from './yearStore';

/** 保存時に送る変更セル（1セル＝週次割当テーブル1レコード） */
export interface WorkStatusChangedCell {
  employeeNo: string;
  /** 週キー（月曜 'YYYY-MM-DD'） */
  weekKey: string;
  /** 変更後のプロジェクトID（null = 未割当） */
  projectId?: string | null;
  /** 変更後の無償支援（BUFFER） */
  isUnpaid?: boolean;
  /** 更新前の version（null = バージョン確認なし。新規セルなど） */
  version?: number | null;
}

/** 異動で変更した要員の現在所属（保存成功時に要員マスタへ反映する） */
export interface WorkStatusDepartmentUpdate {
  employeeNo: string;
  departmentId: string;
}

/** 要員稼動管理の保存ペイロード（要員マスタは含めない） */
export interface WorkStatusPayload {
  /** 稼働表に表示する行（社員番号・所属・有効期間） */
  rows: WorkStatusRows;
  assignment: AssignmentMap;
  unpaid: UnpaidMap;
  /**
   * 行削除で業務データを削除した社員番号。
   * バックエンドは当該年度の割当・BUFFER を削除してから payload を反映する
   * （要員マスタは削除しない）
   */
  deletedEmployeeNos?: string[];
  /**
   * 行削除した社員について、画面を開いた時点の要員マスタ行
   * （年度 + 社員番号 + 所属 + 異動フラグ + 異動日）。
   * 保存時に DB と突き合わせ、1 行でも欠けていれば削除失敗になる
   */
  deletedBaselines?: {
    employeeNo: string;
    rows: { departmentId: string; idouFlag: string; idoubi: string }[];
  }[];
  /** 画面で変更したセル（このセルだけを version + 1 で更新する） */
  changedCells?: WorkStatusChangedCell[];
  /**
   * 異動で変更した要員の現在所属。
   * 稼働表の保存と同一トランザクションで要員マスタへ反映する
   * （未保存の異動では現在所属を変更しない）
   */
  departmentUpdates?: WorkStatusDepartmentUpdate[];
  /**
   * 社員番号変更（旧番号 → 新番号）。
   * 旧番号の週次データは削除せず UNASSIGN に戻す（要員マスタは変更しない）。
   * 新番号の週次データは deletedEmployeeNos で全件削除 → payload で再登録する。
   */
  renumbers?: { from: string; to: string }[];
  /**
   * 備考（退場予定）の変更。
   * 稼働表の保存と同一トランザクションで要員マスタへ反映する。
   * 備考は要員マスタの行ごとの値のため、異動がある場合は行（所属部門）を指定する
   */
  leavePlans?: {
    employeeNo: string;
    departmentId: string;
    leavePlan: string;
  }[];
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
  saveWorkStatus(
    year: number,
    payload: WorkStatusPayload,
    operatorId?: string | null,
  ): Promise<void>;
  /**
   * 要員マスタの削除（将来: DELETE）
   * 当年度の稼働データ（行・割当・BUFFER）も同時に削除する（他年度は変更しない）
   */
  deletePersonnel(year: number, employeeNo: string): Promise<void>;
}

/** 未割当週をバックエンドが「UNASSIGN」で返すための予約文字列 */
const UNASSIGN = 'UNASSIGN';

/** GET /api/kadou/{year}/work-status のレスポンス（後端で解決済みの形） */
interface WorkStatusLoadResponse {
  year: number;
  personnel: Array<{
    employeeNo: string;
    name: string;
    departmentId: string;
    role: string;
    leavePlan?: string;
  }>;
  departments: Array<{
    departmentId: string;
    name: string;
    /** 部門別名（画面の「部門別名」列で表示する） */
    alisa?: string;
    location?: string;
    kind?: string;
  }>;
  projects: Array<{
    projectId: string;
    projectCode: string;
    customer: string;
    caseName: string;
    team: string;
    subTeam: string;
    abbr: string;
    departmentId: string;
    name: string;
    validFlg?: string;
    educationFlg?: string;
  }>;
  workStatus: {
    rows: WorkStatusRow[];
    assignment: Record<string, Record<string, string | null>>;
    unpaid: Record<string, Record<string, boolean>>;
    versions?: Record<string, Record<string, number>>;
  };
}

/**
 * HTTP 実装（バックエンド参照）
 * 取得 = GET /api/kadou/{year}/work-status
 * 保存 = PUT /api/kadou/{year}/work-status
 * 年度ストアをメモリにキャッシュし、データを後端から取得して反映する。
 */
class HttpKadouRepository implements KadouRepository {
  private data: Record<number, YearStore> = {};

  /** 同期で年度ストアを用意する（初回描画用。中身は後端取得を待つ） */
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
    const store = this.ensure(year);
    const res = await httpRequest<WorkStatusLoadResponse>(
      `/api/kadou/${year}/work-status`,
      { retry: true },
    );

    // マスタ系は後端の値を採用する
    store.departments = res.departments as Department[];
    store.personnel = res.personnel as Personnel[];
    // プロジェクト：後端の valid_flg / education_flg は '1'/'0'（または真偽値）なので真偽値へ畳む
    // NOTE: 比較は文字列 '1' 固定にせず、'1' / true / 1 のいずれでも true になるようにする
    //       （後端が真偽値や null を返した場合にフラグが常に false になる事故を防ぐ）
    const toFlag = (v: unknown): boolean =>
      v === true || v === 1 || v === '1';
    store.projects = (res.projects ?? []).map((p) => ({
      projectId: p.projectId,
      projectCode: p.projectCode,
      customer: p.customer,
      caseName: p.caseName,
      team: p.team,
      subTeam: p.subTeam,
      abbr: p.abbr,
      departmentId: p.departmentId,
      name: p.name,
      validFlg: toFlag(p.validFlg),
      educationFlg: toFlag(p.educationFlg),
    }));

    // 週割当：後端の「UNASSIGN」は画面の「未割当(null)」へ畳む
    const assignment: AssignmentMap = {};
    const srcAssign = res.workStatus?.assignment ?? {};
    Object.entries(srcAssign).forEach(([emp, weeks]) => {
      const mapped: Record<string, string | null> = {};
      Object.entries(weeks ?? {}).forEach(([weekKey, pid]) => {
        mapped[weekKey] = pid && pid !== UNASSIGN ? pid : null;
      });
      assignment[emp] = mapped;
    });

    store.workStatus = {
      rows: res.workStatus?.rows ?? [],
      assignment,
      unpaid: res.workStatus?.unpaid ?? {},
      versions: res.workStatus?.versions ?? {},
    };
    return store;
  }

  async saveMaster(year: number, patch: YearMasterPatch): Promise<void> {
    Object.assign(this.ensure(year), patch);
  }

  async saveWorkStatus(
    year: number,
    payload: WorkStatusPayload,
    operatorId?: string | null,
  ): Promise<void> {
    // 画面の「未割当(null)」は後端の「UNASSIGN」へ畳む
    const assignment: Record<string, Record<string, string>> = {};
    Object.entries(payload.assignment ?? {}).forEach(([emp, weeks]) => {
      const mapped: Record<string, string> = {};
      Object.entries(weeks ?? {}).forEach(([weekKey, pid]) => {
        mapped[weekKey] = pid && pid !== '' ? pid : UNASSIGN;
      });
      assignment[emp] = mapped;
    });

    await httpRequest(`/api/kadou/${year}/work-status`, {
      method: 'PUT',
      // 登録・更新者（register_user / update_user）にログインユーザーを記録する
      operatorId,
      body: {
        rows: payload.rows,
        assignment,
        unpaid: payload.unpaid ?? {},
        deletedEmployeeNos: payload.deletedEmployeeNos ?? [],
        deletedBaselines: payload.deletedBaselines ?? [],
        changedCells: (payload.changedCells ?? []).map((cell) => ({
          ...cell,
          projectId: cell.projectId ? cell.projectId : null,
        })),
        departmentUpdates: payload.departmentUpdates ?? [],
        renumbers: (payload.renumbers ?? []).map((r) => ({
          fromNo: r.from,
          toNo: r.to,
        })),
        leavePlans: payload.leavePlans ?? [],
      },
    });

    // 後端保存に成功したら内部キャッシュも同期する
    const store = this.ensure(year);
    store.workStatus = {
      rows: payload.rows,
      assignment: payload.assignment,
      unpaid: payload.unpaid ?? {},
      versions: store.workStatus.versions,
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
    const versions = { ...(store.workStatus.versions ?? {}) };
    delete versions[employeeNo];
    store.workStatus = {
      rows: store.workStatus.rows.filter(
        (r) => r.employeeNo !== employeeNo,
      ),
      assignment,
      unpaid,
      versions,
    };
  }
}

/** アプリ全体で使う repository（バックエンド接続版） */
export const kadouRepository = new HttpKadouRepository();