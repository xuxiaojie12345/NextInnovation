import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../common/css/common.css';
import './VinPlate.css';

interface VinPlateInfo {
  type: string;
  status: string;
  msg: string;
  registerDatetime: string;
  docReady: string;
  docSent: string;
  xmlDoc: string;
}

interface PrintItem {
  name: string;
  value: string;
}

interface VpDataItem {
  variantName: string;
  value: string;
}

const VinPlate: React.FC = () => {
  // ── 表单状态 ──
  const [chassisNumber, setChassisNumber] = useState('');

  // ── 显示数据状态 ──
  const [vinPlateInfo, setVinPlateInfo] = useState<VinPlateInfo | null>(null);
  const [printItems, setPrintItems] = useState<PrintItem[]>([]);
  const [vpData, setVpData] = useState<VpDataItem[]>([]);

  // ── UI 状态 ──
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ── 成功消息自动消失 ──
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 3000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const clearMessages = () => {
    setMessage('');
    setSuccessMessage('');
  };

  // ── 解析 Chassis number 为 serie 和 chnr ──
  const parseChassis = (value: string): { serie: string; chnr: string } => {
    const trimmed = value.trim();
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      return { serie: parts[0], chnr: parts.slice(1).join(' ') };
    }
    // If only one part, try splitting by dash
    const dashParts = trimmed.split('-');
    if (dashParts.length >= 2) {
      return { serie: dashParts[0], chnr: dashParts.slice(1).join('-') };
    }
    return { serie: trimmed, chnr: '' };
  };

  // ── 解析 XML_DOC（简单XML解析） ──
  const parseXmlDoc = (xmlStr: string) => {
    const items: PrintItem[] = [];
    const vpDataItems: VpDataItem[] = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');

      // Parse PrintItemName elements
      const printItemElements = xmlDoc.getElementsByTagName('PrintItemName');
      for (let i = 0; i < printItemElements.length; i++) {
        const el = printItemElements[i];
        items.push({
          name: el.textContent || '',
          value: el.getAttribute('value') || '',
        });
      }

      // Parse Variant elements
      const variantElements = xmlDoc.getElementsByTagName('Variant');
      for (let i = 0; i < variantElements.length; i++) {
        const el = variantElements[i];
        vpDataItems.push({
          variantName: el.getAttribute('name') || '',
          value: el.textContent || '',
        });
      }
    } catch {
      // If XML parsing fails, show raw text
      items.push({ name: 'Raw XML', value: xmlStr });
    }

    setPrintItems(items);
    setVpData(vpDataItems);
  };

  // ── View Info ──
  const handleViewInfo = async () => {
    clearMessages();

    if (!chassisNumber.trim()) {
      setMessage('Chassis number is required.');
      return;
    }

    const { serie, chnr } = parseChassis(chassisNumber);

    setIsLoading(true);
    setHasSearched(true);
    setVinPlateInfo(null);
    setPrintItems([]);
    setVpData([]);

    try {
      const res = await api.post<VinPlateInfo>('/ud15/viewInfo', {
        serie,
        chnr,
      });

      if (res.code === 200 && res.data) {
        setVinPlateInfo(res.data);

        // Parse XML_DOC if present
        if (res.data.xmlDoc) {
          parseXmlDoc(res.data.xmlDoc);
        }

        setSuccessMessage('VIN Plate information loaded successfully.');
      } else {
        setMessage('Chassis record not found.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── 执行操作（Set Regenerate / Set OK / Change to Basic / Change to Advanced） ──
  const executeAction = async (endpoint: string, successMsg: string) => {
    clearMessages();

    if (!chassisNumber.trim()) {
      setMessage('Chassis number is required.');
      return;
    }

    const { serie, chnr } = parseChassis(chassisNumber);

    setIsLoading(true);
    try {
      const res = await api.post(endpoint, { serie, chnr });

      if (res.code === 200) {
        setSuccessMessage(successMsg);
        // Refresh info after action
        await handleViewInfo();
      } else {
        setMessage(res.msg || 'Operation failed.');
      }
    } catch {
      setMessage('System error. Please contact administrator.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetRegenerate = () => executeAction('/ud15/setRegenerate', 'Status updated to regenerate.');
  const handleSetOk = () => executeAction('/ud15/setOk', 'Status updated to OK.');
  const handleChangeToBasic = () => executeAction('/ud15/changeToBasic', 'Type changed to Basic Info.');
  const handleChangeToAdvanced = () => executeAction('/ud15/changeToAdvanced', 'Type changed to Advanced Info.');

  // ── 状态/类型映射 ──
  const getStatusText = (status: string): string => {
    switch (status) {
      case '0': return 'Regenerate';
      case '1': return 'OK';
      default: return status || '-';
    }
  };

  const getTypeText = (type: string): string => {
    switch (type) {
      case '1': return 'Basic Info';
      case '2': return 'Advanced Info';
      default: return type || '-';
    }
  };

  return (
    <div className="vp-container">
      <div className="vp-header">
        <h1>Vin Plate</h1>
      </div>

      {message && <div className="vp-error">{message}</div>}
      {successMessage && <div className="vp-success">{successMessage}</div>}

      {/* ── 输入区域 ── */}
      <div className="vp-input-section">
        <div className="vp-row">
          <span className="vp-label">Chassis number</span>
          <input
            type="text"
            className="vp-input"
            value={chassisNumber}
            onChange={(e) => setChassisNumber(e.target.value)}
            maxLength={15}
            placeholder="e.g. FH 123456"
            disabled={isLoading}
          />
        </div>

        <div className="vp-btn-row">
          <button className="btn" onClick={handleViewInfo} disabled={isLoading}>View Info</button>
          <button className="btn" onClick={handleSetRegenerate} disabled={isLoading}>Set Regenerate</button>
          <button className="btn" onClick={handleSetOk} disabled={isLoading}>Set OK</button>
          <button className="btn" onClick={handleChangeToBasic} disabled={isLoading}>Change to Basic Info</button>
          <button className="btn" onClick={handleChangeToAdvanced} disabled={isLoading}>Change to Advanced Info</button>
        </div>
      </div>

      {/* ── 信息展示区域 ── */}
      {hasSearched && vinPlateInfo && (
        <div className="vp-info-section">
          <table className="vp-info-table">
            <tbody>
              <tr>
                <td className="vp-info-label">Chassis number</td>
                <td className="vp-info-value">{chassisNumber.trim()}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Plate type</td>
                <td className="vp-info-value">{getTypeText(vinPlateInfo.type)}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Status</td>
                <td className="vp-info-value">{getStatusText(vinPlateInfo.status)}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Error Message</td>
                <td className="vp-info-value">{vinPlateInfo.msg || '-'}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Def.</td>
                <td className="vp-info-value">{vinPlateInfo.registerDatetime || '-'}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Data ready</td>
                <td className="vp-info-value">{vinPlateInfo.docReady || '-'}</td>
              </tr>
              <tr>
                <td className="vp-info-label">Sent to CAB factory</td>
                <td className="vp-info-value">{vinPlateInfo.docSent || '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* ── Print items ── */}
          {printItems.length > 0 && (
            <div className="vp-xml-section">
              <h3 className="vp-xml-title">Print items</h3>
              <table className="vp-xml-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {printItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── VP Data ── */}
          {vpData.length > 0 && (
            <div className="vp-xml-section">
              <h3 className="vp-xml-title">VP Data</h3>
              <table className="vp-xml-table">
                <thead>
                  <tr>
                    <th>Variant Name</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {vpData.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.variantName}</td>
                      <td>{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 未搜索到记录 ── */}
      {hasSearched && !vinPlateInfo && !isLoading && (
        <div className="vp-no-data">Chassis record not found.</div>
      )}
    </div>
  );
};

export default VinPlate;
