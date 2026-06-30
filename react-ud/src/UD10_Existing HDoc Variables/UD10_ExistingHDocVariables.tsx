import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD10_ExistingHDocVariables.css';

/**
 * UD10_ExistingHDocVariables 现有HDoc变量管理页面组件
 *
 * 功能说明：
 * - 管理现有的HDoc Variables（认证文档变量）
 * - 支持搜索、添加、更新、删除变量
 * - 支持导出CSV文件
 * - Search按钮携带参数跳转到UD11搜索结果画面
 *
 * @component
 * @returns {JSX.Element} Existing HDoc Variables 管理页面元素
 */
const UD10_ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  // 对应设计书 2.1 控件属性表
  const [variable, setVariable] = useState<string>('');           // 变量名（必填）
  const [type, setType] = useState<string>('');                   // 类型（下拉框）
  const [description, setDescription] = useState<string>('');     // 描述
  const [displayCreatedByUser, setDisplayCreatedByUser] = useState<string>(''); // 创建用户（Output）
  const [displayDate, setDisplayDate] = useState<string>('');     // 日期（Output）

  // Type下拉框固定选项（对应设计书 2.1 备注）
  const TYPE_OPTIONS = ['VDA', 'User Defined'];

  // 消息状态
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ==================== 接收UD11传来的数据 ====================
  /**
   * 从UD11返回时，根据返回类型处理数据填充
   * - Select: 接收选中记录并填充到表单
   * - Back: 恢复跳转前的输入数据
   */
  useEffect(() => {
    const state = (location.state as any);
    if (!state) return;

    const selectedRecord = state.selectedRecord;
    const backFormData = state.backFormData;

    if (selectedRecord) {
      setVariable(selectedRecord.variable || '');
      setType(selectedRecord.type || '');
      setDescription(selectedRecord.description || '');
      setDisplayCreatedByUser(selectedRecord.createdByUser || '');
      setDisplayDate(selectedRecord.date || '');
    } else if (backFormData) {
      setVariable(backFormData.variable || '');
      setType(backFormData.type || '');
      setDescription(backFormData.description || '');
      setDisplayCreatedByUser(backFormData.displayCreatedByUser || '');
      setDisplayDate(backFormData.displayDate || '');
    }

    if (selectedRecord || backFormData) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Search 按钮点击
   * 对应设计书 3.1.2 Search 按钮处理流程
   *
   * 携带输入参数跳转到 UD11 搜索结果画面
   */
  const handleSearch = useCallback(() => {
    const params: Record<string, string> = {};
    if (variable.trim()) params.variable = variable.trim();
    if (type) params.type = type;
    if (description.trim()) params.description = description.trim();

    // 保存当前表单数据，用于UD11点Back返回时恢复输入
    const formData = { variable, type, description, displayCreatedByUser, displayDate };

    navigate('/UD11', { state: { searchParams: params, formData } });
  }, [navigate, variable, type, description, displayCreatedByUser, displayDate]);

  /**
   * 处理 Clear 按钮点击
   * 对应设计书 3.1.3 Clear 按钮处理流程
   */
  const handleClear = useCallback(() => {
    setVariable('');
    setType('');
    setDescription('');
    setDisplayCreatedByUser('');
    setDisplayDate('');
    setMessage('');
    setMessageType('info');
  }, []);

  /**
   * 处理 Back 按钮点击
   * 对应设计书 3.1.4 Back 按钮处理流程
   */
  const handleBack = useCallback(() => {
    navigate('/Menu');
  }, [navigate]);

  /**
   * 执行前端校验 - Variable必填检查
   * 对应设计书 3.2 校验详细规格表 No.1/3/5
   *
   * @returns {boolean} 校验是否通过
   */
  const validateVariableRequired = (): boolean => {
    if (!variable.trim()) {
      setMessage('Variable是必填项');
      setMessageType('error');
      return false;
    }
    return true;
  };

  /**
   * 处理 Add 按钮点击
   * 对应设计书 3.1.5 Add 按钮处理流程
   */
  const handleAdd = useCallback(async () => {
    if (!validateVariableRequired()) return;

    setIsLoading(true);
    try {
      const currentUser = localStorage.getItem('userId') || 'SYSTEM';
      const now = new Date();

      const response = await apiClient.post('/api/ud10/add', {
        variable: variable.trim(),
        type,
        description: description.trim(),
        createdByUser: currentUser,
        date: now.toISOString(),
      });

      if (response.data && response.data.code === 200) {
        setMessage('添加成功');
        setMessageType('success');
        setDisplayCreatedByUser(currentUser);
        setDisplayDate(now.toLocaleString());
        setVariable('');
        setType('');
        setDescription('');
      } else {
        setMessage(response.data?.message || '添加失败');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || '添加失败');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable, type, description]);

  /**
   * 处理 Update 按钮点击
   * 对应设计书 3.1.6 Update 按钮处理流程
   */
  const handleUpdate = useCallback(async () => {
    if (!validateVariableRequired()) return;

    setIsLoading(true);
    try {
      const currentUser = localStorage.getItem('userId') || 'SYSTEM';
      const now = new Date();

      const response = await apiClient.post('/api/ud10/update', {
        variable: variable.trim(),
        type,
        description: description.trim(),
        createdByUser: currentUser,
        date: now.toISOString(),
      });

      if (response.data && response.data.code === 200) {
        setMessage('更新成功');
        setMessageType('success');
        setDisplayDate(now.toLocaleString());
      } else {
        setMessage(response.data?.message || '更新失败');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || '更新失败');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable, type, description]);

  /**
   * 处理 Delete 按钮点击
   * 对应设计书 3.1.7 Delete 按钮处理流程
   */
  const handleDelete = useCallback(async () => {
    if (!validateVariableRequired()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post('/api/ud10/delete', {
        variable: variable.trim(),
      });

      if (response.data && response.data.code === 200) {
        setMessage('删除成功');
        setMessageType('success');
        handleClear();
      } else {
        setMessage(response.data?.message || '删除失败');
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || '删除失败');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable, handleClear]);

  /**
   * 处理 Excel 按钮点击
   * 对应设计书 3.1.8 Excel 按钮处理流程
   *
   * 前端生成CSV文件并下载
   */
  const handleExcel = useCallback(() => {
    try {
      // 构建CSV内容
      const headers = ['Variable', 'Type', 'Description', 'Created by user', 'Date'];
      const dataRow = [
        variable || '',
        type || '',
        description || '',
        displayCreatedByUser || '',
        displayDate || '',
      ];

      // 生成CSV格式（BOM标记支持中文）
      const BOM = '\uFEFF';
      const csvContent = BOM + headers.join(',') + '\n' + dataRow.join(',');

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `HDoc_Variables_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage('CSV导出成功');
      setMessageType('success');
    } catch (error) {
      setMessage('CSV导出失败，请稍后重试');
      setMessageType('error');
    }
  }, [variable, type, description, displayCreatedByUser, displayDate]);

  // ==================== 渲染 ====================
  return (
    <div className="ud10-container">
      {/* 页面标题 */}
      <div className="ud10-title">Existing HDoc Variables</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud10-message ud10-message--${messageType}`}>
          {message}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="ud10-content">
        
        {/* 操作按钮行（对应设计书 2.1 序号6~12） */}
        <div className="ud10-button-row">
          <button className="ud10-btn ud10-btn--search" onClick={handleSearch} disabled={isLoading}>Search</button>
          <button className="ud10-btn ud10-btn--clear" onClick={handleClear} disabled={isLoading}>Clear</button>
          <button className="ud10-btn ud10-btn--back" onClick={handleBack} disabled={isLoading}>Back</button>
          <button className="ud10-btn ud10-btn--add" onClick={handleAdd} disabled={isLoading}>Add</button>
          <button className="ud10-btn ud10-btn--update" onClick={handleUpdate} disabled={isLoading}>Update</button>
          <button className="ud10-btn ud10-btn--delete" onClick={handleDelete} disabled={isLoading}>Delete</button>
          <button className="ud10-btn ud10-btn--excel" onClick={handleExcel} disabled={isLoading}>Excel</button>
        </div>
        
        {/* Variable 输入框（对应设计书 2.1 序号1） */}
        <div className="ud10-row">
          <span className="ud10-label">*Variable</span>
          <select className="ud10-compare-select" defaultValue="=">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            className="ud10-input"
            type="text"
            value={variable}
            onChange={(e) => {
              if (e.target.value.length <= 30) {
                setVariable(e.target.value);
                if (message) setMessage('');
              }
            }}
            placeholder=""
            maxLength={30}
          />
        </div>

        {/* Type 下拉框（对应设计书 2.1 序号2） */}
        <div className="ud10-row">
          <span className="ud10-label">Type</span>
          <select className="ud10-compare-select" defaultValue="=">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <select
            className="ud10-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">-- 请选择 --</option>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Description 输入框（对应设计书 2.1 序号3） */}
        <div className="ud10-row">
          <span className="ud10-label">Description</span>
          <select className="ud10-compare-select" defaultValue="=">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            className="ud10-input"
            type="text"
            value={description}
            onChange={(e) => {
              if (e.target.value.length <= 100) {
                setDescription(e.target.value);
              }
            }}
            placeholder=""
            maxLength={100}
          />
        </div>

        {/* Created by user 输入框（对应设计书 2.1 序号4）- 活性状态 */}
        <div className="ud10-row">
          <span className="ud10-label">Created by user</span>
          <select className="ud10-compare-select" defaultValue="=">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            className="ud10-input"
            type="text"
            value={displayCreatedByUser}
            onChange={(e) => setDisplayCreatedByUser(e.target.value)}
            placeholder=""
          />
        </div>

        {/* Date 输入框（对应设计书 2.1 序号5）- 活性状态 */}
        <div className="ud10-row">
          <span className="ud10-label">Date</span>
          <select className="ud10-compare-select" defaultValue="=">
            <option value="=">=</option>
            <option value="≠">≠</option>
          </select>
          <input
            className="ud10-input"
            type="text"
            value={displayDate}
            onChange={(e) => setDisplayDate(e.target.value)}
            placeholder=""
          />
        </div>

      </div>
    </div>
  );
};

export default UD10_ExistingHDocVariables;
