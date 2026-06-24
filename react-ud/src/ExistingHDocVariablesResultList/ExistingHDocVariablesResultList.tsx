/**
 * ExistingHDocVariablesResultList 组件 - 现有HDoc变量搜索结果列表页面（UD11）
 * 功能：根据前画面传递的搜索条件显示匹配的变量定义列表
 * 提供Select（选择返回）、Down（下钻）、Back（返回）、Print（打印）、Excel（导出CSV）功能
 * 对应详细设计：详细设计/詳細設計UD11.md
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './ExistingHDocVariablesResultList.css';

/**
 * 搜索结果记录数据类型
 */
interface SearchResultItem {
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

/**
 * ExistingHDocVariablesResultList 组件
 * 显示搜索结果列表，支持记录选择、下钻、打印、导出CSV等功能
 */
const ExistingHDocVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 搜索结果列表数据
  const [dataList, setDataList] = useState<SearchResultItem[]>([]);
  // 选中记录的行索引
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  // 消息提示
  const [message, setMessage] = useState<string>('');
  // 消息类型
  const [messageType, setMessageType] = useState<'error' | 'success' | 'warning'>('error');
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  // 操作中状态（防重复提交）
  const [isOperating, setIsOperating] = useState<boolean>(false);

  // 从 location.state 中获取搜索条件
  const searchState = (location.state as Record<string, string>) || {};

  /**
   * 页面初始化：根据搜索条件查询数据
   * 调用 UD10Search API（POST方法），传递搜索条件作为请求参数
   * 对应详细设计 3.1.1 页面初始化流程
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        // 构建搜索请求参数（含运算符）
        const searchParams = {
          variable: searchState.variable || '',
          type: searchState.type || '',
          description: searchState.description || '',
          userid: searchState.userid || '',
          registerDatetime: searchState.registerDatetime || '',
          variableOp: searchState.variableOp || '=',
          typeOp: searchState.typeOp || '=',
          descriptionOp: searchState.descriptionOp || '=',
          useridOp: searchState.useridOp || '=',
          registerDatetimeOp: searchState.registerDatetimeOp || '='
        };
        const res = await axios.post<ApiResponse<SearchResultItem[]>>(
          `${API_BASE_URL}/api/ud11/search`,
          searchParams
        );
        if (res.data.code === 200 && Array.isArray(res.data.data)) {
          setDataList(res.data.data);
        } else {
          setDataList([]);
        }
      } catch {
        setMessage('System error. Please contact administrator.');
        setMessageType('error');
        setDataList([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /**
   * 点击行切换选中状态（单选模式）
   * @param index 行索引
   */
  const handleRowClick = (index: number) => {
    setSelectedIndex(prev => prev === index ? -1 : index);
    if (message) {
      setMessage('');
    }
  };

  /**
   * 获取选中记录的完整数据
   */
  const getSelectedRecord = (): SearchResultItem | null => {
    if (selectedIndex < 0 || selectedIndex >= dataList.length) return null;
    return dataList[selectedIndex];
  };

  /**
   * Select 按钮处理：将选中记录返回到前画面
   * 对应详细设计 3.1.2 Select操作流程
   */
  const handleSelect = useCallback(() => {
    if (selectedIndex < 0) {
      setMessage('Please select a record.');
      setMessageType('error');
      return;
    }
    const record = getSelectedRecord();
    if (!record) {
      setMessage('Please select a record.');
      setMessageType('error');
      return;
    }
    // 将选中记录数据映射为表单格式
    const selectedData = {
      variable: record.variable || '',
      type: record.type || '',
      description: record.description || '',
      userid: record.userid || '',
      registerDatetime: record.registerDatetime || ''
    };
    // 导航回前画面，传递选中数据
    navigate('/Menu/ExistingHDocVariables', { state: { selectedRecord: selectedData } });
  }, [selectedIndex, dataList, navigate]);

  /**
   * Back 按钮处理：返回前画面，保留搜索条件
   * 对应详细设计 3.1.3 Back操作流程
   */
  const handleBack = useCallback(() => {
    navigate('/Menu/ExistingHDocVariables', { state: { searchConditions: searchState } });
  }, [navigate, searchState]);

