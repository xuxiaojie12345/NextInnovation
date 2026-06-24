import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD08_HomologationVariables.css';

/**
 * 检索字段值接口
 * 每个检索条件包含：输入值(value) 和 运算符(operator)
 */
interface SearchField {
  value: string;
  operator: string;
}

/**
 * UD08_HomologationVariables 认证变量规则管理页面组件
 *
 * 功能说明：
 * - 提供认证变量（Homologation Variables）的检索、新增、更新、删除功能
 * - 支持按 Product class、Number、Market、Variable、Value 等条件检索
 * - 对输入数据进行前端校验，调用后端API进行数据操作
 * - 页面加载时从 PRODUCT_CLASS_MASTER 和 MARKET_MASTER 表加载下拉列表数据
 *
 * @component
 * @returns {JSX.Element} Homologation Variables 管理页面元素
 */
const UD08_HomologationVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  // 对应设计书 2.1 控件属性表 - 各字段的输入值和运算符
  const [productClass, setProductClass] = useState<SearchField>({ value: '', operator: '=' });
  const [number, setNumber] = useState<SearchField>({ value: '', operator: '=' });
  const [market, setMarket] = useState<SearchField>({ value: '', operator: '=' });
  const [variable, setVariable] = useState<SearchField>({ value: '', operator: '=' });
  const [value, setValue] = useState<SearchField>({ value: '', operator: '=' });
  const [variantString1, setVariantString1] = useState<SearchField>({ value: '', operator: '=' });
  const [variantString2, setVariantString2] = useState<SearchField>({ value: '', operator: '=' });
  const [comments, setComments] = useState<SearchField>({ value: '', operator: '=' });

  // 信息标签（Output控件，对应设计书 2.1 序号9~12）
  const [displayAddDate, setDisplayAddDate] = useState<string>('');
  const [displayDeleteDate, setDisplayDeleteDate] = useState<string>('');
  const [displayCreatedByUser, setDisplayCreatedByUser] = useState<string>('');
  const [displayDate, setDisplayDate] = useState<string>('');

  // 下拉列表数据源
  const [productClassOptions, setProductClassOptions] = useState<string[]>([]);
  const [marketOptions, setMarketOptions] = useState<string[]>([]);

  // 消息状态
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  // 加载状态
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 操作符选项（固定值）
  // Add和Delete项目后面的下拉框内容为：【=,<,>】（对应设计书 3.1 备注）
  const OPERATOR_OPTIONS_DATE = ['=', '<', '>'];
  // 其他项目后的下拉框内容为：【=,≠】（对应设计书 3.1 备注）
  const OPERATOR_OPTIONS_DEFAULT = ['=', '≠'];

  // ==================== 初始数据加载 ====================
  useEffect(() => {
    /**
     * 页面加载时执行初始化
     * 对应设计书 3.1.1 初始显示流程
     *
     * 处理流程：
     * 1. 调用API获取 Product class 下拉列表数据
     * 2. 调用API获取 Market 下拉列表数据
     */
    const loadMasterData = async () => {
      try {
        // 1. 加载 Product class 下拉列表
        const pcResponse = await apiClient.get('/api/ud08/selectproductclassmaster');
        if (pcResponse.data.code === 200 && Array.isArray(pcResponse.data.data)) {
          const pcList = pcResponse.data.data.map((item: { pc: string }) => item.pc);
          setProductClassOptions(pcList);
        }

        // 2. 加载 Market 下拉列表
        const marketResponse = await apiClient.get('/api/ud08/selectmarketmaster');
        if (marketResponse.data.code === 200 && Array.isArray(marketResponse.data.data)) {
          const marketList = marketResponse.data.data.map((item: { market: string }) => item.market);
          setMarketOptions(marketList);
        }
      } catch (error) {
        console.error('加载主数据失败:', error);
        setMessage('系统内部错误，请联系系统管理员');
        setMessageType('error');
      }
    };

    loadMasterData();
  }, []);

  // ==================== 接收UD09传来的数据 ====================
  /**
   * 从UD09返回时，根据返回类型处理数据填充
   * 对应设计书 3.1.1 初始显示流程 - 第2步
   *
   * 处理逻辑：
   * - 如果从UD09点Select按钮跳转过来（selectedRecord），则接收选中记录并填充到表单
   * - 如果从UD09点Back按钮跳转过来（backFormData），则恢复跳转前的输入数据
   */
  useEffect(() => {
    const state = (location.state as any);
    if (!state) return;

    const selectedRecord = state.selectedRecord;
    const backFormData = state.backFormData;

    if (selectedRecord) {
      // === Select 流程：填充选中记录 ===
      setProductClass({ value: selectedRecord.productClass || '', operator: '=' });
      setNumber({ value: selectedRecord.number !== undefined ? String(selectedRecord.number) : '', operator: '=' });
      setMarket({ value: selectedRecord.market || '', operator: '=' });
      setVariable({ value: selectedRecord.variable || '', operator: '=' });
      setValue({ value: selectedRecord.value || '', operator: '=' });
      setVariantString1({ value: selectedRecord.variantString1 || '', operator: '=' });
      setVariantString2({ value: selectedRecord.variantString2 || '', operator: '=' });
      setComments({ value: selectedRecord.comments || '', operator: '=' });
      setDisplayAddDate(selectedRecord.addDate || '');
      setDisplayDeleteDate(selectedRecord.deleteDate || '');
      setDisplayCreatedByUser(selectedRecord.createdByUser || '');
      setDisplayDate(selectedRecord.date || '');
    } else if (backFormData) {
      // === Back 流程：恢复跳转前的输入数据 ===
      setProductClass({ value: backFormData.productClass || '', operator: backFormData.productClassOp || '=' });
      setNumber({ value: backFormData.number || '', operator: backFormData.numberOp || '=' });
      setMarket({ value: backFormData.market || '', operator: backFormData.marketOp || '=' });
      setVariable({ value: backFormData.variable || '', operator: backFormData.variableOp || '=' });
      setValue({ value: backFormData.value || '', operator: backFormData.valueOp || '=' });
      setVariantString1({ value: backFormData.variantString1 || '', operator: backFormData.variantString1Op || '=' });
      setVariantString2({ value: backFormData.variantString2 || '', operator: backFormData.variantString2Op || '=' });
      setComments({ value: backFormData.comments || '', operator: backFormData.commentsOp || '=' });
      setDisplayAddDate(backFormData.displayAddDate || '');
      setDisplayDeleteDate(backFormData.displayDeleteDate || '');
      setDisplayCreatedByUser(backFormData.displayCreatedByUser || '');
      setDisplayDate(backFormData.displayDate || '');
    }

    // 清除location.state，防止刷新页面时重复填充
    if (selectedRecord || backFormData) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ==================== 输入处理函数 ====================

  /**
   * 更新指定字段的输入值
   * 对应设计书 2.1 - 输入控件状态管理
   *
   * @param setter - 字段的 setState 函数
   * @param newValue - 新的输入值
   */
  const handleFieldValueChange = (
    setter: React.Dispatch<React.SetStateAction<SearchField>>,
    newValue: string
  ) => {
    setter((prev) => ({ ...prev, value: newValue }));
    // 用户输入时清除消息
    if (message) setMessage('');
  };

  /**
   * 更新指定字段的运算符
   *
   * @param setter - 字段的 setState 函数
   * @param newOperator - 新的运算符
   */
  const handleOperatorChange = (
    setter: React.Dispatch<React.SetStateAction<SearchField>>,
    newOperator: string
  ) => {
    setter((prev) => ({ ...prev, operator: newOperator }));
  };

  // ==================== 业务操作函数 ====================

  /**
   * 执行清空操作
   * 对应设计书 3.1.3 Clear 操作流程
   *
   * 处理流程：
   * 1. 清空所有输入字段的值
   * 2. 重置运算符为默认值 '='
   * 3. 清空消息显示
   */
  const handleClear = useCallback(() => {
    setProductClass({ value: '', operator: '=' });
    setNumber({ value: '', operator: '=' });
    setMarket({ value: '', operator: '=' });
    setVariable({ value: '', operator: '=' });
    setValue({ value: '', operator: '=' });
    setVariantString1({ value: '', operator: '=' });
    setVariantString2({ value: '', operator: '=' });
    setComments({ value: '', operator: '=' });
    setDisplayAddDate('');
    setDisplayDeleteDate('');
    setDisplayCreatedByUser('');
    setDisplayDate('');
    setMessage('');
    setMessageType('info');
  }, []);

  /**
   * 执行检索操作
   * 对应设计书 3.1.2 Search 操作流程
   *
   * 处理流程：
   * 1. 收集所有非空的检索条件
   * 2. 携带参数跳转到 UD09 检索结果画面
   */
  const handleSearch = useCallback(() => {
    // 构建检索参数字典（只包含非空值）
    const params: Record<string, string> = {};
    if (productClass.value) params.productClass = productClass.value;
    if (number.value) params.number = number.value;
    if (market.value) params.market = market.value;
    if (variable.value) params.variable = variable.value;
    if (value.value) params.value = value.value;
    if (variantString1.value) params.variantString1 = variantString1.value;
    if (variantString2.value) params.variantString2 = variantString2.value;
    if (comments.value) params.comments = comments.value;

    // 保存当前表单数据，用于UD09点Back返回时恢复输入
    const formData = {
      productClass: productClass.value,
      productClassOp: productClass.operator,
      number: number.value,
      numberOp: number.operator,
      market: market.value,
      marketOp: market.operator,
      variable: variable.value,
      variableOp: variable.operator,
      value: value.value,
      valueOp: value.operator,
      variantString1: variantString1.value,
      variantString1Op: variantString1.operator,
      variantString2: variantString2.value,
      variantString2Op: variantString2.operator,
      comments: comments.value,
      commentsOp: comments.operator,
      displayAddDate,
      displayDeleteDate,
      displayCreatedByUser,
      displayDate,
    };

    // 画面迁移到 UD09，同时传递检索条件和当前表单数据
    navigate('/UD09', { state: { searchParams: params, formData } });
  }, [navigate, productClass, number, market, variable, value, variantString1, variantString2, comments,
      displayAddDate, displayDeleteDate, displayCreatedByUser, displayDate]);

  /**
   * 执行前端校验
   * 对应设计书 3.2 校验详细规格表
   *
   * 校验规则：
   * - Product class 不能为空（No.7）
   * - Number 不能为空（No.8）
   * - Number 必须是半角数字（No.9）
   * - Market 不能为空（No.10）
   *
   * @param operationName - 操作名称（用于错误消息）
   * @returns {boolean} 校验是否通过
   */
  const validateRequiredFields = (operationName: string): boolean => {
    if (!productClass.value.trim()) {
      setMessage('Product class是必填项');
      setMessageType('error');
      return false;
    }
    if (!number.value.trim()) {
      setMessage('Number是必填项');
      setMessageType('error');
      return false;
    }
    if (!/^\d+$/.test(number.value.trim())) {
      setMessage('Number必须是半角数字');
      setMessageType('error');
      return false;
    }
    if (!market.value.trim()) {
      setMessage('Market是必填项');
      setMessageType('error');
      return false;
    }
    return true;
  };

  /**
   * 校验 Variable 在 HDOC_VARIABLES 表中的存在性
   * 对应设计书 3.1.4 Add 操作流程 - 步骤4
   *
   * 处理逻辑：
   * - 若 Variable 输入以 'TEMPLATE-' 开头，去掉前缀后进行检查
   * - 调用后端API校验剩余内容是否存在于 HDOC_VARIABLES 表
   *
   * @returns {Promise<boolean>} 校验是否通过
   */
  const validateVariableExistence = async (): Promise<boolean> => {
    if (!variable.value.trim()) {
      // Variable 为非必填，为空时不校验
      return true;
    }

    // Variable 输入特殊处理：若输入'TEMPLATE-XXX'，需去掉前缀'TEMPLATE-'后检查
    let variableToCheck = variable.value.trim();
    const TEMPLATE_PREFIX = 'TEMPLATE-';
    if (variableToCheck.startsWith(TEMPLATE_PREFIX)) {
      variableToCheck = variableToCheck.substring(TEMPLATE_PREFIX.length);
    }

    try {
      const response = await apiClient.get('/api/ud08/selecthdocvariables', {
        params: { variables: variableToCheck }
      });

      if (response.data.code === 200) {
        const exists = response.data.data?.exists;
        if (!exists) {
          setMessage('Variant does not exist, Please enter the correct content');
          setMessageType('error');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Variable存在性校验失败:', error);
      setMessage('系统内部错误，请联系系统管理员');
      setMessageType('error');
      return false;
    }
  };

  /**
   * 执行新增操作
   * 对应设计书 3.1.4 Add 操作流程
   *
   * 处理流程：
   * 1. 前端校验必填项
   * 2. 校验 Variable 存在性
   * 3. 调用后端新增API
   * 4. 处理成功/失败结果
   */
  const handleAdd = useCallback(async () => {
    // 步骤1：前端校验
    if (!validateRequiredFields('Add')) return;

    setIsLoading(true);
    try {
      // 步骤2：Variable存在性校验
      const variableValid = await validateVariableExistence();
      if (!variableValid) {
        setIsLoading(false);
        return;
      }

      // 步骤3：调用新增API
      const currentUser = localStorage.getItem('userId') || 'SYSTEM';
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

      const requestBody = {
        productClass: productClass.value.trim(),
        number: parseInt(number.value.trim(), 10),
        market: market.value.trim(),
        variable: variable.value.trim(),
        value: value.value.trim(),
        variantString1: variantString1.value.trim(),
        variantString2: variantString2.value.trim(),
        comments: comments.value.trim(),
        addDate: dateStr,
        deleteDate: '',
        createdByUser: currentUser,
        date: now.toISOString(),
      };

      const response = await apiClient.post('/api/ud08/add', requestBody);

      // 步骤4：结果处理
      if (response.data.code === 200) {
        setMessage('数据添加成功');
        setMessageType('success');
        // 自动填充信息标签
        setDisplayAddDate(dateStr);
        setDisplayCreatedByUser(currentUser);
        setDisplayDate(now.toLocaleString());
        // 清空输入表单（保留主键字段以便查看）
        setVariable({ value: '', operator: '=' });
        setValue({ value: '', operator: '=' });
        setVariantString1({ value: '', operator: '=' });
        setVariantString2({ value: '', operator: '=' });
        setComments({ value: '', operator: '=' });
      } else {
        setMessage(response.data.message || '操作失败');
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('新增操作失败:', error);
      // 处理后端返回的业务错误
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('系统内部错误，请联系系统管理员');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productClass, number, market, variable, value, variantString1, variantString2, comments]);

  /**
   * 执行更新操作
   * 对应设计书 3.1.5 Update 操作流程
   *
   * 处理流程：
   * 1. 前端校验必填项
   * 2. 校验 Variable 存在性
   * 3. 调用后端更新API
   * 4. 处理成功/失败结果
   */
  const handleUpdate = useCallback(async () => {
    // 步骤1：前端校验
    if (!validateRequiredFields('Update')) return;

    setIsLoading(true);
    try {
      // 步骤2：Variable存在性校验
      const variableValid = await validateVariableExistence();
      if (!variableValid) {
        setIsLoading(false);
        return;
      }

      // 步骤3：调用更新API
      const currentUser = localStorage.getItem('userId') || 'SYSTEM';
      const now = new Date();

      const requestBody = {
        productClass: productClass.value.trim(),
        number: parseInt(number.value.trim(), 10),
        market: market.value.trim(),
        variable: variable.value.trim(),
        value: value.value.trim(),
        variantString1: variantString1.value.trim(),
        variantString2: variantString2.value.trim(),
        comments: comments.value.trim(),
        addDate: displayAddDate,
        deleteDate: displayDeleteDate,
        createdByUser: currentUser,
        date: now.toISOString(),
      };

      const response = await apiClient.post('/api/ud08/update', requestBody);

      // 步骤4：结果处理
      if (response.data.code === 200) {
        setMessage('数据更新成功');
        setMessageType('success');
        setDisplayDate(now.toLocaleString());
      } else {
        setMessage(response.data.message || '操作失败');
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('更新操作失败:', error);
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('系统内部错误，请联系系统管理员');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productClass, number, market, variable, value, variantString1, variantString2, comments, displayAddDate, displayDeleteDate]);

  /**
   * 执行删除操作
   * 对应设计书 3.1.6 Delete 操作流程
   *
   * 处理流程：
   * 1. 前端校验必填项
   * 2. 调用后端删除API
   * 3. 处理成功/失败结果
   */
  const handleDelete = useCallback(async () => {
    // 步骤1：前端校验必填项
    if (!productClass.value.trim()) {
      setMessage('Product class是必填项');
      setMessageType('error');
      return;
    }
    if (!number.value.trim()) {
      setMessage('Number是必填项');
      setMessageType('error');
      return;
    }
    if (!market.value.trim()) {
      setMessage('Market是必填项');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    try {
      // 步骤2：调用删除API
      const requestBody = {
        productClass: productClass.value.trim(),
        number: parseInt(number.value.trim(), 10),
        market: market.value.trim(),
      };

      const response = await apiClient.post('/api/ud08/delete', requestBody);

      // 步骤3：结果处理
      if (response.data.code === 200) {
        setMessage('数据删除成功');
        setMessageType('success');
        // 清空输入表单
        handleClear();
      } else {
        setMessage(response.data.message || '操作失败');
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('删除操作失败:', error);
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('系统内部错误，请联系系统管理员');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, [productClass, number, market, handleClear]);

  // ==================== 渲染 ====================

  /**
   * 渲染单个字段行
   * 每个字段包含：标签 + 运算符下拉框 + 输入控件
   *
   * @param label - 字段标签
   * @param fieldType - 控件类型（'input' | 'select'）
   * @param value - 当前值
   * @param operator - 当前运算符
   * @param onValueChange - 值变更回调
   * @param onOperatorChange - 运算符变更回调
   * @param options - 下拉选项（select类型时使用）
   * @param maxLength - 最大长度
   * @param placeholder - 占位文字
   */
  const renderFieldRow = (
    label: string,
    fieldType: 'input' | 'select',
    value: string,
    operator: string,
    onValueChange: (val: string) => void,
    onOperatorChange: (op: string) => void,
    options?: string[],
    maxLength?: number,
    placeholder?: string,
    /** 运算符下拉选项，默认使用【=,≠】 */
    operatorOptions?: string[],
  ) => (
    <div className="ud08-search-row">
      <span className="ud08-label">
        {label.startsWith('*') ? (
          <>
            <span className="ud08-label--required">*</span>
            {label.substring(1)}
          </>
        ) : (
          label
        )}
      </span>
      <select
        className="ud08-operator"
        value={operator}
        onChange={(e) => onOperatorChange(e.target.value)}
      >
        {(operatorOptions || OPERATOR_OPTIONS_DEFAULT).map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
      {fieldType === 'select' ? (
        <select
          className="ud08-select"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
        >
          <option value="">-- 请选择 --</option>
          {(options || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          className="ud08-input"
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (maxLength && val.length > maxLength) return;
            onValueChange(val);
          }}
          placeholder={placeholder || `请输入${label}`}
          maxLength={maxLength}
        />
      )}
    </div>
  );

  return (
    <div className="ud08-container">
      {/* 页面标题 */}
      <div className="ud08-title">Homologation Variables</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud08-message ud08-message--${messageType}`}>
          {message}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="ud08-content">
        {/* 操作按钮行（所有按钮在一行，对应图片顶部布局） */}
        <div className="ud08-button-row">
          <button
            className="ud08-btn ud08-btn--search"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Search
          </button>
          <button
            className="ud08-btn ud08-btn--clear"
            onClick={handleClear}
            disabled={isLoading}
          >
            Clear
          </button>
          <button
            className="ud08-btn ud08-btn--add"
            onClick={handleAdd}
            disabled={isLoading}
          >
            Add
          </button>
          <button
            className="ud08-btn ud08-btn--update"
            onClick={handleUpdate}
            disabled={isLoading}
          >
            Update
          </button>
          <button
            className="ud08-btn ud08-btn--delete"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>

        {/* 检索条件字段 */}
        {renderFieldRow(
          '*Product class', 'select',
          productClass.value, productClass.operator,
          (val) => handleFieldValueChange(setProductClass, val),
          (op) => handleOperatorChange(setProductClass, op),
          productClassOptions, undefined, '请选择Product class'
        )}

        {renderFieldRow(
          '*Number', 'input',
          number.value, number.operator,
          (val) => handleFieldValueChange(setNumber, val),
          (op) => handleOperatorChange(setNumber, op),
          undefined, 10, '请输入Number'
        )}

        {renderFieldRow(
          '*Market', 'select',
          market.value, market.operator,
          (val) => handleFieldValueChange(setMarket, val),
          (op) => handleOperatorChange(setMarket, op),
          marketOptions, undefined, '请选择Market'
        )}

        {renderFieldRow(
          'Variable', 'input',
          variable.value, variable.operator,
          (val) => handleFieldValueChange(setVariable, val),
          (op) => handleOperatorChange(setVariable, op),
          undefined, 20, '请输入Variable'
        )}

        {renderFieldRow(
          'Value', 'input',
          value.value, value.operator,
          (val) => handleFieldValueChange(setValue, val),
          (op) => handleOperatorChange(setValue, op),
          undefined, 200, '请输入Value'
        )}

        {renderFieldRow(
          'Variant string.1', 'input',
          variantString1.value, variantString1.operator,
          (val) => handleFieldValueChange(setVariantString1, val),
          (op) => handleOperatorChange(setVariantString1, op),
          undefined, 100, '请输入Variant string.1'
        )}

        {renderFieldRow(
          'Variant string.2', 'input',
          variantString2.value, variantString2.operator,
          (val) => handleFieldValueChange(setVariantString2, val),
          (op) => handleOperatorChange(setVariantString2, op),
          undefined, 100, '请输入Variant string.2'
        )}

        {renderFieldRow(
          'Comments', 'input',
          comments.value, comments.operator,
          (val) => handleFieldValueChange(setComments, val),
          (op) => handleOperatorChange(setComments, op),
          undefined, 100, '请输入Comments'
        )}

        {/* 信息标签字段（与检索字段样式统一） */}
        {/* Add和Delete项目后面的下拉框内容为：【=,<,>】（对应设计书 3.1 备注） */}
        {renderFieldRow(
          'Add', 'input',
          displayAddDate, '=',
          (val) => setDisplayAddDate(val),
          () => {},
          undefined, 6, undefined,
          OPERATOR_OPTIONS_DATE
        )}

        {renderFieldRow(
          'Delete', 'input',
          displayDeleteDate, '=',
          (val) => setDisplayDeleteDate(val),
          () => {},
          undefined, 6, undefined,
          OPERATOR_OPTIONS_DATE
        )}

        {/* 其他项目后的下拉框内容为：【=,≠】（对应设计书 3.1 备注） */}
        {renderFieldRow(
          'Created by user', 'input',
          displayCreatedByUser, '=',
          (val) => setDisplayCreatedByUser(val),
          () => {},
          undefined, 16
        )}

        {renderFieldRow(
          'Date', 'input',
          displayDate, '=',
          (val) => setDisplayDate(val),
          () => {},
          undefined, undefined, undefined,
          OPERATOR_OPTIONS_DATE
        )}
      </div>
    </div>
  );
};

export default UD08_HomologationVariables;
