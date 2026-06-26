import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD07_VehicleSpecification.css';

/**
 * 车辆规格页面状态对象
 */
interface VehicleSpecificationState {
  chassisNo: string;
  model: string;
  builtWeek: string;
  productType: string;
  vin: string;
  engineNo: string;
  countryOfOperation: string;
  symbolStr: string;
  description: string;
  sNoteNo: string;
  message: string;
  isLoading: boolean;
}

/**
 * UD07 Vehicle Specification 页面组件
 *
 * 功能说明：
 * - 从前画面接收 Chassis no 参数
 * - 拆分为 serie 和 chno
 * - 调用后端 API 获取车辆规格数据
 * - 显示车辆规格、SYMBOL_STR 和 DESCRIPTION 提示信息
 *
 * @component
 * @returns {JSX.Element} 车辆规格页面元素
 */
const UD07_VehicleSpecification: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState<VehicleSpecificationState>({
    chassisNo: '',
    model: '',
    builtWeek: '',
    productType: '',
    vin: '',
    engineNo: '',
    countryOfOperation: '',
    symbolStr: '',
    description: '',
    sNoteNo: '',
    message: '',
    isLoading: false,
  });

  useEffect(() => {
    const routeState = location.state as any;
    const chassisSeries = routeState?.chassisSeries || routeState?.chassisSerie || '';
    const chassisNo = routeState?.chassisNo || '';

    if (!chassisSeries || !chassisNo) {
      setState(prev => ({
        ...prev,
        message: 'We can not get the data. Please try again.',
        isLoading: false,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      chassisNo: `${chassisSeries} ${chassisNo}`,
      message: '',
      isLoading: true,
    }));

    fetchVehicleSpecificationData(chassisSeries, chassisNo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const fetchVehicleSpecificationData = async (serie: string, chno: string) => {
    try {
      const response = await apiClient.get('/api/ud07/vehiclespecification', {
        params: {
          serie,
          chno,
        }
      });

      if (response.data?.code === 200 && response.data?.data) {
        const data = response.data.data;
        console.log('UD07车辆规格数据:', data);

        const kolaVariants = data.kolaVariants || [];
        // SYMBOL_STR：取SQL中取得的symbol，保留8字符填充格式，不拼接functionGroup
        const symbolStr = kolaVariants
          .map((item: any) => {
            const rawSymbol = String(item.symbol || '');
            // 不足8字符右侧补空格，超过8字符截取前8位
            return rawSymbol.length >= 8
              ? rawSymbol.substring(0, 8)
              : rawSymbol.padEnd(8, ' ');
          })
          .filter((line: string) => line.trim().length > 0)
          .join('\n');
        const description = kolaVariants
          .map((item: any) => item.description || '')
          .filter((line: string) => line.length > 0)
          .join('\n');

        setState(prev => ({
          ...prev,
          model: data.model || '',
          builtWeek: data.buildWeek || '',
          productType: data.product_type || data.productType || '',
          vin: data.vin || '',
          engineNo: data.engine_no || data.engineNo || '',
          countryOfOperation: data.country_of_operation || data.countryOfOperation || '',
          symbolStr: symbolStr || '-',
          description: description || '-',
          sNoteNo: data.customer_adap || data.customerAdap || '',
          message: '',
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          message: 'We can not get the data. Please try again.',
          isLoading: false,
        }));
      }
    } catch (error: any) {
      console.error('获取UD07车辆规格数据失败:', error);
      let errorMessage = 'System error. Please try again later.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your network.';
      }
      setState(prev => ({
        ...prev,
        message: errorMessage,
        isLoading: false,
      }));
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className='ud07-container'>
      <div className='ud07-card'>
        <div className='ud07-header'>
          <h1>VDA - Vehicle Specification:</h1>
        </div>

        {state.message && (
          <div className='ud07-error'>{state.message}</div>
        )}

        <div className='ud07-grid'>
          <div className='ud07-item'>
            <span className='ud07-label'>Chassis no:</span>
            <span className='ud07-value'>{state.chassisNo || '-'}</span>
          </div>
          <div className='ud07-item'>
            <span className='ud07-label'>Model:</span>
            <span className='ud07-value'>{state.model || '-'}</span>
          </div>
          <div className='ud07-item'>
            <span className='ud07-label'>Built week:</span>
            <span className='ud07-value'>{state.builtWeek || '-'}</span>
          </div>
          <div className='ud07-item'>
            <span className='ud07-label'>Product type:</span>
            <span className='ud07-value'>{state.productType || '-'}</span>
          </div>
          <div className='ud07-item'>
            <span className='ud07-label'>VIN:</span>
            <span className='ud07-value'>{state.vin || '-'}</span>
          </div>
          <div className='ud07-item'>
            <span className='ud07-label'>Engine no:</span>
            <span className='ud07-value'>428628</span>
          </div>
          <div className='ud07-item'>
            <span className='ud07-label'>Country of Operation:</span>
            <span className='ud07-value'>{state.countryOfOperation || '-'}</span>
          </div>
        </div>

        <div className='ud07-block'>
          {/* <div className='ud07-block-label'>SYMBOL_STR</div> */}
          <pre className='ud07-symbol'>{state.symbolStr || '-'}</pre>
          <pre className='ud07-symbol'>{state.description}</pre>
        </div>

        {/* <div className='ud07-description'>
          <span className='ud07-block-label'>DESCRIPTION</span>
          <span className='ud07-tooltip' title={state.description || 'No description available'}>
            {state.description ? 'Hover to view description' : 'No description available'}
          </span>
        </div> */}

        <div className='ud07-snote'>{state.sNoteNo || '-'}</div>

        <button
          className='ud07-close-btn'
          onClick={handleClose}
          disabled={state.isLoading}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UD07_VehicleSpecification;
