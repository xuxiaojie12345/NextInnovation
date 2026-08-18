import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Select } from 'antd';
import axios from 'axios';
import './HDocUserAdministration.css';

interface PermissionEntry {
  enabled: boolean;
  market: string | null;
}

interface Permissions {
  standardUser: PermissionEntry;
  ruleAdmin: PermissionEntry;
  templateAdmin: PermissionEntry;
  documentAuthAdmin: PermissionEntry;
  userAdmin: PermissionEntry;
  adaptationUser: PermissionEntry;
  manageVariableList: PermissionEntry;
  marketSuperUser: PermissionEntry;
}

const emptyPermissions = (): Permissions => ({
  standardUser: { enabled: false, market: null },
  ruleAdmin: { enabled: false, market: null },
  templateAdmin: { enabled: false, market: null },
  documentAuthAdmin: { enabled: false, market: null },
  userAdmin: { enabled: false, market: null },
  adaptationUser: { enabled: false, market: null },
  manageVariableList: { enabled: false, market: null },
  marketSuperUser: { enabled: false, market: null },
});

const HDocUserAdministration: React.FC = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [permissions, setPermissions] = useState<Permissions>(emptyPermissions());
  const [marketList, setMarketList] = useState<{ code: string; description: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  useEffect(() => {
    fetchMarketList();
  }, []);

  const fetchMarketList = async () => {
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.get('/api/UD17SelectMarketmaster', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setMarketList(response.data.data || []);
      } else {
        setMarketList([]);
      }
    } catch {
      setMarketList([]);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const updatePermission = (key: keyof Permissions, field: 'enabled' | 'market', value: boolean | string | null) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setMessage('');
  };

  // 业务规则：角色复选框只能选中一个（互斥）。勾选某角色时取消其它所有角色。
  const allRoleKeys: (keyof Permissions)[] = [
    'standardUser', 'ruleAdmin', 'templateAdmin', 'documentAuthAdmin',
    'userAdmin', 'adaptationUser', 'manageVariableList', 'marketSuperUser',
  ];
  const toggleRole = (key: keyof Permissions, checked: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      allRoleKeys.forEach((k) => {
        next[k] = { ...next[k], enabled: false, market: null };
        if (k === key) {
          next[k].enabled = checked;
        }
      });
      return next;
    });
    setMessage('');
  };

  // 选择 Market Super User 下拉：视为选择该角色（互斥），清空则取消该角色
  const selectMarketSuperUser = (val: string | null) => {
    setPermissions((prev) => {
      const next = { ...prev };
      allRoleKeys.forEach((k) => {
        next[k] = { ...next[k], enabled: false, market: null };
        if (k === 'marketSuperUser') {
          next[k].enabled = !!val;
          next[k].market = val || null;
        }
      });
      return next;
    });
    setMessage('');
  };

  const clearPermissions = () => {
    setPermissions(emptyPermissions());
    setUserName('');
  };

  const handleUserInfoResponse = (responseData: any) => {
    if (responseData.status === 'success') {
      setUserName(responseData.data.userName);
      const p = responseData.data.permissions;
      setPermissions({
        standardUser: p.standardUser || { enabled: false, market: null },
        ruleAdmin: p.ruleAdmin || { enabled: false, market: null },
        templateAdmin: p.templateAdmin || { enabled: false, market: null },
        documentAuthAdmin: p.documentAuthAdmin || { enabled: false, market: null },
        userAdmin: p.userAdmin || { enabled: false, market: null },
        adaptationUser: p.adaptationUser || { enabled: false, market: null },
        manageVariableList: p.manageVariableList || { enabled: false, market: null },
        marketSuperUser: p.marketSuperUser || { enabled: false, market: null },
      });
      showMessage(responseData.message || 'Success', 'success');
    } else {
      setUserName('');
      clearPermissions();
      showMessage(responseData.message || "We didn't recognize the userid you entered. Please try again.", 'error');
    }
  };

  const handleUserInfoClick = async () => {
    const trimmedId = userId.trim();
    if (!trimmedId) {
      showMessage('UserID is required.', 'error');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post('/api/UD17Userinfo', { userId: trimmedId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      handleUserInfoResponse(response.data);
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        handleUserInfoResponse(error.response.data);
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRoleClick = async () => {
    const trimmedId = userId.trim();
    if (!trimmedId) {
      showMessage('Please enter a UserID and click User Info first.', 'error');
      return;
    }
    const perms = { ...permissions };
    const hasAny = Object.values(perms).some((p) => p.enabled);
    if (!hasAny) {
      showMessage('At least one role must be selected.', 'error');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post('/api/UD17UpdateRole', { userId: trimmedId, permissions: perms }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        showMessage(response.data.message || 'User roles updated successfully.', 'success');
      } else {
        showMessage(response.data.message || 'Operation failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Operation failed.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoleClick = async () => {
    const trimmedId = userId.trim();
    if (!trimmedId) {
      showMessage('UserID is required.', 'error');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      const token = sessionStorage.getItem('userInfo');
      const response = await axios.post('/api/UD17DeleteRole', { userId: trimmedId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        clearPermissions();
        showMessage(response.data.message || 'User roles deleted successfully.', 'success');
      } else {
        showMessage(response.data.message || 'Operation failed.', 'error');
      }
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          sessionStorage.removeItem('userInfo');
          navigate('/');
          return;
        }
        showMessage(error.response.data?.message || 'Operation failed.', 'error');
      } else {
        showMessage('Network connection failed. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const marketOptions = marketList.map((m) => ({
    value: m.code,
    label: `${m.code} - ${m.description}`,
  }));

  return (
    <div className="hua-container">
      <div className="hua-header">
        <h1 className="hua-header-title">HDoc - User Administration</h1>
      </div>

      <div className="hua-content">
        <div className="hua-card">
          {message && (
            <div className={`hua-message hua-message-${messageType}`}>{message}</div>
          )}

          <div className="hua-input-row">
            <div className="hua-field">
              <label className="hua-label">UserID</label>
              <div className="hua-input-group">
                <Input
                  className="hua-input"
                  value={userId}
                  onChange={(e) => { setUserId(e.target.value); setMessage(''); }}
                  maxLength={10}
                  placeholder="Enter user ID"
                />
                <Button
                  className="hua-btn hua-btn-info"
                  onClick={handleUserInfoClick}
                  loading={isLoading}
                >
                  User Info
                </Button>
              </div>
            </div>
          </div>

          <div className="hua-user-row">
            <span className="hua-user-label">User:</span>
            <span className={`hua-user-value ${userName ? '' : 'hua-user-placeholder'}`}>
              {userName || '---'}
            </span>
          </div>

          <div className="hua-permissions-section">
            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.standardUser.enabled}
                  onChange={(e) => toggleRole('standardUser', e.target.checked)}
                >
                  Standard User
                </Checkbox>
              </div>
              <div className="hua-perm-market">
                <Select
                  className="hua-select"
                  value={permissions.standardUser.market || '-EU'}
                  onChange={(val) => updatePermission('standardUser', 'market', val)}
                  disabled={!permissions.standardUser.enabled}
                  options={[{ value: '-EU', label: '-EU' }]}
                  style={{ width: 130 }}
                />
              </div>
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.ruleAdmin.enabled}
                  onChange={(e) => toggleRole('ruleAdmin', e.target.checked)}
                >
                  Rule Admin
                </Checkbox>
              </div>
              <div className="hua-perm-market">
                <Select
                  className="hua-select"
                  value={permissions.ruleAdmin.market || undefined}
                  onChange={(val) => updatePermission('ruleAdmin', 'market', val)}
                  disabled={!permissions.ruleAdmin.enabled}
                  placeholder="Select market"
                  options={marketOptions}
                  allowClear
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.templateAdmin.enabled}
                  onChange={(e) => toggleRole('templateAdmin', e.target.checked)}
                >
                  Template Admin
                </Checkbox>
              </div>
              <div className="hua-perm-market">
                <Select
                  className="hua-select"
                  value={permissions.templateAdmin.market || undefined}
                  onChange={(val) => updatePermission('templateAdmin', 'market', val)}
                  disabled={!permissions.templateAdmin.enabled}
                  placeholder="Select market"
                  options={marketOptions}
                  allowClear
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.documentAuthAdmin.enabled}
                  onChange={(e) => toggleRole('documentAuthAdmin', e.target.checked)}
                >
                  Document Auth Admin
                </Checkbox>
              </div>
              <div className="hua-perm-market">
                <Select
                  className="hua-select"
                  value={permissions.documentAuthAdmin.market || undefined}
                  onChange={(val) => updatePermission('documentAuthAdmin', 'market', val)}
                  disabled={!permissions.documentAuthAdmin.enabled}
                  placeholder="Select market"
                  options={marketOptions}
                  allowClear
                  style={{ width: 200 }}
                />
              </div>
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.userAdmin.enabled}
                  onChange={(e) => toggleRole('userAdmin', e.target.checked)}
                >
                  User Admin
                </Checkbox>
              </div>
              <div className="hua-perm-market" />
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.adaptationUser.enabled}
                  onChange={(e) => toggleRole('adaptationUser', e.target.checked)}
                >
                  Adaptation user
                </Checkbox>
              </div>
              <div className="hua-perm-market">
                <Select
                  className="hua-select"
                  value={permissions.adaptationUser.market || '-EU'}
                  onChange={(val) => updatePermission('adaptationUser', 'market', val)}
                  disabled={!permissions.adaptationUser.enabled}
                  options={[{ value: '-EU', label: '-EU' }]}
                  style={{ width: 130 }}
                />
              </div>
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <Checkbox
                  checked={permissions.manageVariableList.enabled}
                  onChange={(e) => toggleRole('manageVariableList', e.target.checked)}
                >
                  Manage Variable List
                </Checkbox>
              </div>
              <div className="hua-perm-market" />
            </div>

            <div className="hua-permission-row">
              <div className="hua-perm-check">
                <span className="hua-market-super-label">Market Super User</span>
              </div>
              <div className="hua-perm-market">
                <Select
                  className="hua-select"
                  value={permissions.marketSuperUser.enabled ? (permissions.marketSuperUser.market || undefined) : undefined}
                  onChange={selectMarketSuperUser}
                  placeholder="Select market super user"
                  options={marketOptions}
                  allowClear
                  style={{ width: 200 }}
                />
              </div>
            </div>
          </div>

          <div className="hua-buttons">
            <Button
              className="hua-btn hua-btn-update"
              onClick={handleUpdateRoleClick}
              loading={isLoading}
            >
              Update Role
            </Button>
            <Button
              className="hua-btn hua-btn-delete"
              onClick={handleDeleteRoleClick}
              loading={isLoading}
            >
              Delete Role
            </Button>
          </div>
        </div>
      </div>

      <div className="hua-footer">
        HDoc support: <a href="mailto:support.tpi@volvo.com" className="hua-footer-link">support.tpi@volvo.com</a>
      </div>
    </div>
  );
};

export default HDocUserAdministration;
