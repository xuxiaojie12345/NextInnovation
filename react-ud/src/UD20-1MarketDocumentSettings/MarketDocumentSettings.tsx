import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./MarketDocumentSettings.css";

interface FormData {
  documentType: string;
  documentTypeOperator: string;
  bussinesUnit: string;
  user: string;
  date: string;
}

const MarketDocumentSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<FormData>({
    documentType: "",
    documentTypeOperator: "=",
    bussinesUnit: "BU",
    user: "",
    date: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 页面初始化：获取当前用户信息和日期
  useEffect(() => {
    const loggedInUser = localStorage.getItem("currentUser");
    const now = new Date();
    const dateTime = now.toISOString().slice(0, 19).replace("T", " ");
    setFormData((prev) => ({
      ...prev,
      user: loggedInUser || "",
      date: dateTime,
    }));
  }, []);

  // 处理从 MarketDocumentSettingsList 返回的导航状态
  useEffect(() => {
    const state = location.state as any;
    if (!state) return;

    // Select → 填充选中记录的内容
    if (state.isFromSelection && state.selectedDocument) {
      const record = state.selectedDocument;
      setFormData((prev) => ({
        ...prev,
        documentType: record.documentType || "",
        bussinesUnit: record.bussinesUnit || "BU",
        user: record.user || prev.user,
        date: record.date || prev.date,
      }));
      setErrorMessage("");
    }

    // Back → 保留之前的搜索条件
    if (state.isFromBack && state.searchCriteria) {
      const criteria = state.searchCriteria;
      setFormData((prev) => ({
        ...prev,
        documentType: criteria.documentType || "",
      }));
      setErrorMessage("");
    }

    // 清除 state，防止刷新页面时重复填充
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // 输入框变化处理
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value.trim()) {
      setErrorMessage("");
      setSuccessMessage("");
    }
  };

  // 点击Search按钮：跳转到Market Document Settings List画面
  const handleSearch = () => {
    if (!formData.documentType.trim()) {
      setErrorMessage("Please enter a document type.");
      return;
    }

    navigate("/market-document-settings-list", {
      state: {
        searchCriteria: {
          documentType: formData.documentType.trim(),
          operator: formData.documentTypeOperator,
        },
      },
    });
  };

  // 点击Clear按钮：清空所有输入项（保留user和date）
  const handleClear = () => {
    setFormData((prev) => ({
      documentType: "",
      documentTypeOperator: "=",
      bussinesUnit: "BU",
      user: prev.user,
      date: prev.date,
    }));
    setErrorMessage("");
  };

  // 点击Back按钮：跳转到市场文档设置列表画面
  const handleBack = () => {
    navigate("/market-document-settings-list");
  };

  // Update Mode处理：更新HDOC_DOCUMENT_LIST表
  const handleUpdateMode = async () => {
    // 空值校验：Document type不能为空
    if (!formData.documentType.trim()) {
      setErrorMessage("Document type不能为空");
      setSuccessMessage("");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const response = await fetch(
        `${API_BASE_URL}/api/ud20-1/updatehdocdocumentlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            operation: "UPDATE_HDOC_DOCUMENT_LIST",
            doctype: formData.documentType.trim(),
            user: formData.user,
            date: formData.date,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("更新失败");
      }

      const result = await response.json();

      if (result.code === 200) {
        setSuccessMessage("更新成功");
      } else if (result.code === 404) {
        setErrorMessage(
          "Document type does not exists. Please enter the correct content.",
        );
      } else {
        setErrorMessage(result.msg || "更新失败");
      }
    } catch (error) {
      setErrorMessage("更新失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='mds-container'>
      {/* 标题 */}
      <h1 className='mds-title'>HDoc - Market Document Settings</h1>

      {/* 错误消息 */}
      {errorMessage && <div className='mds-error-message'>{errorMessage}</div>}

      {/* 成功消息 */}
      {successMessage && (
        <div className='mds-success-message'>{successMessage}</div>
      )}

      {/* 边框容器 */}
      <div className='mds-border-box'>
        {/* 按钮区域 - 放在表单上方 */}
        <div className='mds-button-bar'>
          <button className='mds-btn' onClick={handleSearch}>
            Search
          </button>
          <button className='mds-btn' onClick={handleClear}>
            Clear
          </button>
          <button className='mds-btn' onClick={handleBack}>
            Back
          </button>
          <button
            className='mds-btn'
            onClick={handleUpdateMode}
            disabled={isLoading}
          >
            Update Mode
          </button>
        </div>

        {/* 表单区域 */}
        <div className='mds-form-section'>
          <div className='mds-form-row'>
            <label className='mds-label'>Document type:</label>
            <select
              className='mds-operator-select'
              value={formData.documentTypeOperator}
              onChange={(e) =>
                handleInputChange("documentTypeOperator", e.target.value)
              }
            >
              <option value='='>=</option>
              <option value='<'>&lt;</option>
              <option value='>'>&gt;</option>
            </select>
            <input
              type='text'
              value={formData.documentType}
              onChange={(e) =>
                handleInputChange("documentType", e.target.value)
              }
              placeholder='Enter document type'
              maxLength={20}
              className='mds-input-field mds-width-doctype'
            />
          </div>
          <div className='mds-form-row'>
            <label className='mds-label'>Bussines unit:</label>
            <select className='mds-operator-select'>
              <option value='='>=</option>
              <option value='<'>&lt;</option>
              <option value='>'>&gt;</option>
            </select>
            <input
              type='text'
              value={formData.bussinesUnit}
              onChange={(e) =>
                handleInputChange("bussinesUnit", e.target.value)
              }
              placeholder='BU'
              maxLength={20}
              className='mds-input-field mds-width-bu'
            />
          </div>
          <div className='mds-form-row'>
            <label className='mds-label'>User:</label>
            <select className='mds-operator-select'>
              <option value='='>=</option>
              <option value='<'>&lt;</option>
              <option value='>'>&gt;</option>
            </select>
            <input
              type='text'
              value={formData.user}
              readOnly
              className='mds-input-field mds-input-readonly mds-width-user'
            />
            <span className='mds-auto-text'>Automatic</span>
          </div>
          <div className='mds-form-row'>
            <label className='mds-label'>Date:</label>
            <select className='mds-operator-select'>
              <option value='='>=</option>
              <option value='<'>&lt;</option>
              <option value='>'>&gt;</option>
            </select>
            <input
              type='text'
              value={formData.date}
              readOnly
              className='mds-input-field mds-input-readonly mds-width-date'
            />
            <span className='mds-auto-text'>Automatic</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDocumentSettings;
