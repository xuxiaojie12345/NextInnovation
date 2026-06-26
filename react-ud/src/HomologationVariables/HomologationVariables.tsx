import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HomologationVariables.css';

/**
 * HomologationVariables组件 - 用户自定义规则管理页面
 * 
 * @description 支持检索、新增、更新、删除操作，提供Product class和Market下拉列表选择
 * @props 无Props，通过路由state接收variable参数（从ExistingHdocVariablesResultList画面跳转时）
 */
const HomologationVariables: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [productClass, setProductClass] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [variable, setVariable] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [variantString1, setVariantString1] = useState<string>('');
  const [variantString2, setVariantString2] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [addDate, setAddDate] = useState<string>('');
  const [deleteDate, setDeleteDate] = useState<string>('');
  const [createdByUser, setCreatedByUser] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [productClassList, setProductClassList] = useState<string[]>([]);
  const [marketList, setMarketList] = useState<string[]>([]);
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
   * 画面初期表示 - 加载下拉列表数据并处理从前画面传递的参数
   * 对应设计书 3.1 画面初期
   */
  useEffect(() => {
    // 调用API获取下拉列表数据 (对应设计书 4.1.1 画面初期没有数据情况)
    fetchDropdownData();
    
    // 检查是否从前画面传递了参数
    const state = location.state as any;
    if (state) {
      if (state.pc) {
        // 从HomologationVariablesResultList通过Select返回时，直接用选中行数据填充所有字段
        setProductClass(state.pc || '');
        setNumber(state.num ? String(state.num) : '');
        setMarket(state.market || '');
        setVariable(state.variable || '');
        setValue(state.val || '');
        setVariantString1(state.vs || '');
        setVariantString2(state.vs2 || '');
        setComments(state.comments || '');
        setAddDate(state.addDate || '');
        setDeleteDate(state.deleteDate || '');
        setCreatedByUser(state.updateUser || '');
        setDate(state.updateDatetime || '');
      } else if (state.productClass !== undefined) {
        // 从HomologationVariablesResultList通过Back返回时，用原来的检索条件填充（不调API）
        setProductClass(state.productClass || '');
        setNumber(state.number || '');
        setMarket(state.market || '');
        setVariable(state.variable || '');
        setValue(state.value || '');
        setVariantString1(state.variantString1 || '');
        setVariantString2(state.variantString2 || '');
        setComments(state.comments || '');
      } else if (state.variable) {
        // 从ExistingHdocVariablesResultList画面跳转时，根据variable查询数据
        fetchVariableData(state.variable);
      }
    }
    // 初始加载（从HdocMenu点link进入）: state为null，所有字段保持空白
  }, [location.state]);

  /**
   * 调用UD08SelectProductclassmasterApi和UD08SelectMarketmasterApi获取下拉列表数据
   * 对应设计书 5.1 UD08SelectProductclassmasterApi 和 5.2 UD08SelectMarketmasterApi
   */
  const fetchDropdownData = async () => {
    try {
      // 并行调用两个API获取下拉列表数据
      const [productClassResponse, marketResponse] = await Promise.all([
        axios.post('http://localhost:8081/api/ud08/selectproductclassmaster'),
        axios.post('http://localhost:8081/api/ud08/selectmarketmaster')
      ]);
      
      if (productClassResponse.data.code === 200) {
        const pcList = productClassResponse.data.data.map((item: any) => item.pc || item);
        setProductClassList(pcList);
      }
      
      if (marketResponse.data.code === 200) {
        const marketData = marketResponse.data.data.map((item: any) => item.market || item);
        setMarketList(marketData);
      }
    } catch (error: any) {
      showMessage('获取下拉列表数据失败', 'error');
    }
  };

  /**
   * 调用UD08SelectHdocVariablesApi获取指定variable的数据
   * 对应设计书 5.3 UD08SelectHdocVariablesApi
   * 
   * @param variableParam 变量名
   */
  const fetchVariableData = async (variableParam: string) => {
    try {
      const response = await axios.post('http://localhost:8081/api/ud08/selecthdocvariables', {
        variable: variableParam
      });
      
      if (response.data.code === 200) {
        const data = response.data.data;
        
        // 填充画面数据
        setProductClass(data.pc || '');
        setNumber(data.num ? String(data.num) : '');
        setMarket(data.market || '');
        setVariable(data.variable || '');
        setValue(data.val || '');
        setVariantString1(data.vs || '');
        setVariantString2(data.vs2 || '');
        setComments(data.comments || '');
        setAddDate(data.addDate || '');
        setDeleteDate(data.deleteDate || '');
        setCreatedByUser(data.updateUser || '');
        setDate(data.updateDatetime || '');
      }
    } catch (error: any) {
      showMessage('获取variable数据失败', 'error');
    }
  };

  /**
   * Search按钮点击处理 - 跳转到HomologationVariablesResultList画面
   * 对应设计书 3.2 Search按钮押下
   */
  const handleSearchClick = () => {
    // 校验：Product class, Number, Market必须入力
    if (!productClass) {
      showMessage('productClass 是必须入力项目', 'error');
      return;
    }
    if (!number) {
      showMessage('number 是必须入力项目', 'error');
      return;
    }
    if (!market) {
      showMessage('market 是必须入力项目', 'error');
      return;
    }
    
    clearMessage();
    
    // 获取当前登录用户ID（从localStorage或context中获取）
    const userId = sessionStorage.getItem('userId') || '';
    
    // 准备检索条件参数
    const searchParams = {
      productClass,
      number,
      market,
      variable,
      value,
      variantString1,
      variantString2,
      comments,
      userId
    };
    
    // 跳转到结果列表画面 (对应设计书 7. 实现注意事项)
    navigate('/HdocMenu/HomologationVariablesResultList', { state: searchParams });
  };

  /**
   * Clear按钮点击处理 - 清空所有输入字段
   * 对应设计书 3.3 Clear按钮押下
   */
  const handleClearClick = () => {
    setProductClass('');
    setNumber('');
    setMarket('');
    setVariable('');
    setValue('');
    setVariantString1('');
    setVariantString2('');
    setComments('');
    setAddDate('');
    setDeleteDate('');
    setCreatedByUser('');
    setDate('');
  };

  /**
   * Add按钮点击处理 - 新增数据
   * 对应设计书 3.4 Add按钮押下 和 4.1.2.3 Add操作校验
   */
  const handleAddClick = async () => {
    // 校验1：Product class, Number, Market必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!productClass) {
      showMessage('productClass 是必须入力项目', 'error');
      return;
    }
    if (!number) {
      showMessage('number 是必须入力项目', 'error');
      return;
    }
    if (!market) {
      showMessage('market 是必须入力项目', 'error');
      return;
    }
    
    clearMessage();
    
    // 处理Variable：若以'TEMPLATE-'开头，去除前缀 (对应设计书 2.1 控件属性表 备注)
    let processedVariable = variable;
    if (variable.startsWith('TEMPLATE-')) {
      processedVariable = variable.substring(9); // 去除'TEMPLATE-'前缀
    }
    
    // 校验2：检查Variable是否在HDOC_VARIABLES表中存在 (对应设计书 4.1.2.3 Add操作校验 校验2)
    try {
      const varResponse = await axios.post('http://localhost:8081/api/ud08/selecthdocvariables', {
        variable: processedVariable
      });
      
      if (varResponse.data.code !== 200 || !varResponse.data.data) {
        showMessage('Variant does not exist, Please enter the correct content', 'error');
        return;
      }
    } catch (error: any) {
      showMessage('Variant does not exist, Please enter the correct content', 'error');
      return;
    }
    
    // 校验3：检查是否已存在相同数据 (对应设计书 4.1.2.3 Add操作校验 校验3)
    try {
      const existResponse = await axios.post('http://localhost:8081/api/ud09/search', {
        pc: productClass,
        num: parseInt(number),
        market: market
      });
      
      if (existResponse.data.code === 200 && existResponse.data.data && Array.isArray(existResponse.data.data) && existResponse.data.data.length > 0) {
        showMessage('数据已存在，无法重复添加', 'error');
        return;
      }
    } catch (error: any) {
      // 如果查询失败，继续执行新增
    }
    
    // 执行新增操作 (对应设计书 5.6 UD08AddHdocUserDefinedRulesApi)
    try {
      const currentUserId = sessionStorage.getItem('userId') || '';
      const currentDateTime = new Date().toISOString();
      
      const addResponse = await axios.post('http://localhost:8081/api/ud08/add', {
        pc: productClass,
        num: parseInt(number),
        market: market,
        variable: processedVariable,
        val: value,
        vs: variantString1,
        vs2: variantString2,
        comments: comments,
        addDate: addDate,
        deleteDate: deleteDate,
        updateUser: createdByUser,
        updateDatetime: currentDateTime,
        updateProcess: 'UD08HomologationVariables',
        registerUser: currentUserId,
        registerDatetime: currentDateTime,
        registerProcess: 'UD08HomologationVariables'
      });
      
      if (addResponse.data.code === 200) {
        showMessage('情报登录成功', 'success');
        // 可选：清空表单或刷新数据
      } else {
        showMessage(addResponse.data.message || '情报登录失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.message || '情报登录失败', 'error');
    }
  };

  /**
   * Update按钮点击处理 - 更新数据
   * 对应设计书 3.5 Update按钮押下 和 4.1.2.1 Update操作校验
   */
  const handleUpdateClick = async () => {
    // 校验1：Product class, Number, Market必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!productClass) {
      showMessage('productClass 是必须入力项目', 'error');
      return;
    }
    if (!number) {
      showMessage('number 是必须入力项目', 'error');
      return;
    }
    if (!market) {
      showMessage('market 是必须入力项目', 'error');
      return;
    }
    
    clearMessage();
    
    // 校验2：检查数据是否存在 (对应设计书 4.1.2.1 Update操作校验 校验2)
    try {
      const existResponse = await axios.post('http://localhost:8081/api/ud09/search', {
        pc: productClass,
        num: parseInt(number),
        market: market
      });
      
      if (existResponse.data.code !== 200 || !existResponse.data.data || (Array.isArray(existResponse.data.data) && existResponse.data.data.length === 0)) {
        showMessage('Data does not exist, Please enter the correct content', 'error');
        return;
      }
    } catch (error: any) {
      showMessage('Data does not exist, Please enter the correct content', 'error');
      return;
    }
    
    // 处理Variable：若以'TEMPLATE-'开头，去除前缀
    let processedVariable = variable;
    if (variable.startsWith('TEMPLATE-')) {
      processedVariable = variable.substring(9);
    }
    
    // 校验3：如果Variable有值，检查是否在HDOC_VARIABLES表中存在 (对应设计书 4.1.2.1 Update操作校验 校验3)
    if (processedVariable) {
      try {
        const varResponse = await axios.post('http://localhost:8081/api/ud08/selecthdocvariables', {
          variable: processedVariable
        });
        
        if (varResponse.data.code !== 200 || !varResponse.data.data) {
          showMessage('Variant does not exist, Please enter the correct content', 'error');
          return;
        }
      } catch (error: any) {
        showMessage('Variant does not exist, Please enter the correct content', 'error');
        return;
      }
    }
    
    // 执行更新操作 (对应设计书 5.5 UD08UpdateHdocUserDefinedRulesApi)
    try {
      const currentUserId = sessionStorage.getItem('userId') || '';
      const currentDateTime = new Date().toISOString();
      
      const updateResponse = await axios.post('http://localhost:8081/api/ud08/update', {
        pc: productClass,
        num: parseInt(number),
        market: market,
        variable: processedVariable,
        val: value,
        vs: variantString1,
        vs2: variantString2,
        comments: comments,
        addDate: addDate,
        deleteDate: deleteDate,
        updateUser: currentUserId,
        updateDatetime: currentDateTime,
        updateProcess: 'UD08HomologationVariables'
      });
      
      if (updateResponse.data.code === 200) {
        showMessage('情报更新成功', 'success');
      } else {
        showMessage(updateResponse.data.message || '情报更新失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.message || '情报更新失败', 'error');
    }
  };

  /**
   * Delete按钮点击处理 - 删除数据
   * 对应设计书 3.6 Delete按钮押下 和 4.1.2.2 Delete操作校验
   */
  const handleDeleteClick = async () => {
    // 校验1：Product class, Number, Market必须入力 (对应设计书 4.2 校验详细规格表 No.1)
    if (!productClass) {
      showMessage('productClass 是必须入力项目', 'error');
      return;
    }
    if (!number) {
      showMessage('number 是必须入力项目', 'error');
      return;
    }
    if (!market) {
      showMessage('market 是必须入力项目', 'error');
      return;
    }
    
    clearMessage();
    
    // 校验2：检查数据是否存在 (对应设计书 4.1.2.2 Delete操作校验 校验2)
    try {
      const existResponse = await axios.post('http://localhost:8081/api/ud09/search', {
        pc: productClass,
        num: parseInt(number),
        market: market
      });
      
      if (existResponse.data.code !== 200 || !existResponse.data.data || (Array.isArray(existResponse.data.data) && existResponse.data.data.length === 0)) {
        showMessage('Data does not exist, Please enter the correct content', 'error');
        return;
      }
    } catch (error: any) {
      showMessage('Data does not exist, Please enter the correct content', 'error');
      return;
    }
    
    // 执行删除操作 (对应设计书 5.7 UD08DeleteHdocUserDefinedRulesApi)
    try {
      const deleteResponse = await axios.post('http://localhost:8081/api/ud08/delete', {
        pc: productClass,
        num: parseInt(number),
        market: market
      });
      
      if (deleteResponse.data.code === 200) {
        showMessage('情报删除成功', 'success');
        // 可选：清空表单
        handleClearClick();
      } else {
        showMessage(deleteResponse.data.message || '情报删除失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.message || '情报删除失败', 'error');
    }
  };

  return (
    <div className='homologation-variables-container'>
      <div className='homologation-variables-content'>
        {/* 标题 */}
        <h2 className='page-title'>Homologation Variables</h2>
        
        {/* 按钮区域 */}
        <div className='button-group'>
          <button className='action-button' onClick={handleSearchClick}>Search</button>
          <button className='action-button' onClick={handleClearClick}>Clear</button>
          <button className='action-button' onClick={handleAddClick}>Add</button>
          <button className='action-button' onClick={handleUpdateClick}>Update</button>
          <button className='action-button' onClick={handleDeleteClick}>Delete</button>
        </div>
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
          </div>
        )}
        
        {/* 表单区域 */}
        <div className='form-container'>
          {/* Product class - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label required'>Product class</label>
            <span className='operator'>= ⌵</span>
            <select 
              className='form-select' 
              value={productClass} 
              onChange={(e) => setProductClass(e.target.value)}
            >
              <option value=""></option>
              {productClassList.map((pc, index) => (
                <option key={index} value={pc}>{pc}</option>
              ))}
            </select>
          </div>
          
          {/* Number - 半角数字*/}
          <div className='form-row'>
            <label className='form-label required'>Number</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={number} 
              onChange={(e) => setNumber(e.target.value)}
              maxLength={10}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^0-9]/g, '');
              }}
            />
          </div>
          
          {/* Market - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label required'>Market</label>
            <span className='operator'>= ⌵</span>
            <select 
              className='form-select short' 
              value={market} 
              onChange={(e) => setMarket(e.target.value)}
            >
              <option value=""></option>
              {marketList.map((mkt, index) => (
                <option key={index} value={mkt}>{mkt}</option>
              ))}
            </select>
          </div>
          
          {/* Variable - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Variable</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input medium' 
              value={variable} 
              onChange={(e) => setVariable(e.target.value)}
              maxLength={20}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Value- 半角英数字+記号 */}
          <div className='form-row'>
            <label className='form-label'>Value</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input long' 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              maxLength={200}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Variant string.1 - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Variant string.</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input long' 
              value={variantString1} 
              onChange={(e) => setVariantString1(e.target.value)}
              maxLength={100}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Variant string.2 - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'></label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input long' 
              value={variantString2} 
              onChange={(e) => setVariantString2(e.target.value)}
              maxLength={100}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Comments - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Comments</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input long' 
              value={comments} 
              onChange={(e) => setComments(e.target.value)}
              maxLength={100}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
          </div>
          
          {/* Add - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Add</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={addDate} 
              onChange={(e) => setAddDate(e.target.value)}
              maxLength={6}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
            <span className='auto-text'>YYYYWW</span>
          </div>
          
          {/* Delete - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Delete</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={deleteDate} 
              onChange={(e) => setDeleteDate(e.target.value)}
              maxLength={6}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
            <span className='auto-text'>YYYYWW</span>
          </div>
          
          {/* Created by user - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Created by user</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={createdByUser} 
              onChange={(e) => setCreatedByUser(e.target.value)}
              maxLength={16}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
            <span className='auto-text'>Automatic</span>
          </div>
          
          {/* Date - 半角英数字+記号*/}
          <div className='form-row'>
            <label className='form-label'>Date</label>
            <span className='operator'>= ⌵</span>
            <input 
              type='text' 
              className='form-input short' 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                target.value = target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/g, '');
              }}
            />
            <span className='auto-text'>Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomologationVariables;
