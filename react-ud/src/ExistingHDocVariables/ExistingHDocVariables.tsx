import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './ExistingHDocVariables.css';

type Operator = '=' | '!=' | '>' | '<';

const STORAGE_KEY = 'ehv_conditions';

const ExistingHDocVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── 表单状态 ──
  const [variable, setVariable] = useState('');
  const [variableOp, setVariableOp] = useState<Operator>('=');
  const [type, setType] = useState('');
  const [typeOp, setTypeOp] = useState<Operator>('=');
  const [description, setDescription] = useState('');
  const [descriptionOp, setDescriptionOp] = useState<Operator>('=');
  const [createdByUser, setCreatedByUser] = useState('');
  const [createdByUserOp, setCreatedByUserOp] = useState<Operator>('=');
  const [date, setDate] = useState('');
  const [dateOp, setDateOp] = useState<Operator>('=');

  // ── UI 状态 ──
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── 成功消息自动消失 ──
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 3000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // ── 从 Result List 返回时恢复条件或选中记录 ──
  useEffect(() => {
    const st = location.state as
      | { conditions?: Record<string, string>; selectedRecords?: any[] }
      | null;

    // Select 返回：选中记录填充到表单
    if (st?.selectedRecords?.length) {
      const rec = st.selectedRecords[0];
      const toStr = (v: any): string => (v == null ? '' : String(v));
      setVariable(toStr(rec.variable));
      setVariableOp('=');
      setType(toStr(rec.type));
      setTypeOp('=');
      setDescription(toStr(rec.description));
      setDescriptionOp('=');
      setCreatedByUser(toStr(rec.registerUser));
      setCreatedByUserOp('=');
      setDate(toStr(rec.registerDatetime));
      setDateOp('=');
      window.history.replaceState({}, document.title);
      return;
    }

    // Back 返回：从 location.state 恢复条件
    if (st?.conditions) {
      const c = st.conditions;
      setVariable(c.variable ?? '');
      setVariableOp((c.variableOp as Operator) ?? '=');
      setType(c.type ?? '');
      setTypeOp((c.typeOp as Operator) ?? '=');
      setDescription(c.description ?? '');
      setDescriptionOp((c.descriptionOp as Operator) ?? '=');
      setCreatedByUser(c.createdByUser ?? '');
      setCreatedByUserOp((c.createdByUserOp as Operator) ?? '=');
      setDate(c.date ?? '');
      setDateOp((c.dateOp as Operator) ?? '=');
      window.history.replaceState({}, document.title);
      return;
    }

    // 尝试从 sessionStorage 恢复
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const c = JSON.parse(saved);
        setVariable(c.variable ?? '');
        setVariableOp(c.variableOp ?? '=');
        setType(c.type ?? '');
        setTypeOp(c.typeOp ?? '=');
        setDescription(c.description ?? '');
        setDescriptionOp(c.descriptionOp ?? '=');
        setCreatedByUser(c.createdByUser ?? '');
        setCreatedByUserOp(c.createdByUserOp ?? '=');
        setDate(c.date ?? '');
        setDateOp(c.dateOp ?? '=');
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  // ── 消息 ──
  const clearMessages = () => { setMessage(''); setSuccessMessage(''); };

  const clearForm = (keepSuccess = false) => {
    setVariable('');
    setVariableOp('=');
    setType('');
    setTypeOp('=');
    setDescription('');
    setDescriptionOp('=');
    setCreatedByUser('');
    setCreatedByUserOp('=');
    setDate('');
    setDateOp('=');
    sessionStorage.removeItem(STORAGE_KEY);
    if (!keepSuccess) clearMessages();
  };

  // ── 成功消息自动消失 ──
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 3000);
    return () => clearTimeout(t);
  }, [successMessage]);

  // ── 搜索 ──
  const handleSearch = async () => {
    clearMessages();

    if (!variable && !type && !description && !createdByUser && !date) {
      setMessage('请输入至少一个搜索条件');
      return;
    }

    const conditions = {
      variable, variableOp,
      type, typeOp,
      description, descriptionOp,
      createdByUser, createdByUserOp,
      date, dateOp,
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(conditions));
    navigate('/menu/existing-hdoc-vars/result', { state: { conditions } });
  };

  // ── 新增 ──
  const handleAdd = async () => {
    clearMessages();

    if (!variable.trim()) {
      setMessage('Variable为必填项');
      return;
    }
    if (variable.length > 30) {
      setMessage('Variable长度不能超过30字符');
      return;
    }
    if (!/^[\x20-\x7E]*$/.test(variable)) {
      setMessage('Variable只能包含半角英数字和记号');
      return;
    }
    if (!type) {
      setMessage('请选择变量类型');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/variables/add', {
        variable: variable.trim(),
        type,
        description: description.trim(),
      });
      if (res.code === 200) {
        setSuccessMessage('变量添加成功');
        clearForm(true);
      } else {
        setMessage(res.message || 'Variant already exists. Please enter the correct content');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 更新 ──
  const handleUpdate = async () => {
    clearMessages();

    if (!variable.trim()) {
      setMessage('Variable为必填项');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/variables/update', {
        variable: variable.trim(),
        type,
        description: description.trim(),
      });
      if (res.code === 200) {
        setSuccessMessage('变量更新成功');
      } else {
        setMessage(res.message || 'Variant does not exists. Please enter the correct content');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 删除 ──
  const handleDelete = async () => {
    clearMessages();

    if (!variable.trim()) {
      setMessage('Variable为必填项');
      return;
    }

    if (!window.confirm('Do you really want to delete this variant?')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/variables/delete', {
        variable: variable.trim(),
      });
      if (res.code === 200) {
        setSuccessMessage('变量删除成功');
        clearForm(true);
      } else {
        setMessage(res.message || 'Variant does not exists. Please enter the correct content');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 返回 ──
  const handleBack = () => {
    navigate('/menu');
  };

  // ── Excel 导出 ──
  const handleExcel = async () => {
    clearMessages();
    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `HDoc_Variables_${today}.csv`;
      const token = localStorage.getItem('token') || '';
      const response = await fetch(
        'http://localhost:8080/api/v1/hdoc/variables/export',
        { method: 'GET', headers: { Authorization: token } },
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('CSV文件导出成功');
    } catch {
      setMessage('CSV导出失败，请联系管理员');
    }
  };

  // ── JSX ──
  return (
    <div className="ehv-container">
      <div className="ehv-header">
        <h1>Existing HDoc Variables</h1>
      </div>

      <table className="ehv-btn-table">
        <tbody>
          <tr>
            <td className="ehv-btn-cell">
              <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>Search</button>
              <button className="btn" onClick={() => clearForm()} disabled={isLoading}>Clear</button>
              <button className="btn" onClick={handleBack} disabled={isLoading}>Back</button>
              <button className="btn" onClick={handleAdd} disabled={isLoading}>Add</button>
              <button className="btn" onClick={handleUpdate} disabled={isLoading}>Update</button>
              <button className="btn" onClick={handleDelete} disabled={isLoading}>Delete</button>
              <button className="btn" onClick={handleExcel} disabled={isLoading}>Excel</button>
            </td>
          </tr>
        </tbody>
      </table>

      {message && <div className="ehv-error">{message}</div>}
      {successMessage && <div className="ehv-success">{successMessage}</div>}

      <div className="ehv-form">
        {/* Variable */}
        <div className="ehv-row">
          <span className="ehv-label required">Variable</span>
          <select className="ehv-op-select" value={variableOp} onChange={(e) => setVariableOp(e.target.value as Operator)} disabled={isLoading}>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
          <input
            type="text"
            className="ehv-input ehv-input-variable"
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
            maxLength={30}
            disabled={isLoading}
          />
        </div>

        {/* Type */}
        <div className="ehv-row">
          <span className="ehv-label required">Type</span>
          <select className="ehv-op-select" value={typeOp} onChange={(e) => setTypeOp(e.target.value as Operator)} disabled={isLoading}>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
          <select
            className="ehv-input ehv-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isLoading}
          >
            <option value="">-- Select --</option>
            <option value="VDA">VDA</option>
            <option value="User Defined">User Defined</option>
          </select>
        </div>

        {/* Description */}
        <div className="ehv-row ehv-row-description">
          <span className="ehv-label">Description</span>
          <select className="ehv-op-select" value={descriptionOp} onChange={(e) => setDescriptionOp(e.target.value as Operator)} disabled={isLoading}>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
          <input
            type="text"
            className="ehv-input ehv-input-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            disabled={isLoading}
          />
        </div>

        {/* Created by user */}
        <div className="ehv-row">
          <span className="ehv-label">Created by user</span>
          <select className="ehv-op-select" value={createdByUserOp} onChange={(e) => setCreatedByUserOp(e.target.value as Operator)} disabled={isLoading}>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
          <input
            type="text"
            className="ehv-input ehv-input-created-by"
            value={createdByUser}
            onChange={(e) => setCreatedByUser(e.target.value)}
            maxLength={16}
            disabled={isLoading}
          />
        </div>

        {/* Date */}
        <div className="ehv-row">
          <span className="ehv-label">Date</span>
          <select className="ehv-op-select" value={dateOp} onChange={(e) => setDateOp(e.target.value as Operator)} disabled={isLoading}>
            <option value="=">=</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
          </select>
          <input
            type="text"
            className="ehv-input ehv-input-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default ExistingHDocVariables;
