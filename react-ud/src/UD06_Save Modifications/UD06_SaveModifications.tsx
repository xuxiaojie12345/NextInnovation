import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD06_SaveModifications.css';

/**
 * Save Modifications 页面状态对象
 */
interface SaveModificationsState {
  chassisSerie: string;
  chassisNumber: string;
  doctype: string;
  version: string;
  storing: string;
  foundUnreleasedVersion: string;
  message: string;
  isLoading: boolean;
}

/**
 * UD06 Save Modifications 页面组件
 *
 * 功能说明：
 * - 从前画面接收 chassisSerie 和 chassisNo，调用后端接口获取修改确认信息
 * - 显示 Chassis 信息、Doctype、版本、Storing 信息和固定提示信息
 * - 支持 Close 按钮返回上一画面
 *
 * @component
 * @returns {JSX.Element} Save Modifications 页面元素
 */
const UD06_SaveModifications: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  const [state, setState] = useState<SaveModificationsState>({
    chassisSerie: '',
    chassisNumber: '',
    doctype: '',
    version: '',
    storing: '',
    foundUnreleasedVersion: '',
    message: '',
    isLoading: false,
  });

  // ==================== 生命周期 ====================
  useEffect(() => {
    const routeState = location.state as any;
    const chassisSerie = routeState?.chassisSerie || routeState?.chassisSeries || '';
    const chassisNumber = routeState?.chassisNo || '';
    // 从UD05传来的modifiedItems中提取变量名列表
    const modifiedItems: Array<{ variable: string; currentValue: string; modifiedValue: string }> = routeState?.modifiedItems || [];

    if (!chassisSerie || !chassisNumber) {
      setState(prev => ({
        ...prev,
        message: 'We can not get the data. Please try again.',
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      chassisSerie,
      chassisNumber,
      message: '',
      isLoading: true,
    }));

    // 将变量名列表传给API，确保能精确查询每条修改记录
    const variables = modifiedItems.map(item => item.variable);
    fetchSaveModificationsData(chassisSerie, chassisNumber, variables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // ==================== API调用 ====================
  /**
   * 调用后端接口获取 Save Modifications 数据
   * Method: POST
   * Endpoint: /api/ud06/savemodifications
   *
   * @param chassisSerie - Chassis series
   * @param chassisNumber - Chassis number
   * @param variables - 修改的变量名列表（从UD05传入），用于精确查询每条修改记录
   */
  const fetchSaveModificationsData = async (chassisSerie: string, chassisNumber: string, variables?: string[]) => {
    try {
      const response = await apiClient.post('/api/ud06/savemodifications', {
        chassisSerie,
        chassisNo: chassisNumber,
        variables: variables && variables.length > 0 ? variables : undefined,
      });

      if (response.data?.code === 200 && response.data?.data) {
        const data = response.data.data;
        const storingText = `${data.variable || ''} ${data.newVal || data.newval || ''}`.trim();
        console.log('data:', data);
        console.log('storingText:', storingText);
        setState(prev => ({
          ...prev,
          doctype: data.doctype || '',
          version: data.vers || '',
          storing: storingText,
          foundUnreleasedVersion: data.vers || '',
          message: '',
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          doctype: '',
          version: '',
          storing: '',
          foundUnreleasedVersion: '',
          message: 'We can not get the data. Please try again.',
          isLoading: false,
        }));
      }
    } catch (error: any) {
      console.error('获取 UD06 Save Modifications 数据失败:', error);
      let errorMessage = 'System error. Please try again later.';

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'We can not get the data. Please try again.';
        } else if (error.response.status === 500) {
          errorMessage = 'System error. Please try again later.';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your network.';
      }

      setState(prev => ({
        ...prev,
        doctype: '',
        version: '',
        storing: '',
        foundUnreleasedVersion: '',
        message: errorMessage,
        isLoading: false,
      }));
    }
  };

  // ==================== 事件处理 ====================
  /**
   * Close 按钮点击事件
   * 关闭当前画面并返回上一页
   */
  const handleClose = () => {
    navigate(-1);
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud06-container'>
      <div className='ud06-card'>
        <h1 className='ud06-title'>Save Modifications</h1>

        <div className='ud06-row'>
          <span className='ud06-label'>Chassis serie:</span>
          <span className='ud06-value'>{state.chassisSerie || '-'}</span>
        </div>

        <div className='ud06-row'>
          <span className='ud06-label'>Chassis number:</span>
          <span className='ud06-value'>{state.chassisNumber || '-'}</span>
        </div>

        <div className='ud06-row'>
          <span className='ud06-label'>Doctype:</span>
          <span className='ud06-value'>{state.doctype || '-'}</span>
        </div>

        <div className='ud06-row-empty1'>
          <span className='ud06-label'></span>
          <span className='ud06-value'></span>
        </div>

        <div className='ud06-row'>
          <span className='ud06-label'>Version:</span>
          <span className='ud06-value'>{state.version || '-'}</span>
        </div>

        <div className='ud06-row-empty2'>
          <span className='ud06-label'></span>
          <span className='ud06-value'></span>
        </div>

        <div className='ud06-row'>
          <span className='ud06-label'>Storing:</span>
          <span className='ud06-value'>{state.storing || '-'}</span>
        </div>

        <div className='ud06-row'>
          <span className='ud06-label'>FOUND UNRELEASED VERSION:</span>
          <span className='ud06-value'>{state.foundUnreleasedVersion || '-'}</span>
        </div>

        <div className='ud06-message-box'>
          <span>VERSION IS RELEASED</span>
        </div>

        {state.message && (
          <div className='ud06-error-message'>
            {state.message}
          </div>
        )}

        <div className='ud06-row-empty1'>
          <span className='ud06-label'></span>
          <span className='ud06-value'></span>
        </div>
        
        <button
          className='ud06-close-button'
          onClick={handleClose}
          disabled={state.isLoading}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UD06_SaveModifications;
