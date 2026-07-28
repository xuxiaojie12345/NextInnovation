import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD11_ExistingHDocVariablesResultList.css';

/**
 * 检索结果记录接口
 */
interface ResultRecord {
  variable: string;
  type: string;
  description: string;
  createdByUser: string;
  registerDatetime: string;
}

/**
 * UD11_ExistingHDocVariablesResultList 检索结果列表页面组件
 *
 * @component
 * @returns {JSX.Element} 检索结果列表页面元素
 */
const UD11_ExistingHDocVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 将 API 返回的日期字符串格式化为 yyyy-MM-DD
   */
  const formatDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  // ==================== 初始数据加载 ====================
  useEffect(() => {
    /**
     * 画面加载时执行检索
     *
     * 1. 从UD10传递的location.state中获取检索条件
     * 2. 调用API查询HDOC_VARIABLES表
     */
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const searchParams = (location.state as any)?.searchParams || {};
        const response = await apiClient.get('/api/ud11/search', {
          params: searchParams,
        });

        if (response.data && response.data.code === 200) {
          const dataList = response.data.data || [];
          const mappedResults: ResultRecord[] = dataList.map((item: any) => ({
            variable: item.variable || '',
            type: item.type || '',
            description: item.description || '',
            createdByUser: item.registerUser || item.createdByUser || '',
            registerDatetime: formatDateStr(item.registerDatetime || ''),
          }));

          setResults(mappedResults);
          setSelectedIndex(null);
          setMessage('');
        } else {
          setResults([]);
          setMessage(response.data?.msg || '获取检索结果失败');
          setMessageType('error');
        }
      } catch (error: any) {
        setResults([]);
        // 按详细设计5.异常处理区分错误类型
        if (error.code === 'ECONNABORTED') {
          setMessage('请求超时，请稍后重试');
        } else if (error.response) {
          setMessage(error.response.data?.msg || '获取检索结果失败');
        } else if (error.message && error.message.includes('Network')) {
          setMessage('网络连接失败，请检查网络设置');
        } else {
          setMessage('获取检索结果失败');
        }
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [location.state]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理Radio选择（单选，可取消）
   */
  const handleRadioChange = (index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  /**
   * 处理 Select 按钮点击
   */
  const handleSelect = useCallback(() => {
    if (selectedIndex === null) {
      setMessage('请选择一条记录');
      setMessageType('error');
      return;
    }

    const record = results[selectedIndex];
    if (!record) {
      setMessage('记录数据异常');
      setMessageType('error');
      return;
    }

    navigate('/UD10', {
      state: {
        selectedRecord: {
          variable: record.variable,
          type: record.type,
          description: record.description,
          createdByUser: record.createdByUser,
          date: record.registerDatetime,
        },
      },
    });
  }, [selectedIndex, results, navigate]);

  /**
   * 处理 Down 按钮点击
   */
  const handleDown = useCallback(() => {
    if (selectedIndex === null) {
      setMessage('请选择一条记录');
      setMessageType('error');
      return;
    }

    const record = results[selectedIndex];
    navigate('/UD08', {
      state: {
        selectedRecord: {
          variable: record.variable,
        },
      },
    });
  }, [selectedIndex, results, navigate]);

  /**
   * 处理 Back 按钮点击
   */
  const handleBack = useCallback(() => {
    const formData = (location.state as any)?.formData;
    navigate('/UD10', { state: { backFormData: formData } });
  }, [navigate, location.state]);

  /**
   * 处理 Print 按钮点击
   */
  const handlePrint = useCallback(() => {
    if (results.length === 0) {
      setMessage('没有可打印的数据');
      setMessageType('error');
      return;
    }
    window.print();
  }, [results]);

  /**
   * 处理 Excel 按钮点击
   */
  const handleExcel = useCallback(() => {
    try {
      const BOM = '\uFEFF';
      const headers = 'Variable,Type,Description,Created by user,Date';
      const rows = results.map((r) =>
        [r.variable, r.type, r.description, r.createdByUser, r.registerDatetime].join(',')
      );
      const csvContent = BOM + headers + '\n' + rows.join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `HDoc_Variables_Result_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setMessage('CSV导出成功');
      setMessageType('success');
    } catch (error) {
      setMessage('导出失败');
      setMessageType('error');
    }
  }, [results]);

  /**
   * 处理 Created by user 点击
   */
  const handleUserLinkClick = (userId: string) => {
    navigate('/UD25', { state: { userId } });
  };

  // ==================== 渲染 ====================
  const count = results.length;
  return (
    <div className="ud11-container">
      <div className="ud11-title">Existing HDoc Variables</div>

      {message && (
        <div className={`ud11-message ud13-message-${messageType}`}>
          {message}
        </div>
      )}

      <div className="ud11-content">
        {/* 按钮行 */}
        <div className="ud11-button-row">
          <button className="ud11-btn" onClick={handleSelect} disabled={isLoading}>Select</button>
          <button className="ud11-btn" onClick={handleDown} disabled={isLoading}>Down</button>
          <button className="ud11-btn" onClick={handleBack} disabled={isLoading}>Back</button>
          <button className="ud11-btn" onClick={handlePrint} disabled={isLoading}>Print</button>
          <button className="ud11-btn" onClick={handleExcel} disabled={isLoading}>Excel</button>
        </div>

        {/* 表格 */}
        
          <div className="ud11-table-wrapper">
            <table className="ud11-table">
              <thead>
                <tr>
                  <th className="ud11-th--center" style={{ width: '40px' }}> </th>
                  <th>*Variable</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Created by user</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="ud11-loading">加载中...</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ud11-empty">暂无数据</td>
                </tr>
              ) : (
                  results.map((record, index) => (
                    <tr key={`${record.variable}-${index}`}
                      className={selectedIndex === index ? 'ud11-row--selected' : ''}
                    >
                      <td className="ud11-td--center">
                        <input type="radio" name="ud11-selection" className="ud11-radio"
                          checked={selectedIndex === index}
                          onClick={() => handleRadioChange(index)}
                          readOnly
                        />
                      </td>
                      <td>{record.variable}</td>
                      <td>{record.type}</td>
                      <td>{record.description}</td>
                      <td>
                        <span
                          className="ud11-user-link"
                          onClick={() => handleUserLinkClick(record.createdByUser)}
                          title="点击查看用户详情"
                        >
                          {record.createdByUser}
                        </span>
                      </td>
                      <td>{record.registerDatetime}</td>
                    </tr>
                  ))
                )
                }
              </tbody>
            </table>
          </div>
        
        
        {/* 件数 */}
        <div className="ud11-count">Number of lines found: {count}</div>

      </div>
    </div>
  );
};

export default UD11_ExistingHDocVariablesResultList;
