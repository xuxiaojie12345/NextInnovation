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
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info');

  const showMessage = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => setMessage('');

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
      const [marketResponse, templatesResponse] = await Promise.all([
        axios.post('http://localhost:8081/api/ud12/selectmarket'),
        axios.post('http://localhost:8081/api/ud12/gettemplates')
      ]);
      
      if (marketResponse.data.code === 200) {
        const markets = marketResponse.data.data.map((item: any) => item.market || item);
        setMarketList(markets);
      }
      
      if (templatesResponse.data.code === 200) {
        const templateData = templatesResponse.data.data;
        const templates = templateData?.templateFiles || [];
        setAllTemplates(templates);
        setFilteredTemplates(templates);
      }
    } catch (error: any) {
      showMessage('获取初始数据失败', 'error');
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
    if (!templateFile) {
      showMessage('NO FILE UPLOADED', 'error');
      return;
    }
    
    if (!uploadMarket) {
      showMessage('MARKET是必须入力项目', 'error');
      return;
    }
    
    // 校验文件大小不超过10MB
    const maxSize = 10 * 1024 * 1024;
    if (templateFile.size > maxSize) {
      showMessage('文件大小上限10MB，请压缩文件后再上传', 'error');
      return;
    }
    
    clearMessage();
    
    try {
      const formData = new FormData();
      formData.append('templateFile', templateFile);
      formData.append('market', uploadMarket);
      
      const response = await axios.post('http://localhost:8081/api/ud12/uploadtemplate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.code === 200) {
        showMessage(`TEMPLATE ${templateFile.name} WAS SUCESSFULLY UPLOADED TO MARKET ${uploadMarket}`, 'success');
        await fetchInitialData();
        setTemplateFile(null);
        const fileInput = document.getElementById('template-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        showMessage(response.data.msg || '文档上传失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '文档上传失败', 'error');
    }
  };

  /**
   * Delete按钮点击处理 - 删除指定市场的模板文件
   * 对应设计书 3.3 Delete按钮押下 和 4.1.3 模板删除操作
   */
  const handleDeleteClick = async () => {
    if (!deleteMarket || !selectedTemplate) {
      showMessage('请选择要删除的模板', 'error');
      return;
    }
    
    const confirmed = window.confirm('Do you really want to delete template?');
    if (!confirmed) return;
    
    clearMessage();
    
    try {
      const response = await axios.post('http://localhost:8081/api/ud12/deletetemplate', {
        templateName: selectedTemplate,
        market: deleteMarket
      });
      
      if (response.data.code === 200) {
        showMessage(`TEMPLATE ${selectedTemplate} WAS SUCESSFULLY DELETE FROM MARKET ${deleteMarket}`, 'success');
        await fetchInitialData();
        setSelectedTemplate('');
      } else {
        showMessage(response.data.msg || '文档删除失败', 'error');
      }
    } catch (error: any) {
      showMessage(error.response?.data?.msg || '文档删除失败', 'error');
    }
  };

  /**
   * Archive按钮点击处理 - 归档模板文件
   * 注意：内部设计书中未明确Archive功能，此处预留接口
   */
  const handleCheckTemplateClick = () => {
    navigate('/HdocMenu/HdocTemplateCheck');
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
          </div>
          </div>
        </div>
        
        {/* 消息显示区域 */}
        {message && (
          <div className={`message-display message-${messageType}`}>
            {message}
          </div>
        )}
        
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
