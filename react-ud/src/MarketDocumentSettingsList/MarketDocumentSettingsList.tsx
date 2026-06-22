import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './MarketDocumentSettingsList.css';

/**
 * MarketDocumentSettingsList组件 - 市场文档设置检索结果展示页面
 * 
 * @description 以DataTable形式展示检索结果，支持选中数据后返回上一画面、打印或查看用户详情
 * @props 无Props
 */
const MarketDocumentSettingsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [searchParams, setSearchParams] = useState<any>(null);
  const [dataTableList, setDataTableList] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * 画面初期表示 - 接收前画面传递的参数并查询数据
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    // 从MarketDocumentSettings画面跳转至本画面，携带DOCTYPE参数
    if (location.state) {
      const state = location.state as any;
      setSearchParams(state);
      
      // 调用API获取检索结果数据
      fetchDataTableList(state.doctype || '');
    }
  }, [location.state]);

  /**
   * 调用UD20SelecteHdocDocumentListApi获取检索结果数据
   * 对应设计书 5.1 UD20SelecteHdocDocumentListApi
   */
  const fetchDataTableList = async (doctype: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 - 查询文档list (对应设计书 5.1)
      const response = await axios.get('/api/UD20/select-hdoc-document-list', {
        params: { doctype: doctype }
      });
      
      if (response.data.success) {
        const data = response.data.data || [];
        // 将数据显示在DataTable中，每条数据前添加radiobox
        setDataTableList(Array.isArray(data) ? data : [data]);
      } else {
        setErrorMessage(response.data.message || '查询失败');
        setDataTableList([]);
      }
    } catch (error: any) {
      console.error('查询失败:', error);
      setErrorMessage(error.response?.data?.message || '网络连接失败，请稍后重试');
      setDataTableList([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Radio Box选中处理 - 更新选中的行数据
   */
  const handleRadioChange = (row: any) => {
    setSelectedRow(row);
  };

  /**
   * Select按钮点击处理 - 返回MarketDocumentSettings画面并显示选中数据
   * 对应设计书 3.2 Select按钮押下 和 4.1.2 Select按钮押下
   */
  const handleSelectClick = () => {
    // 条件1：若画面的一条数据未选中 (对应设计书 4.2 No.1)
    if (!selectedRow) {
      setErrorMessage('No data found');
      return;
    }
    
    // 条件2：若画面的一条数据选中后
    // 跳转到前画面Market Document Settings，携带Document type、Bussines unit、User、Date参数
    navigate('/MarketDocumentSettings', { 
      state: { 
        documentType: selectedRow.doctype,
        businessUnit: 'BU', // 固定表示
        user: selectedRow.registerUser,
        date: selectedRow.registerDatetime
      } 
    });
  };

  /**
   * Back按钮点击处理 - 返回MarketDocumentSettings画面
   * 对应设计书 3.4 Back按钮押下
   */
  const handleBackClick = () => {
    navigate(-1); // 返回上一页
  };

  /**
   * Print按钮点击处理 - 打印检索结果
   * 对应设计书 3.3 Print按钮押下 和 4.1.3 Print按钮押下
   */
  const handlePrintClick = () => {
    window.print(); // 调用浏览器原生打印
  };

  /**
   * User Link点击处理 - 跳转到EdbUserView画面查看用户详情
   * 对应设计书 3.5 User的Link按钮押下
   */
  const handleUserClick = (userId: string) => {
    navigate('/EdbUserView', { 
      state: { userId: userId } 
    });
  };

  return (
    <div className='mdsl-container'>
      <div className='mdsl-content'>
        {/* 标题区域 */}
        <h2 className='mdsl-title'>HDoc - Market Document Settings</h2>
        
        {/* 按钮区域 */}
        <div className='mdsl-button-row'>
          <button 
            className='mdsl-action-button' 
            onClick={handleSelectClick}
            disabled={isLoading}
          >
            Select
          </button>
          <button 
            className='mdsl-action-button' 
            onClick={handleBackClick}
            disabled={isLoading}
          >
            Back
          </button>
          <button 
            className='mdsl-action-button' 
            onClick={handlePrintClick}
            disabled={isLoading}
          >
            Print
          </button>
        </div>
        
        {/* 错误信息显示 */}
        {errorMessage && (
          <div className='mdsl-error-message'>
            {errorMessage}
          </div>
        )}
        
        {/* Loading状态 */}
        {isLoading && (
          <div className='mdsl-loading'>
            加载中...
          </div>
        )}
        
        {/* DataTable区域 */}
        <div className='mdsl-table-container'>
          <table className='mdsl-table'>
            <thead>
              <tr>
                <th className='mdsl-th-radio'></th>
                <th className='mdsl-th-doctype'>Document type</th>
                <th className='mdsl-th-businessunit'>Bussines unit</th>
                <th className='mdsl-th-user'>User</th>
                <th className='mdsl-th-date'>Date</th>
              </tr>
            </thead>
            <tbody>
              {dataTableList.length > 0 ? (
                dataTableList.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'mdsl-row-even' : 'mdsl-row-odd'}>
                    <td className='mdsl-td-radio'>
                      <input 
                        type='radio' 
                        name='selectedRow'
                        checked={selectedRow === row}
                        onChange={() => handleRadioChange(row)}
                        disabled={isLoading}
                      />
                    </td>
                    <td className='mdsl-td-doctype'>{row.doctype || ''}</td>
                    <td className='mdsl-td-businessunit'>BU</td>
                    <td className='mdsl-td-user'>
                      <span 
                        className='mdsl-user-link'
                        onClick={() => handleUserClick(row.registerUser)}
                      >
                        {row.registerUser || '-'}
                      </span>
                    </td>
                    <td className='mdsl-td-date'>{row.registerDatetime || ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className='mdsl-empty-message'>暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettingsList;
