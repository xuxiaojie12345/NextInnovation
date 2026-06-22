import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomologationVariablesResultList.css';

/**
 * HomologationVariablesResultList组件 - 用户自定义规则检索结果展示页面
 * 
 * @description 以DataTable形式展示多条检索结果，支持选中数据后返回上一画面或删除操作
 * @props 无Props，通过路由state接收检索条件参数（从HomologationVariables画面跳转时）
 */
const HomologationVariablesResultList: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [searchParams, setSearchParams] = useState<any>({});
  const [dataTableList, setDataTableList] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
   * 调用UD08SelectHdocUserDefinedRulesApi和UD08SelectHdocUserDefinedRulesCountApi获取数据和总条数
   * 对应设计书 5.1 UD08SelectHdocUserDefinedRulesApi 和 5.3 UD08SelectHdocUserDefinedRulesCountApi
   * 
   * @param params 检索条件参数
   */
  const fetchDataAndCount = async (params: any) => {
    setIsLoading(true);
    
    try {
      // 并行调用两个API
      const [dataResponse, countResponse] = await Promise.all([
        // API请求 - 获取检索结果数据 (对应设计书 5.1)
        axios.post('/api/UD08/select-hdoc-user-defined-rules', {
          pc: params.productClass || '',
          num: params.number ? parseInt(params.number) : null,
          market: params.market || ''
        }),
        
        // API请求 - 获取检索结果总条数 (对应设计书 5.3)
        axios.post('/api/UD08/select-hdoc-user-defined-rules-count', {
          pc: params.productClass || '',
          num: params.number ? parseInt(params.number) : null,
          market: params.market || ''
        })
      ]);
      
      if (dataResponse.data.success) {
        // 假设返回的是数组格式
        const dataList = Array.isArray(dataResponse.data.data) 
          ? dataResponse.data.data 
          : [dataResponse.data.data];
        
        // 按 Product Class, Market, Number 排序 (对应设计书 2.1 控件属性表 备注)
        const sortedData = dataList.sort((a: any, b: any) => {
          if (a.pc !== b.pc) return a.pc.localeCompare(b.pc);
          if (a.market !== b.market) return a.market.localeCompare(b.market);
          return (a.num || 0) - (b.num || 0);
        });
        
        setDataTableList(sortedData);
      }
      
      if (countResponse.data.success) {
        setTotalCount(countResponse.data.data.count || 0);
      }
    } catch (error: any) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Select按钮点击处理 - 返回HomologationVariables画面并携带选中数据
   * 对应设计书 3.2 Select按钮押下
   */
  const handleSelectClick = () => {
    // 校验：检查是否选中了数据 (对应设计书 4.2 校验詳細規格表 No.1)
    if (!selectedRow) {
      alert('请先选中一条数据');
      return;
    }
    
    // 返回HomologationVariables画面，携带选中的数据
    navigate('/HomologationVariables', { 
      state: { 
        variable: selectedRow.variable,
        ...selectedRow
      } 
    });
  };

  /**
   * Back按钮点击处理 - 返回HomologationVariables画面
   * 对应設計書 3.3 Back按钮押下
   */
  const handleBackClick = () => {
    navigate(-1);
  };

  /**
   * Print按钮点击处理 - 触发浏览器打印功能
   * 对应設計書 3.4 Print按钮押下
   */
  const handlePrintClick = () => {
    window.print();
  };

  /**
   * Delete selected按钮点击处理 - 删除选中的数据
   * 对应設計書 3.5 Delete selected按钮押下 和 4.1.2 画面选中一条数据后，执行删除操作
   */
  const handleDeleteSelectedClick = async () => {
    // 校验：检查是否选中了数据 (对应設計書 4.2 校驗詳細規格表 No.1)
    if (!selectedRow) {
      alert('请先选中一条数据');
      return;
    }
    
    try {
      // API请求 - 删除选中的数据 (对应設計書 5.2 UD08DeleteHdocUserDefinedRulesApi)
      const deleteResponse = await axios.delete('/api/UD08/delete-hdoc-user-defined-rules', {
        data: {
          pc: selectedRow.pc,
          num: selectedRow.num,
          market: selectedRow.market
        }
      });
      
      if (deleteResponse.data.success) {
        alert('情报删除成功');
        
        // 重新加载数据
        fetchDataAndCount(searchParams);
        
        // 清空选中行
        setSelectedRow(null);
      } else {
        alert(deleteResponse.data.message || '情报删除失败');
      }
    } catch (error: any) {
      console.error('删除失败:', error);
      alert(error.response?.data?.message || '情报删除失败');
    }
  };

  /**
   * Created by user Link点击处理 - 跳转到EdbUserView画面
   * 对应設計書 3.6 Created by user Link按钮押下
   * 
   * @param registerUser 注册用户ID
   */
  const handleCreatedByUserClick = (registerUser: string) => {
    if (!registerUser) {
      return;
    }
    
    // 跳转到EdbUserView画面，携带userId参数
    navigate('/edb-user-view', { 
      state: { userId: registerUser } 
    });
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
    <div className='homologation-variables-result-list-container'>
      <div className='homologation-variables-result-list-content'>
        {/* 标题 */}
        <h2 className='page-title'>Homologation Variables</h2>
        
        {/* 按钮区域 */}
        <div className='button-group'>
          <button className='action-button' onClick={handleSelectClick}>Select</button>
          <button className='action-button' onClick={handleBackClick}>Back</button>
          <button className='action-button' onClick={handlePrintClick}>Print</button>
          <button className='action-button delete-button' onClick={handleDeleteSelectedClick}>Delete Selected</button>
        </div>
        
        {/* DataTable区域 */}
        <div className='table-container'>
          <table className='data-table'>
            <thead>
              <tr>
                <th className='checkbox-column'></th>
                <th className='required-column'>*Product<br />&nbsp;&nbsp;&nbsp;class</th>
                <th className='required-column'>*Number</th>
                <th className='required-column'>*Market</th>
                <th>Variable</th>
                <th>Value</th>
                <th>Variant string.</th>
                <th>Comments</th>
                <th>Add<br />(YYYYWW)</th>
                <th>Delete<br />(YYYYWW)</th>
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
                  <td>{row.pc}</td>
                  <td>{row.num}</td>
                  <td>{row.market}</td>
                  <td>{row.variable}</td>
                  <td>{row.val}</td>
                  <td>{row.vs}</td>
                  <td>{row.comments}</td>
                  <td>{row.addDate}</td>
                  <td>{row.deleteDate}</td>
                  <td>
                    {row.updateUser && (
                      <span 
                        className='link-text'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreatedByUserClick(row.updateUser);
                        }}
                      >
                        {row.updateUser}
                      </span>
                    )}
                  </td>
                  <td>{row.updateDatetime}</td>
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

export default HomologationVariablesResultList;
