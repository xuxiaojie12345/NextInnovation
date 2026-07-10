import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../config/api';
import './ModifyDocument.css';

/**
 * 变量行数据类型
 * 对应详细设计 DES-ModifyDocument-001 2.1 DataTable四列
 */
interface VariableRow {
  variable: string;
  description: string;
  currentValue: string;
  modifiedValue: string;
}

/**
 * 路由参数类型
 * 从 GenerateDocument 页面跳转时传递
 */
interface LocationState {
  chassisNo: string;
  serie: string;
  market: string;
}

/**
 * ModifyDocument 组件 - 文档修改页面（UD05）
 *
 * 功能说明：
 * 1. 接收从 GenerateDocument 页面传递的 chassisNo 和 market 参数
 * 2. 调用 UD05SelectVariableModificationApi 查询变量列表
 * 3. 以 DataTable 展示 Variable、Description、Current value、Modified value
 * 4. Modified value 支持输入修改，点击 Save 保存修改
 *
 * 对应详细设计：DES-ModifyDocument-001
 */
const ModifyDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  // 从路由参数获取底盘信息（对应设计书 3.1.1 步骤2）
  const chassisNo = state?.chassisNo || '';
  const serie = state?.serie || '';
  const market = state?.market || '';

  // 页面数据状态
  const [variables, setVariables] = useState<VariableRow[]>([]);
  const [templateFile, setTemplateFile] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [templateDownloadError, setTemplateDownloadError] = useState<string>('');

  /**
   * 页面初始化 - 调用 UD05SelectVariableModificationApi
   * 对应设计书 3.1.1 页面初始化流程
   */
  useEffect(() => {
    const fetchVariables = async () => {
      if (!chassisNo) {
        setError('缺少必要的底盘信息');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // 调用 UD05SelectVariableModificationApi（POST）
        // 对应设计书 4.1 接口定义
        const response = await api.post(
          `/api/ud05/modifydocument/query`,
          {
            serie: serie,
            chno: chassisNo
          },
          { timeout: 10000 }
        );

        if (response.data.code === 200 && response.data.data) {
          const data = response.data.data;
          setVariables(data.variables || []);
          setTemplateFile(data.templateFile || '');
        } else {
          // 对应设计书 3.2 校验 No.4
          setError(response.data.message || '未找到该底盘的修改记录');
        }
      } catch (err: any) {
        if (err.code === 'ECONNABORTED') {
          // 请求超时（对应设计书 5. 异常处理 - API超时）
          setError('请求超时，请检查网络连接');
        } else if (err.response) {
          if (err.response.status === 404) {
            setError('未找到该底盘的修改记录');
          } else {
            setError('系统异常，请联系管理员');
          }
        } else if (err.request) {
          setError('网络连接失败，请稍后重试');
        } else {
          setError('系统异常，请联系管理员');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVariables();
  }, [chassisNo]);

  /**
   * 处理 Modified value 输入变化
   * 对应设计书 2.1 Modified value - Input类型，最大长度500字符
   */
  const handleModifiedValueChange = useCallback(
    (index: number, value: string) => {
      // 限制最大长度500字符（对应设计书 3.2 校验 No.3）
      if (value.length <= 500) {
        setVariables((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], modifiedValue: value };
          return updated;
        });
        // 用户重新输入时清空错误提示
        if (message) {
          setMessage('');
        }
      }
    },
    [message]
  );

  /**
   * 判断是否所有 Modified value 均为空或未修改
   * 对应设计书 3.1.2 步骤3 空值校验
   */
  const isAllModifiedEmpty = useCallback((): boolean => {
    return variables.every((row) => !row.modifiedValue || row.modifiedValue.trim() === '');
  }, [variables]);

  /**
   * 点击 Save 按钮 - 保存修改
   * 对应设计书 3.1.2 保存修改流程
   */
  const handleSave = useCallback(async () => {
    // 清除旧消息
    setMessage('');

    // 校验1：所有 Modified value 均为空或未修改（对应设计书 3.2 校验 No.2）
    if (isAllModifiedEmpty()) {
      setMessage('NO UNRELEASED VERSION EXISTS!');
      return;
    }

    // 校验2：任一 Modified value 长度超过500字符（对应设计书 3.2 校验 No.3）
    const hasOverLength = variables.some(
      (row) => row.modifiedValue && row.modifiedValue.length > 500
    );
    if (hasOverLength) {
      setMessage('修改后的值长度不能超过500字符');
      return;
    }

    setIsSaving(true);

    try {
      // 调用 UD05UpdateHdocAdcaModificationApi（POST）
      // 对应设计书 4.1 更新接口
      // 获取当前登录用户ID
      let updateUser = '';
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          updateUser = userInfo.userid || userInfo.username || '';
        }
      } catch { /* ignore */ }

      const updatePromises = variables
        .filter((row) => row.modifiedValue && row.modifiedValue.trim() !== '')
        .map((row) =>
          api.post(`/api/ud05/modifydocument/update`, {
            serie: serie,
            chno: chassisNo,
            variable: row.variable,
            modifiedValue: row.modifiedValue.trim(),
            updateUser: updateUser
          }, { timeout: 10000 })
        );

      await Promise.all(updatePromises);

      // 收集已修改变量的列表（仅包含用户实际改动过的值，用于UD06 Storing显示）
      const modifiedVariables = variables
        .filter((row) => row.modifiedValue && row.modifiedValue.trim() !== '' && row.modifiedValue !== row.currentValue)
        .map((row) => ({
          variable: row.variable,
          modifiedValue: row.modifiedValue.trim()
        }));

      // 保存成功，跳转到 Save Modifications 页面（对应设计书 3.1.2 步骤4）
      navigate('/Menu/SaveModifications', {
        state: {
          chassisNo,
          serie,
          modifiedVariables
        }
      });
    } catch (err: any) {
      if (err.code === 'ECONNABORTED') {
        // 请求超时（对应设计书 5. 异常处理 - API超时）
        setMessage('请求超时，请检查网络连接');
      } else {
        setMessage('保存失败，请稍后重试');
      }
    } finally {
      setIsSaving(false);
    }
  }, [variables, chassisNo, market, isAllModifiedEmpty, navigate]);

  /**
   * 点击 chassis no 链接 - 跳转到 Vehicle Specification 页面（UD07）
   * 对应详细设计 2.1 chassis no Link押下时处理
   * 传递参数：chassisNo（serie + 半角空格 + chassisNo 的拼接值）
   */
  const handleChassisNoClick = useCallback(() => {
    const fullChassisNo = `${serie} ${chassisNo}`.trim();
    if (fullChassisNo) {
      navigate('/Menu/VehicleSpecification', {
        state: { chassisNo: fullChassisNo }
      });
    }
  }, [serie, chassisNo, navigate]);

  /**
   * 模板文件点击处理 - 当前版本未实装下载功能
   */
  const handleTemplateDownload = useCallback(() => {
    setTemplateDownloadError('模板文件下载功能未实装');
  }, []);

  // 加载中状态
  if (loading) {
    return (
      <div className='modify-document-container'>
        <div className='page-header'>
          <h1 className='page-title'>Modify Document</h1>
        </div>
        <div className='loading-message'>加载中...</div>
      </div>
    );
  }

  return (
    <div className='modify-document-container'>
      {/* 页面标题 */}
      <div className='page-header'>
        <h1 className='page-title'>Modify Document</h1>
      </div>

      {/* 错误消息区域 */}
      {error && (
        <div className='error-message-area'>
          <p>{error}</p>
        </div>
      )}

      {/* 消息提示区域（保存校验失败等） */}
      {message && !error && (
        <div className='message-area'>
          <p>{message}</p>
        </div>
      )}

      {/* 底盘信息区域（对应设计书 2.1 chassis no / Market） */}
      <div className='vehicle-info-section'>
        <div className='info-item'>
          <label>chassis no:</label>
          <span
            className='chassis-link'
            onClick={handleChassisNoClick}
            title='点击查看车辆规格'
          >
            {serie ? `${serie} ${chassisNo}` : (chassisNo || '-')}
          </span>
        </div>
        <div className='info-item'>
          <label>Market:</label>
          <span>{market || '-'}</span>
        </div>
      </div>

      {/* 模板文件链接（对应设计书 2.1 Template文件 - 点击下载） */}
      {templateFile && (
        <div className='template-section'>
          <span
            className='template-link'
            onClick={handleTemplateDownload}
          >
            {`Template: ${templateFile}`}
          </span>
          {templateDownloadError && (
            <div className='error-message-area'>
              <p>{templateDownloadError}</p>
            </div>
          )}
        </div>
      )}

      {/* 变量列表 DataTable（对应设计书 2.1 DataTable） */}
      {variables.length > 0 ? (
        <div className='data-table-section'>
          <table className='variable-table'>
            <thead>
              <tr>
                <th className='col-save' colSpan={4}>
                  <button
                    className='save-button'
                    onClick={handleSave}
                    disabled={isSaving || loading}
                  >
                    {isSaving ? '保存中...' : 'Save'}
                  </button>
                </th>
              </tr>
              <tr>
                <th className='col-variable'>Variable</th>
                <th className='col-description'>Description</th>
                <th className='col-current'>Current value</th>
                <th className='col-modified'>Modified value</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((row, index) => (
                <tr key={index}>
                  <td>{row.variable}</td>
                  <td>{row.description || '-'}</td>
                  <td>{row.currentValue || '-'}</td>
                  <td>
                    <input
                      type='text'
                      className='modified-input'
                      value={row.modifiedValue}
                      onChange={(e) => handleModifiedValueChange(index, e.target.value)}
                      placeholder='Enter modified value'
                      disabled={isSaving}
                      maxLength={500}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !error && (
          <div className='empty-message'>
            <p>未找到该底盘的变量记录</p>
          </div>
        )
      )}
    </div>
  );
};

export default ModifyDocument;
