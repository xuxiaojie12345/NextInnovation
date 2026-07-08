/**
 * ExistingHDocVariables 组件 - 现有HDoc变量管理页面（UD10）
 * 功能：对 HDOC_VARIABLES 表中的变量定义记录进行增删改查管理
 * 对应详细设计：详细设计/詳細設計UD10.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ExistingHDocVariables.css';

/**
 * 变量定义记录数据类型
 */
interface HdocVariableRecord {
  variable: string;
  type: string;
  description: string;
  userid: string;
  registerDatetime: string;
}

/**
 * 表单数据类型
 */
interface FormData {
  variable: string;
  type: string;
  description: string;
  userid: string;
  registerDatetime: string;
}

/**
 * API 响应数据类型
 */
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const API_BASE_URL = 'http://localhost:8081';

type Operator = '=' | '!=';
/** 日期字段专用运算符：支持 = > < 三种比较 */
type CompareOperator = '=' | 'GT' | 'LT';

/**
 * ExistingHDocVariables 组件
 * 提供HDOC_VARIABLES表的CRUD操作及CSV导出功能
 */
const ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 各字段的 = / != 运算符状态（普通字段）
  const [ops, setOps] = useState<Record<string, Operator>>({
    variable: '=', type: '=', description: '=', userid: '='
  });
  // registerDatetime 字段专用运算符（支持大于小于比较）
  const [compareOps, setCompareOps] = useState<Record<string, CompareOperator>>({
    registerDatetime: '='
  });

  const setOp = (field: string, v: Operator) => setOps(prev => ({ ...prev, [field]: v }));
  const setCompareOp = (field: string, v: CompareOperator) => setCompareOps(prev => ({ ...prev, [field]: v }));

  /**
   * 渲染运算符下拉框（= / !=）
   * 参照 UD08 页面风格
   */
  const renderOp = (field: string) => (
    <select value={ops[field]} onChange={e => setOp(field, e.target.value as Operator)} className='existing-hdoc-operator-select'>
      <option value='='>=</option>
      <option value='!='>!=</option>
    </select>
  );

  /** Date字段专用运算符下拉框（支持 < > = 三种比较） */
  const renderCompareOp = (field: string) => (
    <select value={compareOps[field]} onChange={e => setCompareOp(field, e.target.value as CompareOperator)} className='existing-hdoc-operator-select'>
      <option value='='>=</option>
      <option value='GT'>&gt;</option>
      <option value='LT'>&lt;</option>
    </select>
  );

  // 表单数据状态
  const [formData, setFormData] = useState<FormData>({
    variable: '',
    type: '',
    description: '',
    userid: '',
    registerDatetime: ''
  });

  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 操作中状态（防重复提交）
  const [isOperating, setIsOperating] = useState<boolean>(false);
  // 消息提示
  const [message, setMessage] = useState<string>('');
  // 消息类型：true=错误，false=成功
  const [hasError, setHasError] = useState<boolean>(false);

  /**
   * 初始化：从 location.state 中获取前画面传递的值
   * 包括从UD11 Back返回时的搜索条件，以及从Search画面Select返回时的选中记录
   * 对应详细设计 3.1.1 页面初始化流程
   */
  useEffect(() => {
    const state = location.state as Record<string, any> | null;
    if (!state) return;

    // 从UD11 Back返回时，恢复所有搜索条件
    if (state.searchConditions) {
      const cond = state.searchConditions;
      setFormData(prev => ({
        ...prev,
        variable: cond.variable || '',
        type: cond.type || '',
        description: cond.description || '',
        userid: cond.userid || '',
        registerDatetime: (cond.registerDatetime || '').split(' ')[0].split('T')[0]
      }));
      if (cond.variableOp) setOps(prev => ({ ...prev, variable: cond.variableOp }));
      if (cond.typeOp) setOps(prev => ({ ...prev, type: cond.typeOp }));
      if (cond.descriptionOp) setOps(prev => ({ ...prev, description: cond.descriptionOp }));
      if (cond.useridOp) setOps(prev => ({ ...prev, userid: cond.useridOp }));
      if (cond.registerDatetimeOp) setCompareOps(prev => ({ ...prev, registerDatetime: cond.registerDatetimeOp }));
      return;
    }

    // 从UD11 Select返回时，自动填充选中记录的内容
    if (state.selectedRecord) {
      const rec = state.selectedRecord;
      setFormData(prev => ({
        ...prev,
        variable: rec.variable || '',
        type: rec.type || '',
        description: rec.description || '',
        userid: rec.userid || '',
        registerDatetime: (rec.registerDatetime || '').split(' ')[0].split('T')[0]
      }));
      return;
    }

    // 兼容旧逻辑：只传递了variable
    if (state.variable) {
      setFormData(prev => ({ ...prev, variable: state.variable }));
    }
  }, [location.state]);

  /**
   * 更新表单字段值
   */
  const setField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (message) {
      setMessage('');
      setHasError(false);
    }
  };

  /**
   * 校验必填字段（Variable）
   * 对应详细设计 3.2 校验详细规格表 No.1
   */
  const validateRequired = (): string | null => {
    const { variable } = formData;
    if (!variable || !variable.trim()) {
      return 'Variable is required.';
    }
    return null;
  };

  /**
   * 校验 Variable 输入格式（只允许半角英数字+记号）
   */
  const handleVariableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 只允许半角英数字+記号
    if (/^[a-zA-Z0-9\-_]*$/.test(val) && val.length <= 30) {
      setField('variable', val);
    }
  };

  /**
   * 处理 Type 下拉选项变更
   */
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setField('type', e.target.value);
  };

  /**
   * 处理 Description 输入
   */
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 100) {
      setField('description', val);
    }
  };

  /**
   * 处理 Created by user 输入
   */
  const handleUseridChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 16) {
      setField('userid', val);
    }
  };

  /**
   * 处理 Date 输入（只允许数字和中划线，格式 yyyy-MM-dd）
   */
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9-]*$/.test(val) && val.length <= 10) {
      setField('registerDatetime', val);
    }
  };

  /**
   * 搜索功能 - 跳转到搜索结果页面（UD11）
   * 将表单字段值和运算符一起作为搜索条件传递
   * 至少需要输入一个搜索条件才能执行搜索
   * 对应详细设计 3.1.2 搜索流程
   */
  const handleSearch = useCallback(() => {
    // 检查是否输入了Variable（必填搜索条件）
    if (!formData.variable || !formData.variable.trim()) {
      setMessage('Variable is required for search.');
      setHasError(true);
      return;
    }
    // 构建搜索条件（字段值 + 运算符）
    const searchState: Record<string, string> = {
      ...formData,
      variableOp: ops.variable,
      typeOp: ops.type,
      descriptionOp: ops.description,
      useridOp: ops.userid,
      registerDatetimeOp: compareOps.registerDatetime
    };
    navigate('/Menu/ExistingHDocVariables/Search', { state: searchState });
  }, [formData, ops, compareOps, navigate]);

  /**
   * 新增功能 - 调用 UD10Add API 新增变量定义记录
   * 对应详细设计 3.1.3 新增流程
   */
  const handleAdd = useCallback(async () => {
    setMessage('');
    setHasError(false);
    const err = validateRequired();
    if (err) {
      setMessage(err);
      setHasError(true);
      return;
    }
    setIsOperating(true);
    try {
      // 补全日期格式：如果 registerDatetime 只有日期部分则添加时间
      const submitData = { ...formData };
      if (submitData.registerDatetime && submitData.registerDatetime.length === 10) {
        submitData.registerDatetime = submitData.registerDatetime + ' 00:00:00';
      }
      const res = await axios.post<ApiResponse<string>>(
        `${API_BASE_URL}/api/ud10/add`,
        submitData
      );
      if (res.data.code === 200) {
        setMessage('Record added successfully.');
        setHasError(false);
      } else if (res.data.code === 409) {
        setMessage('Variant already exists. Please enter the correct content');
        setHasError(true);
      } else {
        setMessage(res.data.message || 'System error. Please contact administrator.');
        setHasError(true);
      }
    } catch (e: any) {
      if (e.response?.status === 409) {
        setMessage('Variant already exists. Please enter the correct content');
      } else {
        setMessage('System error. Please contact administrator.');
      }
      setHasError(true);
    } finally {
      setIsOperating(false);
    }
  }, [formData]);

  /**
   * 更新功能 - 调用 UD10Update API 更新变量定义记录
   * 对应详细设计 3.1.4 更新流程
   */
  const handleUpdate = useCallback(async () => {
    setMessage('');
    setHasError(false);
    const err = validateRequired();
    if (err) {
      setMessage(err);
      setHasError(true);
      return;
    }
    setIsOperating(true);
    try {
      // 补全日期格式：如果 registerDatetime 只有日期部分则添加时间
      const submitData = { ...formData };
      if (submitData.registerDatetime && submitData.registerDatetime.length === 10) {
        submitData.registerDatetime = submitData.registerDatetime + ' 00:00:00';
      }
      const res = await axios.post<ApiResponse<string>>(
        `${API_BASE_URL}/api/ud10/update`,
        submitData
      );
      if (res.data.code === 200) {
        setMessage('Record updated successfully.');
        setHasError(false);
      } else if (res.data.code === 404) {
        setMessage('Variant does not exists. Please enter the correct content');
        setHasError(true);
      } else {
        setMessage(res.data.message || 'System error. Please contact administrator.');
        setHasError(true);
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        setMessage('Variant does not exists. Please enter the correct content');
      } else {
        setMessage('System error. Please contact administrator.');
      }
      setHasError(true);
    } finally {
      setIsOperating(false);
    }
  }, [formData]);

  /**
   * 删除功能 - 调用 UD10Delete API 删除变量定义记录
   * 对应详细设计 3.1.5 删除流程
   */
  const handleDelete = useCallback(async () => {
    setMessage('');
    setHasError(false);
    const err = validateRequired();
    if (err) {
      setMessage(err);
      setHasError(true);
      return;
    }
    setIsOperating(true);
    try {
      const res = await axios.post<ApiResponse<string>>(
        `${API_BASE_URL}/api/ud10/delete`,
        { variable: formData.variable }
      );
      if (res.data.code === 200) {
        setMessage('Record deleted successfully.');
        setHasError(false);
        // 清空表单
        setFormData({
          variable: '', type: '', description: '', userid: '', registerDatetime: ''
        });
      } else if (res.data.code === 404) {
        setMessage('Variant does not exists. Please enter the correct content');
        setHasError(true);
      } else {
        setMessage(res.data.message || 'System error. Please contact administrator.');
        setHasError(true);
      }
    } catch (e: any) {
      if (e.response?.status === 404) {
        setMessage('Variant does not exists. Please enter the correct content');
      } else {
        setMessage('System error. Please contact administrator.');
      }
      setHasError(true);
    } finally {
      setIsOperating(false);
    }
  }, [formData]);

  /**
   * 清空功能 - 清空所有输入字段
   * 对应详细设计 3.1.7 清空流程
   */
  const handleClear = useCallback(() => {
    setFormData({
      variable: '', type: '', description: '', userid: '', registerDatetime: ''
    });
    setMessage('');
    setHasError(false);
  }, []);

  /**
   * 返回功能 - 导航回 HomologationVariables 页面
   * 对应详细设计 3.1.8 返回流程
   */
  const handleBack = useCallback(() => {
    navigate('/Menu');
  }, [navigate]);

  /**
   * 导出 CSV 功能
   * 将当前表单数据导出为CSV文件：第一行项目名，第二行值
   * 对应详细设计 3.1.6 导出CSV流程
   */
  const handleExportCsv = useCallback(() => {
    // CSV 头部（项目名）
    const headers = ['Variable', 'Type', 'Description', 'Created by user', 'Date'];
    // CSV 值行（当前表单数据）
    const values = [
      formData.variable,
      formData.type,
      formData.description,
      formData.userid,
      formData.registerDatetime
    ];
    // 构建 CSV 内容：第一行项目名，第二行值
    const csvContent = [
      headers.join(','),
      values.map(cell => `"${cell || ''}"`).join(',')
    ].join('\n');

    // 生成文件名
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `HDOC_Variables_Form_${dateStr}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [formData]);

  const disabled = isOperating || loading;

  return (
    <div className='existing-hdoc-container'>
      {/* 页面标题 */}
      <h1 className='existing-hdoc-title'>Existing HDoc Variables</h1>
      <hr className='existing-hdoc-divider' />

      {/* 消息提示区域 */}
      {message && (
        <div className={hasError ? 'existing-hdoc-message error' : 'existing-hdoc-message success'}>
          {message}
        </div>
      )}

      {/* 表单区域（按钮组在表单边框内顶部） */}
      <div className='existing-hdoc-form'>
        {/* 按钮组 - 紧贴表单顶部 */}
        <div className='existing-hdoc-button-group'>
          <button type='button' className='existing-hdoc-btn' onClick={handleSearch} disabled={disabled}>Search</button>
          <button type='button' className='existing-hdoc-btn' onClick={handleClear} disabled={disabled}>Clear</button>
          <button type='button' className='existing-hdoc-btn' onClick={handleBack} disabled={disabled}>Back</button>
          <button type='button' className='existing-hdoc-btn' onClick={handleAdd} disabled={disabled}>Add</button>
          <button type='button' className='existing-hdoc-btn' onClick={handleUpdate} disabled={disabled}>Update</button>
          <button type='button' className='existing-hdoc-btn' onClick={handleDelete} disabled={disabled}>Delete</button>
          <button type='button' className='existing-hdoc-btn' onClick={handleExportCsv} disabled={disabled}>Excel</button>
        </div>
        {/* Variable */}
        <div className='existing-hdoc-form-row'>
          <label className='existing-hdoc-form-label required'>Variable</label>
          <div className='existing-hdoc-operator-wrapper'>{renderOp('variable')}</div>
          <div className='existing-hdoc-form-control'>
            <input
              type='text'
              value={formData.variable}
              onChange={handleVariableChange}
              disabled={disabled}
              maxLength={30}
              placeholder='Enter Variable name'
              className='existing-hdoc-input'
              style={{ maxWidth: '250px' }}
            />
          </div>
        </div>

        {/* Type */}
        <div className='existing-hdoc-form-row'>
          <label className='existing-hdoc-form-label'>Type</label>
          <div className='existing-hdoc-operator-wrapper'>{renderOp('type')}</div>
          <div className='existing-hdoc-form-control'>
            <select
              value={formData.type}
              onChange={handleTypeChange}
              disabled={disabled}
              className='existing-hdoc-select'
              style={{ maxWidth: '200px' }}
            >
              <option value=''></option>
              <option value='VDA'>VDA</option>
              <option value='User Defined'>User Defined</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className='existing-hdoc-form-row'>
          <label className='existing-hdoc-form-label'>Description</label>
          <div className='existing-hdoc-operator-wrapper'>{renderOp('description')}</div>
          <div className='existing-hdoc-form-control'>
            <input
              type='text'
              value={formData.description}
              onChange={handleDescriptionChange}
              disabled={disabled}
              maxLength={100}
              className='existing-hdoc-input'
              style={{ maxWidth: '500px' }}
            />
          </div>
        </div>

        {/* Created by user */}
        <div className='existing-hdoc-form-row'>
          <label className='existing-hdoc-form-label'>Created by user</label>
          <div className='existing-hdoc-operator-wrapper'>{renderOp('userid')}</div>
          <div className='existing-hdoc-form-control'>
            <input
              type='text'
              value={formData.userid}
              onChange={handleUseridChange}
              disabled={disabled}
              maxLength={16}
              className='existing-hdoc-input'
              style={{ maxWidth: '150px' }}
            />
          </div>
        </div>

        {/* Date */}
        <div className='existing-hdoc-form-row'>
          <label className='existing-hdoc-form-label'>Date</label>
          <div className='existing-hdoc-operator-wrapper'>{renderCompareOp('registerDatetime')}</div>
          <div className='existing-hdoc-form-control'>
            <input
              type='text'
              value={formData.registerDatetime}
              onChange={handleDateChange}
              disabled={disabled}
              maxLength={10}
              placeholder='yyyy-MM-dd'
              className='existing-hdoc-input'
              style={{ maxWidth: '150px' }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default ExistingHDocVariables;
