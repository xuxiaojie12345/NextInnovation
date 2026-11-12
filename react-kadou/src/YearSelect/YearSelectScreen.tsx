import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Spin, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleFilled } from '@ant-design/icons';
import { AVAILABLE_YEARS } from '../data/yearStore';
import { fetchYearSelect } from '../api/yearSelect';
import { displayMessage } from '../utils/normalizeError';
import { notifySystemError } from '../utils/systemError';
import { messageInfo } from '../constants/messages';
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
  /** この画面が表示中かどうか（表示中になったときにDBから再取得する） */
  active: boolean;
}

/**
 * 年度選択 画面
 *
 * 表示対象は 2025年度〜2036年度（MIN_YEAR〜MAX_YEAR）のデータ。
 * すべてのデータ（部門・要員・プロジェクト・休日・済南統計・稼動グリッド）は
 * 年度に紐づく。ここで年度を切り替えると、全画面がその年度のデータに切り替わる。
 * ※バックエンド /api/year-summaries から年度ごとのデータ概要を取得して表示する。
 */
const YearSelectScreen: React.FC<YearSelectScreenProps> = ({
  selectedYear,
  onSelect,
  active,
}) => {
  // ロード中フラグ
  const [loading, setLoading] = useState(true);
  // 取得エラーの表示メッセージ（空 = エラーなし）。設計案の起動時エラーに相当。
  const [error, setError] = useState('');
  // 年度ごとのデータ概要（バックエンドから取得）
  const [summaries, setSummaries] = useState<YearSelectItemView[]>([]);

  /** バックエンドから年度概要を取得して画面状態を更新する（再試行時も呼ばれる） */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await fetchYearSelect();
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
    } catch (err) {
      if (!notifySystemError(err)) {
        setError(
          displayMessage(err, messageInfo('E_KADOU_011')),
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // この画面が表示中になったときにバックエンドから年度概要を取得する。
  // ※全画面は常時マウントされているため、マウント時だけだと画面を開き直しても
  //   再取得が走らず最新のDBデータが反映されない。active が true になったら再取得する。
  useEffect(() => {
    if (!active) return;
    load();
  }, [active, load]);

  /**
   * 表示する年度の並び。
   * 2025年度〜2036年度（MIN_YEAR〜MAX_YEAR）の各年度を連番で並べる。
   * データが無い年は hasData=false（データ未準備の空カード）で表示する。
   */
  const viewYears = useMemo(() => {
  const byYear = new Map(summaries.map((s) => [s.year, s]));
  return AVAILABLE_YEARS.map((y) => {
    const s = byYear.get(y);
    return s
      ? {
          ...s,
          hasData:
            s.departmentCount + s.personnelCount + s.projectCount + s.holidayCount > 0,
        }
      : {
          year: y,
          departmentCount: 0,
          personnelCount: 0,
          projectCount: 0,
          holidayCount: 0,
          weekCount: 0,
          hasData: false,
        };
  });
}, [summaries]);

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
        {error && summaries.length === 0 && !loading ? (
          // 設計案 4.5 / 5：年度一覧の取得失敗は画面内エラーとして全面表示し、再試行できる
          <div className='year-error'>
            <Alert
              type='error'
              showIcon
              message={messageInfo('E_KADOU_011')}
              description={error}
              action={
                <Button size='small' onClick={load}>
                  再試行
                </Button>
              }
            />
          </div>
        ) : (
          <Spin spinning={loading}>
            {error && (
              // 既に表示済みデータがあり、再取得だけ失敗した場合はリストを維持して再試行を促す
              <Alert
                type='error'
                showIcon
                message={messageInfo('E_KADOU_023')}
                description={error}
                action={
                  <Button size='small' onClick={load}>
                    再試行
                  </Button>
                }
                style={{ marginBottom: 12 }}
              />
            )}
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
          </Spin>
        )}
        <Text type='secondary' className='year-note'>
          ※「データ未準備」の年度は中身が空（空白）で表示されます。
        </Text>
      </Card>
    </div>
  );
};

export default YearSelectScreen;