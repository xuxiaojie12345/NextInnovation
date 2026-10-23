/**
 * 済南拠点 稼働率統計 のモックデータ（バックエンド実装までの仮データ）
 * ※実データは要員の週次割当・勤怠（バックエンド）から取得する想定
 */
import dayjs, { Dayjs } from 'dayjs';

/** 稼働率の目標値（%） */
export const JINAN_TARGET_RATE = 50;

/**
 * 済南拠点の部門（年度ごとに部門マスタが変わるため年度別に持つ）
 * ※協力会社（`Department.kind === 'partner'`）は部門と平級だが
 *   稼働率統計の集計対象外のため、この一覧には含めない。
 */
export const JINAN_DEPARTMENTS_BY_YEAR: Record<number, string[]> = {
  2025: ['dept-0001', 'dept-0003'],
  2026: ['dept-0001', 'dept-0002', 'dept-0003'],
};

/** 済南全社（全部門の合計）を表すラベル */
export const JINAN_ALL_LABEL = '済南全社' as const;

/** 統計上の部門（済南全社 を含む） */
export type JinanDept = string;

/** 指定年度の済南拠点の部門一覧を返す（データが無い年度は空配列） */
export const getJinanDepartments = (year: number): string[] =>
  JINAN_DEPARTMENTS_BY_YEAR[year] ?? [];

/** 済南拠点の週次稼動統計（1 週 = 月曜〜日曜 / 部門別） */
export interface JinanWeeklyStat {
  /** 週キー（月曜日 'YYYY-MM-DD'） */
  weekKey: string;
  /** 週の開始日（月曜）'YYYY/M/D' */
  start: string;
  /** 週の終了日（日曜）'YYYY/M/D' */
  end: string;
  /** 部門ID（済南全社 は 各部門の合計として算出する） */
  departmentId: string;
  /** 総人数（在籍者数） */
  headcount: number;
  /** 離職人数 */
  leavers: number;
  /** 総稼動人数（契約稼動 + 非契約稼動） */
  activeTotal: number;
  /** 非契約稼動人数 */
  nonContractActive: number;
  /** 教育実施人数 */
  training: number;
  /** 現地稼動人数（日本出張含） */
  localActive: number;
}

/** 指定日が属する週の月曜日を返す */
const mondayOf = (d: Dayjs): Dayjs => d.subtract((d.day() + 6) % 7, 'day');

/** 年度・部門ごとの年始在籍数 */
const BASE_HEADCOUNT_BY_YEAR: Record<number, Record<string, number>> = {
  2025: { 'dept-0001': 20, 'dept-0003': 11 },
  2026: { 'dept-0001': 22, 'dept-0002': 18, 'dept-0003': 12 },
};

/**
 * 指定年度の週次統計（モック）を部門別に生成する。
 * ・部門ごとに四半期ごとの 1 名離職・数週後の 1 名補充で在籍が変動する
 * ・稼動人数は繁忙期（夏〜秋）に増える想定の季節変動を加える
 * ※済南全社 は対象部門の合計として算出する（getJinanWeeklyStats）
 */
const buildWeeklyStats = (year: number): JinanWeeklyStat[] => {
  const departments = getJinanDepartments(year);
  const baseHeadcount = BASE_HEADCOUNT_BY_YEAR[year];
  if (departments.length === 0 || !baseHeadcount) return [];

  const firstMonday = mondayOf(dayjs(`${year}-01-01`));
  const lastMonday = mondayOf(dayjs(`${year}-12-31`));
  const stats: JinanWeeklyStat[] = [];
  const headcounts = departments.map((d) => baseHeadcount[d] ?? 0);
  let cur = firstMonday;
  let i = 0;
  while (!cur.isAfter(lastMonday, 'day') && i < 60) {
    // for で回す（コールバックをループ内に作らない＝no-loop-func 回避）
    for (let d = 0; d < departments.length; d += 1) {
      const departmentId = departments[d];
      const leavers = (i + d) % 13 === 3 ? 1 : 0; // 四半期ごとに 1 名離職
      const recruit = (i + d) % 13 === 8 ? 1 : 0; // 離職の数週後に 1 名補充
      headcounts[d] = headcounts[d] - leavers + recruit;
      const headcount = headcounts[d];
      // 季節変動（部門ごとに規模が異なる）と週ごとのばらつき
      const seasonal = Math.round(
        ((Math.sin(((i - 6) / 52) * Math.PI * 2) + 1) / 2) * d,
      );
      const baseRate = 0.88 - d * 0.04; // 部門ごとの稼動傾向
      const activeTotal = Math.min(
        headcount,
        Math.max(0, Math.round(headcount * baseRate) + (i % 3) + seasonal),
      );
      const nonContractActive = 1 + ((i + d) % 3);
      const training = 1 + ((i + d) % 2);
      // 天津出張人数の指標は削除したため、現地稼動人数は総稼動人数と同じ
      const localActive = activeTotal;
      stats.push({
        weekKey: cur.format('YYYY-MM-DD'),
        start: cur.format('YYYY/M/D'),
        end: cur.add(6, 'day').format('YYYY/M/D'),
        departmentId,
        headcount,
        leavers,
        activeTotal,
        nonContractActive,
        training,
        localActive,
      });
    }
    cur = cur.add(7, 'day');
    i += 1;
  }
  return stats;
};

/** 年度ごとの週次統計（済南全社 は含まない。データが無い年度は空配列） */
const JINAN_STATS_BY_YEAR: Record<number, JinanWeeklyStat[]> = {
  2025: buildWeeklyStats(2025),
  2026: buildWeeklyStats(2026),
};

/**
 * 指定年度・指定部門の週次統計を返す。
 * 済南全社 の場合は対象部門の合計値を週ごとに算出して返す。
 * targetDepartments を指定すると、その部門だけを集計対象にする
 * （部門マスタの拠点が「済南」の部門だけを渡すために使用する）。
 */
export const getJinanWeeklyStats = (
  department: JinanDept,
  year: number,
  targetDepartments?: string[],
): JinanWeeklyStat[] => {
  const all = JINAN_STATS_BY_YEAR[year] ?? [];
  const targets = targetDepartments
    ? all.filter((s) => targetDepartments.includes(s.departmentId))
    : all;
  if (department !== JINAN_ALL_LABEL) {
    return targets.filter((s) => s.departmentId === department);
  }
  const weekKeys = Array.from(new Set(targets.map((s) => s.weekKey)));
  return weekKeys.map((weekKey) => {
    const list = targets.filter((s) => s.weekKey === weekKey);
    const sum = (f: (s: JinanWeeklyStat) => number) =>
      list.reduce((a, s) => a + f(s), 0);
    return {
      weekKey,
      start: list[0].start,
      end: list[0].end,
      departmentId: JINAN_ALL_LABEL,
      headcount: sum((s) => s.headcount),
      leavers: sum((s) => s.leavers),
      activeTotal: sum((s) => s.activeTotal),
      nonContractActive: sum((s) => s.nonContractActive),
      training: sum((s) => s.training),
      localActive: sum((s) => s.localActive),
    };
  });
};
