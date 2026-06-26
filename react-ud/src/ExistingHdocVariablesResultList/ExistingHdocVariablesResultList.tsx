import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ExistingHdocVariablesResultList.css';

/**
 * ExistingHdocVariablesResultList组件 - HDoc变量检索结果展示页面
 * 
 * @description 以DataTable形式展示多条检索结果，支持选中数据后返回上一画面、下载或跳转到其他管理页面
 * @props 无Props，通过路由state接收检索条件参数（从ExistingHdocVariables画面跳转时）
 */
const ExistingHdocVariablesResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [searchParams, setSearchParams] = useState<any>({});
  const [dataTableList, setDataTableList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage('');
  };

  /**
   * 画面初期表示 - 从路由state获取检索条件并调用API获取数据
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    // 从路由state中获取检索条件参数
    const state = location.state as any;
    if (state) {
      setSearchParams(state);
      
      // 并行调用两个API获取数据和总条数
      fetchDataAndCount(state);
    } else {
      setIsLoading(false);
    }
  }, [location.state]);

  /**
   * 调用UD10SelectHdocVariablesApi和UD10SelectHdocVariablesCountApi获取数据和总条数
   * 对应设计书 5.1 UD10SelectHdocVariablesApi 和 5.2 UD10SelectHdocVariablesCountApi
   * 
   * @param params 检索条件参数
   */
  const fetchDataAndCount = async (params: any) => {
    setIsLoading(true);
    
    try {
      // 并行调用两个API
      const [dataResponse, countResponse] = await Promise.all([
        // API请求 - 获取检索结果数据 (对应设计书 5.1)
        axios.post('http://localhost:8081/api/ud11/search', {
          variable: params.variable || ''
        }),
        
        // API请求 - 获取检索结果总条数 (对应设计书 5.2)
        axios.post('http://localhost:8081/api/ud11/selecthdocvariablescount', {
          variable: params.variable || ''
        })
      ]);
      
      if (dataResponse.data.code === 200) {
        const dataList = Array.isArray(dataResponse.data.data) 
          ? dataResponse.data.data 
          : [dataResponse.data.data];
        
        setDataTableList(dataList);
      }
      
      if (countResponse.data.code === 200) {
        setTotalCount(countResponse.data.data.count || 0);
      }
    } catch (error: any) {
      showMessage('获取数据失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Select按钮点击处理 - 返回ExistingHdocVariables画面并携带选中数据
   * 对应设计书 3.2 Select按钮押下
   */
  const handleSelectClick = () => {
    // 校验：检查是否选中了数据
    if (!selectedRow) {
      showMessage('请先选中一条数据', 'error');
      return;
    }
    
    // 返回ExistingHdocVariables画面，携带选中的数据
    navigate('/HdocMenu/ExistingHdocVariables', { 
      state: { 
        variable: selectedRow.variable,
        type: selectedRow.type,
        description: selectedRow.description,
        createdByUser: selectedRow.registerUser,
        date: selectedRow.registerDatetime
      } 
    });
  };

  /**
   * Back按钮点击处理 - 返回ExistingHdocVariables画面
   * 对应设计书 3.3 Back按钮押下
   */
  const handleBackClick = () => {
    navigate('/HdocMenu/ExistingHdocVariables', { 
      state: searchParams 
    });
  };

  /**
   * Print按钮点击处理 - 触发浏览器打印功能
   * 对应设计书 3.4 Print按钮押下
   */
  const handlePrintClick = () => {
    window.print();
  };

  /**
   * Down按钮点击处理 - 跳转到HomologationVariables画面
   * 对应设计书 3.5 Down按钮押下 和 4.1.2 画面选中一条数据后，执行Down操作
   */
  const handleDownClick = () => {
    // 校验：检查是否选中了数据 (对应设计书 4.2 校验详细规格表 No.1)
    if (!selectedRow) {
      showMessage('No key defined for table.', 'error');
      return;
    }
    
    // 跳转到HomologationVariables画面，携带variable参数
    navigate('/HdocMenu/HomologationVariables', { 
      state: { 
        variable: selectedRow.variable 
      } 
    });
  };

  /**
   * Created by user Link点击处理 - 跳转到EdbUserView画面
   * 对应设计书 3.6 Created by user Link按钮押下
   * 
   * @param registerUser 注册用户ID
   */
  const handleCreatedByUserClick = (registerUser: string) => {
    if (!registerUser) {
      return;
    }
    
    // 跳转到EdbUserView画面，携带userId参数
    navigate('/HdocMenu/EdbUserView', { 
      state: { userId: registerUser } 
    });
  };

  /**
   * Excel按钮点击处理 - 导出CSV文件
   * 对应设计书 3.7 Excel按钮押下
   */
  const handleExcelClick = () => {
    // 纯前台生成CSV，不调API
    const headers = ['Variable', 'Type', 'Description', 'Created by user', 'Date'];
    const csvRows = [headers];
    dataTableList.forEach(row => {
      csvRows.push([
        row.variable || '',
        row.type || '',
        row.description || '',
        row.registerUser || '',
        row.registerDatetime || ''
      ]);
    });
    const csvContent = csvRows.map(row => 
      row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'hdoc_variables.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  /**
   * 表格行点击处理 - 设置选中行
   * 
   * @param row 被点击的行数据
   */
  const handleRowClick = (row: any) => {
    setSelectedRow(row);
  };

  return (
    <div className='existing-hdoc-variables-result-list-container'>
      <div className='existing-hdoc-variables-result-list-content'>
        {/* 标题 */}
        <h2 className='page-title'>Existing HDoc Variables</h2>
        
        {/* 按钮区域 */}
        <div className='button-group'>
          <button className='action-button' onClick={handleSelectClick}>Select</button>
          <button className='action-button' onClick={handleDownClick}>Down</button>
          <button className='action-button' onClick={handleBackClick}>Back</button>
          <button className='action-button' onClick={handlePrintClick}>Print</button>
          <button className='action-button' onClick={handleExcelClick}>Excel</button>
        </div>
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
          </div>
        )}
        
        {/* DataTable区域 */}
        <div className='table-container'>
          <table className='data-table'>
            <thead>
              <tr>
                <th className='checkbox-column'></th>
                <th className='required-column'>*Variable</th>
                <th>Type</th>
                <th>Description</th>
                <th>Created by user<br />(Automatic)</th>
                <th>Date<br />(Automatic)</th>
              </tr>
            </thead>
            <tbody>
              {dataTableList.map((row, index) => (
                <tr 
                  key={index} 
                  className={selectedRow === row ? 'selected-row' : ''}
                  onClick={() => handleRowClick(row)}
                >
                  <td className='checkbox-column'>
                    <input 
                      type='radio' 
                      name='selectedRow' 
                      checked={selectedRow === row}
                      onChange={() => handleRowClick(row)}
                    />
                  </td>
                  <td>{row.variable}</td>
                  <td>{row.type}</td>
                  <td>{row.description}</td>
                  <td>
                    {row.registerUser && (
                      <span 
                        className='link-text'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreatedByUserClick(row.registerUser);
                        }}
                      >
                        {row.registerUser}
                      </span>
                    )}
                  </td>
                  <td>{row.registerDatetime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Count显示 */}
        <div className='count-display'>
          Number of lines found: {totalCount}
        </div>
      </div>
    </div>
  );
};

export default ExistingHdocVariablesResultList;
