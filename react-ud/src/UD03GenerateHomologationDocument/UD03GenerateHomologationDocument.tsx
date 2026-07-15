import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UD03GenerateHomologationDocument.css";

interface DocumentTypeOption {
  value: string;
  label: string;
}

const GenerateHomologationDocument: React.FC = () => {
  const navigate = useNavigate();
  const [chassisSeries, setChassisSeries] = useState("");
  const [chassisNo, setChassisNo] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentTypeList, setDocumentTypeList] = useState<
    DocumentTypeOption[]
  >([]);

  // 页面初始化：加载上次的搜索条件和文档类型列表
  useEffect(() => {
    // 从localStorage获取上次的搜索条件
    const lastSearchConditions = localStorage.getItem("lastSearchConditions");
    if (lastSearchConditions) {
      try {
        const conditions = JSON.parse(lastSearchConditions);
        setChassisSeries(conditions.chassisSeries || "");
        setChassisNo(conditions.chassisNo || "");
        setDocumentType(conditions.documentType || "");
      } catch (err) {}
    }

    // 调用API获取文档类型列表
    fetchDocumentTypeList();
  }, []);

  // 获取文档类型列表
  const fetchDocumentTypeList = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/UD03/selectHdocdocumentlist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 200 && data.data?.doctypeList) {
        const options = data.data.doctypeList.map((type: string) => ({
          value: type,
          label: type,
        }));
        setDocumentTypeList(options);

        // 默认选中第一个选项（仅当当前没有选择值时）
        if (options.length > 0 && !documentType) {
          setDocumentType(options[0].value);
        }
      }
    } catch (err) {}
  };

  // 备用文档类型数据（当API调用失败时使用）

  // 验证表单
  const validateForm = (): boolean => {
    let isValid = true;
    let errorMsg = "";

    if (!chassisSeries.trim()) {
      errorMsg = "Chassis series is required.";
      isValid = false;
    } else if (!/^[A-Za-z]+$/.test(chassisSeries.trim())) {
      errorMsg = "Chassis series 只能输入半角英文字符";
      isValid = false;
    } else if (!chassisNo.trim()) {
      errorMsg = "Chassis no is required.";
      isValid = false;
    } else if (!/^[0-9]+$/.test(chassisNo.trim())) {
      errorMsg = "Chassis no 只能输入半角数字";
      isValid = false;
    } else if (!documentType) {
      errorMsg = "Document type is required. Please select from dropdown.";
      isValid = false;
    }

    setErrorMessage(errorMsg);
    return isValid;
  };

  // Submit按钮处理
  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (e) {
      e.preventDefault();
    }

    // 验证表单
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 保存当前搜索条件到localStorage
      const searchConditions = {
        chassisSeries,
        chassisNo,
        documentType,
      };
      localStorage.setItem(
        "lastSearchConditions",
        JSON.stringify(searchConditions),
      );

      // 跳转到"Generate document"画面，并传递底盘号参数
      const combinedChassisNo = `${chassisSeries}${chassisNo}`;
      const targetUrl = `/generate-document?chassisNo=${encodeURIComponent(combinedChassisNo)}`;

      // 使用React Router的navigate进行页面跳转
      navigate(targetUrl);
    } catch (err) {}
  };

  // Reset按钮处理
  const handleReset = () => {
    setChassisSeries("");
    setChassisNo("");
    setDocumentType("");
    setErrorMessage("");
  };

  // Help按钮处理
  const handleHelp = () => {
    // 跳转到HDocHelp画面
    navigate("/hdoc-help");
  };

  // 输入框变化处理
  const handleChassisSeriesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setChassisSeries(value);
    if (value.trim()) {
      // 半角英文字（A-Z, a-z）以外の文字が含まれている場合
      if (!/^[A-Za-z]*$/.test(value)) {
        setErrorMessage("Chassis series 只能输入半角英文字符");
      } else {
        setErrorMessage("");
      }
    } else {
      setErrorMessage("");
    }
  };

  const handleChassisNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setChassisNo(value);
    if (value.trim()) {
      // 半角数字（0-9）以外の文字が含まれている場合
      if (!/^[0-9]*$/.test(value)) {
        setErrorMessage("Chassis no 只能输入半角数字");
      } else {
        setErrorMessage("");
      }
    } else {
      setErrorMessage("");
    }
  };

  const handleDocumentTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setDocumentType(value);
    if (value) {
      setErrorMessage("");
    }
  };

  return (
    <div className='ghd-container'>
      {/* 标题区域 */}
      <div className='ghd-header'>
        <h1 className='ghd-title'>HDoc - Generate Homologation Document</h1>
      </div>
      {/* 错误信息显示区域 */}
      {errorMessage && <div className='ghd-error-message'>{errorMessage}</div>}
      {/* 主内容区域 */}
      <div className='ghd-main-content'>
        <form onSubmit={handleSubmit} className='ghd-form'>
          {/* Chassis series输入框 */}
          <div className='ghd-input-group'>
            <label className='ghd-label'>
              Chassis series <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type='text'
              id='chassisSeries'
              name='chassisSeries'
              value={chassisSeries}
              onChange={handleChassisSeriesChange}
              maxLength={5}
              disabled={isLoading}
              className='ghd-input-field'
              placeholder='Enter chassis series'
            />
          </div>

          {/* Chassis no输入框 */}
          <div className='ghd-input-group'>
            <label className='ghd-label'>
              Chassis no <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type='text'
              id='chassisNo'
              name='chassisNo'
              value={chassisNo}
              onChange={handleChassisNoChange}
              maxLength={10}
              disabled={isLoading}
              className='ghd-input-field'
              placeholder='Enter chassis number'
            />
          </div>

          {/* Document type下拉列表 */}
          <div className='ghd-input-group'>
            <label className='ghd-label'>
              Document type <span style={{ color: "red" }}>*</span>
            </label>
            <select
              id='documentType'
              name='documentType'
              value={documentType}
              onChange={handleDocumentTypeChange}
              disabled={isLoading}
              className='ghd-select-field'
            >
              <option value=''>Please select</option>
              {documentTypeList.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* 底部按钮区域 */}
      <div className='ghd-footer'>
        <button
          type='button'
          disabled={isLoading}
          onClick={handleSubmit}
          className='ghd-button ghd-submit-btn'
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
        <button
          type='button'
          onClick={handleReset}
          disabled={isLoading}
          className='ghd-button ghd-reset-btn'
        >
          Reset
        </button>
        <button
          type='button'
          onClick={handleHelp}
          disabled={isLoading}
          className='ghd-button ghd-help-btn'
        >
          Help
        </button>
      </div>

      {/* 支持邮箱信息 */}
      <div className='ghd-support-info'>
        <p>HDoc support: support.tpi@volvo.com</p>
      </div>
    </div>
  );
};

export default GenerateHomologationDocument;
