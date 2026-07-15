import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UD14_ListAvailableTemplates.css';
import apiClient from '../api/config';

/**
 * 文件信息接口
 */
interface FileInfo {
  filename: string;          // 文件名（可点击链接下载）
  isUsed: boolean;           // 是否已使用
  variable: string | null;   // VARIABLE值（已使用时显示）
  lastMod: string;           // 文件最后修改时间
  size: string;              // 文件大小
}

/**
 * Market选项接口
 */
interface MarketOption {
  value: string;
  label: string;
}

/**
 * UD14_ListAvailableTemplates - 模板列表展示页面组件
 *
 * @component
 * @returns {JSX.Element} 模板列表展示页面元素
 */
const UD14_ListAvailableTemplates: React.FC = () => {
  const navigate = useNavigate();

  // 未登录时重定向到登录页面
  useEffect(() => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ==================== 状态管理 ====================
  const [selectedMarket, setSelectedMarket] = useState<string>('');        // 当前选中的Market值
  const [marketOptions, setMarketOptions] = useState<MarketOption[]>([]);   // Market下拉列表选项
  const [fileList, setFileList] = useState<FileInfo[]>([]);                 // 文件列表数据（从market文件夹获取）
  const [message, setMessage] = useState<string>('');                      // 错误消息
  const [isLoading, setIsLoading] = useState<boolean>(false);              // 加载状态标识

  // ==================== 初始数据加载 ====================

  /**
   * 组件加载时获取Market列表
   */
  useEffect(() => {
    fetchMarketList();
  }, []);

  // ==================== API调用 ====================
  /**
   * 获取Market列表
   */
  const fetchMarketList = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/ud14/market');

      // 处理成功响应
      if (response.data && response.data.code === 200 && response.data.data) {
        // 将API返回的Market列表映射为下拉框选项
        const options: MarketOption[] = response.data.data.map((item: any) => ({
          value: item.market,
          label: item.market,
        }));
        setMarketOptions(options);
      } else {
        setMessage('获取Market列表失败');
      }
    } catch (error: any) {
      // 异常处理：网络连接失败或服务器内部错误
      if (error.response && error.response.status >= 500) {
        setMessage('服务器内部错误，请联系管理员');
      } else if (error.code === 'ECONNABORTED') {
        setMessage('网络连接失败，请检查网络设置');
      } else {
        setMessage('获取Market列表失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 获取指定Market文件夹下的文件列表
   */
  const fetchFileList = async (market: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/ud14/files', {
        params: { market },
      });

      // 处理成功响应
      if (response.data && response.data.code === 200) {
        const data = response.data.data || [];
        const files: FileInfo[] = data.map((item: any) => ({
          filename: item.filename || '',
          isUsed: item.isUsed || false,
          variable: item.variable || null,
          lastMod: item.lastMod || '',
          size: item.size || '',
        }));
        setFileList(files);
        setMessage('');
      } else {
        // 后端返回错误消息（如 code=404, msg="Market文件夹不存在"）
        setFileList([]);
        setMessage(response.data?.msg || '获取文件列表失败');
      }
    } catch (error: any) {
      // 异常处理（网络错误、超时等HTTP层面的异常）
      setFileList([]);
      if (error.code === 'ECONNABORTED') {
        setMessage('请求超时，请稍后重试');
      } else {
        setMessage('获取文件列表失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 下载指定的模板文件
   *
   * @param {string} filename - 要下载的文件名
   */
  const handleDownloadFile = async (filename: string) => {
    // 前置处理：验证Market和文件是否存在
    if (!selectedMarket) {
      setMessage('请先选择Market');
      return;
    }

    setIsLoading(true);
    try {
      // 调用文件下载API
      const response = await apiClient.get('/api/ud14/downfile', {
        params: {
          market: selectedMarket,
          filename,
        },
        responseType: 'blob', // 以二进制流形式接收文件内容
      });

      // 创建Blob对象并触发下载
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(''); // 清除旧消息
    } catch (error: any) {
      // 异常处理
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 404) {
          setMessage('文件不存在');
        } else {
          setMessage('文件下载失败');
        }
      } else if (error.code === 'ECONNABORTED') {
        setMessage('文件下载超时，请稍后重试');
      } else {
        setMessage('文件下载失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==================== 事件处理函数 ====================

  /**
   * 处理 SelectMarKet 下拉框选择变化
   *
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 选择事件对象
   */
  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const market = e.target.value;
    setSelectedMarket(market);

    // 空值校验：若未选择Market，DataTable保持为空
    if (!market) {
      setFileList([]);
      setMessage('');
      return;
    }

    // 清空旧消息并获取文件列表
    setMessage('');
    fetchFileList(market);
  };

  // ==================== 渲染 UI ====================
  return (
    <div className='ud14-container'>
      <div className='ud14-content'>
        {/* 页面标题 */}
        <h1 className='ud14-title'>List Templates</h1>

        {/* 错误消息显示区域 */}
        {message && (
          <div className='ud14-message ud14-message--error'>
            {message}
          </div>
        )}

        <div className='ud14-content-box'>
          {/* 查询条件区域 */}
          <div className='ud14-search-section'>
            {/* SelectMarKet 下拉框 */}
            <div className='ud14-form-group'>
              <label htmlFor='selectMarket'>
                Select Market:
              </label>
              <select
                id='selectMarket'
                className='ud14-select'
                value={selectedMarket}
                onChange={handleMarketChange}
                disabled={isLoading}
              >
                <option value=''></option>
                {marketOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 加载状态提示 */}
          {isLoading && (
            <div className='ud14-loading'>加载中...</div>
          )}

          {/* 数据表格 - 文件列表 */}
          <div className='ud14-table-wrapper'>
          <table className='ud14-table'>
            <thead>
              <tr>
                <th>Filename</th>
                <th>Used</th>
                <th>Last Mod,</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {fileList.length > 0 ? (
                fileList.map((file, index) => (
                  <tr key={`${file.filename}-${index}`}>
                    <td>
                      <span
                        className='ud14-file-link'
                        onClick={() => handleDownloadFile(file.filename)}
                        title='点击下载文件'
                      >
                        {file.filename}
                      </span>
                    </td>
                    <td>{file.variable || ''}</td>
                    <td>{file.lastMod}</td>
                    <td>{file.size}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className='ud14-empty-cell'>
                    {selectedMarket ? '暂无文件数据' : '请先选择Market'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
};

export default UD14_ListAvailableTemplates;
