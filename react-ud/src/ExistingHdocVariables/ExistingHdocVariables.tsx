import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ExistingHdocVariables.css';

/**
 * ExistingHdocVariables组件 - HDoc变量管理页面
 * 
 * @description 支持检索、新增、更新、删除操作，支持导出CSV文件
 * @props 无Props，通过路由state接收检索条件参数（从ExistingHdocVariablesResultList画面跳转时）
 */
const ExistingHdocVariables: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [variable, setVariable] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [createdByUser, setCreatedByUser] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const typeList = ['VDA', 'User Defined']; // Type下拉列表固定值 (对应设计书 2.1 控件属性表 备注)

  /**
   * 画面初期表示 - 从路由state获取检索条件并显示
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期没有数据情况
   */
  useEffect(() => {
    // 从路由state中获取检索条件参数 (对应设计书 4.1.2.1 接收前画面参数)
    const state = location.state as any;
    if (state) {
      setVariable(state.variable || '');
      setType(state.type || '');
      setDescription(state.description || '');
      setCreatedByUser(state.createdByUser || '');
      setDate(state.date || '');
    }
  }, [location.state]);

  /**
   * Search按钮点击处理 - 跳转到ExistingHdocVariablesResultList画面
   * 对应设计书 3.2 Search按钮押下
   */
  const handleSearchClick = () => {
    // 校验：Variable必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!variable) {
      alert('[项目:Variable] 是必须入力项目');
      return;
    }
    
    const userId = localStorage.getItem('userId') || '';
    
    const searchParams = {
      variable,
      type,
      description,
      createdByUser,
      date,
      userId
    };
    
    // 跳转到结果列表画面
    navigate('/ExistingHdocVariableResultList', { state: searchParams });
  };

  /**
   * Clear按钮点击处理 - 清空所有输入字段
   * 对应设计书 3.3 Clear按钮押下
   */
  const handleClearClick = () => {
    setVariable('');
    setType('');
    setDescription('');
    setCreatedByUser('');
    setDate('');
  };

  /**
   * Back按钮点击处理 - 返回上一画面
   * 对应设计书 3.4 Back按钮押下
   */
  const handleBackClick = () => {
    navigate(-1);
  };

  /**
   * Add按钮点击处理 - 新增数据
   * 对应设计书 3.5 Add按钮押下 和 4.1.2.4 Add操作校验
   */
  const handleAddClick = async () => {
    // 校验1：Variable必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!variable) {
      alert('[项目:Variable] 是必须入力项目');
      return;
    }
    
    try {
      // 校验2：检查Variable是否已存在 (对应设计书 4.1.2.4 Add操作校验 校验2)
      const existResponse = await axios.post('/api/UD10/select-hdoc-variables', {
        variable: variable
      });
      
      if (existResponse.data.success && existResponse.data.data) {
        alert('Variant already exists. Please enter the correct content');
        return;
      }
    } catch (error: any) {
      // 如果查询失败，继续执行新增
    }
    
    // 执行新增操作 (对应设计书 4.1.2.4 Add操作校验 执行新增)
    try {
      const currentUserId = localStorage.getItem('userId') || '';
      const currentDateTime = new Date().toISOString();
      
      const addResponse = await axios.post('/api/UD10/add-hdoc-variables', {
        variable: variable,
        type: type,
        descr: description,
        registerUser: currentUserId,
        registerDatetime: currentDateTime,
        registerProcess: 'ExistingHdocVariables',
        UpdateUser: currentUserId,
        UpdateDatetime: currentDateTime,
        UpdateProcess: 'ExistingHdocVariables'
      });
      
      if (addResponse.data.success) {
        alert('情报登录成功');
        // 清空表单
        handleClearClick();
      } else {
        alert(addResponse.data.message || '情报登录失败');
      }
    } catch (error: any) {
      console.error('新增失败:', error);
      alert(error.response?.data?.message || '情报登录失败');
    }
  };

  /**
   * Update按钮点击处理 - 更新数据
   * 对应设计书 3.6 Update按钮押下 和 4.1.2.2 Update操作校验
   */
  const handleUpdateClick = async () => {
    // 校验1：Variable必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!variable) {
      alert('[项目:Variable] 是必须入力项目');
      return;
    }
    
    try {
      // 校验2：检查数据是否存在 (对应设计书 4.1.2.2 Update操作校验 校验2)
      const existResponse = await axios.post('/api/UD10/select-hdoc-variables', {
        variable: variable
      });
      
      if (!existResponse.data.success || !existResponse.data.data) {
        alert('Variant already exists. Please enter the correct content');
        return;
      }
    } catch (error: any) {
      alert('Variant already exists. Please enter the correct content');
      return;
    }
    
    // 执行更新操作 (对应设计书 4.1.2.2 Update操作校验 执行更新)
    try {
      const currentUserId = localStorage.getItem('userId') || '';
      const currentDateTime = new Date().toISOString();
      
      const updateResponse = await axios.put('/api/UD10/update-hdoc-variables', {
        variable: variable,
        type: type,
        descr: description,
        registerUser: currentUserId,
        registerDatetime: currentDateTime,
        registerProcess: 'ExistingHdocVariables'
      });
      
      if (updateResponse.data.success) {
        alert('情报更新成功');
      } else {
        alert(updateResponse.data.message || '情报更新失败');
      }
    } catch (error: any) {
      console.error('更新失败:', error);
      alert(error.response?.data?.message || '情报更新失败');
    }
  };

  /**
   * Delete按钮点击处理 - 删除数据
   * 对应设计书 3.7 Delete按钮押下 和 4.1.2.3 Delete操作校验
   */
  const handleDeleteClick = async () => {
    // 校验1：Variable必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!variable) {
      alert('[项目:Variable] 是必须入力项目');
      return;
    }
    
    try {
      // 校验2：检查数据是否存在 (对应设计书 4.1.2.3 Delete操作校验 校验2)
      const existResponse = await axios.post('/api/UD10/select-hdoc-variables', {
        variable: variable
      });
      
      if (!existResponse.data.success || !existResponse.data.data) {
        alert('Variant does not exists. Please enter the correct content');
        return;
      }
    } catch (error: any) {
      alert('Variant does not exists. Please enter the correct content');
      return;
    }
    
    // 执行删除操作 (对应设计书 4.1.2.3 Delete操作校验 执行删除)
    try {
      const deleteResponse = await axios.delete('/api/UD10/delete-hdoc-variables', {
        data: {
          variable: variable
        }
      });
      
      if (deleteResponse.data.success) {
        alert('情报删除成功');
        // 清空表单
        handleClearClick();
      } else {
        alert(deleteResponse.data.message || '情报删除失败');
      }
    } catch (error: any) {
      console.error('删除失败:', error);
      alert(error.response?.data?.message || '情报删除失败');
    }
  };

  /**
   * Excel按钮点击处理 - 导出CSV文件
   * 对应设计书 3.8 Excel按钮押下
   */
  const handleExcelClick = async () => {
    try {
      // 调用后端接口生成CSV文件
      const response = await axios.post('/api/UD10/export-csv', {
        variable: variable,
        type: type,
        description: description,
        createdByUser: createdByUser,
        date: date
      }, {
        responseType: 'blob' // 设置响应类型为blob以处理文件下载
      });
      
      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hdoc_variables.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('导出CSV失败:', error);
      alert(error.response?.data?.message || '导出CSV失败');
    }
  };

  return (
    <div className='existing-hdoc-variables-container'>
      <div className='existing-hdoc-variables-content'>
        {/* 标题 */}
        <h2 className='page-title'>Existing HDoc Variables</h2>
        
        {/* 按钮区域 */}
        <div className='button-group'>
          <button className='action-button color-button' onClick={handleSearchClick}>Search</button>
          <button className='action-button color-button' onClick={handleClearClick}>Clear</button>
          <button className='action-button color-button' onClick={handleBackClick}>Back</button>
          <button className='action-button' onClick={handleAddClick}>Add</button>
          <button className='action-button' onClick={handleUpdateClick}>Update</button>
          <button className='action-button' onClick={handleDeleteClick}>Delete</button>
          <button className='action-button' onClick={handleExcelClick}>Excel</button>
        </div>
        
        {/* 表单区域 */}
        <div className='form-container'>
          {/* Variable - 半角英数字+記号 */}
          <div className='form-row'>
            <label className='form-label required'>Variable</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input medium' 
              value={variable} 
              onChange={(e) => setVariable(e.target.value)}
              maxLength={30}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Type - 下拉列表固定值 */}
          <div className='form-row'>
            <label className='form-label'>Type</label>
            <span className='operator'>= ⌵</span>
            <select 
              className='form-select short' 
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              <option value=""></option>
              {typeList.map((t, index) => (
                <option key={index} value={t}>{t}</option>
              ))}
            </select>
          </div>
          
          {/* Description - 半角英数字+記号 */}
          <div className='form-row'>
            <label className='form-label'>Description</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input long' 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Created by user - 半角英数字+記号 */}
          <div className='form-row'>
            <label className='form-label'>Created by user</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={createdByUser} 
              onChange={(e) => setCreatedByUser(e.target.value)}
              maxLength={16}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
            <span className='auto-text'>Automatic</span>
          </div>
          
          {/* Date - 日付 */}
          <div className='form-row'>
            <label className='form-label'>Date</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
            <span className='auto-text'>Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExistingHdocVariables;
