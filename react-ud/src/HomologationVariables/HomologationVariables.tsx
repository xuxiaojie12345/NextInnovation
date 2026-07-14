import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Select, Tooltip } from 'antd';
import axios from 'axios';
import './HomologationVariables.css';

interface ProductClass {
  pc: string;
  description: string;
}

interface MarketItem {
  market: string;
  description: string;
}

interface RuleRecord {
  pc: string;
  num: string;
  market: string;
  variable: string;
  val: string;
  vs: string;
  vs2: string;
  comments: string;
  addDate: string;
  deleteDate: string;
  userId: string;
  updateDatetime: string;
}

const HomologationVariables: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [productClass, setProductClass] = useState<string>('');
  const [number, setNumber] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [variable, setVariable] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [variantString1, setVariantString1] = useState<string>('');
  const [variantString2, setVariantString2] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [addDate, setAddDate] = useState<string>('');
  const [deleteDate, setDeleteDate] = useState<string>('');
  const [createdByUser, setCreatedByUser] = useState<string>('');
  const [updateDate, setUpdateDate] = useState<string>('');

  const [productClassList, setProductClassList] = useState<ProductClass[]>([]);
  const [marketList, setMarketList] = useState<MarketItem[]>([]);
  const [variableList, setVariableList] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const state = location.state as any;
    if (state?.selectedRecord) {
      const r = state.selectedRecord;
      setProductClass(r.pc);
      setNumber(String(r.num));
      setMarket(r.market);
      setVariable(r.variable);
      setValue(r.val);
      setVariantString1(r.vs);
      setVariantString2(r.vs2);
      setComments(r.comments);
      setAddDate(r.addDate);
      setDeleteDate(r.deleteDate || '');
      setCreatedByUser(r.registerUser || '');
      setUpdateDate(r.registerDatetime || '');
    } else if (state?.backCriteria) {
      const c = state.backCriteria;
      if (c.pc) setProductClass(c.pc);
      if (c.num) setNumber(c.num);
      if (c.market) setMarket(c.market);
      if (c.variable) setVariable(c.variable);
      if (c.val) setValue(c.val);
      if (c.vs) setVariantString1(c.vs);
      if (c.vs2) setVariantString2(c.vs2);
      if (c.comments) setComments(c.comments);
      if (c.addDate) setAddDate(c.addDate);
      if (c.deleteDate) setDeleteDate(c.deleteDate);
      if (c.createdByUser) setCreatedByUser(c.createdByUser);
      if (c.updateDate) setUpdateDate(c.updateDate);
    }
    window.history.replaceState({}, '');
  }, [location.state]);

  const clearForm = useCallback(() => {
    setProductClass('');
    setNumber('');
    setMarket('');
    setVariable('');
    setValue('');
    setVariantString1('');
    setVariantString2('');
    setComments('');
    setAddDate('');
    setDeleteDate('');
    setCreatedByUser('');
    setUpdateDate('');
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadDropdownData = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('userInfo');
      const headers = { Authorization: `Bearer ${token}` };

      const [pcRes, marketRes, varRes] = await Promise.allSettled([
        axios.get('/api/UD08SelectProductclassmaster', { headers }),
        axios.get('/api/UD08SelectMarketmaster', { headers }),
        axios.get('/api/UD08SelectHdocvariables', { headers }),
      ]);

      if (pcRes.status === 'fulfilled' && pcRes.value.data.status === 'success') {
        setProductClassList(pcRes.value.data.data || []);
      } else {
        showMessage('Failed to load product class data.', 'error');
      }

      if (marketRes.status === 'fulfilled' && marketRes.value.data.status === 'success') {
        setMarketList(marketRes.value.data.data || []);
      } else {
        showMessage('Failed to load market data.', 'error');
      }

      if (varRes.status === 'fulfilled' && varRes.value.data.status === 'success') {
        setVariableList(varRes.value.data.data || []);
      } else {
        showMessage('Failed to load variable data for validation.', 'error');
      }
    } catch {
      showMessage('Network connection failed. Please try again later.', 'error');
    }
  }, []);

  useEffect(() => {
    loadDropdownData();
  }, [loadDropdownData]);

  const getRequiredFields = () => {
    if (!productClass) return 'Product class is required.';
    if (!number) return 'Number is required.';
    if (!market) return 'Market is required.';
    return null;
  };

  const validateVariable = (): boolean => {
    if (!variable) return true;
    let checkVar = variable;
    if (checkVar.startsWith('TEMPLATE-')) {
      checkVar = checkVar.substring(9);
    }
    if (!variableList.includes(checkVar)) {
      showMessage('Variant does not exist, Please enter the correct content.', 'error');
      return false;
    }
    return true;
  };

  const handleClear = () => {
    clearForm();
    setMessage('');
  };

  const handleAdd = async () => {
    const requiredErr = getRequiredFields();
    if (requiredErr) {
      showMessage(requiredErr, 'error');
      return;
    }
    if (!validateVariable()) return;

    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD08Add',
        {
          pc: productClass,
          num: number,
          market,
          variable,
          val: value,
          vs: variantString1,
          vs2: variantString2,
          comments,
          addDate,
          deleteDate: deleteDate || null,
          userId: createdByUser,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        showMessage('Rule added successfully', 'success');
        clearForm();
      } else {
        showMessage(response.data.message || 'Add failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 409) {
          showMessage('Primary key conflict, Please enter the correct content.', 'error');
        } else {
          showMessage(error.response.data?.message || 'Add failed.', 'error');
        }
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    const requiredErr = getRequiredFields();
    if (requiredErr) {
      showMessage(requiredErr, 'error');
      return;
    }
    if (!validateVariable()) return;

    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD08Update',
        {
          pc: productClass,
          num: number,
          market,
          variable,
          val: value,
          vs: variantString1,
          vs2: variantString2,
          comments,
          addDate,
          deleteDate: deleteDate || null,
          userId: createdByUser,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        showMessage('Rule updated successfully', 'success');
      } else {
        showMessage(response.data.message || 'Update failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          showMessage('Data does not exist, Please enter the correct content.', 'error');
        } else if (error.response.status === 409) {
          showMessage('Primary key conflict, Please enter the correct content.', 'error');
        } else {
          showMessage(error.response.data?.message || 'Update failed.', 'error');
        }
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const requiredErr = getRequiredFields();
    if (requiredErr) {
      showMessage(requiredErr, 'error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post(
        '/api/UD08Delete',
        { pc: productClass, num: number, market },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 'success') {
        showMessage('Rule deleted successfully', 'success');
        clearForm();
      } else {
        showMessage(response.data.message || 'Delete failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 404) {
          showMessage('Data does not exist, Please enter the correct content.', 'error');
        } else {
          showMessage(error.response.data?.message || 'Delete failed.', 'error');
        }
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToResultList = () => {
    const criteria: Record<string, string> = {};
    if (productClass) criteria.pc = productClass;
    if (number) criteria.num = number;
    if (market) criteria.market = market;
    if (variable) criteria.variable = variable;
    if (value) criteria.val = value;
    if (variantString1) criteria.vs = variantString1;
    if (variantString2) criteria.vs2 = variantString2;
    if (comments) criteria.comments = comments;
    if (addDate) criteria.addDate = addDate;
    if (deleteDate) criteria.deleteDate = deleteDate;
    if (createdByUser) criteria.createdByUser = createdByUser;
    if (updateDate) criteria.updateDatetime = updateDate;
    navigate('/homologation-variables-result-list', { state: { searchCriteria: criteria } });
  };

  return (
    <div className="hv-container">
      <div className="hv-header">
        <h1 className="hv-header-title">HDoc - Homologation Variables</h1>
      </div>

      <div className="hv-content">
        <div className="hv-card">
          {message && (
            <div className={`hv-message hv-message-${messageType}`}>{message}</div>
          )}

          <div className="hv-form">
            <div className="hv-form-row">
              <div className="hv-field">
                <label className="hv-label">Product class</label>
                <Select
                  className="hv-select"
                  placeholder=""
                  value={productClass || undefined}
                  onChange={(v) => { setProductClass(v); setMessage(''); }}
                  options={productClassList.map((pc) => ({
                    value: pc.pc,
                    label: `${pc.pc} - ${pc.description}`,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="No data"
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Number</label>
                <Input
                  className="hv-input"
                  value={number}
                  onChange={(e) => { setNumber(e.target.value); setMessage(''); }}
                  maxLength={10}
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Market</label>
                <Select
                  className="hv-select"
                  placeholder=""
                  value={market || undefined}
                  onChange={(v) => { setMarket(v); setMessage(''); }}
                  options={marketList.map((m) => ({
                    value: m.market,
                    label: `${m.market} - ${m.description}`,
                  }))}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="No data"
                />
              </div>
            </div>

            <div className="hv-form-row">
              <div className="hv-field">
                <label className="hv-label">Variable</label>
                <Input
                  className="hv-input"
                  value={variable}
                  onChange={(e) => { setVariable(e.target.value); setMessage(''); }}
                  maxLength={20}
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Value</label>
                <Input
                  className="hv-input"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setMessage(''); }}
                  maxLength={200}
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Variant string.1</label>
                <Input
                  className="hv-input"
                  value={variantString1}
                  onChange={(e) => { setVariantString1(e.target.value); setMessage(''); }}
                  maxLength={100}
                />
              </div>
            </div>

            <div className="hv-form-row">
              <div className="hv-field">
                <label className="hv-label">Variant string.2</label>
                <Input
                  className="hv-input"
                  value={variantString2}
                  onChange={(e) => { setVariantString2(e.target.value); setMessage(''); }}
                  maxLength={100}
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Comments</label>
                <Input
                  className="hv-input"
                  value={comments}
                  onChange={(e) => { setComments(e.target.value); setMessage(''); }}
                  maxLength={100}
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Add (Add Date)</label>
                <Input
                  className="hv-input"
                  value={addDate}
                  onChange={(e) => { setAddDate(e.target.value); setMessage(''); }}
                  maxLength={6}
                  placeholder="YYYYWW"
                />
              </div>
            </div>

            <div className="hv-form-row">
              <div className="hv-field">
                <label className="hv-label">Delete (Delete Date)</label>
                <Input
                  className="hv-input"
                  value={deleteDate}
                  onChange={(e) => { setDeleteDate(e.target.value); setMessage(''); }}
                  maxLength={6}
                  placeholder="YYYYWW"
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Created by user</label>
                <Input
                  className="hv-input"
                  value={createdByUser}
                  onChange={(e) => { setCreatedByUser(e.target.value); setMessage(''); }}
                  maxLength={16}
                />
              </div>
              <div className="hv-field">
                <label className="hv-label">Date (Update Date)</label>
                <Input
                  className="hv-input"
                  value={updateDate}
                  onChange={(e) => { setUpdateDate(e.target.value); setMessage(''); }}
                />
              </div>
            </div>
          </div>

          <div className="hv-buttons">
            <Button className="hv-btn hv-btn-search" onClick={navigateToResultList} loading={isLoading}>
              Search
            </Button>
            <Button className="hv-btn hv-btn-clear" onClick={handleClear}>
              Clear
            </Button>
            <Button className="hv-btn hv-btn-add" onClick={handleAdd} loading={isLoading}>
              Add
            </Button>
            <Button className="hv-btn hv-btn-update" onClick={handleUpdate} loading={isLoading}>
              Update
            </Button>
            <Button className="hv-btn hv-btn-delete" onClick={handleDelete} loading={isLoading}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="hv-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="hv-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default HomologationVariables;
