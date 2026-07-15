import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/config";
import "./UD12_UploadDeleteTemplate.css";

/**
 * 上传删除模板页面组件
 * 
 * @component
 * @returns {JSX.Element} 上传删除模板页面元素
 */
const UD12_UploadDeleteTemplate: React.FC = () => {
  const navigate = useNavigate();

  // 未登录时重定向到登录页面
  useEffect(() => {
    const userID = localStorage.getItem('userID');
    if (!userID) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // ==================== 状态管理 ====================
  // 对应设计书 6.1 状态管理
  const [marketOptions, setMarketOptions] = useState<Array<{ market: string }>>([]); // Market下拉列表选项
  const [uploadMarket, setUploadMarket] = useState<string>("");   // Upload区域选中的Market
  const [deleteMarket, setDeleteMarket] = useState<string>("");   // Delete区域选中的Market
  const [templateOptions, setTemplateOptions] = useState<string[]>([]); // Templates下拉列表选项
  const [selectedTemplate, setSelectedTemplate] = useState<string>(""); // Delete区域选中的Template
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // 选择的文件
  const [message, setMessage] = useState<string>("");             // 消息文本
  const [messageType, setMessageType] = useState<"success" | "error" | "warning" | "">(""); // 消息级别
  const [isUploadLoading, setIsUploadLoading] = useState<boolean>(false); // Upload按钮加载状态
  const [isDeleteLoading, setIsDeleteLoading] = useState<boolean>(false); // Delete按钮加载状态
  const [isMarketLoading, setIsMarketLoading] = useState<boolean>(false); // Market下拉加载状态
  const [isTemplateLoading, setIsTemplateLoading] = useState<boolean>(false); // Templates下拉加载状态
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false); // 确认对话框显示状态

  // ==================== 常量定义 ====================
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // ==================== API调用函数 ====================
  /**
   * 获取 Market 下拉列表数据
   * 在组件加载时调用，填充 Upload 区域和 Delete 区域的 Market 下拉框
   */
  const fetchMarketList = useCallback(async () => {
    setIsMarketLoading(true);
    try {
      // 调用后端API获取Market列表
      // Method: GET, Endpoint: /api/ud12/selectmarket
      const response = await apiClient.get("/api/ud12/selectmarket");
      if (response.data.code === 200 && response.data.data) {
        setMarketOptions(response.data.data);
      }
    } catch (error) {
      // 对应设计书 5. 异常处理 - 网络连接失败
      setMessage("获取Market列表失败");
      setMessageType("error");
    } finally {
      setIsMarketLoading(false);
    }
  }, []);

  /**
   * 根据选中的 Market 获取 Templates 列表
   * 当 Delete 区域的 Market 改变时，动态加载对应文件夹下的模板文件名
   */
  const fetchTemplateList = useCallback(async (market: string) => {
    if (!market) {
      setTemplateOptions([]);
      setSelectedTemplate("");
      return;
    }
    setIsTemplateLoading(true);
    try {
      // 根据Market获取模板文件列表
      // 通过检索API获取文件列表信息
      const response = await apiClient.get("/api/ud12/template/list", {
        params: { market }
      });
      if (response.data.code === 200 && response.data.data) {
        setTemplateOptions(response.data.data);
      } else {
        setTemplateOptions([]);
      }
    } catch (error) {
      setMessage("获取模板列表失败");
      setMessageType("error");
      setTemplateOptions([]);
    } finally {
      setIsTemplateLoading(false);
    }
  }, []);

  // ==================== 生命周期 ====================

  /**
   * 组件加载时初始化数据
   */
  useEffect(() => {
    fetchMarketList();
  }, [fetchMarketList]);

  // ==================== 事件处理函数 ====================

  /**
   * 处理 Upload 区域 Market 下拉框变更
   * 
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 变更事件对象
   */
  const handleUploadMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUploadMarket(e.target.value);
    // 用户操作时清空旧消息
    clearMessage();
  };

  /**
   * 处理 Delete 区域 Market 下拉框变更， Delete区域的Templates下拉框联动加载
   * 
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 变更事件对象
   */
  const handleDeleteMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const market = e.target.value;
    setDeleteMarket(market);
    setSelectedTemplate("");
    // 联动加载对应Market的模板文件列表
    fetchTemplateList(market);
    clearMessage();
  };

  /**
   * 处理 Delete 区域 Templates 下拉框变更
   * 
   * @param {React.ChangeEvent<HTMLSelectElement>} e - 变更事件对象
   */
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTemplate(e.target.value);
    clearMessage();
  };

  /**
   * 处理文件选择
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - 文件选择事件对象
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 校验文件大小
      if (file.size > MAX_FILE_SIZE) {
        setMessage("The file exceeds 10MB, please select again");
        setMessageType("error");
        setSelectedFile(null);
        e.target.value = "";
        return;
      }

      setSelectedFile(file);
      clearMessage();
    } else {
      setSelectedFile(null);
    }
  };

  /**
   * 清空消息
   */
  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  /**
   * 点击 Upload file 按钮触发上传流程
   */
  const handleUploadFile = async () => {
    // 1. 前置处理：获取选中的文件和Market值
    // 2. 空值校验（前端校验）
    if (!selectedFile) {
      setMessage("NO FILE UPLOADED");
      setMessageType("error");
      return;
    }

    if (!uploadMarket) {
      setMessage("Please select a market");
      setMessageType("error");
      return;
    }

    // 3. API调用（后端校验）
    setIsUploadLoading(true);
    clearMessage();
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("market", uploadMarket);

      // 调用文件上传API
      // Method: POST, Endpoint: /api/ud12/uploadflie
      const response = await apiClient.post("/api/ud12/uploadflie", formData);
      if (response.data.code === 200) {
        // 4. 结果处理 - 成功
        const msg = response.data.msg || `TEMPLATE ${selectedFile.name} WAS SUCESSFULLY UPLOADED TO MARKET ${uploadMarket}`;
        setMessage(msg);
        setMessageType("success");
        // 清空文件选择框和Market选择
        setSelectedFile(null);
        setUploadMarket("");
        const fileInput = document.getElementById("templateFileInput") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        // 上传失败
        setMessage(response.data.msg || "文件上传失败");
        setMessageType("error");
      }
    } catch (error: any) {
      // 异常处理
      if (error.response) {
        const status = error.response.status;
        if (status === 400) {
          setMessage(error.response.data?.msg || "NO FILE UPLOADED");
        } else {
          setMessage("文件上传失败");
        }
      } else {
        setMessage("网络连接失败，请检查网络设置");
      }
      setMessageType("error");
    } finally {
      setIsUploadLoading(false);
    }
  };

  /**
   * 点击 Delete 按钮触发删除流程
   */
  const handleDeleteTemplate = () => {
    // 1. 前置处理：获取选中的Market和Template值

    // 2. 空值校验（前端校验）
    // 对应设计书 3.2 校验详细规格表 No.4
    if (!deleteMarket) {
      setMessage("请选择Market");
      setMessageType("error");
      return;
    }

    // 对应设计书 3.2 校验详细规格表 No.5
    if (!selectedTemplate) {
      setMessage("请选择要删除的模板");
      setMessageType("error");
      return;
    }

    // 3. 显示确认对话框
    // 对应设计书 3.2 校验详细规格表 No.6
    setShowConfirmModal(true);
  };

  /**
   * 确认删除操作
   * 用户点击确认对话框的确认按钮后执行
   */
  const confirmDelete = async () => {
    setShowConfirmModal(false);
    setIsDeleteLoading(true);
    clearMessage();

    try {
      // 调用文件删除API
      // 对应设计书 4.3 UD12DeleteFlie - 文件删除
      // Method: DELETE, Endpoint: /api/ud12/deleteflie
      // 后端使用@DeleteMapping且参数为@RequestParam，需以params形式传递
      const response = await apiClient.delete("/api/ud12/deleteflie", {
        params: {
          market: deleteMarket,
          template: selectedTemplate,
        },
      });

      if (response.data.code === 200) {
        // 对应设计书 3.2 校验详细规格表 No.7
        const msg = response.data.msg || `TEMPLATE ${selectedTemplate} WAS SUCESSFULLY DELETE FROM MARKET ${deleteMarket}`;
        setMessage(msg);
        setMessageType("success");
        // 刷新Templates下拉框和Market下拉框
        setDeleteMarket("");
        setSelectedTemplate("");
        fetchTemplateList(deleteMarket);
      } else {
        setMessage(response.data.msg || "文件删除失败");
        setMessageType("error");
      }
    } catch (error: any) {
      // 对应设计书 5. 异常处理
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          setMessage("文件不存在");
        } else {
          setMessage("文件删除失败");
        }
      } else {
        setMessage("网络连接失败，请检查网络设置");
      }
      setMessageType("error");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  /**
   * 取消删除操作
   */
  const cancelDelete = () => {
    setShowConfirmModal(false);
  };

  /**
   * 点击 Check Template 链接跳转到模板检查画面
   * 对应设计书 3.1.4 Check Template Link 点击流程
   */
  const handleCheckTemplateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 画面迁移：跳转到 HDoc Template Check 画面（UD13）
    navigate("/UD13");
  };

  return (
    <div className="ud12-container">
      {/* ==================== 页面标题 ==================== */}

    
      <div className="ud12-content-wrapper">
        {/* ==================== 左侧：Upload区域 ==================== */}
        <div className="ud12-upload-section">
          <div className="ud12-section-header">
            <h2 className="ud12-section-title">HDoc Template Upload</h2>
          </div>

      {/* ==================== 消息显示区域 ==================== */}
      {message && (
        <div className={`ud12-message ud12-message-${messageType}`}>
          {message}
        </div>
      )}

          <div className="ud12-form-body">
            {/* 文件选择 */}
            <div className="ud12-form-group">
              <label className="ud12-label">Template File</label>
              <div className="ud12-blue-border-box">
                <input id="templateFileInput" type="file" className="ud12-file-input"
                  onChange={handleFileChange}
                  disabled={isUploadLoading}
                />
              </div>
            </div>

            {/* Market下拉框 */}
            <div className="ud12-form-group">
              <label className="ud12-label">Market</label>
              <div className="ud12-blue-border-box">
                <select className="ud12-select" value={uploadMarket}
                  onChange={handleUploadMarketChange}
                  disabled={isUploadLoading || isMarketLoading}
                >
                  <option value=""></option>
                  {marketOptions.map((item, index) => (
                    <option key={index} value={item.market}>
                      {item.market}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* 上传按钮（表单外部） */}
          <div className="ud12-btn-outer">
            <div className="ud12-blue-border-box ud12-btn-box">
              <button className="ud12-btn ud12-btn-upload" onClick={handleUploadFile} disabled={isUploadLoading} >
                {isUploadLoading ? "Uploading..." : "Upload file"}
              </button>
            </div>
          </div>

          {/* 底部提示文字 */}
          <div className="ud12-footnote">
            Before uploading new VIN plate templates, inform support.tpi@volvo.com, to make sure that the connection to the cab factory will work.
          </div>
        </div>

        {/* ==================== 右侧：Delete区域 ==================== */}
        <div className="ud12-delete-section">
          <div className="ud12-section-header">
            <h2 className="ud12-section-title">Hdoc Template Delete/Archive</h2>
          </div>

          <div className="ud12-form-body">
            {/* Market下拉框 */}
            <div className="ud12-form-group">
              <label className="ud12-label">Market</label>
              <div className="ud12-blue-border-box">
                <select className="ud12-select" value={deleteMarket}
                  onChange={handleDeleteMarketChange}
                  disabled={isDeleteLoading || isMarketLoading}
                >
                  <option value=""></option>
                  {marketOptions.map((item, index) => (
                    <option key={index} value={item.market}>
                      {item.market}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Templates下拉框 */}
            <div className="ud12-form-group">
              <label className="ud12-label">Templates</label>
              <div className="ud12-blue-border-box">
                <select className="ud12-select" value={selectedTemplate}
                  onChange={handleTemplateChange}
                  disabled={isDeleteLoading || isTemplateLoading || templateOptions.length === 0}
                >
                  <option value=""></option>
                  {templateOptions.map((template, index) => (
                    <option key={index} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </div>
              {isTemplateLoading && (
                <span className="ud12-loading-hint">Loading...</span>
              )}
            </div>

          </div>

          {/* 删除按钮（表单外部） */}
          <div className="ud12-btn-outer">
            <div className="ud12-blue-border-box ud12-btn-box">
              <button className="ud12-btn ud12-btn-delete"
                onClick={handleDeleteTemplate}
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>

             {/* ==================== Check Template 底部区域 ==================== */}
            <div className="ud12-check-section">
                <h2 className="ud12-check-heading">Check your rtf template</h2>
                <p className="ud12-check-description">
                If you want to verify that your template can be processed, you can run a check before uploading/downloading it as "HDoc template".
                </p>
                <a
                href="#!"
                className="ud12-check-link"
                onClick={handleCheckTemplateClick}
                >
                Check Template
                </a>
            </div>

          </div>
        </div>

      {/* ==================== 确认删除对话框 ==================== */}
      {showConfirmModal && (
        <div className="ud12-modal-overlay">
          <div className="ud12-modal">
            <div className="ud12-modal-header">
              <h3>确认删除</h3>
            </div>
            <div className="ud12-modal-body">
              <p>Do you really want to delete template?</p>
              <p className="ud12-modal-file-info">
                Market: {deleteMarket} / Template: {selectedTemplate}
              </p>
            </div>
            <div className="ud12-modal-footer">
              <button className="ud12-btn ud12-btn-cancel" onClick={cancelDelete} >
                Cancel
              </button>
              <button className="ud12-btn ud12-btn-confirm" onClick={confirmDelete} >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UD12_UploadDeleteTemplate;
