import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../common/css/common.css';
import './HDocUserAdministration.css';

interface AuthItem {
  function: string;
  market: string;
}

const HDocUserAdministration: React.FC = () => {
  // ── 表单状态 ──
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [markets, setMarkets] = useState<string[]>([]);

  // 各role的权限状态 - Market 改为 string[] 支持多选
  const [standardUser, setStandardUser] = useState(false);
  const [standardMarket, setStandardMarket] = useState<string[]>([]);
  const [ruleAdmin, setRuleAdmin] = useState(false);
  const [ruleMarket, setRuleMarket] = useState<string[]>([]);
  const [templateAdmin, setTemplateAdmin] = useState(false);
  const [templateMarket, setTemplateMarket] = useState<string[]>([]);
  const [docAuthAdmin, setDocAuthAdmin] = useState(false);
  const [docAuthMarket, setDocAuthMarket] = useState<string[]>([]);
  const [userAdmin, setUserAdmin] = useState(false);

  // Roles分组
  const [adaptationUser, setAdaptationUser] = useState(false);
  const [adaptationMarket, setAdaptationMarket] = useState<string[]>([]);
  const [manageVarList, setManageVarList] = useState(false);
  const [marketSuperUser, setMarketSuperUser] = useState<string[]>([]);

  // ── UI 状态 ──
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 加载 Market 列表
  useEffect(() => {
    (async () => {
      try {
        const res = await api.post<{ marketList: string[] }>('/ud19/selectMarketMaster', {});
        if (res.code === 200 && res.data) {
          setMarkets(res.data.marketList || []);
        }
      } catch {
        // silently fail
      }
    })();
  }, []);

  const clearMessages = () => {
    setMessage('');
    setSuccessMessage('');
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setStandardUser(false);
    setStandardMarket([]);
    setRuleAdmin(false);
    setRuleMarket([]);
    setTemplateAdmin(false);
    setTemplateMarket([]);
    setDocAuthAdmin(false);
    setDocAuthMarket([]);
    setUserAdmin(false);
    setAdaptationUser(false);
    setAdaptationMarket([]);
    setManageVarList(false);
    setMarketSuperUser([]);
  };

  // 构建 authList（每个 market 生成一条记录）
  const buildAuthList = (): AuthItem[] => {
    const list: AuthItem[] = [];
    if (standardUser) {
      standardMarket.forEach((m) => list.push({ function: 'USER', market: m }));
    }
    if (ruleAdmin) {
      ruleMarket.forEach((m) => list.push({ function: 'RULES', market: m }));
    }
    if (templateAdmin) {
      templateMarket.forEach((m) => list.push({ function: 'TEMPLATE', market: m }));
    }
    if (docAuthAdmin) {
      docAuthMarket.forEach((m) => list.push({ function: 'Document', market: m }));
    }
    if (userAdmin) list.push({ function: 'User Administrator', market: '' });
    if (adaptationUser) {
      adaptationMarket.forEach((m) => list.push({ function: 'ADAPTATION DOC', market: m }));
    }
    if (manageVarList) list.push({ function: 'Manage Variable List', market: '' });
    if (marketSuperUser.length > 0) {
      marketSuperUser.forEach((m) => list.push({ function: 'market super user', market: m }));
    }
    return list;
  };

  // 根据 authList 填充表单（聚合相同 function 的多条 market）
  const applyAuthList = (authList: AuthItem[]) => {
    setStandardUser(false);
    setStandardMarket([]);
    setRuleAdmin(false);
    setRuleMarket([]);
    setTemplateAdmin(false);
    setTemplateMarket([]);
    setDocAuthAdmin(false);
    setDocAuthMarket([]);
    setUserAdmin(false);
    setAdaptationUser(false);
    setAdaptationMarket([]);
    setManageVarList(false);
    setMarketSuperUser([]);

    authList.forEach((a) => {
      const addMarket = (prev: string[]) => {
        if (a.market && !prev.includes(a.market)) return [...prev, a.market];
        return prev;
      };
      switch (a.function) {
        case 'USER': setStandardUser(true); setStandardMarket(addMarket); break;
        case 'RULES': setRuleAdmin(true); setRuleMarket(addMarket); break;
        case 'TEMPLATE': setTemplateAdmin(true); setTemplateMarket(addMarket); break;
        case 'Document': setDocAuthAdmin(true); setDocAuthMarket(addMarket); break;
        case 'User Administrator': setUserAdmin(true); break;
        case 'ADAPTATION DOC': setAdaptationUser(true); setAdaptationMarket(addMarket); break;
        case 'Manage Variable List': setManageVarList(true); break;
        case 'market super user': setMarketSuperUser(addMarket); break;
      }
    });
  };

  // ── User Info ──
  const handleUserInfo = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage('Userid is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ userId: string; username: string; password: string; authList: AuthItem[] }>('/user/info', {
        userid: trimmedId,
      });

      if (res && res.code === 200 && res.data) {
        // 查询结果为 0 件时显示错误消息
        if (!res.data.username && (!res.data.authList || res.data.authList.length === 0)) {
          setMessage("We didn't recognize the userid you entered. Please try again.");
          return;
        }
        setUsername(res.data.username || '');
        setPassword(res.data.password || '');
        applyAuthList(res.data.authList || []);
      } else {
        setMessage(res?.message || "We didn't recognize the userid you entered. Please try again.");
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Update Role ──
  const handleUpdateRole = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage('Userid is required.');
      return;
    }

    // 检索用户是否存在
    try {
      const infoRes = await api.post<{ username: string; authList: AuthItem[] }>('/user/info', {
        userid: trimmedId,
      });
      if (infoRes.code === 200 && infoRes.data) {
        if (!infoRes.data.username && (!infoRes.data.authList || infoRes.data.authList.length === 0)) {
          setMessage("We didn't recognize the userid you entered. Please try again.");
          return;
        }
      } else {
        setMessage("We didn't recognize the userid you entered. Please try again.");
        return;
      }
    } catch {
      setMessage('System error. Please contact administrator.');
      return;
    }

    const authList = buildAuthList();
    if (authList.length === 0) {
      setMessage('Please select at least one permission.');
      return;
    }

    const currentUser = localStorage.getItem('userId') || '';
    setIsLoading(true);
    try {
      const res = await api.post<{ userId: string; updateCount: number; authList: AuthItem[] }>('/user/update/role', {
        userid: trimmedId,
        authList,
        currentUser,
      });

      if (res.code === 200) {
        setSuccessMessage('权限更新成功');
      } else {
        setMessage(res.message || 'Failed to update role.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete Role ──
  const handleDeleteRole = async () => {
    clearMessages();

    const trimmedId = userid.trim();
    if (!trimmedId) {
      setMessage('Userid is required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<{ userId: string }>('/user/delete/role', {
        userid: trimmedId,
      });

      if (res.code === 200) {
        setSuccessMessage('用户权限已全部删除');
        resetForm();
      } else {
        setMessage(res.message || 'Failed to delete role.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="hua-header">
        <h1>HDoc User Admin</h1>
      </div>
      <div className="hua-container">

      {message && <div className="hua-error">{message}</div>}
      {successMessage && <div className="hua-success">{successMessage}</div>}

      {/* ── UserID / User / Password 输入 ── */}
      <table className="hua-input-table">
        <tbody>
          <tr>
            <td className="hua-label-cell">Userid</td>
            <td>
              <input
                type="text"
                className="hua-input"
                value={userid}
                onChange={(e) => setUserid(e.target.value)}
                maxLength={10}
                disabled={isLoading}
              />
              <span className="hua-btn-inline">
                <button className="btn" onClick={handleUserInfo} disabled={isLoading}>USER INFO</button>
              </span>
            </td>
          </tr>
            <tr>
              <td className="hua-label-cell">User</td>
              <td style={{ textAlign: 'left' }}>
                <input
                  type="text"
                  className="hua-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoComplete="no"
                />
              </td>
              <td></td>
              <td></td>
            </tr>
        </tbody>
      </table>

      {/* ---- 权限项目 ---- */}
      <div className="hua-form-section">
        <div className="hua-roles-sidebar-layout">
          {/* Roles 侧标题 */}
          <div className="hua-roles-sidebar">Roles</div>

          <div className="hua-roles-content">
            {/* 第一行：5个角色权限横向排列 */}
        <div className="hua-grid-row">
          {/* Standard User */}
          <div className="hua-grid-cell">
            <div className="hua-cell-header">
              <input type="checkbox" checked={standardUser} onChange={(e) => setStandardUser(e.target.checked)} disabled={isLoading} />
              <span className="hua-label">Standard User</span>
            </div>
            <select
              className="hua-listbox"
              multiple
              size={5}
              value={standardMarket}
              onChange={(e) => setStandardMarket(Array.from(e.target.selectedOptions, (opt) => opt.value))}
              disabled={isLoading}
            >
              <option value="-EU">-EU</option>
            </select>
          </div>

          {/* Rule Admin + Adaptation user (同列) */}
          <div className="hua-grid-cell" style={{ gap: 8 }}>
            {/* Rule Admin */}
            <div style={{ textAlign: 'left' }}>
              <div className="hua-cell-header">
                <input type="checkbox" checked={ruleAdmin} onChange={(e) => setRuleAdmin(e.target.checked)} disabled={isLoading} />
                <span className="hua-label">Rule Admin</span>
              </div>
              <select
                className="hua-listbox"
                multiple
                size={5}
                value={ruleMarket}
                onChange={(e) => setRuleMarket(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                disabled={isLoading}
              >
                {markets.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
            {/* Adaptation user */}
            <div style={{ textAlign: 'left' }}>
              <div className="hua-cell-header">
                <input type="checkbox" checked={adaptationUser} onChange={(e) => setAdaptationUser(e.target.checked)} disabled={isLoading} />
                <span className="hua-label">Adaptation user</span>
              </div>
              <select
                className="hua-listbox"
                multiple
                size={5}
                value={adaptationMarket}
                onChange={(e) => setAdaptationMarket(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                disabled={isLoading}
              >
                <option value="-EU">-EU</option>
              </select>
            </div>
          </div>

          {/* Template Admin */}
          <div className="hua-grid-cell">
            <div className="hua-cell-header">
              <input type="checkbox" checked={templateAdmin} onChange={(e) => setTemplateAdmin(e.target.checked)} disabled={isLoading} />
              <span className="hua-label">Template Admin</span>
            </div>
            <select
              className="hua-listbox"
              multiple
              size={5}
              value={templateMarket}
              onChange={(e) => setTemplateMarket(Array.from(e.target.selectedOptions, (opt) => opt.value))}
              disabled={isLoading}
            >
              {markets.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>

          {/* Document Auth Admin */}
          <div className="hua-grid-cell">
            <div className="hua-cell-header">
              <input type="checkbox" checked={docAuthAdmin} onChange={(e) => setDocAuthAdmin(e.target.checked)} disabled={isLoading} />
              <span className="hua-label">Document Auth Admin</span>
            </div>
            <select
              className="hua-listbox"
              multiple
              size={5}
              value={docAuthMarket}
              onChange={(e) => setDocAuthMarket(Array.from(e.target.selectedOptions, (opt) => opt.value))}
              disabled={isLoading}
            >
              {markets.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>

          {/* User Admin（无市场） */}
          <div className="hua-grid-cell">
            <div className="hua-cell-header">
              <input type="checkbox" checked={userAdmin} onChange={(e) => setUserAdmin(e.target.checked)} disabled={isLoading} />
              <span className="hua-label">User Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>

        {/* 第二行：Manage Variable List */}
        <div className="hua-grid-row">
          <div className="hua-grid-cell">
            <div className="hua-cell-header-reverse">
              <span className="hua-label hua-label-mvl">Manage Variable List</span>
              <input type="checkbox" checked={manageVarList} onChange={(e) => setManageVarList(e.target.checked)} disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* 第四行：Market Super User */}
        <div className="hua-grid-row">
          <div className="hua-grid-cell hua-cell-row">
            <span className="hua-label hua-label-msu">Market super user</span>
            <select
              className="hua-listbox"
              multiple
              size={5}
              value={marketSuperUser}
              onChange={(e) => setMarketSuperUser(Array.from(e.target.selectedOptions, (opt) => opt.value))}
              disabled={isLoading}
            >
              {markets.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
        </div>

          {/* ── 操作按钮 ── */}
          <div className="hua-btn-row">
            <button className="btn" onClick={handleUpdateRole} disabled={isLoading}>Update Role</button>
            <button className="btn" onClick={handleDeleteRole} disabled={isLoading}>Delete Role</button>
          </div>
    </div>
    </div>
    </>
  );
};

export default HDocUserAdministration;
