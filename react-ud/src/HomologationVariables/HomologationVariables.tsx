import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './HomologationVariables.css';

interface ProductClass {
  pc: string;
  description: string;
}

interface Market {
  market: string;
  description: string;
}

interface CheckResult {
  exists: boolean;
  count: number;
}

type Operator = '=' | '!=' | '>' | '<';

interface Condition {
  label: string;
  operator: Operator;
  value: string;
}

interface VariantCond {
  label: string;
  operator1: Operator;
  value1: string;
  operator2: Operator;
  value2: string;
}

const ALL_LABELS = [
  'Product class', 'Number', 'Market', 'Variable', 'Value',
  'Comments', 'Add', 'Delete', 'Created by user', 'Date',
] as const;

const STORAGE_KEY = 'hv_conditions';

const HomologationVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── 条件状态 ──
  const [conditions, setConditions] = useState<Condition[]>(
    ALL_LABELS.map((label) => ({ label, operator: '=' as Operator, value: '' }))
  );

  const [variantCond, setVariantCond] = useState<VariantCond>({
    label: 'Variant string',
    operator1: '=', value1: '',
    operator2: '=', value2: '',
  });

  // ── 下拉数据 ──
  const [productClasses, setProductClasses] = useState<ProductClass[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);

  // ── UI 状态 ──
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── 更新函数 ──
  const updateConditionOp = (i: number, op: Operator) =>
    setConditions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], operator: op };
      return next;
    });

  const updateConditionVal = (i: number, v: string) =>
    setConditions((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], value: v };
      return next;
    });

  // ── 加载下拉数据 ──
  useEffect(() => {
    (async () => {
      try {
        const [pcRes, marketRes] = await Promise.all([
          api.post<ProductClass[]>('/ud08/productclass', {}),
          api.post<Market[]>('/ud08/market', {}),
        ]);
        if (pcRes.code === 200 && pcRes.data) setProductClasses(pcRes.data);
        if (marketRes.code === 200 && marketRes.data) setMarkets(marketRes.data);
      } catch {
        setErrorMessage('Failed to load reference data.');
      }
    })();
  }, []);

  // ── 从 Select / Back / Down 返回时恢复条件 ──
  useEffect(() => {
    const st = location.state as
      | { selectedRecords?: any[]; conditions?: any[]; downVariable?: string }
      | null;

    // Down 操作：从 Existing HDoc Variables 跳转过来，填充 Variable 字段
    if (st?.downVariable) {
      const idx = ALL_LABELS.indexOf('Variable');
      if (idx >= 0) {
        setConditions((prev) => {
          const next = [...prev];
          next[idx] = { ...next[idx], value: st.downVariable || '' };
          return next;
        });
      }
      window.history.replaceState({}, document.title);
      return;
    }

    // Select 返回：选中记录填充到表单
    if (st?.selectedRecords?.length) {
      const rec = st.selectedRecords[0];
      // 将所有值转为字符串，避免数字类型导致后端 JSON 反序列化异常
      const toStr = (v: any): string => (v == null ? '' : String(v));
      setConditions(
        ALL_LABELS.map((label) => {
          const valMap: Record<string, string> = {
            'Product class': toStr(rec.pc),
            Number: toStr(rec.num),
            Market: toStr(rec.market),
            Variable: toStr(rec.variable),
            Value: toStr(rec.val),
            Comments: toStr(rec.comments),
            Add: toStr(rec.addDate),
            Delete: toStr(rec.deleteDate),
            'Created by user': toStr(rec.updateUser),
            Date: toStr(rec.updateDatetime),
          };
          return { label, operator: '=' as Operator, value: valMap[label] ?? '' };
        })
      );
      window.history.replaceState({}, document.title);
      return;
    }

    // Back 返回：从 location.state 或 sessionStorage 恢复
    const rawConds = st?.conditions ?? (() => {
      try {
        const s = sessionStorage.getItem(STORAGE_KEY);
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    })();

    if (rawConds && Array.isArray(rawConds)) {
      const getVal = (lbl: string) =>
        rawConds.find((c: any) => c.label === lbl)?.value ?? '';
      const getOp = (lbl: string): Operator =>
        (rawConds.find((c: any) => c.label === lbl)?.operator as Operator) ?? '=';

      setConditions(ALL_LABELS.map((l) => ({ label: l, operator: getOp(l), value: getVal(l) })));

      const vs = rawConds.find((c: any) => c.label === 'Variant string');
      if (vs) {
        setVariantCond({
          label: 'Variant string',
          operator1: vs.operator1 ?? '=',
          value1: vs.value1 ?? '',
          operator2: vs.operator2 ?? '=',
          value2: vs.value2 ?? '',
        });
      }

      sessionStorage.removeItem(STORAGE_KEY);
      window.history.replaceState({}, document.title);
    }
  }, []);

  // ── 消息 ──
  const clearMessages = () => { setErrorMessage(''); setSuccessMessage(''); };

  const clearForm = (keepSuccess = false) => {
    setConditions((prev) => prev.map((c) => ({ ...c, operator: '=' as Operator, value: '' })));
    setVariantCond({ label: 'Variant string', operator1: '=', value1: '', operator2: '=', value2: '' });
    sessionStorage.removeItem(STORAGE_KEY);
    if (!keepSuccess) clearMessages();
  };

  // ── 成功消息自动消失 ──
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 3000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // ── 工具函数 ──
  const getCondValue = (label: string): string =>
    conditions.find((c) => c.label === label)?.value ?? '';

  const processVariable = (v: string): string =>
    v.startsWith('TEMPLATE-') ? v.substring(9) : v;

  const checkVariableExists = async (v: string): Promise<boolean> => {
    try {
      const res = await api.post<CheckResult>('/ud08/checkVariable', { variable: v });
      return res.code === 200 && res.data ? res.data.exists : false;
    } catch { return false; }
  };

  const checkRuleExists = async (pc: string, num: string, market: string): Promise<boolean> => {
    try {
      const res = await api.post<CheckResult>('/ud08/checkRule', { pc, num, market });
      return res.code === 200 && res.data ? res.data.exists : false;
    } catch { return false; }
  };

  /** 读取 conditions 中的值用于 CRUD 操作 */
  const getFormVal = (label: string): string =>
    conditions.find((c) => c.label === label)?.value ?? '';

  // ── 按钮处理 ──
  const handleSearch = async () => {
    clearMessages();
    const pc = getCondValue('Product class');
    const num = getCondValue('Number');
    const mkt = getCondValue('Market');
    if (!pc || !num || !mkt) {
      setErrorMessage('Product class, Number and Market are required.');
      return;
    }
    setIsLoading(true);
    try {
      const allConds = [
        ...conditions.map((c) => ({ label: c.label, operator: c.operator, value: String(c.value) })),
        {
          label: variantCond.label,
          operator1: variantCond.operator1, value1: String(variantCond.value1),
          operator2: variantCond.operator2, value2: String(variantCond.value2),
        },
      ];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allConds));
      navigate('/menu/homologation-variables/result', { state: { conditions: allConds } });
    } finally { setIsLoading(false); }
  };

  const handleAdd = async () => {
    clearMessages();
    const pc = getFormVal('Product class');
    const num = getFormVal('Number');
    const mkt = getFormVal('Market');
    const varVal = getFormVal('Variable');
    const valVal = getFormVal('Value');
    const cmt = getFormVal('Comments');
    const addDt = getFormVal('Add');
    const delDt = getFormVal('Delete');

    if (!pc || !num || !mkt) {
      setErrorMessage('Product class, Number and Market are required.');
      return;
    }

    if (await checkRuleExists(pc, num, mkt)) {
      setErrorMessage('Primary key conflict, Please enter the correct content.');
      return;
    }

    const processedVar = processVariable(varVal);
    if (varVal && !processedVar) {
      setErrorMessage('Variant does not exist, Please enter the correct content.');
      return;
    }
    if (processedVar && !(await checkVariableExists(processedVar))) {
      setErrorMessage('Variant does not exist, Please enter the correct content.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/ud08/add', {
        pc, num, market: mkt, variable: processedVar, val: valVal,
        vs: variantCond.value1, vs2: variantCond.value2, comments: cmt, addDate: addDt, deleteDate: delDt,
      });
      if (res.code === 200) { setSuccessMessage('Rule added successfully.'); clearForm(true); }
      else setErrorMessage(res.message || 'Failed to add rule.');
    } catch { setErrorMessage('System error. Please contact administrator.'); }
    finally { setIsLoading(false); }
  };

  const handleUpdate = async () => {
    clearMessages();
    const pc = getFormVal('Product class');
    const num = getFormVal('Number');
    const mkt = getFormVal('Market');
    const varVal = getFormVal('Variable');
    const valVal = getFormVal('Value');
    const cmt = getFormVal('Comments');
    const addDt = getFormVal('Add');
    const delDt = getFormVal('Delete');

    if (!pc || !num || !mkt) {
      setErrorMessage('Product class, Number and Market are required.');
      return;
    }

    if (!(await checkRuleExists(pc, num, mkt))) {
      setErrorMessage('Data does not exist, Please enter the correct content.');
      return;
    }

    const processedVar = processVariable(varVal);
    if (processedVar && !(await checkVariableExists(processedVar))) {
      setErrorMessage('Variant does not exist, Please enter the correct content.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/ud08/update', {
        pc, num, market: mkt, variable: processedVar, val: valVal,
        vs: variantCond.value1, vs2: variantCond.value2, comments: cmt, addDate: addDt, deleteDate: delDt,
      });
      if (res.code === 200) { setSuccessMessage('Rule updated successfully.'); clearForm(true); }
      else setErrorMessage(res.message || 'Failed to update rule.');
    } catch { setErrorMessage('System error. Please contact administrator.'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async () => {
    clearMessages();
    const pc = getFormVal('Product class');
    const num = getFormVal('Number');
    const mkt = getFormVal('Market');

    if (!pc || !num || !mkt) {
      setErrorMessage('Product class, Number and Market are required.');
      return;
    }

    if (!(await checkRuleExists(pc, num, mkt))) {
      setErrorMessage('Data does not exist, Please enter the correct content.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/ud08/delete', { pc, num, market: mkt });
      if (res.code === 200) { setSuccessMessage('Rule deleted successfully.'); clearForm(true); }
      else setErrorMessage(res.message || 'Failed to delete rule.');
    } catch { setErrorMessage('System error. Please contact administrator.'); }
    finally { setIsLoading(false); }
  };

  // ── 渲染函数 ──
  const isRequired = (label: string) => ['Product class', 'Number', 'Market'].includes(label);

  const renderValueControl = (label: string, value: string, onChange: (v: string) => void) => {
    if (label === 'Product class') {
      return (
        <select className="hv-cond-input hv-cond-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading}>
          <option value="">-- Select --</option>
          {productClasses.map((pc) => (
            <option key={pc.pc} value={pc.pc}>{pc.pc} - {pc.description}</option>
          ))}
        </select>
      );
    }
    if (label === 'Market') {
      return (
        <select className="hv-cond-input hv-cond-select" value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading}>
          <option value="">-- Select --</option>
          {markets.map((m) => (
            <option key={m.market} value={m.market}>{m.market} - {m.description}</option>
          ))}
        </select>
      );
    }
    return (
      <input type="text" className="hv-cond-input" value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading} />
    );
  };

  const getRowClass = (label: string): string => {
    const map: Record<string, string> = {
      'Product class': 'hv-row-product-class', Variable: 'hv-row-variable',
      Value: 'hv-row-value', Comments: 'hv-row-comments',
      'Created by user': 'hv-row-created-by', Date: 'hv-row-date',
    };
    return map[label] || '';
  };

  const getSuffix = (label: string): string | null => {
    if (label === 'Add' || label === 'Delete') return 'YYYYWW';
    if (label === 'Created by user' || label === 'Date') return 'Haohetao123';
    return null;
  };

  const renderOpSelect = (op: Operator, onChange: (op: Operator) => void) => (
    <select className="hv-op-select" value={op} onChange={(e) => onChange(e.target.value as Operator)} disabled={isLoading}>
      <option value="=">=</option>
      <option value="!=">!=</option>
      <option value=">">&gt;</option>
      <option value="<">&lt;</option>
    </select>
  );

  const renderSimpleRow = (cond: Condition, idx: number) => (
    <div className={`hv-cond-row ${getRowClass(cond.label)}`} key={cond.label}>
      <span className={`hv-cond-label${isRequired(cond.label) ? ' required' : ''}`}>{cond.label}</span>
      {renderOpSelect(cond.operator, (op) => updateConditionOp(idx, op))}
      {renderValueControl(cond.label, cond.value, (v) => updateConditionVal(idx, v))}
      {getSuffix(cond.label) && <span className="hv-input-suffix">{getSuffix(cond.label)}</span>}
    </div>
  );

  const renderVariantRow = () => (
    <div className="hv-cond-row hv-row-variant" key="Variant string">
      <span className="hv-cond-label">Variant string</span>
      <div className="hv-variant-group">
        <div className="hv-variant-subrow">
          {renderOpSelect(variantCond.operator1, (op) => setVariantCond((p) => ({ ...p, operator1: op })))}
          {renderValueControl('Variant string', variantCond.value1, (v) => setVariantCond((p) => ({ ...p, value1: v })))}
        </div>
        <div className="hv-variant-subrow">
          {renderOpSelect(variantCond.operator2, (op) => setVariantCond((p) => ({ ...p, operator2: op })))}
          {renderValueControl('Variant string', variantCond.value2, (v) => setVariantCond((p) => ({ ...p, value2: v })))}
        </div>
      </div>
    </div>
  );

  // ── JSX ──
  return (
    <div className="homologation-vars-container">
      <div className="homologation-vars-header">
        <h1>Homologation Variables</h1>
      </div>

      <table className="hv-btn-table">
        <tbody>
          <tr>
            <td className="hv-btn-cell">
              <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>Search</button>
              <button className="btn" onClick={() => clearForm()} disabled={isLoading}>Clear</button>
              <button className="btn" onClick={handleAdd} disabled={isLoading}>Add</button>
              <button className="btn" onClick={handleUpdate} disabled={isLoading}>Update</button>
              <button className="btn" onClick={handleDelete} disabled={isLoading}>Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="hv-cond-list">
        {conditions.slice(0, 5).map((cond, i) => renderSimpleRow(cond, i))}
        {renderVariantRow()}
        {conditions.slice(5).map((cond, i) => renderSimpleRow(cond, i + 5))}
      </div>

      {errorMessage && <div className="hv-error">{errorMessage}</div>}
      {successMessage && <div className="hv-success">{successMessage}</div>}
    </div>
  );
};

export default HomologationVariables;
