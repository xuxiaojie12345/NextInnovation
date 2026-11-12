import React from 'react';
import { Result, Typography } from 'antd';
import { SystemErrorDetail } from './utils/systemError';
import './SystemErrorScreen.css';

const { Text } = Typography;

interface SystemErrorScreenProps {
  detail?: SystemErrorDetail;
}

const SystemErrorScreen: React.FC<SystemErrorScreenProps> = ({ detail }) => {
  // HTTP ステータスコードを最優先で表示する（向きの HTTP 500 / 502 / 404 など）。
  // ステータスが無い場合は業務 code（SYSTEM_ERROR など）を表示する。
  const code = detail?.status
    ? `HTTP ${detail.status}`
    : detail?.code ?? 'SYSTEM_ERROR';
  const message =
    detail?.message ??
    'サーバーとの通信に問題が発生しました。しばらく経ってから、もう一度お試しください。';

  return (
    <div className='system-error-page'>
      <Result
        status='error'
        title='サーバーエラー'
        subTitle={
          <div>
            <Text strong>{code}</Text>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{`  ${message}`}</Text>
          </div>
        }
      />
    </div>
  );
};

export default SystemErrorScreen;