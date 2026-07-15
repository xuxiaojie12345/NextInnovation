import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/config';
import './UD07_VehicleSpecification.css';

/** 单条KOLA变体项 */
interface KolaVariantItem {
  symbol: string;
  description: string;
}

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
  /** 已格式化的一一对应的KOLA变体列表 */
  kolaItems: KolaVariantItem[];
  sNoteNo: string;
  message: string;
  isLoading: boolean;
}

/**
 * UD07 Vehicle Specification 页面组件
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
    kolaItems: [],
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
        message: 'We can not get the OM_data. Please try again.',
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

        const kolaVariants = data.kolaVariants || [];
        // 构建一一对应的symbol+description列表
        const kolaItems: KolaVariantItem[] = kolaVariants
          .map((item: any) => {
            const rawSymbol = String(item.symbol || '');
            // 不足8字符右侧补空格，超过8字符截取前8位
            const symbol = rawSymbol.length >= 8
              ? rawSymbol.substring(0, 8)
              : rawSymbol.padEnd(8, ' ');
            return { symbol, description: item.description || '' };
          })
          .filter((item: KolaVariantItem) => item.symbol.trim().length > 0);

        setState(prev => ({
          ...prev,
          model: data.model || '',
          builtWeek: data.buildWeek || '',
          productType: data.product_type || data.productType || '',
          vin: data.vin || '',
          engineNo: data.engine_no || data.engineNo || '',
          countryOfOperation: data.country_of_operation || data.countryOfOperation || '',
          kolaItems,
          sNoteNo: data.customer_adap || data.customerAdap || '',
          message: '',
          isLoading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          message: 'We can not get the OM_data. Please try again..',
          isLoading: false,
        }));
      }
    } catch (error: any) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          <div className='ud07-symbol'>
            {state.kolaItems.length > 0 ? (
              state.kolaItems.map((item, idx) => (
                <span
                  key={idx}
                  className='ud07-symbol-line'
                  title={item.description || 'No description available'}
                >
                  {item.symbol}
                </span>
              ))
            ) : (
              <span className='ud07-symbol-line'>-</span>
            )}
          </div>
        </div>

        <div className='ud07-snote'>{state.sNoteNo || '-'}</div>

      </div>
    </div>
  );
};

export default UD07_VehicleSpecification;
