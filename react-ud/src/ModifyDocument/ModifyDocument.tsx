import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ModifyDocument.css';

const ModifyDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [chassisNo, setChassisNo] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [chassisSerie, setChassisSerie] = useState<string>('');
  const [dataTableList, setDataTableList] = useState<Array<{
    variable: string;
    description: string;
    currentValue: string;
    modifiedValue: string;
  }>>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const state = location.state as any;
    if (state && state.chassisNo && state.market && state.userId) {
      setChassisNo(state.chassisNo);
      setMarket(state.market);
      setUserId(state.userId);

      const combinedNo = state.chassisNo as string;
      const serie = combinedNo.replace(/[0-9]/g, '');
      const chNo = combinedNo.replace(/[^0-9]/g, '');
      setChassisSerie(serie);

      fetchVariableModificationData(serie, chNo);
    } else {
      setIsLoading(false);
    }
  }, [location.state]);

  const fetchVariableModificationData = async (serieParam: string, chnoParam: string) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post('http://localhost:8081/api/ud05/selecthdocadcamodification', {
        serie: serieParam,
        chno: chnoParam
      });

      if (response.data.code === 200) {
        const data = response.data.data;
        const list = Array.isArray(data) ? data : [data];

        const mappedList = list.map((item: any) => ({
          variable: item.variable || '',
          description: item.description || '',
          currentValue: item.newval || '',
          modifiedValue: ''
        }));

        setDataTableList(mappedList);
      } else {
        setErrorMessage(response.data.msg || '情报取得失败');
      }
    } catch (error: any) {
      if (error.response) {
        setErrorMessage(error.response.data?.msg || '情报取得失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('系统维护中，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifiedValueChange = (index: number, value: string) => {
    setDataTableList(prevList => {
      const newList = [...prevList];
      newList[index] = { ...newList[index], modifiedValue: value };
      return newList;
    });
    if (errorMessage) setErrorMessage('');
  };

  const handleTemplateFileClick = () => {
    window.open('/api/download/template/aus_UD_TEST.odt', '_blank');
  };

  const handleChassisNoClick = () => {
    navigate('/HdocMenu/VehicleSpecification', { state: { userId, chassisNo } });
  };

  const handleSaveClick = async () => {
    const hasModifiedValue = dataTableList.some(row => row.modifiedValue.trim() !== '');
    if (!hasModifiedValue) {
      setErrorMessage('NO UNRELEASED VERSION EXISTS!');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const updatePromises = dataTableList
        .filter(row => row.modifiedValue.trim() !== '')
        .map(async (row) => {
          return await axios.post('http://localhost:8081/api/ud05/updatehdocadcamodification', {
            serie: chassisSerie,
            chno: chassisNo.replace(/[^0-9]/g, ''),
            newval: row.modifiedValue,
            description: row.description,
            updateUser: userId,
            updateProcess: 'UD05ModifyDocument'
          });
        });

      await Promise.all(updatePromises);

      const modifiedData = dataTableList.filter(row => row.modifiedValue.trim() !== '');
      navigate('/HdocMenu/SaveModifications', {
        state: { userId, chassisNo, chassisSerie, modifiedData }
      });

    } catch (error: any) {
      if (error.response) {
        setErrorMessage(error.response.data?.message || '情报更新失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('系统维护中，请稍后重试');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='md-container'>
      <div className='md-content'>
        <h2 className='md-page-title'>Modify Document</h2>

        {errorMessage && errorMessage.trim() !== '' && (
          <div className='md-error'>{errorMessage}</div>
        )}

        {isLoading ? (
          <div className='md-loading'>加载中...</div>
        ) : (
          <>
            <div className='md-info-row'>
              <span className='md-label'>Chassis no:</span>
              <a href='#' className='md-link' onClick={(e) => { e.preventDefault(); handleChassisNoClick(); }}>
                {chassisNo}
              </a>
            </div>

            <div className='md-info-row'>
              <span className='md-label'>Market:</span>
              <span className='md-value'>{market}</span>
            </div>

            <div className='md-info-row'>
              <span className='md-label'>Template:</span>
              <a href='#' className='md-link' onClick={handleTemplateFileClick}>
                aus/UD_TEST.odt
              </a>
            </div>

            <div className='md-table-container'>
              <div className='md-btn-container'>
                <button className='md-save-btn' onClick={handleSaveClick} disabled={isSaving}>
                  {isSaving ? '保存中...' : 'Save'}
                </button>
              </div>

              <div className='md-table-wrapper'>
                <table className='md-table'>
                  <thead>
                    <tr>
                      <th className='md-col-variable'>Variable</th>
                      <th className='md-col-description'>Description</th>
                      <th className='md-col-current'>Current value</th>
                      <th className='md-col-modified'>Modified value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataTableList.map((row, index) => (
                      <tr key={index}>
                        <td className='md-col-variable'>{row.variable}</td>
                        <td className='md-col-description'>{row.description}</td>
                        <td className='md-col-current'>{row.currentValue}</td>
                        <td className='md-col-modified'>
                          <input
                            type='text'
                            className='md-input'
                            value={row.modifiedValue}
                            onChange={(e) => handleModifiedValueChange(index, e.target.value)}
                            maxLength={500}
                            disabled={isSaving}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ModifyDocument;
