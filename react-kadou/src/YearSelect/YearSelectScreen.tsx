import React, { useEffect, useMemo, useState } from 'react';
import { Card, Empty, Spin, Tag, Typography, message } from 'antd';
import { CalendarOutlined, CheckCircleFilled } from '@ant-design/icons';
import { fetchYearSelect } from '../api/yearSelect';
import type { YearSelectItem } from '../api/yearSelect';
import './YearSelectScreen.css';

const { Title, Text } = Typography;

/** 年度選択画面が表示する項目（バックエンド取得値 + 描画用の hasData） */
type YearSelectItemView = YearSelectItem & { hasData: boolean };

interface YearSelectScreenProps {
  /** 現在選択中の年度 */
  selectedYear: number;
  /** 年度を選択したとき（App 側で未保存チェックを行う） */
  onSelect: (year: number) => void;
}

/**
 * 年度選択 画面
 *
 * すべてのデータ（部門・要員・プロジェクト・休日・済南統計・稼動グリッド）は
 * 年度に紐づく。ここで年度を切り替えると、全画面がその年度のデータに切り替わる。
 * ※バックエンド /api/year-summaries から年度ごとのデータ概要を取得して表示する。
 */
const YearSelectScreen: React.FC<YearSelectScreenProps> = ({
  selectedYear,
  onSelect,
}) => {
  // ロード中フラグ
  const [loading, setLoading] = useState(true);
  // 年度ごとのデータ概要（バックエンドから取得）
  const [summaries, setSummaries] = useState<YearSelectItemView[]>([]);

  // マウント時にバックエンドから年度概要を取得する
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchYearSelect();
        if (!alive) return;
        setSummaries(
          list.map((s) => ({
            ...s,
            hasData:
              s.departmentCount +
                s.personnelCount +
                s.projectCount +
                s.holidayCount >
              0,
          })),
        );
      } catch {
        if (!alive) return;
        message.error('年度データを取得できませんでした。');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /**
   * 表示する年度の並び。
   * 「既存データがある年度」から「既存データの最新年度 + 未来3年」までを連番で並べる。
   * 未来でデータが無い年は hasData=false（データ未準備の空カード）で表示する。
   */
  const viewYears = useMemo(() => {
    const existingYears = summaries.map((s) => s.year);
    const earliest = existingYears.length
      ? Math.min(...existingYears)
      : selectedYear;
    const latest = existingYears.length
      ? Math.max(...existingYears)
      : selectedYear;
    const startYear = Math.min(earliest, selectedYear);
    const endYear = Math.max(latest + 3, selectedYear);
    const byYear = new Map(summaries.map((s) => [s.year, s]));
    const years: YearSelectItemView[] = [];
    for (let y = startYear; y <= endYear; y += 1) {
      years.push(
        byYear.get(y) ?? {
          year: y,
          departmentCount: 0,
          personnelCount: 0,
          projectCount: 0,
          holidayCount: 0,
          weekCount: 0,
          hasData: false,
        },
      );
    }
    return years;
  }, [summaries, selectedYear]);

  return (
    <div className='screen-page'>
      <div className='screen-header'>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            年度選択
          </Title>
          <Text type='secondary'>
            表示する年度を選んでください。部門・要員・プロジェクト・休日などのマスタ情報も年度ごとに切り替わります。
          </Text>
        </div>
        <Tag color='green'>選択中：{selectedYear}年度</Tag>
      </div>

      <Card className='screen-card' style={{ marginTop: 12 }}>
        {loading ? (
          <div className='year-loading'>
            <Spin tip='年度データを読み込み中...' />
          </div>
        ) : (
          <div className='year-grid'>
            {viewYears.map((s) => {
              const selected = s.year === selectedYear;
              return (
                <button
                  key={s.year}
                  type='button'
                  className={`year-card${selected ? ' year-card-selected' : ''}${
                    s.hasData ? '' : ' year-card-empty'
                  }`}
                  onClick={() => onSelect(s.year)}
                >
                  <div className='year-card-head'>
                    <CalendarOutlined />
                    <span className='year-card-year'>{s.year}</span>
                    {selected && <CheckCircleFilled className='year-card-check' />}
                  </div>
                  {s.hasData ? (
                    <ul className='year-card-body'>
                      <li>部門 {s.departmentCount}</li>
                      <li>要員 {s.personnelCount}</li>
                      <li>項目 {s.projectCount}</li>
                      <li>休日 {s.holidayCount}</li>
                      <li>{s.weekCount} 週</li>
                    </ul>
                  ) : (
                    <Empty
                      className='year-card-empty-body'
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description='データ未準備'
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
        <Text type='secondary' className='year-note'>
          ※「データ未準備」の年度は中身が空（空白）で表示されます。
        </Text>
      </Card>
    </div>
  );
};

export default YearSelectScreen;