import React, { useState } from 'react';
import './UD16_ADChange.css';
import apiClient from '../api/config';

/**
 * UD16_ADChange - AD Change 管理ページコンポーネント
 *
 * 功能说明：
 * - 用户可以对Serie-Chnr进行添加(ADD)、删除(DELETE)和检查(CHECK)操作
 * - 管理HDOC_ADCA_CHANGE表中的ADCA变更信息
 * - 添加时支持长文本描述输入（最大4000字符）
 * - 删除时逻辑删除（设置ACT字段为"U"）
 *
 * 对应设计书：DES-UD16-001
 *
 * @component
 * @returns {JSX.Element} AD Change管理页面元素
 */
const UD16_ADChange: React.FC = () => {
  // ==================== 状态管理 ====================
  // 对应设计书 6.1 状态管理
  const [serieChnr, setSerieChnr] = useState<string>('');  // Serie-Chnr输入值
  const [desc, setDesc] = useState<string>('');             // Desc描述输入值
  const [message, setMessage] = useState<string>('');        // 错误消息
  const [isLoading, setIsLoading] = useState<boolean>(false); // 加载状态标识

  // ==================== 常量定义 ====================
  const MAX_SERIE_CHNR_LENGTH = 15;    // Serie-Chnr最大长度（对应设计书 2.1 No.1）
  const MAX_DESC_LENGTH = 4000;        // Desc最大长度（对应设计书 2.1 No.2）

  // ==================== 工具函数 ====================

  /**
   * 从Serie-Chnr中拆分出SERIE和CHNR
   * 对应设计书 3.1.1 ADD按钮处理流程 前置处理
   * Serie-Chnr的英文字母部分赋值给serie，数字部分赋值给chnr
   *
   * @param {string} value - 完整的Serie-Chnr值
   * @returns {{ serie: string, chnr: string }} 拆分后的系列和编号
   */
  const splitSerieChnr = (value: string) => {
    // 提取前半部分英文字母作为serie
    const matchSerie = value.match(/^[A-Za-z]+/);
    // 提取后半部分数字作为chnr
    const matchChnr = value.match(/\d+$/);
    return {
      serie: matchSerie ? matchSerie[0] : '',
      chnr: matchChnr ? matchChnr[0] : '',
    };
  };

  /**
   * 显示错误消息
   *
   * @param {string} msg - 消息内容
   */
  const showMessage = (msg: string) => {
    setMessage(msg);
  };

  // ==================== API调用 ====================

  /**
   * 点击ADD按钮处理流程
   * 对应设计书 3.1.1 ADD按钮处理流程 和 4.1 UD16InsertHdocAdcaChange
   *
   * 处理流程：
   * 1. 前置处理：获取输入的Serie-Chnr和Desc值
   * 2. 空值校验和长度校验（前端校验）
   * 3. 拆分Serie-Chnr为SERIE和CHNR
   * 4. 调用API添加记录（若记录已存在且ACT="U"，弹框提示后激活）
   * 5. 结果处理：成功时显示成功消息并清空输入框
   */
  const handleAdd = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedSerieChnr = serieChnr.trim();
    const trimmedDesc = desc.trim();

    // 2. 空值校验（前端校验）
    // 对应设计书 3.2 校验详细规格表 No.1
    if (!trimmedSerieChnr) {
      showMessage('请输入Serie-Chnr');
      return; // 终止流程
    }

    // 对应设计书 3.2 校验详细规格表 No.2
    if (trimmedSerieChnr.length > MAX_SERIE_CHNR_LENGTH) {
      showMessage('Serie-Chnr最大长度为15字符');
      return; // 终止流程
    }

    // 对应设计书 3.2 校验详细规格表 No.3
    if (trimmedDesc.length > MAX_DESC_LENGTH) {
      showMessage('描述最大长度为4000字符');
      return; // 终止流程
    }

    // 3. 拆分Serie-Chnr
    const { serie, chnr } = splitSerieChnr(trimmedSerieChnr);

    // 4. API调用
    setIsLoading(true);
    showMessage('');

    try {
      // 对应设计书 4.1 UD16InsertHdocAdcaChange
      // POST /api/ud16/addchange
      const response = await apiClient.post('/api/ud16/addchange', {
        serie,
        chnr,
        desc: trimmedDesc,
      });

      // 5. 结果处理
      if (response.data && response.data.code === 200) {
        // 添加成功
        showMessage('添加成功');
        // 清空输入框
        setSerieChnr('');
        setDesc('');
      } else {
        // 对应设计书 3.2 校验详细规格表 No.5
        showMessage(response.data?.msg || '添加失败');
      }
    } catch (error: any) {
      // 异常处理
      console.error('添加AD Change失败:', error);

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        // 对应设计书 3.2 校验详细规格表 No.4
        // 记录已存在且ACT="U"的情况（HTTP 409 Conflict）
        if (statusCode === 409 && errorMsg === 'AFTER DEF CHANGE IS NOT ACTIVATED') {
          // 弹框显示警告消息
          const userConfirmed = window.confirm('AFTER DEF CHANGE IS NOT ACTIVATED');
          if (userConfirmed) {
            // 用户点击OK后，调用添加API继续（将ACT字段更新为"Y"）
            try {
              const retryResponse = await apiClient.post('/api/ud16/addchange', {
                serie,
                chnr,
                desc: trimmedDesc,
              });
              if (retryResponse.data && retryResponse.data.code === 200) {
                showMessage('添加成功');
                setSerieChnr('');
                setDesc('');
              } else {
                showMessage(retryResponse.data?.msg || '添加失败');
              }
            } catch (retryError: any) {
              showMessage(retryError.response?.data?.msg || '添加失败');
            }
          } else {
            // 用户取消操作
            showMessage('操作已取消');
          }
        } else if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员');
        } else {
          showMessage(errorMsg || '添加失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置');
      } else {
        showMessage('数据库插入失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 点击DELETE按钮处理流程
   * 对应设计书 3.1.2 DELETE按钮处理流程 和 4.2 UD16UpdateHdocAdcaChange
   *
   * 处理流程：
   * 1. 前置处理：获取输入的Serie-Chnr值
   * 2. 空值校验（前端校验）
   * 3. 拆分Serie-Chnr为SERIE和CHNR
   * 4. 调用API删除记录（更新ACT字段为"U"）
   * 5. 结果处理
   */
  const handleDelete = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedSerieChnr = serieChnr.trim();

    // 2. 空值校验（前端校验）
    // 对应设计书 3.2 校验详细规格表 No.6
    if (!trimmedSerieChnr) {
      showMessage('请输入Serie-Chnr');
      return; // 终止流程
    }

    // 3. 拆分Serie-Chnr
    const { serie, chnr } = splitSerieChnr(trimmedSerieChnr);

    // 4. API调用
    setIsLoading(true);
    showMessage('');

    try {
      // 对应设计书 4.2 UD16UpdateHdocAdcaChange
      // DELETE /api/ud16/deletechange
      const response = await apiClient.delete('/api/ud16/deletechange', {
        data: {
          serie,
          chnr,
        },
      });

      // 5. 结果处理
      if (response.data && response.data.code === 200) {
        // 删除成功
        showMessage('删除成功');
        setSerieChnr('');
        setDesc('');
      } else {
        // 对应设计书 3.2 校验详细规格表 No.8
        showMessage(response.data?.msg || '删除失败');
      }
    } catch (error: any) {
      // 异常处理
      console.error('删除AD Change失败:', error);

      if (error.response) {
        const statusCode = error.response.status;
        const errorMsg = error.response.data?.msg;

        // 对应设计书 3.2 校验详细规格表 No.7
        if (statusCode === 404) {
          showMessage('记录不存在');
        } else if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员');
        } else {
          showMessage(errorMsg || '删除失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置');
      } else {
        showMessage('数据库删除失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 点击CHECK按钮处理流程
   * 对应设计书 3.1.3 CHECK按钮处理流程 和 4.3 UD16SelectHdocAdcaChange
   *
   * 处理流程：
   * 1. 前置处理：获取输入的Serie-Chnr值
   * 2. 空值校验（前端校验）
   * 3. 拆分Serie-Chnr为SERIE和CHNR
   * 4. 调用API查询记录
   * 5. 结果处理：弹框显示查询结果
   */
  const handleCheck = async () => {
    // 1. 前置处理：获取输入值并去除首尾空格
    const trimmedSerieChnr = serieChnr.trim();

    // 2. 空值校验（前端校验）
    // 对应设计书 3.2 校验详细规格表 No.9
    if (!trimmedSerieChnr) {
      showMessage('请输入Serie-Chnr');
      return; // 终止流程
    }

    // 3. 拆分Serie-Chnr
    const { serie, chnr } = splitSerieChnr(trimmedSerieChnr);

    // 4. API调用
    setIsLoading(true);
    showMessage('');

    try {
      // 对应设计书 4.3 UD16SelectHdocAdcaChange
      // GET /api/ud16/checkchange
      const response = await apiClient.get('/api/ud16/checkchange', {
        params: {
          serie,
          chnr,
        },
      });

      // 5. 结果处理
      if (response.data && response.data.code === 200 && response.data.data) {
        if (response.data.data.exists) {
          // 记录存在
          window.alert('对应的数据存在');
        } else {
          // 对应设计书 3.2 校验详细规格表 No.10
          window.alert('记录不存在');
        }
      } else {
        window.alert('记录不存在');
      }
    } catch (error: any) {
      // 异常处理
      console.error('检查AD Change失败:', error);

      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode >= 500) {
          showMessage('服务器内部错误，请联系管理员');
        } else {
          showMessage(error.response.data?.msg || '查询失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        showMessage('网络连接失败，请检查网络设置');
      } else {
        showMessage('数据库查询失败，请联系管理员');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Serie-Chnr 输入变化
   * 限制：只允许半角英数字，最大长度15字符
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - 输入事件对象
   */
  const handleSerieChnrChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 半角英数字校验
    if (/^[a-zA-Z0-9]*$/.test(val) && val.length <= MAX_SERIE_CHNR_LENGTH) {
      setSerieChnr(val);
      // 用户重新输入时清空错误提示
      if (message) showMessage('');
    }
  };

  /**
   * 处理 Desc 输入变化
   * 限制：最大长度4000字符
   *
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - 输入事件对象
   */
  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_DESC_LENGTH) {
      setDesc(val);
      // 用户重新输入时清空错误提示
      if (message) showMessage('');
    }
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud16-container'>
      <div className='ud16-content'>
        {/* 页面标题 */}
        <h1 className='ud16-title'>AD Change</h1>

        {/* 错误消息显示区域 */}
        {/* 对应设计书 2.1 控件属性表 No.3 error message */}
        {message && (
          <div className='ud16-message'>
            {message}
          </div>
        )}

        {/* 输入区域 */}
        <div className='ud16-form-section'>
          {/* Serie-Chnr 输入框 */}
          {/* 对应设计书 2.1 控件属性表 No.1 Serie-Chnr */}
          <div className='ud16-form-group'>
            <label htmlFor='serieChnr'>
              Serie-Chnr
            </label>
            <input
              id='serieChnr'
              type='text'
              className='ud16-input'
              value={serieChnr}
              onChange={handleSerieChnrChange}
              placeholder='请输入Serie-Chnr'
              disabled={isLoading}
              maxLength={MAX_SERIE_CHNR_LENGTH}
            />
          </div>

          {/* Desc 输入框 */}
          {/* 对应设计书 2.1 控件属性表 No.2 Desc */}
          <div className='ud16-form-group ud16-form-group-desc'>
            <label htmlFor='desc'>
              Desc
            </label>
            <textarea
              id='desc'
              className='ud16-textarea'
              value={desc}
              onChange={handleDescChange}
              placeholder='请输入描述'
              disabled={isLoading}
              maxLength={MAX_DESC_LENGTH}
              rows={4}
            />
          </div>
        </div>

        {/* 加载状态提示 */}
        {isLoading && (
          <div className='ud16-loading'>加载中...</div>
        )}

        {/* 按钮区域 */}
        {/* 对应设计书 2.1 控件属性表 No.4 ADD, No.5 DELETE, No.6 CHECK */}
        <div className='ud16-button-section'>
          <button
            className='ud16-btn ud16-btn-add'
            onClick={handleAdd}
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : 'ADD'}
          </button>

          <button
            className='ud16-btn ud16-btn-delete'
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : 'DELETE'}
          </button>

          <button
            className='ud16-btn ud16-btn-check'
            onClick={handleCheck}
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : 'CHECK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UD16_ADChange;
