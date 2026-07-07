import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './HomologationVariablesResultList.css';

/**
 * 搜索结果记录数据类型
 */
interface SearchResultItem {
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
 * 批量删除请求类型
 */
interface BatchDeleteItem {
  productClass: string;
  number: string;
  market: string;
}

/**
 * 批量删除响应类型
 */
interface BatchDeleteResponse {
  deletedCount: number;
  failedCount: number;
  message: string;
}

const API_BASE_URL = 'http://localhost:8081';

/**
 * HomologationVariablesResultList 组件 - 认证变量搜索结果列表页面（UD09）
 *
 * 功能说明：
 * - 从 HomologationVariables 页面跳转时接收搜索条件（通过 React Router state 传递）
 * - 页面加载时调用 UD08Search API 根据搜索条件查询用户自定义规则列表
 * - 支持选择单条记录并返回前画面（Select 按钮）
 * - 支持返回前画面并保留搜索条件（Back 按钮）
 * - 支持打印搜索结果列表（Print 按钮）
 * - 支持批量删除选中的记录（Delete selected 按钮）
 * - 显示搜索结果总数（Count 字段）
 */
const HomologationVariablesResultList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 搜索结果列表数据
  const [dataList, setDataList] = useState<SearchResultItem[]>([]);
  // 选中记录的主键集合（使用字符串 "pc|num|market" 作为唯一标识）
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  // 消息提示
  const [message, setMessage] = useState<string>('');
  // 消息类型：'error' | 'success' | 'warning'
  const [messageType, setMessageType] = useState<'error' | 'success' | 'warning'>('error');
  // 加载状态
  const [loading, setLoading] = useState<boolean>(true);
  // 操作中状态（防重复提交）
  const [isOperating, setIsOperating] = useState<boolean>(false);

  // 从 location.state 中获取搜索条件
  const searchState = (location.state as Record<string, string>) || {};

  /**
   * 页面初始化：根据搜索条件查询数据
   * 调用 UD08Search API（POST方法），传递搜索条件作为请求参数
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMessage('');
      try {
        const res = await axios.post(`${API_BASE_URL}/api/ud09/search`, searchState);
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
   * 单选切换（Radio 行为）
   * @param key 记录的唯一标识 "pc|num|market"
   */
  const toggleSelect = (key: string) => {
    setSelectedKeys(prev => {
      if (prev.has(key)) {
        // 点击已选中项 → 取消选中
        return new Set();
      } else {
        // 选中新项（单选，只保留一个）
        return new Set([key]);
      }
    });
    if (message) {
      setMessage('');
    }
  };

  /**
   * 获取选中记录的完整数据（用于 Select 操作）
   * 选中记录只能有一条
   */
  const getSelectedRecord = useCallback((): SearchResultItem | null => {
    if (selectedKeys.size === 0) return null;
    const firstKey = Array.from(selectedKeys)[0];
    // 直接从 dataList 中根据唯一键查找匹配的记录
    return dataList.find(item => `${item.pc}|${item.num}|${item.market}` === firstKey) || null;
  }, [selectedKeys, dataList]);

  /**
   * 获取选中记录的主键列表（用于 Delete selected 操作）
   */
  const getSelectedPrimaryKeys = (): BatchDeleteItem[] => {
    const keys: BatchDeleteItem[] = [];
    selectedKeys.forEach(key => {
      const [productClass, number, market] = key.split('|');
      keys.push({ productClass, number, market });
    });
    return keys;
  };

  /**
   * Select 按钮处理：将选中记录返回到前画面
   * - 检查是否有选中的记录
   * - 获取选中记录的完整数据，存储到 state 中
   * - 导航回 /Menu/HomologationVariables 页面
   */
  const handleSelect = useCallback(() => {
    if (selectedKeys.size === 0) {
      setMessage('Please select a record.');
      setMessageType('error');
      return;
    }
    // Select操作只返回一条选中记录
    const record = getSelectedRecord();
    if (!record) {
      setMessage('Please select a record.');
      setMessageType('error');
      return;
    }
    // 将选中记录数据映射为 HomologationVariables 页面的 FormData 格式
    const selectedData = {
      productClass: record.pc || '',
      number: record.num || '',
      market: record.market || '',
      variable: record.variable || '',
      value: record.val || '',
      vs: record.vs || '',
      vs2: record.vs2 || '',
      comments: record.comments || '',
      addDate: record.addDate || '',
      deleteDate: record.deleteDate || '',
      updateUser: record.updateUser || '',
      updateDatetime: record.updateDatetime || '',
    };
    // 导航回前画面，传递选中数据
    navigate('/Menu/HomologationVariables', { state: { selectedRecord: selectedData } });
  }, [selectedKeys, dataList, navigate]);

  /**
   * Back 按钮处理：返回前画面，保留搜索条件
   */
  const handleBack = useCallback(() => {
    // 将当前搜索条件回传给前画面
    navigate('/Menu/HomologationVariables', { state: { searchConditions: searchState } });
  }, [navigate, searchState]);

