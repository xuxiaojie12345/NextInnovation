import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UD12UploadDeletetemplate.css';

/**
 * Upload&Delete Template 组件 - 用于管理 HDoc（Help Document）模板文件
 *
 * 功能：支持将模板文件上传到 SVN 服务器的指定 Market 文件夹，以及从 SVN 服务器删除指定的模板文件
 *
 * @returns JSX.Element - Upload&Delete Template 页面组件
 */
function UD12UploadDeletetemplate() {
  const navigate = useNavigate();

  // 状态管理：根据内部设计文档的实现注意事项
  const [marketList, setMarketList] = useState<string[]>([]); // Market 列表
  const [uploadMarket, setUploadMarket] = useState<string>(''); // 上传区域选择的 Market
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 选择的文件
  const [deleteMarket, setDeleteMarket] = useState<string>(''); // 删除区域选择的 Market
  const [templateList, setTemplateList] = useState<string[]>([]); // 模板文件列表
  const [selectedTemplate, setSelectedTemplate] = useState<string>(''); // 选择的模板文件
  const [uploadLoading, setUploadLoading] = useState<boolean>(false); // 上传加载状态
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false); // 删除加载状态
  const [message, setMessage] = useState<{
    text: string;
    type: 'information' | 'warning' | 'error' | '';
  }>({ text: '', type: '' }); // 消息状态

  /**
   * 画面初期化表示流程
   * 根据内部设计文档 3.1.1：画面初期化时加载 Market 列表数据
   */
  useEffect(() => {
    loadMarkets();
  }, []);

  /**
   * 加载 Market 列表
   * 根据内部设计文档 4.1.1 getMarkets 接口调用
   */
  const loadMarkets = async () => {
    try {
      const response = await axios.get(
        '/admin/Upload&DeleteTemplate/getMarket'
      );
      if (response.data && response.data.code === 200) {
        const markets = response.data.data.map((item: any) => item.market);
        setMarketList(markets);
      } else {
        setMessage({
          text: 'Failed to load markets',
          type: 'error'
        });
      }
    } catch (error: any) {
      // 异常处理：根据内部设计文档 5. 异常处理
      if (error.response) {
        if (error.response.status === 401) {
          setMessage({
            text: 'faile',
            type: 'error'
          });
        } else if (error.response.status === 500) {
          setMessage({
            text: 'System error. Please contact administrator.',
            type: 'error'
          });
        }
      } else if (error.request) {
        setMessage({
          text: 'Network error. Please check your connection.',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'Failed to load markets',
          type: 'error'
        });
      }
    }
  };

  /**
   * Market 选择变化流程（Delete 区域）
   * 根据内部设计文档 3.1.4：根据选择的 Market 加载对应的模板文件列表
   */
  const handleDeleteMarketChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedMarket = e.target.value;
    setDeleteMarket(selectedMarket);

    // 清空 Templates 下拉列表和选中值
    setTemplateList([]);
    setSelectedTemplate('');

    if (selectedMarket) {
      await loadTemplates(selectedMarket);
    }
  };

  /**
   * 加载模板文件列表
   * 根据内部设计文档 4.1.3 getFileList 接口调用
   */
  const loadTemplates = async (market: string) => {
    try {
      const response = await axios.get(
        '/admin/Upload&DeleteTemplate/getFileList',
        {
          params: { Market: market }
        }
      );
      if (response.data && response.data.code === 200) {
        const templates = response.data.data.map((item: any) => item.File);
        setTemplateList(templates);
      } else {
        setMessage({
          text: 'Failed to load templates',
          type: 'error'
        });
      }
    } catch (error: any) {
      // 异常处理：根据内部设计文档 5. 异常处理
      if (error.response) {
        if (error.response.status === 401) {
          setMessage({
            text: 'faile',
            type: 'error'
          });
        } else if (error.response.status === 500) {
          setMessage({
            text: 'System error. Please contact administrator.',
            type: 'error'
          });
        }
      } else if (error.request) {
        setMessage({
          text: 'Network error. Please check your connection.',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'Failed to load templates',
          type: 'error'
        });
      }
    }
  };

  /**
   * 文件选择流程
   * 根据内部设计文档 3.1.2：选择要上传的文件
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  /**
   * 文件上传流程
   * 根据内部设计文档 3.1.3：处理文件上传逻辑
   */
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清空之前的消息
    setMessage({ text: '', type: '' });

    // 前置处理：获取选中的文件和 Market
    const fileToUpload = selectedFile;
    const marketToUpload = uploadMarket.trim();

    // 空值校验 (Frontend Check) - 根据内部设计文档 3.1.3
    // 若 `Template File` 未选择：
    if (!fileToUpload) {
      // 设置 `Message` = `NO FILE UPLOADED`（类型：Error）
      // **终止**流程，不调用 API
      setMessage({
        text: 'NO FILE UPLOADED',
        type: 'error'
      });
      return;
    }

    // 若 `Market` 未选择：
    if (!marketToUpload) {
      // 设置 `Message` = `Please select a market`（类型：Error）
      // **终止**流程，不调用 API
      setMessage({
        text: 'Please select a market',
        type: 'error'
      });
      return;
    }

    // 文件大小校验 (Frontend Check) - 根据内部设计文档 3.1.3
    // 若选中文件大小超过 10MB：
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (fileToUpload.size > maxSize) {
      // 设置 `Message` = `The file exceeds 10MB, please select again`（类型：Error）
      // **终止**流程，不调用 API
      setMessage({
        text: 'The file exceeds 10MB, please select again',
        type: 'error'
      });
      return;
    }

    // API 调用 (Backend Check) - 根据内部设计文档 3.1.3
    // 若校验通过，调用 `UD12UploadDeleteTemplateAPI.uploadFile(file, market)`
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('Template File', fileToUpload);
      formData.append('Market', marketToUpload);

      const response = await axios.post(
        '/admin/Upload&DeleteTemplate/uploadFile',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // 结果处理 - 根据内部设计文档 3.1.3
      if (response.data && response.data.code === 200) {
        // **上传成功**：设置 `Message` = `TEMPLATE XXX WAS SUCCESSFULLY UPLOADED TO MARKET JPN`（类型：Information），清空文件选择和入力内容
        setMessage({
          text: `TEMPLATE ${fileToUpload.name} WAS SUCCESSFULLY UPLOADED TO MARKET ${marketToUpload}`,
          type: 'information'
        });
        setSelectedFile(null); // 清空文件选择
        setUploadMarket(''); // 清空 Market 选择
      } else {
        // **上传失败**：设置 `Message` = `File upload faile`（类型：Error）
        setMessage({
          text: 'File upload faile',
          type: 'error'
        });
      }
    } catch (error: any) {
      // 异常处理：根据内部设计文档 5. 异常处理
      if (error.response) {
        if (error.response.status === 401) {
          setMessage({
            text: 'faile',
            type: 'error'
          });
        } else if (error.response.status === 500) {
          setMessage({
            text: 'System error. Please contact administrator.',
            type: 'error'
          });
        }
      } else if (error.request) {
        setMessage({
          text: 'Network error. Please check your connection.',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'File upload faile',
          type: 'error'
        });
      }
    } finally {
      setUploadLoading(false);
    }
  };

  /**
   * 文件删除流程
   * 根据内部设计文档 3.1.5：处理文件删除逻辑
   */
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清空之前的消息
    setMessage({ text: '', type: '' });

    // 前置处理：获取选中的 Market 和 Template
    const marketToDelete = deleteMarket.trim();
    const templateToDelete = selectedTemplate;

    // 空値校验 (Frontend Check) - 根据内部设计文档 3.1.5
    // 若 `Market` 未选择：
    if (!marketToDelete) {
      // 设置 `Message` = `Please select a market`（类型：Error）
      // **终止**流程，不调用 API
      setMessage({
        text: 'Please select a market',
        type: 'error'
      });
      return;
    }

    // 若 `Templates` 未选择：
    if (!templateToDelete) {
      // 设置 `Message` = `Please select a template file`（类型：Error）
      // **终止**流程，不调用 API
      setMessage({
        text: 'Please select a template file',
        type: 'error'
      });
      return;
    }

    // 确认对话框 - 根据内部设计文档 3.1.5
    // 显示 "Do you really want to delete template?"（类型：Warning）
    // 用户取消则**终止**流程
    if (!window.confirm('Do you really want to delete template?')) {
      return;
    }

    // API 调用 (Backend Check) - 根据内部设计文档 3.1.5
    // 若用户确认，调用 `UD12UploadDeleteTemplateAPI.deleteFile(filePath)`
    setDeleteLoading(true);

    try {
      const response = await axios.delete(
        '/admin/Upload&DeleteTemplate/deleteFile',
        {
          data: {
            'Template File': templateToDelete,
            Market: marketToDelete
          }
        }
      );

      // 结果处理 - 根据内部設計文档 3.1.5
      if (response.data && response.data.code === 200) {
        // **删除成功**：设置 `Message` = `TEMPLATE XXX WAS SUCCESSFULLY DELETE FROM MARKET JPN`（类型：Information），清空删除区域内容
        setMessage({
          text: `TEMPLATE ${templateToDelete} WAS SUCCESSFULLY DELETE FROM MARKET ${marketToDelete}`,
          type: 'information'
        });

        // 清空删除区域的入力内容
        setDeleteMarket('');
        setTemplateList([]);
        setSelectedTemplate('');
      } else {
        // **删除失败**：设置 `Message` = `File upload faile`（类型：Error）
        setMessage({
          text: 'File upload faile',
          type: 'error'
        });
      }
    } catch (error: any) {
      // 异常处理：根据内部設計文档 5. 异常处理
      if (error.response) {
        if (error.response.status === 401) {
          setMessage({
            text: 'faile',
            type: 'error'
          });
        } else if (error.response.status === 500) {
          setMessage({
            text: 'System error. Please contact administrator.',
            type: 'error'
          });
        }
      } else if (error.request) {
        setMessage({
          text: 'Network error. Please check your connection.',
          type: 'error'
        });
      } else {
        setMessage({
          text: 'File upload faile',
          type: 'error'
        });
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * 跳转模板检查页面流程
   * 根据内部設計文档 3.1.6：画面迁移到模板检查页面
   */
  const goToTemplateCheck = () => {
    // 画面迁移到 13_HDoc Template Check 画面
    navigate('/TemplateCheck'); // 假设路径为 /TemplateCheck
  };

  return (
    <div className='ud12-container'>
      {/* 大标题 - 深海军蓝，参照图片 */}
      <h1 className='page-title'>HDoc Template Upload</h1>

      {/* 消息显示区域 */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'information' && <span className='icon'>ℹ️</span>}
          {message.type === 'warning' && <span className='icon'>⚠️</span>}
          {message.type === 'error' && <span className='icon'>❌</span>}
          <span>{message.text}</span>
        </div>
      )}

      <div className='ud12-content'>
        {/* ========== HDoc Template Upload 区域 ========== */}
        <div className='upload-section'>
          <h2>HDoc Template Upload</h2>

          <form onSubmit={handleUpload}>
            {/* Template File 行 */}
            <div className='form-group'>
              <label htmlFor='templateFile'>Template File:</label>
              <div className='file-input-wrapper'>
                <button
                  type='button'
                  className='file-input-button'
                  disabled={uploadLoading}
                >
                  ファイルを選択
                  <input
                    id='templateFile'
                    type='file'
                    onChange={handleFileChange}
                    disabled={uploadLoading}
                  />
                </button>
                <span className='selected-file'>
                  {selectedFile ? selectedFile.name : '選択されていません'}
                </span>
              </div>
            </div>

            {/* Market 行 */}
            <div className='form-group'>
              <label htmlFor='uploadMarket'>Market:</label>
              <select
                id='uploadMarket'
                value={uploadMarket}
                onChange={(e) => setUploadMarket(e.target.value)}
                disabled={uploadLoading || marketList.length === 0}
              >
                <option value=''></option>
                {marketList.map((market) => (
                  <option key={`upload-${market}`} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </div>

            {/* 按钮行 - 浅蓝紫背景条 */}
            <div className='button-row'>
              <button
                type='submit'
                className='upload-button'
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <span className='loading-spinner'></span>Uploading...
                  </>
                ) : (
                  'Upload file'
                )}
              </button>
            </div>
          </form>
        </div>

        <div className='upload-note'>
          <p>
            Before uploading new VIN plate templates, inform
            support.tpi@volvo.com,
          </p>
          <p>to make sure that the connection to the cab factory will work.</p>
        </div>

        {/* ========== HDoc Template Delete/Archive 区域 ========== */}
        <div className='delete-section'>
          <h2>HDoc Template Delete/Archive</h2>

          <form onSubmit={handleDelete}>
            {/* Market 行 */}
            <div className='form-group'>
              <label htmlFor='deleteMarket'>Market:</label>
              <select
                id='deleteMarket'
                value={deleteMarket}
                onChange={handleDeleteMarketChange}
                disabled={deleteLoading || marketList.length === 0}
              >
                <option value=''></option>
                {marketList.map((market) => (
                  <option key={`delete-${market}`} value={market}>
                    {market}
                  </option>
                ))}
              </select>
            </div>

            {/* Templates 行 */}
            <div className='form-group'>
              <label htmlFor='templates'>Templates:</label>
              <select
                id='templates'
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={deleteLoading}
              >
                <option value=''></option>
                {templateList.map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
            </div>

            {/* 按钮行 - 浅蓝紫背景条 */}
            <div className='button-row'>
              <button
                type='submit'
                className='delete-button'
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className='loading-spinner'></span>Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Check Template 链接 - 左对齐 */}
      <div className='check-template-section'>
        <h2 className='check-template-title'>Check your rtf template</h2>
        <p>
          In case you have a rtf template you should run a check on it before
          uploading it.
        </p>
        <p>
          After check download the template to your desktop and then upload it
          to your template directory.
        </p>
        <p>Use the link below.</p>
        <div className='check-template-link'>
          <button
            type='button'
            onClick={goToTemplateCheck}
            className='link-button'
          >
            Check Template (Only for rtf files)
          </button>
        </div>
      </div>
    </div>
  );
}

export default UD12UploadDeletetemplate;
