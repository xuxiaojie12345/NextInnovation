import React from 'react';
import { CloseCircleFilled } from '@ant-design/icons';
import './ServerErrorScreen.css';

interface ServerErrorScreenProps {
  /** 接続失敗時の HTTP ステータス（通信不可は 503） */
  status?: number;
}

/** API 接続失敗時に全画面表示するエラー画面 */
const ServerErrorScreen: React.FC<ServerErrorScreenProps> = ({
  status = 503,
}) => (
  <div className='server-error-screen' role='alert'>
    <CloseCircleFilled className='server-error-icon' />
    <div className='server-error-title'>サーバーエラー</div>
    <div className='server-error-message'>
      HTTP {status}　システムエラーが発生しました。データベースに接続できませんでした。
    </div>
  </div>
);

export default ServerErrorScreen;
