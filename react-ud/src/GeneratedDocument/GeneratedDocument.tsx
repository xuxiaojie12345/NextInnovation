import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GeneratedDocument.css';

/**
 * GeneratedDocument组件 - 车辆认证文档信息显示页面
 * 
 * @description 展示从多个数据表获取的底盘相关信息，提供文档下载和跳转功能
 * @props 无Props，通过路由state接收参数
 */
const GeneratedDocument: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 状态管理 (对应设计书 7. 实现注意事项)
  const [chassisNo, setChassisNo] = useState<string>('');
  const [chassisSeries, setChassisSeries] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [ordernumber, setOrdernumber] = useState<string>('');
  const [buildWeek, setBuildWeek] = useState<string>('');
  const [specWeek, setSpecWeek] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [sNoteNo, setSNoteNo] = useState<string>('');
  const [sNoteMessage, setSNoteMessage] = useState<string>('');
  const [loadIndex, setLoadIndex] = useState<string>('');
  const [modifyDocLinkActive, setModifyDocLinkActive] = useState<boolean>(false);
  const [usingTemplate] = useState<string>('[/eu/VIN_PLATE_UD_TRUCKS_TSA_INDO_PHIL.rtf]');
  const [replacingParameters, setReplacingParameters] = useState<string>('');
  const [generatedDocumentUrl, setGeneratedDocumentUrl] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [hdocVersion] = useState<string>('4.2.1');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * 画面初期表示 - 从路由state获取参数并调用API
   * 对应设计书 3.1 画面初期表示
   */
  useEffect(() => {
    // 从路由state中获取参数
    const state = location.state as any;
    if (state && state.chassisNo && state.chassisSeries && state.userId) {
      setChassisNo(state.chassisNo);
      setChassisSeries(state.chassisSeries);
      setUserId(state.userId);
      
      // 设置当前系统时间
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setCurrentDate(formattedDate);
      
      // 调用API获取数据
      fetchDocumentData(state.chassisNo, state.chassisSeries);
    } else {
      setErrorMessage('');
      setIsLoading(false);
    }
  }, [location.state]);

  /**
   * 调用UD04SelectHcocRecDataOmApi获取文档数据
   * 对应设计书 5.1 UD04SelectHcocRecDataOmApi
   * 
   * @param chassisNoParam 底盘号
   * @param chassisSeriesParam 底盘系列
   */
  const fetchDocumentData = async (chassisNoParam: string, chassisSeriesParam: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // API请求 (对应设计书 5. 接口定义)
      const response = await axios.post('/api/UD04/ud04/select-hcoc-rec-data-om', {
        ChassisNo: chassisNoParam,
        ChassisSeries: chassisSeriesParam
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // 映射返回的数据到状态变量 (对应设计书 4.1 处理流程)
        setOrdernumber(data.ordernumber || '');
        setBuildWeek(data.build || '');
        setSpecWeek(data.spec || '');
        setMarket(data.countryOfOperation || '');
        setSNoteNo(data.customerAdap || '');
        setLoadIndex(data.loadIndex || '');
        
        // 判断Modify Doc Link是否激活 (对应设计书 4.2 校验详细规格表)
        setModifyDocLinkActive(!!data.act && data.act !== '');
        
        // 设置Replacing parameters (对应设计书 4.1.3 步骤3)
        if (data.variable) {
          setReplacingParameters(`AD Change. Modifying: ${data.variable}`);
        }
        
        // 设置S-Note Message (对应设计书 7. 实现注意事项)
        if (data.customerAdap) {
          setSNoteMessage('The S-Notes above can affect homologation documents.');
        }
        
        // 设置Generated document URL (模拟值，实际应从后端获取)
        setGeneratedDocumentUrl(`/api/download/vin-plate/${chassisNoParam}.trf`);
        
      } else {
        // API返回失败 (对应设计书 6. 异常处理)
        setErrorMessage(response.data.message || '情报取得失败');
      }
    } catch (error: any) {
      // 捕获网络错误或服务器错误 (对应设计书 6. 异常処理)
      if (error.response) {
        setErrorMessage(error.response.data?.message || '情报取得失败');
      } else if (error.request) {
        setErrorMessage('网络连接失败，请稍后重试');
      } else {
        setErrorMessage('システム维护中，请稍後重試');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Chassis no Link点击处理
   * 对应设计书 3.2 Chassis no Link押下
   */
  const handleChassisNoClick = () => {
    // 跳转到VdaVehicle Specification画面，传递userId参数
    navigate('/VehicleSpecification', { state: { userId } });
  };

  /**
   * Modify Doc Link点击处理
   * 对应設計書 3.3 Modify Doc Link押下
   */
  const handleModifyDocClick = () => {
    // 跳转到ModifyDocument画面，传递userId、chassisNo、market参数
    navigate('/ModifyDocument', { state: { userId, chassisNo, market } });
  };

  /**
   * Generated document Link点击处理
   * 对应設計書 3.4 Generated document Link押下
   */
  const handleGeneratedDocumentClick = () => {
    // 触发文件下载
    if (generatedDocumentUrl) {
      window.open(generatedDocumentUrl, '_blank');
    }
  };

  /**
   * Analyze Rules Link点击处理
   * 对应設計書 2.1 控件属性表
   */
  const handleAnalyzeRulesClick = () => {
    // TODO: 实现Analyze Rules功能
    console.log('Analyze Rules clicked');
  };

  return (
    <div className='generated-document-container'>
      <div className='generated-document-content'>
        {/* 标题 */}
        <h2 className='page-title'>Generate document</h2>
        
        {/* Error message area (对应設計書 7. 実装注意事项) */}
        {errorMessage && (
          <div className='error-message-area'>
            {errorMessage}
          </div>
        )}
        
        {/* Loading状态显示 */}
        {isLoading ? (
          <div className='loading-message'>加载中...</div>
        ) : (
          <>
            {/* Chassis no (Link类型) - 与Ordernumber间距4px */}
            <div className='chassis-no-row'>
              <span className='chassis-no-label'>Chassis no:</span>
              <a href='/VehicleSpecification' className='chassis-no-link' onClick={handleChassisNoClick}>
                {chassisSeries} {chassisNo}
              </a>
            </div>
            
            {/* Ordernumber - 与下一组间距20px */}
            <div className='ordernumber-row'>
              <span className='ordernumber-label'>Ordernumber:</span>
              <span className='ordernumber-value'>{ordernumber}</span>
            </div>
            
            {/* Build week到Master Market组 - 紧凑排列，组内间距4px */}
            <div className='build-week-row'>
              <span className='default-label'>Build week:</span>
              <span className='default-value'>{buildWeek}</span>
            </div>
            
            <div className='spec-week-row'>
              <span className='default-label'>Spec week:</span>
              <span className='default-value'>{specWeek}</span>
            </div>
            
            <div className='market-row'>
              <span className='default-label'>Market:</span>
              <span className='default-value'>{market}</span>
            </div>
            
            <div className='master-market-row'>
              <span className='default-label'>Master Market:</span>
              <span className='default-value'>-EU</span>
            </div>
            
            {/* S-Note NO (条件显示) */}
            {sNoteNo && (
              <div className='s-note-no-row'>
                <span className='default-label'>S-Note NO:</span>
                <span className='default-value'>{sNoteNo}</span>
              </div>
            )}
            
            {/* S-Note Message (条件显示) */}
            {sNoteMessage && (
              <div className='s-note-message-row'>
                {sNoteMessage}
              </div>
            )}
            
            {/* Load Index组 - 4个项目紧凑排列，组内间距4px */}
            <div className='front-load-index-row'>
              <span className='default-label'>Front load index:</span>
              <span className='default-value'>{loadIndex}</span>
            </div>
            
            <div className='front-speed-index-row'>
              <span className='default-label'>Front speed index:</span>
              <span className='default-value'>FTSI-</span>
            </div>
            
            <div className='drive-load-index-row'>
              <span className='default-label'>Drive load index:</span>
              <span className='default-value'>DTLI-143</span>
            </div>
            
            <div className='drive-speed-index-row'>
              <span className='default-label'>Drive speed index:</span>
              <span className='default-value'>DTSI-L</span>
            </div>
            
            {/* Analyze Rules (Link类型) - 与上组间距20px */}
            <div className='analyze-rules-row'>
              <a href='#' className='analyze-rules-link' onClick={handleAnalyzeRulesClick}>
                Analyze Rules
              </a>
            </div>
            
            {/* Modify Doc Link (条件显示) - 红色警告信息 */}
            {modifyDocLinkActive && (
              <div className='modify-warning-row'>
                <a href='/react-ud/src/ModifyDocument/ModifyDocument.tsx' className='modify-warning-link' onClick={handleModifyDocClick}>
                  After def change detected. Document need to be modified.
                </a>
              </div>
            )} 
            
            {/* Using template (固定值) - 与Replacing parameters间距4px */}
            <div className='using-template-row'>
              <span className='using-template-label'>Using template:</span>
              <span className='using-template-value'>{usingTemplate}</span>
            </div>
            
            {/* Replacing parameters标题 */}
            <div className='replacing-params-title-row'>
              <span className='replacing-params-title'>Replacing parameters</span>
            </div>
            
            {/* Information parameter行 */}
            {replacingParameters && (
              <div className='information-parameter-row'>
                <span className='default-label'>Information parameter:</span>
                <a href='#' className='info-param-link'>VPGVW_2</a>
                <span className='default-value'> Market: AUS overrides -EU</span>
              </div>
            )}
            
            {/* ERROR行 */}
            <div className='error-row'>
              <span className='default-label'>ERROR:</span>
              <span className='default-value'>RULE_EPC_4_8.</span>
            </div>
            
            <div className='error-row'>
              <span className='default-label'>ERROR:</span>
              <span className='default-value'>for variable RULE_EPC_4_8ERROR: Can not find RULE_EPC_4_8. No match in user defined rules..</span>
            </div>
            
            {/* Generated document (Link类型) - 与底部Date间距80px */}
            <div className='generated-doc-row'>
              <a href='#' className='generated-doc-link' onClick={handleGeneratedDocumentClick}>
                Generated document
              </a>
            </div>
            
            {/* Date - 与HDoc version间距4px */}
            <div className='date-row'>
              <span className='date-label'>Date:</span>
              <span className='date-value'>{currentDate}</span>
            </div>
            
            {/* HDoc version (固定値) */}
            <div className='hdoc-version-row'>
              <span className='hdoc-version-label'>HDoc version:</span>
              <span className='hdoc-version-value'>{hdocVersion}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GeneratedDocument;
