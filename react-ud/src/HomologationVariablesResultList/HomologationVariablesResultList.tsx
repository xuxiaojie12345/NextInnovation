import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../common/css/common.css';
import './HomologationVariablesResultList.css';

/**
 * 查询结果记录的数据结构
 * @property pc - 产品分类
 * @property num - 编号
 * @property market - 市场
 * @property variable - 变量名
 * @property val - 变量值
 * @property vs - 变体字符串1
 * @property vs2 - 变体字符串2
 * @property comments - 备注
 * @property addDate - 添加日期
 * @property deleteDate - 删除日期
 * @property updateUser - 更新用户
 * @property updateDatetime - 更新时间
 */
interface RuleRecord {
  pc: string;
  num: string;
  market: string;
  variable: string;
  val: string;
  vs: string;
  vs2: string;
  comments: string;
  addDate: string;
  deleteDate: string;
  updateUser: string;
  updateDatetime: string;
}

/**
 * Homologation Variables Result List 页面组件
 * 展示查询结果，支持记录选择、返回、打印和批量删除操作。
 *
 * 业务规则：
 * - 从 HomologationVariables 页面通过 location.state 接收查询条件
 * - 组件挂载时自动调用 UD09 search API 获取查询结果
 * - 数据按 Product Class, Market, Number 排序（由后端处理）
 * - Created by user 列显示为可点击链接，点击跳转到 EDB User View
 * - 支持多选记录进行批量删除
 *
 * @returns {React.FC} HomologationVariablesResultList 组件
 */
const HomologationVariablesResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  interface ConditionItem {
    label: string;
    operator?: string;
    value?: string;
    operator1?: string;
    value1?: string;
    operator2?: string;
    value2?: string;
  }

  const searchState = location.state as { conditions?: ConditionItem[] } | null;
  const searchConditions = searchState?.conditions ?? null;

  const [results, setResults] = useState<RuleRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * 组件挂载时，根据从 HomologationVariables 页面传递过来的查询条件，
   * 调用 UD09 search API 获取查询结果。
   */
  useEffect(() => {
    const fetchResults = async () => {
      if (!searchConditions) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await api.post<{ ruleList: RuleRecord[] }>('/ud09/search', {
          conditions: searchConditions,
        });
        if (res.code === 200 && res.data) {
          setResults(res.data.ruleList || []);
        } else {
          setErrorMessage(res.message || 'Failed to fetch results.');
        }
      } catch {
        setErrorMessage('System error. Please contact administrator.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResults();
  }, [searchConditions]);

  const toggleSelect = (idx: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.clear();
      else { next.clear(); next.add(idx); }
      return next;
    });
  };

  const handleSelect = () => {
    if (selectedIds.size === 0) {
      setErrorMessage('Please select a record first.');
      return;
    }
    // Return selected records to previous page
    const selectedRecords = results.filter((_, i) => selectedIds.has(i));
    navigate('/menu/homologation-variables', { state: { selectedRecords } });
  };

  const handleBack = () => {
    // 将查询条件带回前页面
    navigate('/menu/homologation-variables', { state: { conditions: searchConditions } });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      setErrorMessage('Please select records to delete.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    try {
      const recordsToDelete = results.filter((_, i) => selectedIds.has(i));
      const res = await api.post('/ud09/deleteSelected', {
        records: recordsToDelete.map((r) => ({
          pc: r.pc,
          num: r.num,
          market: r.market,
        })),
      });
      if (res.code === 200) {
        // 从本地结果中移除已删除的记录
        const remaining = results.filter((_, i) => !selectedIds.has(i));
        setResults(remaining);
        setSelectedIds(new Set());
        setErrorMessage('');
      } else {
        setErrorMessage(res.message || 'Failed to delete records.');
      }
    } catch {
      setErrorMessage('System error. Please contact administrator.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUserViewClick = (userid: string) => {
    navigate('/menu/edb-user-view', { state: { userid } });
  };

  return (
    <div className="hv-result-container">
      {/* 顶部深蓝色标题栏 */}
      <div className="hv-result-header">
        <h1>Homologation Variables</h1>
      </div>

      {errorMessage && <div className="hv-result-error">{errorMessage}</div>}

      {/* ─── 按钮 Table ─── */}
      <table className="hv-result-btn-table">
        <tbody>
          <tr>
            <td className="hv-result-btn-cell">
              <button className="btn btn-primary" onClick={handleSelect} disabled={isDeleting}>
                Select
              </button>
              <button className="btn btn-secondary" onClick={handleBack} disabled={isDeleting}>
                Back
              </button>
              <button className="btn btn-secondary" onClick={handlePrint} disabled={isDeleting}>
                Print
              </button>
              <button
                className="btn btn-delete"
                onClick={handleDeleteSelected}
                disabled={isDeleting || selectedIds.size === 0}
              >
                {isDeleting ? 'Deleting...' : 'Delete selected'}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {isLoading ? (
        <div className="hv-result-empty">
          <p>Loading...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="hv-result-table-wrapper">
          <table className="hv-result-table">
            <thead>
              <tr>
                <th className="th-check hv-th-noborder"></th>
                <th className="hv-th-required hv-th-underline hv-th-noborder">Product class</th>
                <th className="hv-th-required hv-th-underline hv-th-noborder">Number</th>
                <th className="hv-th-required hv-th-underline hv-th-noborder">Market</th>
                <th className="hv-th-underline hv-th-noborder">Variable</th>
                <th className="hv-th-underline hv-th-noborder">Value</th>
                <th className="hv-th-underline hv-th-noborder">Variant string.</th>
                <th className="hv-th-underline hv-th-noborder">Comments</th>
                <th className="hv-th-sub hv-th-noborder">Add<div className="hv-th-subtext">(YYYWW)</div></th>
                <th className="hv-th-sub hv-th-noborder">Delete<div className="hv-th-subtext">(YYYWW)</div></th>
                <th className="hv-th-sub hv-th-noborder">Created by user<div className="hv-th-subtext">(Haohetao123)</div></th>
                <th className="hv-th-sub hv-th-noborder">Date<div className="hv-th-subtext">(Haohetao123)</div></th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx} className={selectedIds.has(idx) ? 'selected' : ''}>
                  <td className="td-check">
                    <input
                      type="radio"
                      name="selectedRow"
                      checked={selectedIds.has(idx)}
                      onChange={() => toggleSelect(idx)}
                    />
                  </td>
                  <td>{row.pc}</td>
                  <td>{row.num}</td>
                  <td>{row.market}</td>
                  <td>{row.variable}</td>
                  <td>{row.val}</td>
                  <td>{row.vs}-{row.vs2}</td>
                  <td>{row.comments}</td>
                  <td>{row.addDate}</td>
                  <td>{row.deleteDate}</td>
                  <td>
                    <span
                      className="link-user"
                      onClick={() => handleUserViewClick(row.updateUser)}
                    >
                      {row.updateUser}
                    </span>
                  </td>
                  <td>{row.updateDatetime ? row.updateDatetime.substring(0, 10) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="hv-result-empty">
          <p>No results found. Please go back and try different search criteria.</p>
        </div>
      )}

      <div className="hv-result-count">Number of lines found: {results.length}</div>
    </div>
  );
};

export default HomologationVariablesResultList;
