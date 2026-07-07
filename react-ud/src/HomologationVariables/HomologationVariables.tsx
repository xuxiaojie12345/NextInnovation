import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './HomologationVariables.css';

/**
 * Product Class 下拉选项类型
 */
interface ProductClassOption {
  pc: string;
  description: string;
}

/**
 * Market 下拉选项类型
 */
interface MarketOption {
  market: string;
  description: string;
}

/**
 * HDOC Variable 选项类型
 */
interface HdocVariableOption {
  variable: string;
}

/**
 * 表单数据类型
 */
interface FormData {
  productClass: string;
  number: string;
  market: string;
  variable: string;
  value: string;
  vs: string;
  vs2: string;
  comments: string;
  addDate: string;
  deleteDate: string;
  updateUser: string;
  updateDatetime: string;
}

const API_BASE_URL = 'http://localhost:8081';

type Operator = '=' | '!=';
/** 数值/日期字段专用运算符：仅支持 < > = 三种比较 */
type CompareOperator = '=' | 'GT' | 'LT';

/**
 * HomologationVariables 组件 - 认证变量管理页面（UD08）
 */
const HomologationVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 各字段的 = / != 运算符状态（普通字段）
  const [ops, setOps] = useState<Record<string, Operator>>({
    productClass: '=', market: '=', variable: '=', value: '=',
    vs: '=', vs2: '=', comments: '=', updateUser: '=', addDate: '=', deleteDate: '='
  });
  // Number和Date字段的运算符状态（支持大于小于比较）
  const [compareOps, setCompareOps] = useState<Record<string, CompareOperator>>({
    number: '=', updateDatetime: '='
  });

  const setOp = (field: string, v: Operator) => setOps(prev => ({ ...prev, [field]: v }));

  const setCompareOp = (field: string, v: CompareOperator) => setCompareOps(prev => ({ ...prev, [field]: v }));

  const renderOp = (field: string) => (
    <select value={ops[field]} onChange={e => setOp(field, e.target.value as Operator)} className='operator-select'>
      <option value='='>=</option>
      <option value='!='>!=</option>
    </select>
  );

  /** 数值/日期字段专用运算符下拉框（仅支持 < > = 三种比较） */
  const renderCompareOp = (field: string) => (
    <select value={compareOps[field]} onChange={e => setCompareOp(field, e.target.value as CompareOperator)} className='operator-select'>
      <option value='='>=</option>
      <option value='GT'>&gt;</option>
      <option value='LT'>&lt;</option>
    </select>
  );

  const [productClassList, setProductClassList] = useState<ProductClassOption[]>([]);
  const [marketList, setMarketList] = useState<MarketOption[]>([]);
  const [hdocVariableList, setHdocVariableList] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    productClass: '', number: '', market: '', variable: '', value: '',
    vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isOperating, setIsOperating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);
  // 从UD09搜索结果页传入的原始主键值，用于Update时主键变更校验
  const [originalKeys, setOriginalKeys] = useState<{ productClass: string; number: string; market: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [pcRes, mktRes, varRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/ud08/selectproductclassmaster`),
          axios.get(`${API_BASE_URL}/api/ud08/selectmarketmaster`),
          axios.get(`${API_BASE_URL}/api/ud08/selecthdocvariables`)
        ]);
        if (Array.isArray(pcRes.data)) setProductClassList(pcRes.data);
        if (Array.isArray(mktRes.data)) setMarketList(mktRes.data);
        if (Array.isArray(varRes.data)) {
          setHdocVariableList(varRes.data.map((x: HdocVariableOption) => x.variable));
        }

        // 从搜索结果页面返回时，接收选中的记录数据或搜索条件
        const state = location.state as Record<string, any> | null;
        if (state?.selectedRecord) {
          // Select操作：从搜索结果页面选中一条记录返回
          const record = state.selectedRecord as Record<string, string>;
          setFormData(prev => ({ ...prev, ...record }));
          // 保存原始主键值（用于Update时主键变更校验）
          setOriginalKeys({
            productClass: record.productClass || '',
            number: record.number || '',
            market: record.market || ''
          });
        } else if (state?.searchConditions) {
          // Back操作：从搜索结果页面携带搜索条件返回
          // searchConditions 包含字段值和运算符（key 以 Op 结尾）
          const conditions = state.searchConditions as Record<string, string>;
          // 分离字段值和运算符
          const formValues: Record<string, string> = {};
          const equalOpValues: Record<string, Operator> = {};
          const compareOpValues: Record<string, CompareOperator> = {};
          // 比较运算符字段列表（number、updateDatetime）
          const compareFields = ['number', 'updateDatetime'];
          for (const key of Object.keys(conditions)) {
            if (key.endsWith('Op')) {
              // 运算符字段，如 productClassOp -> productClass
              const fieldName = key.slice(0, -2); // 去掉 'Op' 后缀
              const val = conditions[key];
              if (compareFields.includes(fieldName)) {
                if (['=', '!=', 'GT', 'LT', '>=', '<='].includes(val)) {
                  compareOpValues[fieldName] = val as CompareOperator;
                }
              } else {
                if (val === '=' || val === '!=') {
                  equalOpValues[fieldName] = val as Operator;
                }
              }
            } else if (key !== 'selectedRecord' && key !== 'searchConditions') {
              // 普通字段值
              formValues[key] = conditions[key];
            }
          }
          setFormData(prev => ({ ...prev, ...formValues }));
          if (Object.keys(equalOpValues).length > 0) {
            setOps(prev => ({ ...prev, ...equalOpValues }));
          }
          if (Object.keys(compareOpValues).length > 0) {
            setCompareOps(prev => ({ ...prev, ...compareOpValues }));
          }
        }
      } catch {
        setMessage('Failed to load data. Please try again.');
        setHasError(true);
      } finally { setLoading(false); }
    };
    init();
  }, []);

  const setField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (message) { setMessage(''); setHasError(false); }
  };

  const handleNumber = (v: string) => {
    if (/^[0-9]*$/.test(v) && v.length <= 10) setField('number', v);
  };

  const handleDate = (v: string) => {
    if (/^[0-9-]*$/.test(v) && v.length <= 10) setField('updateDatetime', v);
  };

  const validateRequired = (): string | null => {
    const { productClass, number, market } = formData;
    if (!productClass) return 'Product class is required.';
    if (!number) return 'Number is required.';
    if (!/^[0-9]+$/.test(number)) return 'Number must be digits only.';
    if (!market) return 'Market is required.';
    return null;
  };

  const validateVariable = (): string | null => {
    const { variable } = formData;
    if (variable && variable.startsWith('TEMPLATE-')) {
      const s = variable.substring(9);
      if (s && !hdocVariableList.includes(s)) return 'Variant does not exist, Please enter the correct content';
    }
    return null;
  };

  const handleAdd = useCallback(async () => {
    setMessage(''); setHasError(false);
    const err = validateRequired() || validateVariable();
    if (err) { setMessage(err); setHasError(true); return; }
    setIsOperating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/ud08/add`, formData);
      if (res.data.code === 200) { setMessage('Record added successfully.'); setHasError(false); }
      else if (res.data.code === 409) { setMessage('Primary key conflict, Please enter the correct content'); setHasError(true); }
      else { setMessage(res.data.message || 'System error. Please contact administrator.'); setHasError(true); }
    } catch (e: any) {
      if (e.response?.status === 409) setMessage('Primary key conflict, Please enter the correct content');
      else if (e.response?.status === 400) setMessage('Variant does not exist, Please enter the correct content');
      else setMessage('System error. Please contact administrator.');
      setHasError(true);
    } finally { setIsOperating(false); }
  }, [formData]);

  const handleUpdate = useCallback(async () => {
    setMessage(''); setHasError(false);
    const err = validateRequired() || validateVariable();
    if (err) { setMessage(err); setHasError(true); return; }
    // 主键变更校验：若从UD09返回（有原始主键值），检查主键是否被修改
    if (originalKeys) {
      const { productClass, number, market } = formData;
      if (productClass !== originalKeys.productClass ||
          number !== originalKeys.number ||
          market !== originalKeys.market) {
        setMessage('Primary key conflict, Please enter the correct content');
        setHasError(true);
        return;
      }
    }
    setIsOperating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/ud08/update`, formData);
      if (res.data.code === 200) { setMessage('Record updated successfully.'); setHasError(false); }
      else if (res.data.code === 404) { setMessage('Data does not exist, Please enter the correct content'); setHasError(true); }
      else if (res.data.code === 409) { setMessage('Primary key conflict, Please enter the correct content'); setHasError(true); }
      else { setMessage(res.data.message || 'System error. Please contact administrator.'); setHasError(true); }
    } catch (e: any) {
      if (e.response?.status === 404) setMessage('Data does not exist, Please enter the correct content');
      else if (e.response?.status === 409) setMessage('Primary key conflict, Please enter the correct content');
      else if (e.response?.status === 400) setMessage('Variant does not exist, Please enter the correct content');
      else setMessage('System error. Please contact administrator.');
      setHasError(true);
    } finally { setIsOperating(false); }
  }, [formData, originalKeys]);

  const handleDelete = useCallback(async () => {
    setMessage(''); setHasError(false);
    const { productClass, number, market } = formData;
    if (!productClass) { setMessage('Product class is required.'); setHasError(true); return; }
    if (!number) { setMessage('Number is required.'); setHasError(true); return; }
    if (!market) { setMessage('Market is required.'); setHasError(true); return; }
    setIsOperating(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/ud08/delete`, { productClass, number, market });
      if (res.data.code === 200) {
        setMessage('Record deleted successfully.'); setHasError(false);
        handleClear();
      } else if (res.data.code === 404) { setMessage('Data does not exist, Please enter the correct content'); setHasError(true); }
      else { setMessage(res.data.message || 'System error. Please contact administrator.'); setHasError(true); }
    } catch (e: any) {
      if (e.response?.status === 404) setMessage('Data does not exist, Please enter the correct content');
      else setMessage('System error. Please contact administrator.');
      setHasError(true);
    } finally { setIsOperating(false); }
  }, [formData]);

  const handleSearch = () => {
    // 将字段值和运算符一起传递给搜索结果页面
    // 排除 updateDatetime（仅展示用，不作为搜索条件）
    const { updateDatetime, ...searchFormData } = formData;
    // 普通运算符 key 添加 'Op' 后缀，比较运算符 key 添加 'CompareOp' 后缀，避免与字段值重名
    const searchState: Record<string, string> = {
      ...searchFormData,
      productClassOp: ops.productClass,
      marketOp: ops.market,
      variableOp: ops.variable,
      valueOp: ops.value,
      vsOp: ops.vs,
      vs2Op: ops.vs2,
      commentsOp: ops.comments,
      updateUserOp: ops.updateUser,
      addDateOp: ops.addDate,
      deleteDateOp: ops.deleteDate,
      numberOp: compareOps.number,
      updateDatetimeOp: compareOps.updateDatetime,
    };
    navigate('/Menu/HomologationVariables/Search', { state: searchState });
  };

  const handleClear = () => {
    setFormData({
      productClass: '', number: '', market: '', variable: '', value: '',
      vs: '', vs2: '', comments: '', addDate: '', deleteDate: '', updateUser: '', updateDatetime: ''
    });
    setMessage(''); setHasError(false);
  };

  const disabled = isOperating || loading;

  if (loading) {
    return (
      <div className='homologation-variables-container'>
        <h1 className='page-title'>Homologation Variables</h1>
        <div className='loading-message'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='homologation-variables-container'>
      <h1 className='page-title'>Homologation Variables</h1>

      {message && (
        <div className={hasError ? 'error-message' : 'success-message'}>
          {message}
        </div>
      )}

      <div className='form-container'>
        {/* 按钮组 */}
        <div className='button-group'>
          <button type='button' className='action-button' onClick={handleSearch} disabled={disabled}>Search</button>
          <button type='button' className='action-button' onClick={handleClear} disabled={disabled}>Clear</button>
          <button type='button' className='action-button' onClick={handleAdd} disabled={disabled}>Add</button>
          <button type='button' className='action-button' onClick={handleUpdate} disabled={disabled}>Update</button>
          <button type='button' className='action-button' onClick={handleDelete} disabled={disabled}>Delete</button>
        </div>

        {/* Product class */}
        <div className='form-row'>
          <label className='form-label required'>Product class</label>
          <div className='operator-wrapper'>{renderOp('productClass')}</div>
          <div className='form-control-wrapper'>
            <select value={formData.productClass} onChange={e => setField('productClass', e.target.value)} disabled={disabled} className='form-select'>
              <option value=''></option>
              {productClassList.map(x => <option key={x.pc} value={x.pc}>{x.pc}</option>)}
            </select>
          </div>
        </div>

        {/* Number */}
        <div className='form-row'>
          <label className='form-label required'>Number</label>
          <div className='operator-wrapper'>{renderCompareOp('number')}</div>
          <div className='form-control-wrapper'>
            <input type='text' value={formData.number} onChange={e => handleNumber(e.target.value)} disabled={disabled} maxLength={10} className='form-input' style={{ maxWidth: '150px' }} />
          </div>
        </div>

        {/* Market */}
        <div className='form-row'>
          <label className='form-label required'>Market</label>
          <div className='operator-wrapper'>{renderOp('market')}</div>
          <div className='form-control-wrapper'>
            <select value={formData.market} onChange={e => setField('market', e.target.value)} disabled={disabled} className='form-select' style={{ maxWidth: '200px' }}>
              <option value=''></option>
              {marketList.map(x => <option key={x.market} value={x.market}>{x.market}</option>)}
            </select>
          </div>
        </div>

        {/* Variable */}
        <div className='form-row'>
          <label className='form-label'>Variable</label>
          <div className='operator-wrapper'>{renderOp('variable')}</div>
          <div className='form-control-wrapper'>
            <input type='text' value={formData.variable} onChange={e => setField('variable', e.target.value)} disabled={disabled} maxLength={20} className='form-input' style={{ maxWidth: '250px' }} />
          </div>
        </div>

        {/* Value */}
        <div className='form-row'>
          <label className='form-label'>Value</label>
          <div className='operator-wrapper'>{renderOp('value')}</div>
          <div className='form-control-wrapper'>
            <input type='text' value={formData.value} onChange={e => setField('value', e.target.value)} disabled={disabled} maxLength={200} className='form-input' style={{ maxWidth: '600px' }} />
          </div>
        </div>

        {/* Variant string. */}
        <div className='form-row'>
          <label className='form-label'>Variant string.</label>
          <div className='operator-wrapper'>{renderOp('vs')}</div>
          <div className='form-control-wrapper'>
            <input type='text' value={formData.vs} onChange={e => setField('vs', e.target.value)} disabled={disabled} maxLength={100} className='form-input' style={{ maxWidth: '600px' }} />
          </div>
        </div>

        {/* Variant string.2 */}
        <div className='form-row'>
          <label className='form-label'></label>
          <div className='operator-wrapper'>{renderOp('vs2')}</div>
          <div className='form-control-wrapper'>
            <input type='text' value={formData.vs2} onChange={e => setField('vs2', e.target.value)} disabled={disabled} maxLength={100} className='form-input' style={{ maxWidth: '600px' }} />
          </div>
        </div>

        {/* Comments */}
        <div className='form-row'>
          <label className='form-label'>Comments</label>
          <div className='operator-wrapper'>{renderOp('comments')}</div>
          <div className='form-control-wrapper'>
            <input type='text' value={formData.comments} onChange={e => setField('comments', e.target.value)} disabled={disabled} maxLength={100} className='form-input' style={{ maxWidth: '500px' }} />
          </div>
        </div>

        {/* Add */}
        <div className='form-row'>
          <label className='form-label'>Add</label>
          <div className='operator-wrapper'>{renderOp('addDate')}</div>
          <div className='form-control-wrapper auto-field'>
            <input type='text' value={formData.addDate} onChange={e => setField('addDate', e.target.value)} disabled={disabled} maxLength={6} className='form-input' style={{ maxWidth: '150px' }} />
            <span className='auto-label'>YYYYWW</span>
          </div>
        </div>

        {/* Delete */}
        <div className='form-row'>
          <label className='form-label'>Delete</label>
          <div className='operator-wrapper'>{renderOp('deleteDate')}</div>
          <div className='form-control-wrapper auto-field'>
            <input type='text' value={formData.deleteDate} onChange={e => setField('deleteDate', e.target.value)} disabled={disabled} maxLength={6} className='form-input' style={{ maxWidth: '150px' }} />
            <span className='auto-label'>YYYYWW</span>
          </div>
        </div>

        {/* Created by user */}
        <div className='form-row'>
          <label className='form-label'>Created by user</label>
          <div className='operator-wrapper'>{renderOp('updateUser')}</div>
          <div className='form-control-wrapper auto-field'>
            <input type='text' value={formData.updateUser} onChange={e => setField('updateUser', e.target.value)} disabled={disabled} maxLength={16} className='form-input' style={{ maxWidth: '150px' }} />
            <span className='auto-label'>Automatic</span>
          </div>
        </div>

        {/* Date */}
        <div className='form-row'>
          <label className='form-label'>Date</label>
          <div className='operator-wrapper'>{renderCompareOp('updateDatetime')}</div>
          <div className='form-control-wrapper auto-field'>
            <input type='text' value={formData.updateDatetime} onChange={e => handleDate(e.target.value)} disabled={disabled} maxLength={10} placeholder='yyyy-MM-dd' className='form-input' style={{ maxWidth: '150px' }} />
            <span className='auto-label'>Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomologationVariables;
