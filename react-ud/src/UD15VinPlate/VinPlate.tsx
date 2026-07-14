import { useState } from "react";
import "./VinPlate.css";

interface VinPlateData {
  chassisNumber: string;
  type: string;
  status: string;
  msg: string;
  registerDatetime: string;
  docReady: string;
  docSent: string;
  xmlDoc: string;
}

const VinPlate: React.FC = () => {
  const [chassisNumber, setChassisNumber] = useState("");
  const [vinPlateData, setVinPlateData] = useState<VinPlateData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 处理Chassis number输入变化
  const handleChassisChange = (value: string) => {
    setChassisNumber(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // 将Chassis number按"-"拆分为serie和chnr
  const parseChassisNumber = (
    value: string,
  ): { serie: string; chnr: string } => {
    const parts = value.split("-");
    if (parts.length >= 2 && parts[0].trim() !== "") {
      // "ABC-123" → serie="ABC", chnr="123"
      return { serie: parts[0], chnr: parts.slice(1).join("-") };
    }
    // 没有"-"时返回空标识，由调用方处理错误
    return { serie: "", chnr: value };
  };

  // 验证Chassis number格式
  const validateChassisNumber = (value: string): string | null => {
    if (!value.trim()) {
      return "Please enter a chassis number.";
    }
    const parts = value.split("-");
    if (parts.length < 2 || parts[0].trim() === "") {
      return 'Invalid chassis number format. Please use format "SERIE-CHNR" (e.g., "ABC-123").';
    }
    return null;
  };

  // View Info功能：查询VIN Plate详细信息
  const handleViewInfo = async () => {
    // 验证Chassis number格式
    const validationError = validateChassisNumber(chassisNumber);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const { serie, chnr } = parseChassisNumber(chassisNumber);

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setVinPlateData(null);

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(`${API_BASE_URL}/api/ud15/viewinfo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serie, chnr, updateUser: currentUser }),
      });

      if (!response.ok) {
        throw new Error("System error. Please contact administrator.");
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setVinPlateData(result.data);
      } else {
        setErrorMessage(result.msg || "Chassis number not found.");
      }
    } catch (error: any) {
      setErrorMessage(
        error.message || "System error. Please contact administrator.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Set Regenerate功能：将Status更新为'0'
  const handleSetRegenerate = async () => {
    const validationError = validateChassisNumber(chassisNumber);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!vinPlateData) {
      setErrorMessage("请先查询Chassis信息");
      return;
    }

    const { serie, chnr } = parseChassisNumber(chassisNumber);

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(`${API_BASE_URL}/api/ud15/setregenerate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serie, chnr, updateUser: currentUser }),
      });

      if (!response.ok) {
        throw new Error("更新失败，请联系管理员");
      }

      const result = await response.json();

      if (result.code === 200) {
        setSuccessMessage("设置重新生成成功");
        await handleViewInfo();
      } else {
        setErrorMessage(result.msg || "更新失败，请联系管理员");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "更新失败，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // Set OK功能：将Status更新为'1'
  const handleSetOK = async () => {
    const validationError = validateChassisNumber(chassisNumber);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!vinPlateData) {
      setErrorMessage("请先查询Chassis信息");
      return;
    }

    const { serie, chnr } = parseChassisNumber(chassisNumber);

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(`${API_BASE_URL}/api/ud15/setok`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serie, chnr, updateUser: currentUser }),
      });

      if (!response.ok) {
        throw new Error("更新失败，请联系管理员");
      }

      const result = await response.json();

      if (result.code === 200) {
        setSuccessMessage("设置OK成功");
        await handleViewInfo();
      } else {
        setErrorMessage(result.msg || "更新失败，请联系管理员");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "更新失败，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // Change to Basic Info功能：将Status更新为'0'，Type更新为'1'
  const handleChangeToBasic = async () => {
    const validationError = validateChassisNumber(chassisNumber);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!vinPlateData) {
      setErrorMessage("请先查询Chassis信息");
      return;
    }

    const { serie, chnr } = parseChassisNumber(chassisNumber);

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(
        `${API_BASE_URL}/api/ud15/changetobasicinfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ serie, chnr, updateUser: currentUser }),
        },
      );

      if (!response.ok) {
        throw new Error("更新失败，请联系管理员");
      }

      const result = await response.json();

      if (result.code === 200) {
        setSuccessMessage("切换到基础信息成功");
        await handleViewInfo();
      } else {
        setErrorMessage(result.msg || "更新失败，请联系管理员");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "更新失败，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  // Change to Advanced Info功能：将Status更新为'0'，Type更新为'2'
  const handleChangeToAdvanced = async () => {
    const validationError = validateChassisNumber(chassisNumber);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!vinPlateData) {
      setErrorMessage("请先查询Chassis信息");
      return;
    }

    const { serie, chnr } = parseChassisNumber(chassisNumber);

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const API_BASE_URL =
        process.env.REACT_APP_API_BASE_URL || "http://localhost:8081";

      const currentUser = localStorage.getItem("currentUser") || "";

      const response = await fetch(
        `${API_BASE_URL}/api/ud15/changetoadvancedinfo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ serie, chnr, updateUser: currentUser }),
        },
      );

      if (!response.ok) {
        throw new Error("更新失败，请联系管理员");
      }

      const result = await response.json();

      if (result.code === 200) {
        setSuccessMessage("切换到高级信息成功");
        await handleViewInfo();
      } else {
        setErrorMessage(result.msg || "更新失败，请联系管理员");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "更新失败，请联系管理员");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className='vp-container'>
        <div className='vp-loading'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='vp-container'>
      {/* Vin Plate区域 */}
      <div className='vp-section'>
        <h2 className='vp-section-title'>Vin Plate</h2>

        {/* Chassis number输入框 */}
        <div className='vp-form-group'>
          <label className='vp-label'>Chassis number</label>
          <input
            type='text'
            className='vp-input'
            value={chassisNumber}
            onChange={(e) => handleChassisChange(e.target.value)}
            maxLength={15}
          />
        </div>

        {/* 按钮区域 */}
        <div className='vp-button-row'>
          <button
            className='vp-btn'
            onClick={handleViewInfo}
            disabled={isLoading}
          >
            View Info
          </button>
          <button
            className='vp-btn'
            onClick={handleSetRegenerate}
            disabled={isLoading}
          >
            Set Regenerate
          </button>
          <button className='vp-btn' onClick={handleSetOK} disabled={isLoading}>
            Set OK
          </button>
          <button
            className='vp-btn'
            onClick={handleChangeToBasic}
            disabled={isLoading}
          >
            Change to Basic Info
          </button>
          <button
            className='vp-btn'
            onClick={handleChangeToAdvanced}
            disabled={isLoading}
          >
            Change to Advanced Info
          </button>
        </div>

        {/* 初始提示文本 - 始终显示 */}
        <div className='vp-initial-message'>Please enter a chassis number.</div>

        {/* 错误消息显示 */}
        {errorMessage && <div className='vp-error-message'>{errorMessage}</div>}

        {/* 成功消息显示 */}
        {successMessage && (
          <div className='vp-success-message'>{successMessage}</div>
        )}

        {/* 详细信息展示区域 */}
        {vinPlateData && (
          <div className='vp-details'>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Chassis number:</span>
              <span className='vp-detail-value'>
                {vinPlateData.chassisNumber}
              </span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Plate type:</span>
              <span className='vp-detail-value'>{vinPlateData.type}</span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Status:</span>
              <span className='vp-detail-value'>{vinPlateData.status}</span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Error Message:</span>
              <span className='vp-detail-value'>{vinPlateData.msg}</span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Def.:</span>
              <span className='vp-detail-value'>
                {vinPlateData.registerDatetime}
              </span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Data ready:</span>
              <span className='vp-detail-value'>{vinPlateData.docReady}</span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Sent to CAB factory:</span>
              <span className='vp-detail-value'>{vinPlateData.docSent}</span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>Print items:</span>
              <span className='vp-detail-value'>
                {/* 这里需要根据实际XML解析结果展示 */}
                {vinPlateData.xmlDoc ? "Parsed from XML" : "-"}
              </span>
            </div>
            <div className='vp-detail-row'>
              <span className='vp-detail-label'>VP Data:</span>
              <span className='vp-detail-value'>
                {/* 这里需要根据实际XML解析结果展示 */}
                {vinPlateData.xmlDoc ? "Parsed from XML" : "-"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VinPlate;
