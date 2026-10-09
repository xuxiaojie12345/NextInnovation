import React, { useMemo } from 'react';
import { Card, Space, Statistic, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import {
  JINAN_ALL_LABEL,
  JINAN_DEPARTMENTS,
  JINAN_TARGET_RATE,
  getJinanWeeklyStats,
} from '../data/mockJinanStats';
import type { JinanDept, JinanWeeklyStat } from '../data/mockJinanStats';
import './JinanWorkRateScreen.css';

const { Title, Text } = Typography;

/** % を小数第 1 位で丸める */
const round1 = (n: number) => Math.round(n * 10) / 10;

/** 率（%）= 分子 ÷ 分母 × 100 */
const rate = (num: number, den: number) =>
  den <= 0 ? 0 : round1((num / den) * 100);

/** 指定日が属する週の月曜日（週キー 'YYYY-MM-DD'） */
const weekKeyOf = (d: dayjs.Dayjs) =>
  d.subtract((d.day() + 6) % 7, 'day').format('YYYY-MM-DD');

/** 稼動率のセル表示（目標値以上は緑） */
const rateCell = (v: number) => (
  <span
    style={{
      color: v >= JINAN_TARGET_RATE ? '#3f8600' : '#d48806',
      fontWeight: 600,
    }}
  >
    {v}%
  </span>
);

/** 指標値のセル表示（数値 + 単位） */
const cellText = (row: MetricRow, v: number) => `${v} ${row.unit}`;

/** 1 週（月曜〜日曜）の列情報 */
interface WeekCol {
  /** 週キー（月曜日 'YYYY-MM-DD'） */
  key: string;
  monday: dayjs.Dayjs;
  sunday: dayjs.Dayjs;
}

/** 月ごとの週グループ（ヘッダー 2 段組み用） */
interface MonthGroup {
  key: string;
  label: string;
  weeks: WeekCol[];
}

/** テーブル 1 行分（指標 × 部門 × 週の横向き表示） */
interface MetricRow {
  /** 行キー（指標キー|部門） */
  key: string;
  /** 指標名 */
  metric: string;
  /** 部門（済南全社 を含む） */
  department: string;
  /** 済南全社（3 部門の合計行）か */
  isTotal: boolean;
  /** 同じ指標の先頭行（第一開発部）か（指標列のセル結合に使う） */
  isFirstOfMetric: boolean;
  /** 単位（名 / %） */
  unit: '名' | '%';
  /** 週キー → 値 */
  values: Record<string, number>;
  /** 稼動率（目標値で色分けする）か */
  isRate?: boolean;
}

/**
 * 済南拠点 稼働率統計 画面（メニュー「済南稼働率統計」で切り替わる画面）
 * 週単位（月曜〜日曜）で 総人数 / 離職人数 / 稼動人数 / 稼動率 などを集計して表示する
 * ※現状はモックデータ表示（バックエンド未接続）
 */
const JinanWorkRateScreen: React.FC = () => {
  /** 今日を含む週の週キー */
  const currentWeekKey = useMemo(() => weekKeyOf(dayjs()), []);

  /** 対象年（当年） */
  const displayYear = dayjs().year();

  /** 済南全社（3 部門の合計）の週次統計 */
  const allStats = useMemo(() => getJinanWeeklyStats(JINAN_ALL_LABEL), []);

  /** 週列（当年分／月曜始まり） */
  const weeks: WeekCol[] = useMemo(
    () =>
      allStats.map((s) => {
        const monday = dayjs(s.weekKey);
        return { key: s.weekKey, monday, sunday: monday.add(6, 'day') };
      }),
    [allStats],
  );

  /** 月ごとの週グループ（ヘッダー 2 段組み） */
  const monthGroups: MonthGroup[] = useMemo(() => {
    const map = new Map<
      string,
      { key: string; order: number; label: string; weeks: WeekCol[] }
    >();
    weeks.forEach((w) => {
      const ym = { year: w.monday.year(), month: w.monday.month() };
      const key = `${ym.year}-${ym.month}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          order: ym.year * 12 + ym.month,
          // 年をまたぐ月（前年12月・翌年1月）は年を付けて表示する
          label:
            ym.year === displayYear
              ? `${ym.month + 1}月`
              : `${ym.year}年${ym.month + 1}月`,
          weeks: [],
        });
      }
      map.get(key)!.weeks.push(w);
    });
    return Array.from(map.values())
      .sort((a, b) => a.order - b.order)
      .map(({ key, label, weeks: groupWeeks }) => ({
        key,
        label,
        weeks: groupWeeks,
      }));
  }, [weeks, displayYear]);

  /**
   * 指標行（10 指標 × 4 部門 = 40 行）
   * 各指標ごとに 第一開発部 / 第二開発部 / 第三開発部 / 済南全社 の順に展開する
   */
  const metricRows: MetricRow[] = useMemo(() => {
    const metrics: {
      key: string;
      label: string;
      unit: '名' | '%';
      isRate?: boolean;
      value: (s: JinanWeeklyStat) => number;
    }[] = [
      {
        key: 'headcount',
        label: '総人数',
        unit: '名',
        value: (s) => s.headcount,
      },
      {
        key: 'leavers',
        label: '離職人数',
        unit: '名',
        value: (s) => s.leavers,
      },
      {
        key: 'activeTotal',
        label: '総稼動人数',
        unit: '名',
        value: (s) => s.activeTotal,
      },
      {
        key: 'activeRate',
        label: '総稼動率',
        unit: '%',
        isRate: true,
        value: (s) => rate(s.activeTotal, s.headcount),
      },
      {
        key: 'nonContractActive',
        label: '非契約稼動人数',
        unit: '名',
        value: (s) => s.nonContractActive,
      },
      {
        key: 'training',
        label: '教育実施人数',
        unit: '名',
        value: (s) => s.training,
      },
      {
        key: 'tianjin',
        label: '天津出張人数',
        unit: '名',
        value: (s) => s.tianjin,
      },
      {
        key: 'localActive',
        label: '現地稼動人数（日本出張含）',
        unit: '名',
        value: (s) => s.localActive,
      },
      {
        key: 'localRate',
        label: '現地稼動率',
        unit: '%',
        isRate: true,
        value: (s) => rate(s.localActive, s.headcount),
      },
      {
        key: 'contractRate',
        label: '契約稼動率',
        unit: '%',
        isRate: true,
        value: (s) =>
          rate(Math.max(0, s.activeTotal - s.nonContractActive), s.headcount),
      },
    ];

    const deptRows: JinanDept[] = [...JINAN_DEPARTMENTS, JINAN_ALL_LABEL];
    const rows: MetricRow[] = [];
    metrics.forEach((m) => {
      deptRows.forEach((department, dIdx) => {
        /** 週キー → 値 */
        const values: Record<string, number> = {};
        getJinanWeeklyStats(department).forEach((s) => {
          values[s.weekKey] = m.value(s);
        });
        rows.push({
          key: `${m.key}|${department}`,
          metric: m.label,
          department,
          isTotal: department === JINAN_ALL_LABEL,
          isFirstOfMetric: dIdx === 0,
          unit: m.unit,
          isRate: m.isRate,
          values,
        });
      });
    });
    return rows;
  }, []);

  /**
   * 今週の集計（当週 = 今日を含む週の実績値）
   * ラベルの週番号は、その月に日が含まれる週を 1 から数える
   * （例：2026/10/5（月）の週は、9/28 の週が 1 週目なので 10月2週目）
   */
  const week = useMemo(() => {
    const monday = dayjs(currentWeekKey);
    const current = allStats.find((s) => s.weekKey === currentWeekKey);
    const contract = (s: JinanWeeklyStat) =>
      Math.max(0, s.activeTotal - s.nonContractActive);

    // 当週が属する月に含まれる週（月曜が前月でも、月内の日を含めばその月の週として数える）
    const weekNo =
      weeks
        .filter(
          (w) =>
            w.monday.isSame(monday, 'month') ||
            w.sunday.isSame(monday, 'month'),
        )
        .findIndex((w) => w.key === currentWeekKey) + 1;

    return {
      /** 当週のモックデータがあるか */
      hasData: current !== undefined,
      /** 例：2026年10月2週目 */
      label: `${monday.format('YYYY年M月')}${weekNo > 0 ? `${weekNo}週目` : ''}`,
      /** 例：2026/10/5 〜 10/11 */
      period: `${monday.format('YYYY/M/D')} 〜 ${monday
        .add(6, 'day')
        .format('M/D')}`,
      headcount: current?.headcount ?? 0,
      leavers: current?.leavers ?? 0,
      activeTotal: current?.activeTotal ?? 0,
      activeRate: current ? rate(current.activeTotal, current.headcount) : 0,
      nonContractActive: current?.nonContractActive ?? 0,
      training: current?.training ?? 0,
      tianjin: current?.tianjin ?? 0,
      localActive: current?.localActive ?? 0,
      localRate: current ? rate(current.localActive, current.headcount) : 0,
      contractRate: current ? rate(contract(current), current.headcount) : 0,
    };
  }, [allStats, currentWeekKey, weeks]);

  /** 対象期間（週の開始日 = 月曜で表す） */
  const period = useMemo(
    () => ({
      weeks: weeks.length,
      first: weeks[0].monday.format('YYYY/M/D'),
      last: weeks[weeks.length - 1].monday.format('YYYY/M/D'),
    }),
    [weeks],
  );

  /** 今週のサマリ（10 項目） */
  const cards: {
    label: string;
    value: number;
    suffix: string;
    isRate?: boolean;
  }[] = [
    { label: '総人数', value: week.headcount, suffix: '名' },
    { label: '離職人数', value: week.leavers, suffix: '名' },
    { label: '総稼動人数', value: week.activeTotal, suffix: '名' },
    { label: '総稼動率', value: week.activeRate, suffix: '%', isRate: true },
    { label: '非契約稼動人数', value: week.nonContractActive, suffix: '名' },
    { label: '教育実施人数', value: week.training, suffix: '名' },
    { label: '天津出張人数', value: week.tianjin, suffix: '名' },
    {
      label: '現地稼動人数（日本出張含）',
      value: week.localActive,
      suffix: '名',
    },
    { label: '現地稼動率', value: week.localRate, suffix: '%', isRate: true },
    {
      label: '契約稼動率',
      value: week.contractRate,
      suffix: '%',
      isRate: true,
    },
  ];

  /** 週次統計テーブルの列（指標 × 週の横向き。要員稼動管理グリッドと同じ 2 段ヘッダー） */
  const columns: TableColumnsType<MetricRow> = useMemo(() => {
    const cols: TableColumnsType<MetricRow> = [
      {
        title: '指標',
        dataIndex: 'metric',
        key: 'metric',
        fixed: 'left',
        // 部門列と同じ幅。入りきらない指標名は折り返して表示する
        width: 110,
        // 同じ指標の 4 行（第一〜第三開発部・済南全社）はセルを縦に結合して表示する
        onCell: (row) => ({
          rowSpan: row.isFirstOfMetric ? JINAN_DEPARTMENTS.length + 1 : 0,
          className: row.isFirstOfMetric ? 'jinan-metric-cell' : '',
        }),
      },
      {
        title: '部門',
        dataIndex: 'department',
        key: 'department',
        fixed: 'left',
        width: 110,
        render: (v: string, row) =>
          row.isTotal ? <span className='jinan-dept-total'>{v}</span> : v,
      },
    ];

    // 月グループ（例: 1月）→ 配下に週列（週番号は表示せず期間のみ）
    monthGroups.forEach((g) => {
      cols.push({
        title: <div className='jinan-month-head'>{g.label}</div>,
        key: g.key,
        children: g.weeks.map((w) => ({
          title: (
            <div className='jinan-week-head'>
              <div>{w.monday.format('M/D')}</div>
              <div>〜 {w.sunday.format('M/D')}</div>
            </div>
          ),
          key: w.key,
          width: 96,
          align: 'center' as const,
          onCell: () => ({
            className: w.key === currentWeekKey ? 'jinan-current-col' : '',
          }),
          onHeaderCell: () => ({
            className: w.key === currentWeekKey ? 'jinan-current-head' : '',
          }),
          render: (_: unknown, row: MetricRow) =>
            row.isRate
              ? rateCell(row.values[w.key] ?? 0)
              : cellText(row, row.values[w.key] ?? 0),
        })),
      });
    });

    return cols;
  }, [monthGroups, currentWeekKey]);

  return (
    <div className='screen-page'>
      {/* 画面ヘッダー */}
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            済南稼働率統計（週単位）
          </Title>
          <Text type='secondary'>
            済南拠点の稼動状況（総人数・離職・稼動人数・各種稼動率）を部門別（第一〜第三開発部・済南全社）に週単位（月曜〜日曜）で集計した統計画面です。対象期間：{period.first} の週 〜 {period.last} の週（全{period.weeks}週）
          </Text>
        </div>
        <Space>
          <Tag color='blue'>拠点：済南</Tag>
          <Tag color='orange'>フロント モック（バックエンド未接続）</Tag>
        </Space>
      </div>

      {/* 今週の集計（10 項目） */}
      <Card
        title={`今週の集計（${JINAN_ALL_LABEL}／${week.label}）`}
        className='screen-card jinan-card-full'
        extra={<Text type='secondary'>目標稼働率 {JINAN_TARGET_RATE}%</Text>}
      >
        <div className='jinan-stat-grid'>
          {cards.map((c) => (
            <Card size='small' key={c.label} className='jinan-stat-card'>
              <Statistic
                title={c.label}
                value={c.value}
                precision={c.isRate ? 1 : 0}
                suffix={c.suffix}
                valueStyle={
                  c.isRate
                    ? {
                        color:
                          c.value >= JINAN_TARGET_RATE ? '#3f8600' : '#d48806',
                      }
                    : undefined
                }
              />
            </Card>
          ))}
        </div>
        <Text type='secondary' className='jinan-note'>
          ※ 当週（{week.period}）の実績値です。人数は当週の人数、稼動率は「各分子 ÷ 総人数」で算出しています。
          {!week.hasData && ' ※当週のデータが無いため 0 で表示しています。'}
        </Text>
      </Card>

      {/* 週次統計（指標 × 週の横向き） */}
      <Card
        title={`週次 稼動統計（10 指標 × 4 部門 × ${period.weeks} 週）`}
        className='screen-card jinan-card-full'
        style={{ marginTop: 12 }}
        extra={
          <Text type='secondary'>
            列 = 1 週（月曜〜日曜）／今週の列をハイライト
          </Text>
        }
      >
        <Table<MetricRow>
          rowKey='key'
          size='small'
          columns={columns}
          dataSource={metricRows}
          pagination={false}
          scroll={{ x: 310 + weeks.length * 96 }}
          rowClassName={(r) => (r.isTotal ? 'jinan-total-row' : '')}
        />
        <Text type='secondary' className='jinan-note'>
          ※ 行 = 指標 × 部門（第一〜第三開発部／済南全社 = 3 部門の合計）、列 = 週（月曜〜日曜）。「今週の列」（{currentWeekKey} の週）はハイライト表示。
        </Text>
      </Card>

      {/* 算出式（定義）: 仕様確認中のため一旦非表示
          ※再表示する場合は、このコメント（外側）を解除する
      <Card
        title='算出式（定義）'
        className='screen-card'
        style={{ marginTop: 12 }}
      >
        <ul className='jinan-formula-list'>
          <li>総稼動人数 = 契約稼動人数 + 非契約稼動人数</li>
          <li>契約稼動人数 = 総稼動人数 − 非契約稼動人数</li>
          <li>総稼動率 = 総稼動人数 ÷ 総人数 × 100</li>
          <li>契約稼動率 = 契約稼動人数 ÷ 総人数 × 100</li>
          <li>
            現地稼動人数（日本出張含） = 総稼動人数 − 天津出張人数（日本出張者は現地稼動に含める）
          </li>
          <li>現地稼動率 = 現地稼動人数 ÷ 総人数 × 100</li>
          <li>教育実施人数は稼動人数には含めない（教育 = 非稼動として集計）</li>
          <li>稼動率の目標値 = {JINAN_TARGET_RATE}%（目標以上を緑で表示）</li>
        </ul>
      </Card>
      */}
    </div>
  );
};

export default JinanWorkRateScreen;
