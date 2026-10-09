/**
 * 済南拠点 稼働率統計 のモックデータ（バックエンド実装までの仮データ）
 * ※実データは要員の週次割当・勤怠（バックエンド）から取得する想定
 */
import dayjs, { Dayjs } from 'dayjs';

/** 稼働率の目標値（%） */
export const JINAN_TARGET_RATE = 50;

/** 済南拠点の部門（統計上の区分） */
export const JINAN_DEPARTMENTS = ['第一開発部', '第二開発部', '第三開発部'] as const;

/** 済南全社（全部門の合計）を表すラベル */
export const JINAN_ALL_LABEL = '済南全社' as const;

/** 統計上の部門（済南全社 を含む） */
export type JinanDept =
  | (typeof JINAN_DEPARTMENTS)[number]
  | typeof JINAN_ALL_LABEL;

/** 済南拠点の週次稼動統計（1 週 = 月曜〜日曜 / 部門別） */
export interface JinanWeeklyStat {
  /** 週キー（月曜日 'YYYY-MM-DD'） */
  weekKey: string;
  /** 週の開始日（月曜）'YYYY/M/D' */
  start: string;
  /** 週の終了日（日曜）'YYYY/M/D' */
  end: string;
  /** 部門（済南全社 は 3 部門の合計として算出する） */
  department: JinanDept;
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
  /** 天津出張人数 */
  tianjin: number;
  /** 現地稼動人数（日本出張含） */
  localActive: number;
}

/** 指定日が属する週の月曜日を返す */
const mondayOf = (d: Dayjs): Dayjs => d.subtract((d.day() + 6) % 7, 'day');

/** 部門ごとの年始在籍数（合計 52 名 = 済南全社） */
const BASE_HEADCOUNT: Record<(typeof JINAN_DEPARTMENTS)[number], number> = {
  第一開発部: 22,
  第二開発部: 18,
  第三開発部: 12,
};

/**
 * 当年の週次統計（モック）を部門別に生成する。
 * ・部門ごとに四半期ごとの 1 名離職・数週後の 1 名補充で在籍が変動する
 * ・稼動人数は繁忙期（夏〜秋）に増える想定の季節変動を加える
 * ※済南全社 はこの 3 部門の合計として算出する（getJinanWeeklyStats）
 */
const buildWeeklyStats = (): JinanWeeklyStat[] => {
  const year = dayjs().year();
  const firstMonday = mondayOf(dayjs(`${year}-01-01`));
  const lastMonday = mondayOf(dayjs(`${year}-12-31`));
  const stats: JinanWeeklyStat[] = [];
  const headcounts = JINAN_DEPARTMENTS.map((d) => BASE_HEADCOUNT[d]);
  let cur = firstMonday;
  let i = 0;
  while (!cur.isAfter(lastMonday, 'day') && i < 60) {
    JINAN_DEPARTMENTS.forEach((department, d) => {
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
      const tianjin = (i + d) % 7 === 0 ? 2 : (i + d) % 3 === 0 ? 1 : 0;
      const localActive = Math.max(0, activeTotal - tianjin);
      stats.push({
        weekKey: cur.format('YYYY-MM-DD'),
        start: cur.format('YYYY/M/D'),
        end: cur.add(6, 'day').format('YYYY/M/D'),
        department,
        headcount,
        leavers,
        activeTotal,
        nonContractActive,
        training,
        tianjin,
        localActive,
      });
    });
    cur = cur.add(7, 'day');
    i += 1;
  }
  return stats;
};

/** 部門別の週次統計（当年分。済南全社 は含まない） */
export const JINAN_WEEKLY_STATS: JinanWeeklyStat[] = buildWeeklyStats();

/**
 * 指定部門の週次統計を返す。
 * 済南全社 の場合は 第一〜第三開発部 の合計値を週ごとに算出して返す。
 */
export const getJinanWeeklyStats = (
  department: JinanDept,
): JinanWeeklyStat[] => {
  if (department !== JINAN_ALL_LABEL) {
    return JINAN_WEEKLY_STATS.filter((s) => s.department === department);
  }
  const weekKeys = Array.from(
    new Set(JINAN_WEEKLY_STATS.map((s) => s.weekKey)),
  );
  return weekKeys.map((weekKey) => {
    const list = JINAN_WEEKLY_STATS.filter((s) => s.weekKey === weekKey);
    const sum = (f: (s: JinanWeeklyStat) => number) =>
      list.reduce((a, s) => a + f(s), 0);
    return {
      weekKey,
      start: list[0].start,
      end: list[0].end,
      department: JINAN_ALL_LABEL,
      headcount: sum((s) => s.headcount),
      leavers: sum((s) => s.leavers),
      activeTotal: sum((s) => s.activeTotal),
      nonContractActive: sum((s) => s.nonContractActive),
      training: sum((s) => s.training),
      tianjin: sum((s) => s.tianjin),
      localActive: sum((s) => s.localActive),
    };
  });
};
