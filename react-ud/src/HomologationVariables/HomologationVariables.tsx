import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./HomologationVariables.css";

interface DropdownOption {
  code: string;
  pc?: string;
  market?: string;
  description?: string;
}

const HomologationVariables: React.FC = () => {
  const navigate = useNavigate();

  const [userID, setUserID] = useState<string>("");
  const [productClasses, setProductClasses] = useState<DropdownOption[]>([]);
  const [markets, setMarkets] = useState<DropdownOption[]>([]);

  // Form fields
  const [productClass, setProductClass] = useState<string>("");
  const [number, setNumber] = useState<string>("");
  const [market, setMarket] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [variantString1, setVariantString1] = useState<string>("");
  const [variantString2, setVariantString2] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [addDate, setAddDate] = useState<string>("");
  const [deleteDate, setDeleteDate] = useState<string>("");
  const [createdByUser, setCreatedByUser] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const storedUserID = localStorage.getItem("userID");
    if (!storedUserID) {
      navigate("/login");
      return;
    }
    setUserID(storedUserID);
    fetchDropdownData();
  }, [navigate]);

  const fetchDropdownData = async () => {
    try {
      const response = await fetch("/api/ud08/getdropdowndata");
      const data = await response.json();
      if (data.success && data.data) {
        setProductClasses(data.data.productClasses || []);
        setMarkets(data.data.markets || []);
      }
    } catch {
      // silent
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userID");
    navigate("/login");
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
    setNumber(val);
    clearMessages();
  };

  const clearMessages = () => {
    if (errorMessage) setErrorMessage("");
    if (successMessage) setSuccessMessage("");
  };

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>, maxLen: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value.slice(0, maxLen));
      clearMessages();
    };

  const handleSearch = () => {
    navigate("/homologation-variables-result", {
      state: {
        productClass,
        number,
        market,
        variable,
        value,
        variantString1,
        variantString2,
        comments,
        addDate,
        deleteDate,
        createdByUser,
        date,
      },
    });
  };

  const handleClear = () => {
    setProductClass("");
    setNumber("");
    setMarket("");
    setVariable("");
    setValue("");
    setVariantString1("");
    setVariantString2("");
    setComments("");
    setAddDate("");
    setDeleteDate("");
    setCreatedByUser("");
    setDate("");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateRequired = (): boolean => {
    if (!productClass.trim() || !number.trim() || !market.trim()) {
      setErrorMessage("Product class, Number, and Market are required.");
      setSuccessMessage("");
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateRequired()) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ud08/addrule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productClass, number: number.trim(), market,
          variable, value, variantString1, variantString2, comments,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Rule added successfully");
        handleClear();
      } else {
        setErrorMessage(data.message || "Primary key conflict, Please enter the correct content");
      }
    } catch {
      setErrorMessage("Network error or server unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateRequired()) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ud08/updaterule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productClass, number: number.trim(), market,
          variable, value, variantString1, variantString2, comments,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Rule updated successfully");
      } else {
        setErrorMessage(data.message || "Data does not exist, Please enter the correct content");
      }
    } catch {
      setErrorMessage("Network error or server unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!validateRequired()) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/ud08/deleterule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productClass, number: number.trim(), market,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMessage("Rule deleted successfully");
        handleClear();
      } else {
        setErrorMessage(data.message || "Data does not exist, Please enter the correct content");
      }
    } catch {
      setErrorMessage("Network error or server unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hv-page">
      {/* 顶部导航栏 */}
      <header className="hv-header">
        <div className="header-left">
          <span className="volvo-logo">VOLVO</span>
        </div>
        <div className="header-right">
          <span className="welcome-text">Welcome, {userID || "---"}</span>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="hv-body">
        <div className="hv-content">
          <h1 className="hv-title">Homologation Variables</h1>

          {/* 错误消息 */}
          {errorMessage && <div className="hv-error">{errorMessage}</div>}
          {successMessage && <div className="hv-success">{successMessage}</div>}

          {/* 表单 */}
          <div className="hv-form">
            {/* 行1: Product class / Number / Market */}
            <div className="hv-row">
              <div className="hv-field hv-field-pc">
                <label className="hv-label">Product class</label>
                <select
                  className="hv-select"
                  value={productClass}
                  onChange={(e) => { setProductClass(e.target.value); clearMessages(); }}
                  disabled={isLoading}
                >
                  <option value=""></option>
                  {productClasses.map((pc) => (
                    <option key={pc.pc || pc.code} value={pc.pc || pc.code}>
                      {pc.pc || pc.code}{pc.description ? ` - ${pc.description}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hv-field hv-field-num">
                <label className="hv-label">Number</label>
                <input
                  type="text"
                  className="hv-input"
                  value={number}
                  onChange={handleNumberChange}
                  disabled={isLoading}
                  placeholder=""
                />
              </div>
              <div className="hv-field hv-field-mkt">
                <label className="hv-label">Market</label>
                <select
                  className="hv-select"
                  value={market}
                  onChange={(e) => { setMarket(e.target.value); clearMessages(); }}
                  disabled={isLoading}
                >
                  <option value=""></option>
                  {markets.map((m) => (
                    <option key={m.market || m.code} value={m.market || m.code}>
                      {m.market || m.code}{m.description ? ` - ${m.description}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 行2: Variable / Value */}
            <div className="hv-row">
              <div className="hv-field hv-field-var">
                <label className="hv-label">Variable</label>
                <input
                  type="text"
                  className="hv-input"
                  value={variable}
                  onChange={handleFieldChange(setVariable, 20)}
                  disabled={isLoading}
                />
              </div>
              <div className="hv-field hv-field-val">
                <label className="hv-label">Value</label>
                <input
                  type="text"
                  className="hv-input"
                  value={value}
                  onChange={handleFieldChange(setValue, 200)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 行3: Variant string.1 / Variant string.2 */}
            <div className="hv-row">
              <div className="hv-field hv-field-vs1">
                <label className="hv-label">Variant string.1</label>
                <input
                  type="text"
                  className="hv-input"
                  value={variantString1}
                  onChange={handleFieldChange(setVariantString1, 100)}
                  disabled={isLoading}
                />
              </div>
              <div className="hv-field hv-field-vs2">
                <label className="hv-label">Variant string.2</label>
                <input
                  type="text"
                  className="hv-input"
                  value={variantString2}
                  onChange={handleFieldChange(setVariantString2, 100)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 行4: Comments */}
            <div className="hv-row">
              <div className="hv-field hv-field-com">
                <label className="hv-label">Comments</label>
                <input
                  type="text"
                  className="hv-input"
                  value={comments}
                  onChange={handleFieldChange(setComments, 100)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* 行5: Add / Delete / Created by user / Date */}
            <div className="hv-row">
              <div className="hv-field hv-field-add">
                <label className="hv-label">Add</label>
                <input
                  type="text"
                  className="hv-input hv-input-sm"
                  value={addDate}
                  onChange={handleFieldChange(setAddDate, 6)}
                  disabled={isLoading}
                />
              </div>
              <div className="hv-field hv-field-del">
                <label className="hv-label">Delete</label>
                <input
                  type="text"
                  className="hv-input hv-input-sm"
                  value={deleteDate}
                  onChange={handleFieldChange(setDeleteDate, 6)}
                  disabled={isLoading}
                />
              </div>
              <div className="hv-field hv-field-cbu">
                <label className="hv-label">Created by user</label>
                <input
                  type="text"
                  className="hv-input hv-input-sm"
                  value={createdByUser}
                  onChange={handleFieldChange(setCreatedByUser, 16)}
                  disabled={isLoading}
                />
              </div>
              <div className="hv-field hv-field-dt">
                <label className="hv-label">Date</label>
                <input
                  type="text"
                  className="hv-input hv-input-sm"
                  value={date}
                  onChange={handleFieldChange(setDate, 50)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* 按钮行 */}
          <div className="hv-buttons">
            <button className="hv-btn hv-btn-action" onClick={handleSearch} disabled={isLoading}>Search</button>
            <button className="hv-btn hv-btn-action" onClick={handleClear} disabled={isLoading}>Clear</button>
            <button className="hv-btn hv-btn-action" onClick={handleAdd} disabled={isLoading}>Add</button>
            <button className="hv-btn hv-btn-action" onClick={handleUpdate} disabled={isLoading}>Update</button>
            <button className="hv-btn hv-btn-action" onClick={handleDelete} disabled={isLoading}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomologationVariables;