  /**
   * Down 按钮（暂不实装具体功能）
   */
  const handleDown = useCallback(() => {
    // 暂不实装
  }, []);

  /**
   * Print 按钮处理：打印搜索结果列表
   * 对应详细设计 3.1.5 Print操作流程
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * Excel 按钮处理：导出搜索结果列表为CSV文件
   * 对应详细设计 3.1.6 Excel操作流程
   */
  const handleExportCsv = useCallback(() => {
    if (dataList.length === 0) {
      setMessage('No data to export.');
      setMessageType('warning');
      return;
    }
    // CSV 头部
    const headers = ['Variable', 'Type', 'Description', 'Created by user', 'Date'];
    // CSV 数据行
    const rows = dataList.map(item => [
      item.variable,
      item.type,
      item.description,
      item.userid,
      item.registerDatetime
    ]);
    // 构建 CSV 内容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    // 生成文件名
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const filename = `HDOC_Variables_${dateStr}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [dataList]);

  const disabled = isOperating || loading;

  if (loading) {
    return (
      <div className='ud11-container'>
        <h1 className='ud11-title'>Existing HDoc Variables</h1>
        <p className='ud11-subtitle'>Search Result List</p>
        <hr className='ud11-divider' />
        <div className='ud11-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='ud11-container'>
      {/* 页面标题 */}
      <h1 className='ud11-title'>Existing HDoc Variables</h1>
      <p className='ud11-subtitle'>Search Result List</p>
      <hr className='ud11-divider' />

      {/* 面包屑导航 */}
      <div className='ud11-breadcrumb'>
        Home &gt; <span onClick={() => navigate('/Menu/ExistingHDocVariables')}>Existing HDoc Variables</span> &gt; Search Result
      </div>

      {/* 消息提示区域 */}
      {message && (
        <div className={`ud11-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* 按钮组 */}
      <div className='ud11-button-group'>
        <button type='button' className='ud11-btn' onClick={handleSelect} disabled={disabled}>Select</button>
        <button type='button' className='ud11-btn' onClick={handleBack} disabled={disabled}>Back</button>
        <button type='button' className='ud11-btn' onClick={handleDown} disabled={disabled}>Down</button>
        <button type='button' className='ud11-btn' onClick={handlePrint} disabled={disabled}>Print</button>
        <button type='button' className='ud11-btn' onClick={handleExportCsv} disabled={disabled}>Excel</button>
      </div>

      {/* 搜索结果计数 */}
      <div className='ud11-count'>
        Number of lines found: {dataList.length}
      </div>

      {/* 数据表格 */}
      {dataList.length > 0 ? (
        <div className='ud11-table-wrapper'>
          <table className='ud11-table'>
            <thead>
              <tr>
                <th className='ud11-row-indicator'></th>
                <th>Variable</th>
                <th>Type</th>
                <th>Description</th>
                <th>Created by user</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {dataList.map((item, index) => (
                <tr
                  key={index}
                  className={selectedIndex === index ? 'ud11-row-selected' : ''}
                  onClick={() => handleRowClick(index)}
                >
                  <td className='ud11-row-indicator'>
                    {selectedIndex === index && <span className='ud11-check-mark'>&#10003;</span>}
                  </td>
                  <td>{item.variable}</td>
                  <td>{item.type}</td>
                  <td>{item.description}</td>
                  <td>
                    <span
                      className='ud11-user-link'
                      onClick={(e) => {
                        e.stopPropagation();
                        // Created by user 显示为可点击链接，跳转到 EDB User View 页面（UD25）
                        navigate('/Menu/EDBUserView', { state: { userId: item.userid } });
                      }}
                    >
                      {item.userid}
                    </span>
                  </td>
                  <td>{item.registerDatetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='ud11-empty'>
          No data found. Please try different search conditions.
        </div>
      )}
    </div>
  );
};

export default ExistingHDocVariablesResultList;
