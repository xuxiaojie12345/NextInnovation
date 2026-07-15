import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD09_HomologationVariablesResultList.css';

/**
 * 检索结果记录接口
 */
interface ResultRecord {
  productClass: string;
  number: string;
  market: string;
  variable: string;
  value: string;
  variantString: string;
  variantString1: string;
  variantString2: string;
  comments: string;
  addDate: string;
  deleteDate: string;
  createdByUser: string;
  date: string;
}

/**
 * UD09_HomologationVariablesResultList 检索结果列表页面组件
 *
 * @component
 * @returns {JSX.Element} 检索结果列表页面元素
 */
const UD09_HomologationVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================== 状态管理 ====================
  const [results, setResults] = useState<ResultRecord[]>([]);  // 检索结果列表
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // 选中的行索引（单选）
  const [message, setMessage] = useState<string>('');          // 消息
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState<boolean>(false);  // 加载状态

  /**
   * 将 API 返回的日期字符串格式化为 yyyy-MM-DD
   */
  const formatDateStr = (dateStr: string): string => {
    if (!dateStr) return '';
    // ISO 格式: 取 T 前面的日期部分
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    return dateStr;
  };

  // ==================== 初始数据加载 ====================
  useEffect(() => {
    // 画面加载时执行检索
    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // 获取前画面（UD08）传递的检索条件
        const searchParams = (location.state as any)?.searchParams || {};

        // 调用检索API
        const response = await apiClient.get('/api/ud09/seach', {
          params: searchParams,
        });

        if (response.data && response.data.code === 200) {
          const dataList = response.data.data || [];

          // 将API返回的数据映射为前端展示格式, Variant string. 列由 VS 和 VS2 拼接显示
          const mappedResults: ResultRecord[] = dataList.map((item: any) => ({
            productClass: item.productClass || '',
            number: item.number !== null && item.number !== undefined ? String(item.number) : '',
            market: item.market || '',
            variable: item.variable || '',
            value: item.value || '',
            // Variant string.列：VS和VS2通过逗号","拼接
            variantString1: item.variantString1 || '',
            variantString2: item.variantString2 || '',
            variantString: [item.variantString1, item.variantString2]
              .filter((v: string) => v && v.trim())
              .join(', '),
            comments: item.comments || '',
            addDate: item.addDate || '',
            deleteDate: item.deleteDate || '',
            createdByUser: item.createdByUser || item.registerUser || '',
            date: formatDateStr(item.date || item.registerDatetime || ''),
          }));

          // 按照 Product Class, Market, Number 排序（对应设计书 2.1 备注）
          mappedResults.sort((a: ResultRecord, b: ResultRecord) => {
            const pcCmp = (a.productClass || '').localeCompare(b.productClass || '');
            if (pcCmp !== 0) return pcCmp;
            const marketCmp = (a.market || '').localeCompare(b.market || '');
            if (marketCmp !== 0) return marketCmp;
            return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
          });

          setResults(mappedResults);
          setSelectedIndex(null);
          setMessage('');
        } else {
          // API返回非200状态码
          setResults([]);
          setMessage(response.data?.message || '检索失败');
          setMessageType('error');
        }
      } catch (error: any) {
        setResults([]);
        setMessage('系统内部错误，请联系系统管理员');
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [location.state]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理Radio选择变更（单选，可取消选中）
   *
   * @param index - 选中的行索引
   */
  const handleRadioChange = (index: number) => {
    // 点击已选中的radio则取消选中，否则选中该行
    setSelectedIndex((prev) => (prev === index ? null : index));
  };

  /**
   * 处理 Select 按钮点击
   */
  const handleSelect = useCallback(() => {
    // 校验：未选中任何记录
    if (selectedIndex === null) {
      setMessage('请选择至少一条记录');
      setMessageType('error');
      return;
    }

    // 获取选定记录的数据
    const selectedRecord = results[selectedIndex];
    if (!selectedRecord) {
      setMessage('记录数据异常');
      setMessageType('error');
      return;
    }

    // 画面迁移到UD08，自动填充选定记录的内容
    navigate('/UD08', {
      state: {
        selectedRecord: {
          productClass: selectedRecord.productClass,
          number: selectedRecord.number,
          market: selectedRecord.market,
          variable: selectedRecord.variable,
          value: selectedRecord.value,
          variantString1: selectedRecord.variantString1,
          variantString2: selectedRecord.variantString2,
          comments: selectedRecord.comments,
          addDate: selectedRecord.addDate,
          deleteDate: selectedRecord.deleteDate,
          createdByUser: selectedRecord.createdByUser,
          date: selectedRecord.date,
        },
      },
    });
  }, [selectedIndex, results, navigate]);

  /**
   * 处理 Back 按钮点击
   */
  const handleBack = useCallback(() => {
    // 从location.state中取出UD08传来的formData，回传给UD08恢复输入数据
    const formData = (location.state as any)?.formData;
    navigate('/UD08', { state: { backFormData: formData } });
  }, [navigate, location.state]);

  /**
   * 处理 Print 按钮点击
   */
  const handlePrint = useCallback(() => {
    // 校验：无数据可打印
    if (results.length === 0) {
      setMessage('没有可打印的数据');
      setMessageType('error');
      return;
    }

    // 触发浏览器打印
    window.print();
  }, [results]);

  /**
   * 处理 Delete selected 按钮点击
   */
  const handleDeleteSelected = useCallback(async () => {
    // 校验：未选中任何记录
    if (selectedIndex === null) {
      setMessage('请选择至少一条要删除的记录');
      setMessageType('error');
      return;
    }

    // 确认删除
    if (!window.confirm('确定要删除选中的记录吗？')) {
      return;
    }

    setIsLoading(true);
    try {
      // 删除选中的记录
      const record = results[selectedIndex];
      const requestBody = {
        productClass: record.productClass,
        number: parseInt(record.number, 10) || 0,
        market: record.market,
      };

      const response = await apiClient.post('/api/ud09/deleteselected', requestBody);

      if (response.data.code !== 200) {
        throw new Error(response.data.message || '删除失败');
      }

      // 删除成功：刷新列表
      setMessage('删除成功');
      setMessageType('success');
      setSelectedIndex(null);

      // 重新加载数据
      const searchParams = (location.state as any)?.searchParams || {};
      const searchResponse = await apiClient.get('/api/ud09/seach', {
        params: searchParams,
      });

      if (searchResponse.data && searchResponse.data.code === 200) {
        const dataList = searchResponse.data.data || [];
        const mappedResults: ResultRecord[] = dataList.map((item: any) => ({
          productClass: item.productClass || '',
          number: item.number !== null && item.number !== undefined ? String(item.number) : '',
          market: item.market || '',
          variable: item.variable || '',
          value: item.value || '',
          variantString1: item.variantString1 || '',
          variantString2: item.variantString2 || '',
          variantString: [item.variantString1, item.variantString2]
            .filter((v: string) => v && v.trim())
            .join(', '),
          comments: item.comments || '',
          addDate: item.addDate || '',
          deleteDate: item.deleteDate || '',
          createdByUser: item.createdByUser || item.registerUser || '',
          date: formatDateStr(item.date || item.registerDatetime || ''),
        }));

        mappedResults.sort((a: ResultRecord, b: ResultRecord) => {
          const pcCmp = (a.productClass || '').localeCompare(b.productClass || '');
          if (pcCmp !== 0) return pcCmp;
          const marketCmp = (a.market || '').localeCompare(b.market || '');
          if (marketCmp !== 0) return marketCmp;
          return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
        });

        setResults(mappedResults);
      }
    } catch (error: any) {
      setMessage(error.message || 'Data does not exist, Please enter the correct content');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedIndex, results, location.state]);

  /**
   * 处理 Created by user 点击事件
   *
   * @param userId - 用户ID
   */
  const handleUserLinkClick = (userId: string) => {
    navigate('/UD25', { state: { userId } });
  };

  // ==================== 渲染 ====================
  const count = results.length;

  return (
    <div className="ud09-container">
      {/* 页面标题 */}
      <div className="ud09-title">Homologation Variables</div>

      {/* 消息显示区域 */}
      {message && (
        <div className={`ud09-message ud09-message--${messageType}`}>
          {message}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="ud09-content">
        <div className="ud09-button-row">
          <button className="ud09-btn ud09-btn--primary" onClick={handleSelect} disabled={isLoading}>Select</button>
          <button className="ud09-btn ud09-btn--default" onClick={handleBack} disabled={isLoading}>Back</button>
          <button className="ud09-btn ud09-btn--default" onClick={handlePrint} disabled={isLoading}>Print</button>
          <button className="ud09-btn ud09-btn--danger" onClick={handleDeleteSelected} disabled={isLoading}>Delete selected</button>
        </div>

        {/* 数据表格 */}
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>加载中...</div>
        ) : (
          <div className="ud09-table-wrapper">
            <table className="ud09-table">
              <thead>
                <tr>
                  <th className="ud09-th--center" style={{ width: '40px' }}></th>
                  <th>Product class</th>
                  <th>Number</th>
                  <th>Market</th>
                  <th>Variable</th>
                  <th>Value</th>
                  <th>Variant string.</th>
                  <th>Comments</th>
                  <th>Add</th>
                  <th>Delete</th>
                  <th>Created by user</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  results.map((record, index) => (
                    <tr
                      key={`${record.productClass}-${record.number}-${record.market}-${index}`}
                      className={selectedIndex === index ? 'ud09-row--selected' : ''}
                    >
                      {/* RadioButton 列（对应设计书 2.1 序号1）- 单选且可取消选中 */}
                      <td className="ud09-td--center">
                        <input type="radio"  name="ud09-selection" className="ud09-radio"
                          checked={selectedIndex === index}
                          onClick={() => handleRadioChange(index)}
                          readOnly
                        />
                      </td>
                      <td>{record.productClass}</td>
                      <td>{record.number}</td>
                      <td>{record.market}</td>
                      <td>{record.variable}</td>
                      <td>{record.value}</td>
                      {/* Variant string.列：VS和VS2拼接（对应设计书 2.1 序号7） */}
                      <td>{record.variantString}</td>
                      <td>{record.comments}</td>
                      <td>{record.addDate}</td>
                      <td>{record.deleteDate}</td>
                      {/* Created by user 链接（对应设计书 2.1 序号11 + 3.1.6） */}
                      <td>
                        <span className="ud09-user-link"
                          onClick={() => handleUserLinkClick(record.createdByUser)}
                          title="点击查看用户详情"
                        >
                          {record.createdByUser}
                        </span>
                      </td>
                      <td>{record.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 记录件数显示（对应设计书 2.1 序号13）- 置于表格下方 */}
        <div className="ud09-count">
          Number of lines found: {count}
        </div>

      </div>
    </div>
  );
};

export default UD09_HomologationVariablesResultList;
