import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../common/css/common.css';
import './AdCaChange.css';

const AdCaChange: React.FC = () => {
  // ── 表单状态 ──
  const [serieChnr, setSerieChnr] = useState('');
  const [desc, setDesc] = useState('');

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

  const clearMessages = () => {
    setMessage('');
    setSuccessMessage('');
  };

  // ── 解析 Serie-Chnr ──
  const parseSerieChnr = (value: string): { serie: string; chnr: string } => {
    const trimmed = value.trim();
    const parts = trimmed.split('-');
    if (parts.length >= 2) {
      return { serie: parts[0].trim(), chnr: parts.slice(1).join('-').trim() };
    }
    // If no dash, treat entire input as serie
    return { serie: trimmed, chnr: '' };
  };

  // ── ADD ──
  const handleAdd = async () => {
    clearMessages();

    const trimmedValue = serieChnr.trim();
    const trimmedDesc = desc.trim();

    const { serie, chnr } = parseSerieChnr(trimmedValue);

    if (!serie || !chnr) {
      setMessage('Please enter a valid Serie-Chnr (e.g. "FH-12345").');
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Check existence
      const checkRes = await api.post<{ serie: string; chnr: string; count: string; act: string }>('/adca/select', {
        serie,
        chnr,
      });

      if (checkRes.code === 200 && checkRes.data) {
        const count = parseInt(checkRes.data.count, 10);
        const act = checkRes.data.act;
        if (count > 0 && act === 'Y') {
          // 已存在且为活性状态 → 不允许新增
          setMessage('AFTER DEF CHANGE IS NOT ACTIVATED');
          setIsLoading(false);
          return;
        }
        if (count > 0 && act === 'N') {
          // 已存在但为非活性状态 → 执行 reactivate（主键冲突不可 insert）
          const updateUser = localStorage.getItem('userId') || '';
          const reactivateRes = await api.post('/adca/reactivate', {
            serie,
            chnr,
          });
          if (reactivateRes.code === 200) {
            setSuccessMessage('Record added successfully.');
            setSerieChnr('');
            setDesc('');
          } else {
            setMessage(reactivateRes.message || 'Failed to reactivate record.');
          }
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Insert (BU fixed as "UD", ACT = 'Y' for active)
      const updateUser = localStorage.getItem('userId') || '';
      const res = await api.post('/adca/insert', {
        serie,
        chnr,
        act: 'Y',
        bu: 'UD',
        updateUser,
      });

      if (res.code === 200) {
        setSuccessMessage('Record added successfully.');
        setSerieChnr('');
        setDesc('');
      } else {
        setMessage(res.message || 'Failed to add record.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async () => {
    clearMessages();

    const trimmedValue = serieChnr.trim();
    const { serie, chnr } = parseSerieChnr(trimmedValue);

    if (!serie || !chnr) {
      setMessage('Please enter a valid Serie-Chnr (e.g. "FH-12345").');
      return;
    }

    if (!window.confirm('Do you really want to delete this AD/CA change record?')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/adca/update', {});

      if (res.code === 200) {
        setSuccessMessage('Record updated/deleted successfully.');
        setSerieChnr('');
      } else {
        setMessage(res.message || 'Failed to delete record.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── CHECK ──
  const handleCheck = async () => {
    clearMessages();

    const trimmedValue = serieChnr.trim();
    const { serie, chnr } = parseSerieChnr(trimmedValue);

    if (!serie || !chnr) {
      setMessage('Please enter a valid Serie-Chnr (e.g. "FH-12345").');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ serie: string; chnr: string; count: string; act: string }>('/adca/select', {
        serie,
        chnr,
      });

      if (res.code === 200 && res.data) {
        const count = parseInt(res.data.count, 10);
        const act = res.data.act;
        if (count > 0) {
          if (act === 'Y') {
            setMessage('Record found and activated.');
          } else {
            setMessage('AFTER DEF CHANGE IS NOT ACTIVATED');
          }
        } else {
          setMessage('Record not found.');
        }
      } else {
        setMessage('Record not found.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="adca-container">
      <div className="adca-header">
        <h1>AD/CA Change</h1>
      </div>

      <div className="adca-error">{message}</div>
      <div className="adca-success">{successMessage}</div>

      <div className="adca-form">
        {/* Serie-Chnr */}
        <div className="adca-row">
          <span className="adca-label">Serie-Chnr</span>
          <input
            type="text"
            className="adca-input"
            value={serieChnr}
            onChange={(e) => setSerieChnr(e.target.value)}
            maxLength={15}
            placeholder="e.g. FH-12345"
            disabled={isLoading}
          />
        </div>

        {/* Desc */}
        <div className="adca-row">
          <span className="adca-label">Desc</span>
          <input
            type="text"
            className="adca-input adca-input-desc"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={4000}
            disabled={isLoading}
          />
        </div>

        {/* Buttons */}
        <div className="adca-btn-row">
          <button className="btn" onClick={handleAdd} disabled={isLoading}>ADD</button>
          <button className="btn" onClick={handleDelete} disabled={isLoading}>DELETE</button>
          <button className="btn" onClick={handleCheck} disabled={isLoading}>CHECK</button>
        </div>
      </div>
    </div>
  );
};

export default AdCaChange;
