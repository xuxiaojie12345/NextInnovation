import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UploadDeleteTemplate.css';

/**
 * UploadDeleteTemplate组件 - 模板管理页面
 * 
 * @description 支持模板的上传、删除和归档功能，以及RTF模板格式预检查
 * @props 无Props
 */
const UploadDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadMarket, setUploadMarket] = useState<string>('');
  const [deleteMarket, setDeleteMarket] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<any[]>([]);
  const [marketList, setMarketList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 画面初期表示 - 调用API获取Market下拉列表数据和Templates模板列表数据
   * 对应设计书 3.1 画面初期 和 4.1.1 画面初期表示
   */
  useEffect(() => {
    fetchInitialData();
  }, []);

  /**
   * 监听deleteMarket变化，动态过滤Templates下拉列表
   * 对应设计书 4.1.4 Market下拉列表变化监听
   */
  useEffect(() => {
    if (!deleteMarket) {
      // 选中空白，显示全部模板
      setFilteredTemplates(allTemplates);
    } else {
      // 选中有效值，用该参数过滤本地全量数据
      const filtered = allTemplates.filter(
        (template) => template.market === deleteMarket
      );
      setFilteredTemplates(filtered);
    }
  }, [deleteMarket, allTemplates]);

  /**
   * 调用UD08SelectMarketmasterApi和UD12GetTemplatesApi获取初始数据
   * 对应设计书 5.1 UD08SelectMarketmasterApi 和 5.2 UD12GetTemplatesApi
   */
  const fetchInitialData = async () => {
    setIsLoading(true);
    
    try {
      // 并行调用两个API
      const [marketResponse, templatesResponse] = await Promise.all([
        // API请求 - 获取Market下拉列表数据
        axios.post('/api/UD08/select-marketmaster'),
        
        // API请求 - 获取所有模板列表数据
        axios.post('/api/UD12/get-templates')
      ]);
      
      if (marketResponse.data.success) {
        const markets = marketResponse.data.data.map((item: any) => item.market || item);
        setMarketList(markets);
      }
      
      if (templatesResponse.data.success) {
        const templates = templatesResponse.data.data.templateFiles || [];
        setAllTemplates(templates);
        setFilteredTemplates(templates);
      }
    } catch (error: any) {
      console.error('获取初始数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理文件选择
   * 
   * @param e 文件选择事件
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setTemplateFile(file);
  };

  /**
   * Upload file按钮点击处理 - 上传模板文件到指定市场
   * 对应设计书 3.2 Upload file按钮押下 和 4.1.2 模板上传操作
   */
  const handleUploadClick = async () => {
    // 校验1：Template File未选择文件 (对应设计书 4.2 校验详细规格表 No.1)
    if (!templateFile) {
      alert('NO FILE UPLOADED');
      return;
    }
    
    // 校验2：Market未选择
    if (!uploadMarket) {
      alert('请选择目标市场');
      return;
    }
    
    try {
      // 使用FormData封装文件和参数
      const formData = new FormData();
      formData.append('templateFile', templateFile);
      formData.append('market', uploadMarket);
      
      // API请求 - 上传模板文件 (对应设计书 5.3 UD12UploadTemplateApi)
      const response = await axios.post('/api/UD12/upload-template', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // 弹出Information提示 (对应设计书 4.1.2 执行上传)
        alert(`TEMPLATE ${templateFile.name} WAS SUCESSFULLY UPLOADED TO MARKET ${uploadMarket}`);
        
        // 刷新Templates下拉列表
        await fetchInitialData();
        
        // 清空文件选择
        setTemplateFile(null);
        const fileInput = document.getElementById('template-file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        alert(response.data.message || '文档上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      alert(error.response?.data?.message || '文档上传失败');
    }
  };

  /**
   * Delete按钮点击处理 - 删除指定市场的模板文件
   * 对应设计书 3.3 Delete按钮押下 和 4.1.3 模板删除操作
   */
  const handleDeleteClick = async () => {
    // 校验1：Market或Templates未选择 (对应设计书 4.2 校验详细规格表 No.3)
    if (!deleteMarket || !selectedTemplate) {
      alert('请选择要删除的模板');
      return;
    }
    
    // 确认对话框 (对应设计书 4.1.3 确认对话框)
    const confirmed = window.confirm('Do you really want to delete template?');
    if (!confirmed) {
      return;
    }
    
    try {
      // API请求 - 删除模板文件 (对应设计书 5.4 UD12DeleteTemplateApi)
      const response = await axios.delete('/api/UD12/delete-template', {
        data: {
          templateName: selectedTemplate,
          market: deleteMarket
        }
      });
      
      if (response.data.success) {
        // 弹出Information提示 (对应设计书 4.1.3 执行删除)
        alert(`TEMPLATE ${selectedTemplate} WAS SUCESSFULLY DELETE FROM MARKET ${deleteMarket}`);
        
        // 刷新Templates下拉列表
        await fetchInitialData();
        
        // 清空选中项
        setSelectedTemplate('');
      } else {
        alert(response.data.message || '文档删除失败');
      }
    } catch (error: any) {
      console.error('删除失败:', error);
      alert(error.response?.data?.message || '文档删除失败');
    }
  };

  /**
   * Archive按钮点击处理 - 归档模板文件
   * 注意：内部设计书中未明确Archive功能，此处预留接口
   */
  const handleArchiveClick = () => {
    alert('Archive功能暂未实现');
  };

  /**
   * Check Template链接点击处理 - 跳转到HdocTemplateCheck画面进行模板校验
   * 对应设计书 3.4 Check Template链接押下
   */
  const handleCheckTemplateClick = () => {
    navigate('/HdocTemplateCheck');
  };

  return (
    <div className='udt-container'>
      <div className='udt-content'>
        {/* HDoc Template Upload区域 */}
        <div className='udt-section'>
          <h2 className='udt-section-title'>HDoc Template Upload</h2>
          <div className='udt-section-solid'> 
          
          <div className='udt-form-group'>
            <label className='udt-label'>Template File:</label>
            <input 
              type='file' 
              id='template-file-input'
              className='udt-file-input' 
              onChange={handleFileChange}
              accept='.rtf,.txt'
            />
            {/* <span className='udt-file-status'>
              {templateFile ? 'ファイルを選択' : '選択されていません'}
            </span> */}
          </div>
          
          <div className='udt-form-group'>
            <label className='udt-label'>Market:</label>
            <select 
              className='udt-select short' 
              value={uploadMarket} 
              onChange={(e) => setUploadMarket(e.target.value)}
            >
              <option value=""></option>
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
          </div>
          <div className='line'/> 
          
          <div className='udt-button-row'>
            <button className='udt-action-button' onClick={handleUploadClick}>Upload file</button>
          </div>
          </div>
        </div>
        
        {/* 提示信息 */}
        <p className='udt-info-text'>
          Before uploading new VIN plate templates, inform support.tpi@volvo.com, <br />to make sure that the connection to the cab factory will work.
        </p>
        
        {/* HDoc Template Delete/Archive区域 */}
        <div className='udt-section'>
          <h2 className='udt-section-title'>HDoc Template Delete/Archive</h2>
          <div className='udt-section-solid'> 
          
          <div className='udt-form-group'>
            <label className='udt-label'>Market:</label>
            <select 
              className='udt-select short' 
              value={deleteMarket} 
              onChange={(e) => setDeleteMarket(e.target.value)}
            >
              <option value=""></option>
              {marketList.map((market, index) => (
                <option key={index} value={market}>{market}</option>
              ))}
            </select>
          </div>
          
          <div className='udt-form-group'>
            <label className='udt-label'>Templates:</label>
            <select 
              className='udt-select medium' 
              value={selectedTemplate} 
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value=""></option>
              {filteredTemplates.map((template, index) => (
                <option key={index} value={template.fileName}>{template.fileName}</option>
              ))}
            </select>
          </div>
           <div className='line'/> 

          <div className='udt-button-row'>
            <button className='udt-action-button' onClick={handleDeleteClick}>Delete</button>
            <button className='udt-action-button' onClick={handleArchiveClick}>Archive</button>
          </div>
          </div>
        </div>
        
        {/* Check your rtf template区域 */}
        <div className='udt-check-section'>
          <h3 className='udt-check-title'>Check your rtf template</h3>
          
          <p className='udt-check-description'>
            In case you have a rtf template you should run a check on it before uploading it.<br />
            After check download the template to your desktop and then upload it to your template directory.<br />
            Use the link bellow.
          </p>
          
          <a 
            href='/HdocTemplateCheck' 
            className='udt-check-link'
            onClick={(e) => {
              e.preventDefault();
              handleCheckTemplateClick();
            }}
          >
            Check Template (Only for rtf files)
          </a>
        </div>
      </div>
    </div>
  );
};

export default UploadDeleteTemplate;
