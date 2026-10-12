// SaveModifications.tsx
// 描述：Save Modifications(保存结果)画面组件。
// 功能：Modify Document 画面点击 [Save] 并成功保存后迁移至本画面，
//       显示底盘信息、存储的变量修正值及版本状态（参照内部設計書 4.2 结果处理 / 画面式样图 Save Modifications.png）。
import React from 'react';
import './SaveModifications.css';

/** SaveModifications 画面 Props */
interface SaveModificationsProps {
  /** 底盘系列（例：JPCT） */
  chassisSeries: string;
  /** 底盘编号（例：028321） */
  chassisNo: string;
  /** 文档类型（Doctype），缺省 DIM-PLATE */
  doctype?: string;
  /** 版本号（Version / FOUND UNRELEASED VERSION） */
  version: number;
  /** 存储的修正信息一览（例：Storing: SEAT_NO 4） */
  storedMessages: string[];
  /** 关闭回调：关闭本画面并返回 GenerateDocument 画面 */
  onClose: () => void;
}

/**
 * SaveModifications(保存结果)画面组件
 * @description 显示修正数据的保存结果与版本状态；版本已发行时以绿色背景突出显示。
 * @param props 画面参数（chassisSeries / chassisNo / doctype / version / storedMessages / onClose）
 */
const SaveModifications: React.FC<SaveModificationsProps> = ({
  chassisSeries,
  chassisNo,
  doctype = 'DIM-PLATE',
  version,
  storedMessages,
  onClose,
}) => {
  return (
    <div className='save-mod'>
      {/* 内容区：浅蓝色边框矩形（与 Generate document 画面风格统一） */}
      <div className='save-mod__card'>
        {/* 画面标题：深蓝粗体 */}
        <h1 className='save-mod__title'>Save Modifications</h1>

        {/* 结果明细：等宽字体逐行表示 */}
        <div className='save-mod__body'>
          <p className='save-mod__line'>Chassis serie: {chassisSeries}</p>
          <p className='save-mod__line'>Chassis number: {chassisNo}</p>
          <p className='save-mod__line'>Doctype: {doctype}</p>
          <p className='save-mod__line'>&nbsp;</p>
          <p className='save-mod__line'>Version: {version}</p>
          <p className='save-mod__line'>&nbsp;</p>

          {/* 存储的修正信息（例：Storing: SEAT_NO 4） */}
          {storedMessages.map((storedMessage, index) => (
            <p className='save-mod__line' key={`stored-${index}`}>
              {storedMessage}
            </p>
          ))}

          <p className='save-mod__line'>
            FOUND UNRELEASED VERSION: {version}
          </p>
          {/* 版本已发行：绿色背景突出显示 */}
          <p className='save-mod__line save-mod__line--released'>
            VERSION IS RELEASED
          </p>
        </div>

        {/* Close 按钮：关闭本画面（浅灰色，与 Generate document 按钮统一） */}
        <button
          type='button'
          className='save-mod__button'
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SaveModifications;
