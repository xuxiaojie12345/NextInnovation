import React from 'react';
import { Card, Empty, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleFilled } from '@ant-design/icons';
import type { YearSummary } from '../data/yearStore';
import './YearSelectScreen.css';

const { Title, Text } = Typography;

interface YearSelectScreenProps {
  /** 現在選択中の年度 */
  selectedYear: number;
  /** 年度を選択したとき（App 側で未保存チェックを行う） */
  onSelect: (year: number) => void;
  /** 年度ごとのデータ概要 */
  summaries: YearSummary[];
}

/**
 * 年度選択 画面
 *
 * すべてのデータ（部門・要員・プロジェクト・休日・済南統計・稼動グリッド）は
 * 年度に紐づく。ここで年度を切り替えると、全画面がその年度のデータに切り替わる。
 * ※データ未準備の年度は選択できるが、中身は空（空白表示）になる。
 */
const YearSelectScreen: React.FC<YearSelectScreenProps> = ({
  selectedYear,
  onSelect,
  summaries,
}) => (
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
      <div className='year-grid'>
        {summaries.map((s) => {
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
      <Text type='secondary' className='year-note'>
        ※「データ未準備」の年度は中身が空（空白）で表示されます。
      </Text>
    </Card>
  </div>
);

export default YearSelectScreen;
