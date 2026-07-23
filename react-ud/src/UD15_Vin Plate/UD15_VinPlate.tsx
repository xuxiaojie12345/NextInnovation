import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UD15_VinPlate.css';
import apiClient from '../api/config';

/**
 * 打印项数据接口
 */
interface PrintItemData {
  name: string;          // 打印项名称
  value: string;         // 打印项值
}

/**
 * VP数据项接口
 */
interface VpDataItem {
  variantName: string;   // 变体名
  value: string;         // 值
}

/**
 * VIN Plate信息接口
 */
interface VinPlateInfo {
  chassisNumber: string;                              // 底盘号
  plateType: string;                                  // 板类型（从TYPE字段获取）
  status: string;                                     // 状态（从STATUS字段获取）
  errorMessage: string;                               // 错误消息（从MSG字段获取）
  registerDatetime: string;                           // 注册时间（从REGISTER_DATETIME字段获取）
  docReady: string;                                   // 文档就绪（从DOC_READY字段获取）
  docSent: string;                                    // 文档发送（从DOC_SENT字段获取）
  printItems: PrintItemData[];                        // 打印项列表（XML_DOC中的PrintItemName名及其值）
  vpData: VpDataItem[];                               // VP数据列表（XML_DOC中的Variant名和Value的值）
}

/**
 * UD15_VinPlate - VIN Plate 数据管理页面组件
 *
 * @component
 * @returns {JSX.Element} VIN Plate数据管理页面元素
 */
