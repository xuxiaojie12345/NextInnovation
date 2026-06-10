import React, { useState, useEffect } from 'react';
import { templateApi } from '../api/index';
import './UploadDeleteTemplate.css';

// 定義组件のProps类型
interface UploadDeleteTemplateProps {}

// 定義模板ファイル类型
interface TemplateFile {
  name: string;
  size: number;
  type: string;
}

/**
 * 上传删除模板组件
 * 根据詳細設計ドキュメント[Upload&Delete template]実装
 * 提供模板ファイルのアップロード、削除和归档操作機能
 */
const UploadDeleteTemplate: React.FC<UploadDeleteTemplateProps> = () => {
  // 状態管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 选择のテンプレートファイル
  const [uploadMarket, setUploadMarket] = useState<string>(''); // Upload区域选择の市場
  const [deleteMarket, setDeleteMarket] = useState<string>(''); // Delete区域选择の市場
  const [selectedTemplate, setSelectedTemplate] = useState<string>(''); // 选择のテンプレート
  const [markets, setMarkets] = useState<string[]>([]); // 市場リスト
  const [templates, setTemplates] = useState<string[]>([]); // 模板リスト
  const [message, setMessage] = useState<string>(''); // 消息显示
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info'); // 消息类型
  const [uploadLoading, setUploadLoading] = useState<boolean>(false); // Upload加载状态
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false); // Delete加载状态
  const [templateLoading, setTemplateLoading] = useState<boolean>(false); // Templates获取加载状态
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false); // 確認对话框显示状态

  // 初始化时获取市场リスト
  useEffect(() => {
    fetchMarkets();
  }, []);

  // 当Delete区域的Market选择变化時、获取对应的模板リスト（仅Delete区域联动）
  useEffect(() => {
    if (deleteMarket) {
      fetchTemplatesByMarket(deleteMarket);
    } else {
      setTemplates([]);
      setSelectedTemplate('');
    }
  }, [deleteMarket]);

  /**
   * 获取市场リスト
   * 調用UD12SelectMarket方法获取MARKETの返回値
   */
  const fetchMarkets = async () => {
    try {
      setTemplateLoading(true);
      const response = await templateApi.getMarkets();
      
      if (response.success && response.data) {
        // 后端返回的数据结构は { markets: string[], count: number }
        // 需要提取 markets 数组
        const marketData = response.data as any;
        const marketList = marketData.markets || marketData;
        
        if (Array.isArray(marketList)) {
          setMarkets(marketList);
          setMessage(response.message || '市場リスト取得成功');
          setMessageType('success');
        } else {
          setMessage('市場データ形式が正しくありません');
          setMessageType('error');
        }
      } else {
        setMessage(response.message || '市場リスト取得失敗');
        setMessageType('error');
      }
    } catch (error) {
      console.error('市場リスト取得時にエラーが発生しました:', error);
      setMessage('市場リスト取得時にエラーが発生しました');
      setMessageType('error');
    } finally {
      setTemplateLoading(false);
    }
  };

  /**
   * 根据市场获取模板列表
   * 通过API获取特定市場のテンプレートリスト
   */
  const fetchTemplatesByMarket = async (market: string) => {
    try {
      setTemplateLoading(true);
      
      // 调用后端API获取指定Market下的模板リスト
      const response = await templateApi.getTemplates(market);
      
      if (response.success && response.data) {
        const templateData = response.data as any;
        const templateList = templateData.templates || [];
        
        if (Array.isArray(templateList)) {
          setTemplates(templateList);
          setMessage(`市場${market}のテンプレートリスト取得成功`);
          setMessageType('success');
        } else {
          setTemplates([]);
          setMessage('テンプレートデータ形式が正しくありません');
          setMessageType('error');
        }
      } else {
        setTemplates([]);
        setMessage(response.message || 'テンプレートリスト取得失敗');
        setMessageType('error');
      }
    } catch (error) {
      console.error(`市場${market}のテンプレートリスト取得時にエラーが発生しました:`, error);
      setTemplates([]);
      setMessage(`市場${market}のテンプレートリスト取得時にエラーが発生しました`);
      setMessageType('error');
    } finally {
      setTemplateLoading(false);
    }
  };

  /**
   * 处理文件选择事件
   * 根据機能说明4.1-4.3実装ファイル選択機能
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setMessage(`ファイルが選択されました: ${file.name}`);
      setMessageType('info');
    }
  };

  /**
   * 处理Upload区域Market选择变化（不触发联动）
   */
  const handleUploadMarketChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadMarket(event.target.value);
  };

  /**
   * 处理Delete区域Market选择变化（触发Templates联动）
   */
  const handleDeleteMarketChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDeleteMarket(event.target.value);
    setSelectedTemplate(''); // テンプレート選択をリセット
  };

  /**
   * 处理テンプレート選択変化
   * 根据機能说明4.2実装テンプレート選択機能
   */
  const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(event.target.value);
  };

  /**
   * 上传ファイルボタンクリック処理
   * 根据機能说明4.3実装アップロード機能
   */
  const handleUploadClick = async () => {
    // 前置処理：Template File，Marketの値を取得
    // 空値チェック等 (Frontend Check)
    if (!selectedFile) {
      // Template Fileが空の場合：Message = "NO FILE UPLOADED"
      setMessage('NO FILE UPLOADED');
      setMessageType('error');
      return; // フローを終了し、APIを呼び出さない
    }
    
    if (!uploadMarket) {
      // Marketが空の場合：Message = "市場を選択してください"
      setMessage('市場を選択してください');
      setMessageType('error');
      return; // フローを終了し、APIを呼び出さない
    }

    // API呼び出し (Backend Check)：チェックが通ったら、UD12UploadDeleteTemplateApi(Template File, Market)を呼び出す
    try {
      setUploadLoading(true);
      const response = await templateApi.uploadTemplate(selectedFile, uploadMarket);
      
      if (response.success) {
        // 成功：Message = "TEMPLATE XXX WAS SUCESSFULLY UPLOADED TO MARKET JPN"
        setMessage(`TEMPLATE ${selectedFile.name} WAS SUCCESSFULLY UPLOADED TO MARKET ${uploadMarket}`);
        setMessageType('success');
        // 選択されたファイルをクリア
        setSelectedFile(null);
        // If Upload and Delete区域のMarket相同，刷新Templatesリスト
        if (deleteMarket === uploadMarket) {
          fetchTemplatesByMarket(uploadMarket);
        }
      } else {
        // 失敗：該当するエラーメッセージを表示
        setMessage(response.message || 'アップロード失敗');
        setMessageType('error');
      }
    } catch (error) {
      console.error('テンプレートアップロード時にエラーが発生しました:', error);
      setMessage('アップロードに失敗しました。もう一度お試しください。');
      setMessageType('error');
    } finally {
      setUploadLoading(false);
    }
  };

  /**
   * 削除ボタンクリック処理
   * 根据機能说明4.4実装削除機能
   */
  const handleDeleteClick = () => {
    // 前置処理：Market，Templatesの値を取得
    // 空値チェック(Frontend Check)
    if (!deleteMarket) {
      // Marketが空の場合：Message = "市場を選択してください"
      setMessage('市場を選択してください');
      setMessageType('error');
      return; // フローを終了し、APIを呼び出さない
    }
    
    if (!selectedTemplate) {
      // Templatesが空の場合：Message = "NO FILE DELETE"
      setMessage('NO FILE DELETE');
      setMessageType('error');
      return; // フローを終了し、APIを呼び出さない
    }

    // 確認ダイアログ：dialog表示、文字表示"【Do you really want to delete template?】"
    setShowConfirmDialog(true);
  };

  /**
   * 削除操作を確認
   * 確認ダイアログで削除ボタンをクリックしたときに呼び出されます
   */
  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      setShowConfirmDialog(false);
      
      // UD12UploadDeleteTemplateApi(Market, Templates)を呼び出す
      const response = await templateApi.deleteTemplate(deleteMarket, selectedTemplate);
      
      if (response.success) {
        // 成功：Message = "TEMPLATE XXX WAS SUCESSFULLY DELETE FROM MARKET JPN"
        setMessage(`TEMPLATE ${selectedTemplate} WAS SUCCESSFULLY DELETED FROM MARKET ${deleteMarket}`);
        setMessageType('success');
        // テンプレート選択をクリアし、テンプレートリストを再取得
        setSelectedTemplate('');
        fetchTemplatesByMarket(deleteMarket);
      } else {
        // 失敗：該当するエラーメッセージを表示
        setMessage(response.message || '削除失敗');
        setMessageType('error');
      }
    } catch (error) {
      console.error('テンプレート削除時にエラーが発生しました:', error);
      setMessage('削除に失敗しました。もう一度お試しください。');
      setMessageType('error');
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * 削除操作をキャンセル
   * 確認ダイアログでキャンセルボタンをクリックしたときに呼び出されます
   */
  const cancelDelete = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="upload-delete-template-container">
      {/* メッセージ表示エリア */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}
      
      {/* HDoc Template Uploadセクション */}
      <div className="section upload-section">
        <h2>HDoc Template Upload</h2>
        
        <div className="form-box">
          <div className="form-row">
            <label className="form-label">Template File:</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="templateFile"
                onChange={handleFileChange}
                className="file-input"
              />
              <button 
                type="button" 
                className="file-select-btn"
                onClick={() => document.getElementById('templateFile')?.click()}
              >
                ファイルを選択
              </button>
              <span className="file-status">
                {selectedFile ? selectedFile.name : '選択されていません'}
              </span>
            </div>
          </div>
          
          <div className="form-row">
            <label className="form-label">Market:</label>
            <select
              value={uploadMarket}
              onChange={handleUploadMarketChange}
              className="select-input market-select"
            >
              <option value="">選択してください</option>
              {markets.map((market) => (
                <option key={`upload-${market}`} value={market}>
                  {market}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="button-row">
          <button
            onClick={handleUploadClick}
            disabled={uploadLoading || !selectedFile || !uploadMarket}
            className="btn btn-upload"
          >
            {uploadLoading ? 'アップロード中...' : 'Upload file'}
          </button>
        </div>
        
        <p className="info-text">
          Before uploading new VIN plate templates, inform support.tpi@volvo.com,<br/>
          to make sure that the connection to the cab factory will work.
        </p>
      </div>
      
      {/* HDoc Template Delete/Archiveセクション */}
      <div className="section delete-section">
        <h2>HDoc Template Delete/Archive</h2>
        
        <div className="form-box">
          <div className="form-row">
            <label className="form-label">Market:</label>
            <select
              value={deleteMarket}
              onChange={handleDeleteMarketChange}
              className="select-input market-select"
            >
              <option value="">選択してください</option>
              {markets.map((market) => (
                <option key={`delete-${market}`} value={market}>
                  {market}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <label className="form-label">Templates:</label>
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="select-input templates-select"
              disabled={!deleteMarket}
            >
              <option value="">選択してください</option>
              {templates.map((template) => (
                <option key={template} value={template}>
                  {template}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="button-row">
          <button
            onClick={handleDeleteClick}
            disabled={deleteLoading || templateLoading || !deleteMarket || !selectedTemplate}
            className="btn btn-delete"
          >
            Delete
          </button>
        </div>
      </div>
      
      {/* Check your rtf templateセクション */}
      <div className="section check-section">
        <h3 className="check-title">Check your rtf template</h3>
        <p className="check-text">
          In case you have a rtf template you should run a check on it before uploading it.<br/>
          After check download the template to your desktop and then upload it to your template directory.<br/>
          Use the link bellow.
        </p>
        <a href="#" className="check-link">
          Check Template (Only for rtf files)
        </a>
      </div>
      
      {/* 確認ダイアログ */}
      {showConfirmDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <p>【Do you really want to delete template?】</p>
            <div className="dialog-buttons">
              <button onClick={confirmDelete} className="btn btn-danger">
                削除
              </button>
              <button onClick={cancelDelete} className="btn btn-secondary">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadDeleteTemplate;