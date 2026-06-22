import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ModifyDocument.css';

/**
 * ModifyDocument组件 - 车辆认证文档修改页面
 * 
 * @description 显示需要修改的变量列表及其当前值和新值，支持用户修改变量值并保存
 * @props 无Props，通过路由state接收参数
 */
const ModifyDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [chassisNo, setChassisNo] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [chassisSerie, setChassisSerie] = useState<string>('');
  const [dataTableList, setDataTableList] = useState<Array<{
    variable: string;
    description: string;
    currentValue: string;
    modifiedValue: string;
  }>>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  /**
   * 画面初期表示 - 从路由state获取参数并调用API
   * 对应设计书 3.1 画面初期
   */
  useEffect(() => {
    // 从路由state中获取参数
    const state = location.state as any;
    if (state && state.chassisNo && state.market && state.userId) {
      setChassisNo(state.chassisNo);
      setMarket(state.market);
      setUserId(state.userId);
      
      // 解析chassisSerie（从chassisNo中提取或单独传递）
      // 假设chassisNo格式为 "JPCT 028321"，提取系列部分
      const parts = state.chassisNo.split(' ');
      const serie = parts.length > 1 ? parts[0] : '';
      setChassisSerie(serie);
      
      // 调用API获取数据
      fetchVariableModificationData(serie, state.chassisNo);
    } else {
      // 初期不显示错误信息，只设置loading为false
      setIsLoading(false);
    }
  }, [location.state]);

  /**
   * 调用UD05SelectVariableModificationApi获取变量修改数据
   * 对应设计书 5.1 UD05SelectVariableModificationApi
   * 
   * @param serieParam 底盘系列
   * @param chnoParam 底盘号
   */
  const fetchVariableModificationData = async (serieParam: string, chnoParam: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 (对应设计书 5.1 UD05SelectVariableModificationApi)
      const response = await axios.post('/api/UD05/SelectVariableModification', {
        serie: serieParam,
        chno: chnoParam
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // 映射返回的数据到DataTable列表 (对应设计书 4.1.1 步骤1)
        // 注意：实际返回可能是数组，这里假设返回单条或多条数据
        const list = Array.isArray(data) ? data : [data];
        
        const mappedList = list.map((item: any) => ({
          variable: item.variable || '',
          description: item.description || '',
          currentValue: item.newval || '', // Current value来自NEWVAL字段
          modifiedValue: '' // Modified value初始为空
        }));
        
        setDataTableList(mappedList);
      } else {
        // API返回失败 (对应设计书 6. 异常处理)
        setErrorMessage(response.data.message || '情报取得失败');
      }
    } catch (error: any) {
      // 捕获网络错误或服务器错误 (对应设计书 6. 异常处理)
      if (error.response) {
        setErrorMessage(error.response.data?.message || '情报取得失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('系统维护中，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理Modified value输入变化
   * 
   * @param index DataTable行索引
   * @param value 输入的新值
   */
  const handleModifiedValueChange = (index: number, value: string) => {
    setDataTableList(prevList => {
      const newList = [...prevList];
      newList[index] = {
        ...newList[index],
        modifiedValue: value
      };
      return newList;
    });
    
    // 清除错误消息
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  /**
   * Template ファイル Link点击处理
   * 对应设计书 3.2 Link 'Template: aus/UD_TEST.odt' 押下
   */
  const handleTemplateFileClick = () => {
    // 下载 "aus/UD_TEST.odt" 文件
    window.open('/api/download/template/aus_UD_TEST.odt', '_blank');
  };

  /**
   * Chassis no Link点击处理
   * 对应设计书 3.3 Link 'Chassis no' 押下
   */
  const handleChassisNoClick = () => {
    // 跳转到VehicleSpecification画面，传递userId和chassisNo参数
    navigate('/VehicleSpecification', { state: { userId, chassisNo } });
  };

  /**
   * Save按钮点击处理
   * 对应设计书 3.4 Save按钮押下 和 4.2 校验详细规格表
   */
  const handleSaveClick = async () => {
    // 校验：检查是否有Modified value已入力 (对应设计书 4.1.2 和 4.1.3)
    const hasModifiedValue = dataTableList.some(row => row.modifiedValue.trim() !== '');
    
    if (!hasModifiedValue) {
      // 所有Modified value均为空，显示错误消息 (对应设计书 7. 实现注意事项)
      setErrorMessage('NO UNRELEASED VERSION EXISTS!');
      return; // 终止流程，停留在当前画面
    }
    
    // 有Modified value已入力，执行更新操作
    setIsSaving(true);
    setErrorMessage('');
    
    try {
      // 遍历dataTableList，筛选出Modified value有值的行并更新
      const updatePromises = dataTableList
        .filter(row => row.modifiedValue.trim() !== '')
        .map(async (row) => {
          // 获取当前系统时间 (对应设计书 7. 实现注意事项)
          const now = new Date();
          const formattedDatetime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
          
          // 调用UD05UpdateHdocAdcaModificationApi更新数据 (对应设计书 5.2 UD05UpdateHdocAdcaModificationApi)
          return await axios.put('/api/UD05/UpdateHdocAdcaModification', {
            serie: chassisSerie,
            chno: chassisNo,
            newval: row.modifiedValue,
            update_datetime: formattedDatetime,
            update_user: userId
          });
        });
      
      // 等待所有更新完成
      await Promise.all(updatePromises);
      
      // 所有更新成功后，跳转到SaveModifications画面
      // 携带修改后的数据列表 (对应设计书 7. 实现注意事项)
      const modifiedData = dataTableList.filter(row => row.modifiedValue.trim() !== '');
      
      navigate('/SaveModifications', { 
        state: { 
          userId, 
          chassisNo, 
          chassisSerie, 
          modifiedData 
        } 
      });
      
    } catch (error: any) {
      // 捕获更新错误 (对应设计书 6. 异常处理)
      if (error.response) {
        setErrorMessage(error.response.data?.message || '情报更新失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('系统维护中，请稍后重试');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='modify-document-container'>
      <div className='modify-document-content'>
        {/* 标题 */}
        <h2 className='page-title'>Modify Document</h2>
        
        {/* Error message area (对应设计书 7. 实现注意事项) */}
        {/* 只在有错误信息时才显示，初期为空字符串时不显示也不占位 */}
        {errorMessage && errorMessage.trim() !== '' && (
          <div className='error-message-area'>
            {errorMessage}
          </div>
        )}
        
        {/* Loading状态显示 */}
        {isLoading ? (
          <div className='loading-message'>加载中...</div>
        ) : (
          <>
            {/* Chassis no (Link类型) */}
            <div className='info-row'>
              <span className='label'>Chassis no:</span>
              <a href='/VehicleSpecification' className='link-text' onClick={handleChassisNoClick}>
                {chassisNo}
              </a>
            </div>
            
            {/* Market */}
            <div className='info-row'>
              <span className='label'>Market:</span>
              <span className='value'>{market}</span>
            </div>
            
            {/* Template ファイル (Link类型) */}
            <div className='info-row'>
              <span className='label'>Template:</span>
              <a href='#' className='link-text' onClick={handleTemplateFileClick}>
                aus/UD_TEST.odt
              </a>
            </div>
            
            {/* Save按钮 (对应设计书 3.4 Save按钮押下) */}
            {/* 位于DataTable左上方 */}
            <div className='button-container-top'>
              <button 
                className='save-button' 
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : 'Save'}
              </button>
            </div>
            
            {/* DataTable (对应设计书 2.1 控件属性表) */}
            <div className='data-table-container'>
              <table className='data-table'>
                <thead>
                  <tr>
                    <th className='col-variable'>Variable</th>
                    <th className='col-description'>Description</th>
                    <th className='col-current'>Current value</th>
                    <th className='col-modified'>Modified value</th>
                  </tr>
                </thead>
                <tbody>
                  {dataTableList.map((row, index) => (
                    <tr key={index}>
                      <td className='col-variable'>{row.variable}</td>
                      <td className='col-description'>{row.description}</td>
                      <td className='col-current'>{row.currentValue}</td>
                      <td className='col-modified'>
                        <input
                          type='text'
                          className='modified-input'
                          value={row.modifiedValue}
                          onChange={(e) => handleModifiedValueChange(index, e.target.value)}
                          maxLength={500}
                          disabled={isSaving}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModifyDocument;