  /**
   * Print 按钮处理：打印搜索结果列表
   * 调用 window.print() 方法，打印内容包括 DataTable 和 Count 信息
   */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /**
   * Delete selected 按钮处理：批量删除选中的记录
   * - 检查是否有选中的记录
   * - 调用 UD09DeleteHdocuserdefinedrules API 批量删除
   * - 根据删除结果刷新列表
   */
  const handleDeleteSelected = useCallback(async () => {
    if (selectedKeys.size === 0) {
      setMessage('Please select at least one record to delete.');
      setMessageType('error');
      return;
    }

    setIsOperating(true);
    setMessage('');

    try {
      const deleteItems = getSelectedPrimaryKeys();
      const res = await axios.post(
        `${API_BASE_URL}/api/ud09/deletehdocuserdefinedrules`,
        deleteItems
      );

      if (res.data.code === 200) {
        const response: BatchDeleteResponse = res.data.data;
        if (response.failedCount === 0) {
          setMessage(response.message);
          setMessageType('success');
        } else if (response.deletedCount > 0) {
          setMessage(response.message);
          setMessageType('warning');
        } else {
          setMessage(response.message);
          setMessageType('error');
        }
        // 清空选中状态
        setSelectedKeys(new Set());
        // 重新调用 UD08Search API 刷新列表数据
        const searchRes = await axios.post(`${API_BASE_URL}/api/ud09/search`, searchState);
        if (searchRes.data.code === 200 && Array.isArray(searchRes.data.data)) {
          setDataList(searchRes.data.data);
        } else {
          setDataList([]);
        }
      } else {
        setMessage(res.data.message || 'Failed to delete records. Please try again.');
        setMessageType('error');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
      setMessageType('error');
    } finally {
      setIsOperating(false);
    }
  }, [selectedKeys, searchState]);

  /**
   * 根据主键生成唯一标识
   */
  const getKey = (item: SearchResultItem): string => {
    return `${item.pc}|${item.num}|${item.market}`;
  };

  /**
   * 判断记录是否被选中
   */
  const isSelected = (item: SearchResultItem): boolean => {
    return selectedKeys.has(getKey(item));
  };

  const disabled = isOperating || loading;

  if (loading) {
    return (
      <div className='result-list-container'>
        <h1 className='result-list-title'>Homologation Variables</h1>
        <div className='loading-overlay'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='result-list-container'>
      {/* 页面标题 */}
      <h1 className='result-list-title'>Homologation Variables</h1>

      {/* 面包屑导航 */}
      <div className='breadcrumb'>
        Home &gt; <span onClick={() => navigate('/Menu/HomologationVariables')}>Homologation Variables</span> &gt; Search Result
      </div>

      {/* 消息提示区域 */}
      {message && (
        <div className={`result-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* 按钮组 */}
      <div className='result-button-group'>
        <button
          type='button'
          className='result-btn primary'
          onClick={handleSelect}
          disabled={disabled}
        >
          Select
        </button>
        <button
          type='button'
          className='result-btn'
          onClick={handleBack}
          disabled={disabled}
        >
          Back
        </button>
        <button
          type='button'
          className='result-btn'
          onClick={handlePrint}
          disabled={disabled}
        >
          Print
        </button>
        <button
          type='button'
          className='result-btn danger'
          onClick={handleDeleteSelected}
          disabled={disabled}
        >
          Delete selected
        </button>
      </div>

      {/* 搜索结果计数 */}
      <div className='result-count'>
        Number of lines found: {dataList.length}
      </div>

      {/* 数据表格 */}
      {dataList.length > 0 ? (
        <div className='table-wrapper'>
          <table className='data-table'>
            <thead>
              <tr>
                <th className='checkbox-cell'></th>
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
              {dataList.map((item) => {
                const key = getKey(item);
                return (
                  <tr
                    key={key}
                    className={isSelected(item) ? 'selected' : ''}
                    onClick={() => toggleSelect(key)}
                  >
                    <td className='checkbox-cell' onClick={(e) => e.stopPropagation()}>
                      <input
                        type='radio'
                        name='selectedRecord'
                        checked={isSelected(item)}
                        onChange={() => toggleSelect(key)}
                        disabled={disabled}
                      />
                    </td>
                    <td>{item.pc}</td>
                    <td>{item.num}</td>
                    <td>{item.market}</td>
                    <td>{item.variable}</td>
                    <td>{item.val}</td>
                    <td>{(item.vs || '') + (item.vs && item.vs2 ? ', ' : '') + (item.vs2 || '') || '-'}</td>
                    <td>{item.comments}</td>
                    <td>{item.addDate}</td>
                    <td>{item.deleteDate}</td>
                    <td>
                      <span
                        className='user-link'
                        onClick={(e) => {
                          e.stopPropagation();
                          // Created by user 显示为蓝色可点击链接，点击跳转到 EDB User View 页面（UD25）
                          navigate('/Menu/EDBUserView', { state: { userId: item.updateUser } });
                        }}
                      >
                        {item.updateUser}
                      </span>
                    </td>
                    <td>{item.updateDatetime}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='empty-data'>
          No data found. Please try different search conditions.
        </div>
      )}
    </div>
  );
};

export default HomologationVariablesResultList;
