// ModifyDocument.tsx
// 描述：Modify Document(文档修改)画面的示例组件。
// 功能：作为 GenerateDocument 画面 [Modify Doc Link] 的迁移目标画面，接收底盘检索条件。
//       支持嵌入 Menu 右侧内容区域显示（props 传入检索条件），也可作为独立路由画面使用。
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ModifyDocument.css';

/** ModifyDocument 画面 Props（支持嵌入 Menu 右侧区域显示） */
interface ModifyDocumentProps {
  /** 底盘系列（由上一画面传入；缺省时回退路由 state / 演示默认值） */
  chassisSeries?: string;
  /** 底盘编号（由上一画面传入；缺省时回退路由 state / 演示默认值） */
  chassisNo?: string;
  /** 返回回调：嵌入 Menu 右侧区域时返回 GenerateDocument；未提供时回退 navigate('/GenerateDocument') */
  onBack?: () => void;
}

/**
 * ModifyDocument(文档修改)画面示例组件
 * @description 读取底盘系列与底盘编号，作为文档修改的检索条件（画面功能后续实现）。
 *              支持嵌入 Menu 右侧内容区域显示（与 GenerateDoc / GenerateDocument 同一位置）。
 */
const ModifyDocument: React.FC<ModifyDocumentProps> = ({
  chassisSeries: chassisSeriesProp,
  chassisNo: chassisNoProp,
  onBack,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  // 检索条件：优先使用 props（Menu 右侧区域嵌入时传入），其次路由 state，否则演示默认值
  const routeState = (location.state ?? {}) as { chassisSeries?: string; chassisNo?: string };
  const chassisSeries = chassisSeriesProp ?? routeState.chassisSeries ?? 'JPCT';
  const chassisNo = chassisNoProp ?? routeState.chassisNo ?? '013945';

  /** 返回 GenerateDocument 画面 */
  const handleClickBack = () => {
    if (onBack) {
      // 嵌入 Menu 右侧内容区域时返回 GenerateDocument 画面
      onBack();
    } else {
      navigate('/GenerateDocument', { state: { chassisSeries, chassisNo } });
    }
  };

  return (
    <div className='modify-doc'>
      <div className='modify-doc__card'>
        <h1 className='modify-doc__title'>Modify Document</h1>
        <div className='modify-doc__info'>
          Chassis series: {chassisSeries}, Chassis no: {chassisNo}
        </div>
        <div className='modify-doc__placeholder'>
          Document modification screen is under development.
        </div>
        <button
          type='button'
          className='modify-doc__button'
          onClick={handleClickBack}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default ModifyDocument;
