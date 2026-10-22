import React from 'react';
import { Button, Modal, Typography } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

const { Text } = Typography;

interface UnsavedChangesModalProps {
  /** 表示するか */
  open: boolean;
  /** 未保存の内容を保存して実行する */
  onSave: () => void;
  /** 未保存の内容を破棄して実行する */
  onDiscard: () => void;
  /** キャンセル（何もしない） */
  onCancel: () => void;
  /** 対象年度（本文に表示する） */
  year: number;
}

/**
 * 未保存の変更がある状態で「年度切替」「ログアウト」を行おうとしたときの確認ダイアログ。
 *  - 保存して実行
 *  - 破棄して実行
 *  - キャンセル
 * の 3 択。
 */
const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  open,
  onSave,
  onDiscard,
  onCancel,
  year,
}) => (
  <Modal
    open={open}
    closable={false}
    maskClosable={false}
    keyboard={false}
    title={
      <span>
        <ExclamationCircleFilled style={{ color: '#faad14', marginRight: 8 }} />
        未保存の変更があります
      </span>
    }
    footer={
      <div className='unsaved-modal-footer'>
        <Button onClick={onCancel}>キャンセル</Button>
        <Button danger onClick={onDiscard}>
          破棄して続行
        </Button>
        <Button type='primary' onClick={onSave}>
          保存して続行
        </Button>
      </div>
    }
  >
    <Text>
      {year}年度の「要員稼動管理」に保存されていない変更があります。
      <br />
      保存してから続行しますか？破棄すると、直近の保存状態に戻ります。
    </Text>
  </Modal>
);

export default UnsavedChangesModal;