const UD15_VinPlate: React.FC = () => {
  const navigate = useNavigate();

  // 未登录时重定向到登录页面
  useEffect(() => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ==================== 状态管理 ====================
  const [chassisNumber, setChassisNumber] = useState<string>('');     // 底盘号输入值
  const [plateInfo, setPlateInfo] = useState<VinPlateInfo | null>(null); // VIN Plate信息
  const [message, setMessage] = useState<string>('');                  // 消息
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false);          // 加载状态标识

  // ==================== 常量定义 ====================
  const MAX_CHASSIS_LENGTH = 15;  // 底盘号最大长度1）

  // ==================== 工具函数 ====================

  /**
   * 从底盘号中拆分出chassisSerie和chassisNo
   * Chassis number的半角英字部分赋值给chassisSerie，半角数字部分赋值给chassisNo
   *
   * @param {string} chassisNumber - 完整底盘号
   * @returns {{ chassisSerie: string, chassisNo: string }} 拆分后的系列和编号
   */
  const splitChassisNumber = (chassisNumber: string) => {
    // 提取前半部分英文字母作为chassisSerie
    const matchSerie = chassisNumber.match(/^[A-Za-z]+/);
    // 提取后半部分数字作为chassisNo
    const matchNo = chassisNumber.match(/\d+$/);
    return {
      chassisSerie: matchSerie ? matchSerie[0] : '',
      chassisNo: matchNo ? matchNo[0] : '',
    };
  };

  /**
   * 显示消息并自动设置消息类型
   *
   * @param {string} msg - 消息内容
   * @param {'success' | 'error' | 'warning' | 'info'} type - 消息类型
   */
  const showMessage = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  // ==================== API调用 ====================

  /**
   * 获取VIN Plate详细信息
   */
  const handleViewInfo = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedChassis = chassisNumber.trim();

    // 2. 空值校验（前端校验）
    if (!trimmedChassis) {
      showMessage('请输入底盘号', 'error');
      return; // 终止流程
    }
    // 4. 拆分底盘号
    const { chassisSerie, chassisNo } = splitChassisNumber(trimmedChassis);
    // 5. API调用（后端校验）
    setIsLoading(true);
    showMessage('', 'info');
    try {
      const response = await apiClient.get('/api/ud15/info', {
        params: {
          chassisSerie,
          chassisNo,
        },
      });

      // 6. 结果处理
      if (response.data && response.data.code === 200 && response.data.data) {
        // 成功 - 底盘号存在
        const data = response.data.data;
        const info: VinPlateInfo = {
          chassisNumber: data.chassisNumber || trimmedChassis,
          plateType: data.plateType || '',
          status: data.status || '',
          errorMessage: data.errorMessage || '',
          registerDatetime: data.registerDatetime || '',
          docReady: data.docReady || '',
          docSent: data.docSent || '',
          printItems: (data.printItems || []).map((item: any) => ({
            name: item.name || '',
            value: item.value || '',
          })),
          vpData: data.vpData || [],
        };
        setPlateInfo(info);
        showMessage('', 'info');
      } else {
        // 失败 - 底盘号不存在或查询失败
        const notFoundMsg = response.data?.msg
          ? `Chassis number ${trimmedChassis} not found.`
          : (response.data?.msg || '查询失败');
        showMessage(notFoundMsg, 'warning');
        setPlateInfo(null);
      }
    } catch (error: any) {
      // 异常处理
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 404) {
          // 底盘号不存在
          showMessage(`Chassis number ${trimmedChassis} not found.`, 'warning');
        } else if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员', 'error');
        } else {
          showMessage(error.response.data?.msg || '查询失败', 'error');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置', 'error');
      } else {
        showMessage('数据库查询失败，请联系管理员', 'error');
      }
      setPlateInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 执行状态更新操作（抽像方法）
   */
  const updateStatus = async (endpoint: string, successMsg: string) => {
    const trimmedChassis = chassisNumber.trim();

    if (!plateInfo) {
      showMessage('请先查询Chassis信息', 'error');
      return;
    }

    if (!trimmedChassis) {
      showMessage('请输入底盘号', 'error');
      return;
    }

    const { chassisSerie, chassisNo } = splitChassisNumber(trimmedChassis);

    setIsLoading(true);
    showMessage('', 'info');

    try {
      const response = await apiClient.post(endpoint, { chassisSerie, chassisNo });

      if (response.data && response.data.code === 200) {
        showMessage(successMsg, 'success');
        handleRefreshInfo(chassisSerie, chassisNo, trimmedChassis);
      } else {
        const errorMsg = response.data?.msg || `Chassis number ${trimmedChassis} not found.`;
        showMessage(errorMsg, 'warning');
      }
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 404) {
          showMessage(`Chassis number ${trimmedChassis} not found.`, 'warning');
        } else if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员', 'error');
        } else {
          showMessage(error.response.data?.msg || '操作失败', 'error');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置', 'error');
      } else {
        showMessage('数据库更新失败，请联系管理员', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /** Set Regenerate 按钮压下 - 设置重新生成 */
  const handleSetRegenerate = () => updateStatus('/api/ud15/regenerate', '状态已更新为重新生成');
  /** Set OK 按钮压下 - 设置完成状态 */
  const handleSetOk = () => updateStatus('/api/ud15/setok', '状态已更新为OK');
  /** Change to Basic Info 按钮压下 - 切换为基础信息 */
  const handleChangeBasic = () => updateStatus('/api/ud15/changebasic', '已切换到基本信息');
  /** Change to Advanced Info 按钮压下 - 切换为高级信息 */
  const handleChangeAdvanced = () => updateStatus('/api/ud15/changeadvanced', '已切换到高级信息');

  /**
   * 刷新VIN Plate信息
   * 在状态更新操作成功后调用，重新查询最新数据
   *
   * @param {string} chassisSerie - 底盘系列
   * @param {string} chassisNo - 底盘编号
   * @param {string} fullChassis - 完整底盘号
   */
  const handleRefreshInfo = async (chassisSerie: string, chassisNo: string, fullChassis: string) => {
    try {
      const response = await apiClient.get('/api/ud15/info', {
        params: { chassisSerie, chassisNo },
      });

      if (response.data && response.data.code === 200 && response.data.data) {
        const data = response.data.data;
        const info: VinPlateInfo = {
          chassisNumber: data.chassisNumber || fullChassis,
          plateType: data.plateType || '',
          status: data.status || '',
          errorMessage: data.errorMessage || '',
          registerDatetime: data.registerDatetime || '',
          docReady: data.docReady || '',
          docSent: data.docSent || '',
          printItems: (data.printItems || []).map((item: any) => ({
            name: item.name || '',
            value: item.value || '',
          })),
          vpData: data.vpData || [],
        };
        setPlateInfo(info);
      }
    } catch (error) {
      // 刷新失败不影响主操作的消息显示
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Chassis number 输入变化
   * 只允许半角英字（A-Z a-z）和半角数字（0-9），其他字符自动过滤
   * 用户体验优化：用户重新输入时清空错误提示
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handleChassisNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    // 只允许半角英字和半角数字
    const filteredValue = rawValue.replace(/[^A-Za-z0-9]/g, '');
    setChassisNumber(filteredValue);
    if (message) {
      setMessage('');
    }
  };

  /**
   * 处理键盘事件 - 按Enter键触发View Info
   *
   * @param {React.KeyboardEvent<HTMLInputElement>} e - 键盘事件对象
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleViewInfo();
    }
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud15-container'>
      <div className='ud15-content'>
        {/* 页面标题 */}
        <h1 className='ud15-title'>VIN Plate</h1>

        {/* 消息显示区域 */}
        {message && (
          <div className={`ud15-message ud15-message--${messageType}`}>
            {message}
          </div>
        )}

        {/* 输入区域 */}
        <div className='ud15-input-section'>
          {/* Chassis number 输入框 */}
          <div className='ud15-form-group'>
            <label htmlFor='chassisNumber'>
              Chassis number
            </label>
            <input id='chassisNumber' type='text' className='ud15-input' value={chassisNumber}
              onChange={handleChassisNumberChange}
              onKeyDown={handleKeyDown}
              placeholder='请输入底盘号'
              disabled={isLoading}
              maxLength={MAX_CHASSIS_LENGTH}
            />
          </div>
        </div>

        {/* 按钮区域 - 所有按钮排成一行 */}
        <div className='ud15-button-group'>
          <button className='ud15-btn' onClick={handleViewInfo} disabled={isLoading}>View Info</button>
          <button className='ud15-btn' onClick={handleSetRegenerate} disabled={isLoading}>Set Regenerate</button>
          <button className='ud15-btn' onClick={handleSetOk} disabled={isLoading}>Set OK</button>
          <button className='ud15-btn' onClick={handleChangeBasic} disabled={isLoading}>Change to Basic Info</button>
          <button className='ud15-btn' onClick={handleChangeAdvanced} disabled={isLoading}>Change to Advanced Info</button>
        </div>

        {/* 加载状态提示 */}
        {isLoading && (
          <div className='ud15-loading'>加载中...</div>
        )}

        {/* 输出区域 - VIN Plate详细信息 */}
        {!plateInfo && !isLoading && (
          <div className='ud15-info-prompt'>
            Please enter a chassis number
          </div>
        )}
        {plateInfo && (
          <div className='ud15-info-panel'>
            {/* 信息列表区域 - 单列布局 */}
            <div className='ud15-info-list'>
              {/* Chassis number - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Chassis number</span>
                <span className='ud15-info-value'>{plateInfo.chassisNumber}</span>
              </div>

              {/* Plate type - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Plate type</span>
                <span className='ud15-info-value'>{plateInfo.plateType || '-'}</span>
              </div>

              {/* Status - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Status</span>
                <span className='ud15-info-value'>{plateInfo.status || '-'}</span>
              </div>

              {/* Error Message - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Error Message</span>
                <span className='ud15-info-value'>{plateInfo.errorMessage || '-'}</span>
              </div>

              {/* Def. (Register Datetime) - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Def.</span>
                <span className='ud15-info-value'>{plateInfo.registerDatetime || '-'}</span>
              </div>

              {/* Data ready (Doc Ready) - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Data ready</span>
                <span className='ud15-info-value'>{plateInfo.docReady || '-'}</span>
              </div>

              {/* Sent to CAB factory (Doc Sent) - 输出 */}
              <div className='ud15-info-row'>
                <span className='ud15-info-label'>Sent to CAB factory</span>
                <span className='ud15-info-value'>{plateInfo.docSent || '-'}</span>
              </div>
            </div>

            {/* PrintItemName 区域 */}
            <div className='ud15-vp-section'>
              <h3 className='ud15-section-title'>PrintItemName</h3>
              {plateInfo.printItems && plateInfo.printItems.length > 0 ? (
                <table className='ud15-vp-table'>
                  <tbody>
                    {plateInfo.printItems.map((item, index) => (
                      <tr key={`print-${index}`}>
                        <td className='ud15-vp-label'>{item.name}</td>
                        <td className='ud15-vp-value'>{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span className='ud15-empty-text'>无数据</span>
              )}
            </div>

            {/* VP Data 区域 */}
            <div className='ud15-vp-section'>
              <h3 className='ud15-section-title'>VP Data</h3>
              {plateInfo.vpData && plateInfo.vpData.length > 0 ? (
                <table className='ud15-vp-table'>
                  <tbody>
                    {plateInfo.vpData.map((item, index) => (
                      <tr key={`vp-${index}`}>
                        <td className='ud15-vp-label'>{item.variantName}</td>
                        <td className='ud15-vp-value'>{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span className='ud15-empty-text'>无数据</span>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default UD15_VinPlate;
