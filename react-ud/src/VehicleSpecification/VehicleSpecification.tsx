// VehicleSpecification.tsx
// 描述：Vehicle Specification(VDA 车辆仕样)画面组件。
// 功能：Modify Document 画面点击 [chassis no] 超链接后迁移至本画面，
//       显示车辆基本信息与仕样代码一览（参照内部設計書 4.3 / 画面式样图 Vehicle Specification.png）。
import React from 'react';
import './VehicleSpecification.css';

/** 车辆基本信息（画面上部两列信息区） */
export interface VehicleSpecificationInfo {
  /** Chassis no（例：JPCT 028321） */
  chassisNo: string;
  /** Model（例：UD-MDE） */
  model: string;
  /** Built week（例：2018） */
  builtWeek: string;
  /** Product type（例：UE 42 R） */
  productType: string;
  /** VIN（例：JPCYZ50A2LT028321） */
  vin: string;
  /** Engine no（例：517457） */
  engineNo: string;
  /** Country of Operation（例：AUS） */
  countryOfOperation: string;
}

/** 信息行（标签 + 值） */
interface SpecInfoLine {
  label: string;
  value: string;
}

/** 车辆基本信息假数据（参照画面式样图 Vehicle Specification.png） */
const MOCK_VEHICLE_INFO: VehicleSpecificationInfo = {
  chassisNo: 'JPCT 028321',
  model: 'UD-MDE',
  builtWeek: '2018',
  productType: 'UE 42 R',
  vin: 'JPCYZ50A2LT028321',
  engineNo: '517457',
  countryOfOperation: 'AUS',
};

/** 仕样代码一览假数据（7 列，参照画面式样图 Vehicle Specification.png） */
const MOCK_SPEC_ROWS: string[][] = [
  ['B3-MDV', 'UE 42 R', 'TYPE-CL', '4x2', 'RA11', 'FA10', 'RIGID'],
  ['BRAND-UD', 'TC-DISTR', 'RC-SMOUT', 'GW17500', 'ALT12000', 'GQW32.0', 'UEGR'],
  ['ENG-DB', 'F6.5', 'RALTI', 'STWPB-R', '600000', 'FFL1212', 'RAP8890'],
  ['FAM-2890', 'BZ2500', 'WM2500', 'NR-80EC', 'ATU-YH', 'D82620', 'ETR1190'],
  ['FLYTH_AE2', 'OIL-ST_B', 'FUPFL', 'FUEPFLW', 'UFLWELB', 'DIESEL', 'FUEL255'],
  ['F/M-1090', 'LUB-PLT', 'STAB-F', '16-10-C', 'ED-F', 'N-L', 'DEF-EQP'],
  ['EM-BRK', 'EM-EXU', 'ESV-0', 'EAR-DR', 'EAS-SCR', 'SPEED100', 'GR0SEC'],
  ['FCA-10', 'ENGRPT', 'OBDEC1', 'OBDEP-A', '24V', '2BATT110', 'UTAS'],
  ['24AL90B', 'UESTAID', 'DRL-HAL', 'POSLMP-W', 'UDILOAM', 'TL-IRF', 'INLI-BAS'],
  ['MARKLR-SR', 'UWARNLIG', 'FOGL-WB', 'DL24.12', 'UCIGARL1', 'DRIO-USB', 'UAESS'],
  ['ELS-BPB-', 'ECBS-BAB', 'AUXSW-3', 'DIFL-ENG', 'DSL-ESP', 'BUPALARM', 'AUD-PK4'],
  ['TGW-3GLW', 'UDAE', 'UCLTCH', 'TRA-APS', 'AL306', 'TRAN-AMD', 'GSS-GB'],
  ['PSBR1-03', 'PSBR2-05', 'PSPB1-C', 'PSPB2-H', 'PROPS-M', 'PFL1350', 'PLS1000'],
  ['MPL1775', 'MPRO-FX2', 'SRED-M', 'R55513ZD', 'RAT5.57', 'UPTOTRA', 'UTPTT'],
  ['UPTOTR', 'UEPTT', 'UPTER', 'UPTCNGR', 'PTOC-UK', 'TC-HW0', 'TCCMP500'],
  ['TRBRAKE2', 'UTECABLE', 'TREL-7', 'URET', 'ABS', 'STG22.4', 'RAD-L80D'],
  ['UBSR', 'UCBYLPRO', 'ULIFT', 'FRAM-SPL', 'FST8000', 'FRAME238', 'RFL2845'],
  ['UFIL', 'ACMR2', 'IACMF360', 'ZACW210', 'SWCP-R', 'UMRUP', 'URUP'],
  ['FUP', 'FST-PAR', 'RST-MUL', 'RSS-LEA', 'RZH1325', 'FIH180', 'RSHAB8'],
  ['FSTAB', 'UWSDP3', 'WTD22.5', 'WTD22-S', 'WHIF-S', 'WHDPD', 'WTD22.5'],
  ['TBTORQ', 'USTRB5', 'IAF', '20-4-07', 'STD-TF', 'WWPM', 'D2215'],
  ['UDHT3', 'WTMD-AL', 'TMBB-FD', 'TMB-BD', 'FBR70228', 'TID1', 'TMD-BRID'],
  ['DBR70249', 'UIT', 'UTR', 'UTRT', 'UNIFLAD', '8101-H11', 'CAB-MED'],
  ['CAB-SLP', 'RCABS-M', 'LOAD-CL', 'WLF-DL', 'UREF-EFL', 'MIR-FF3', 'MIR-ELOP'],
  ['AMR-WB', 'AMR-F20', 'AMR-SB2', 'UMRTRXT', 'DST-STD9', 'UTIPCO', 'ARMER-DS'],
  ['APST', 'LBK52', 'FMU0-AS', 'CU-MCC7', 'UWARNTRI', 'VFLT-44', 'VUPT-A2'],
  ['DF-FUELM', 'DF-POSM', 'UNTIMIR', 'FUS-BAS', 'CR-BRW', 'AIRBAG', 'SBPRE-DS'],
  ['ISUN-FB', 'TOWF-NO1', 'UFIREXT', 'JACK-12T', 'TOOL-BAS', 'UT00LB', 'PUBL-GBR'],
  ['MPLA-ENG', 'UPUBS', 'LANG-ENG', 'WAR200', 'PSCAT', 'USWMOUNT', 'U5WEIHG'],
  ['UKPJSIZE', 'U5WTYPE', 'TOWR-ONE', 'B-YANC', 'UCRANEPC', 'HBA-FSFB', 'COD-AUS'],
  ['PROPCALC', 'AUS', 'RECALC', 'FACT-TH3', '101000MM', '', ''],
];

/** VehicleSpecification 画面 Props */
interface VehicleSpecificationProps {
  /** Chassis no（由 Modify Document 画面传入；缺省时使用假数据） */
  chassisNo?: string;
  /** 车辆基本信息（缺省时使用假数据） */
  info?: VehicleSpecificationInfo;
  /** 返回回调：返回 Modify Document 修正一览画面 */
  onBack?: () => void;
}

/**
 * VehicleSpecification(VDA 车辆仕样)画面组件
 * @description 显示车辆的基本信息（Chassis no / Model / VIN 等）与仕样代码一览。
 * @param props 画面参数（chassisNo / info / onBack）
 */
const VehicleSpecification: React.FC<VehicleSpecificationProps> = ({
  chassisNo,
  info,
  onBack,
}) => {
  // 基本信息：优先使用 props 传入，缺省时使用假数据；chassisNo 单独覆盖
  const vehicleInfo: VehicleSpecificationInfo = {
    ...(info ?? MOCK_VEHICLE_INFO),
    ...(chassisNo ? { chassisNo } : {}),
  };

  // 上部信息区：两列（左列 / 右列），右列可为空
  const infoRows: Array<[SpecInfoLine, SpecInfoLine | null]> = [
    [
      { label: 'Chassis no', value: vehicleInfo.chassisNo },
      { label: 'Model', value: vehicleInfo.model },
    ],
    [
      { label: 'Built week', value: vehicleInfo.builtWeek },
      { label: 'Product type', value: vehicleInfo.productType },
    ],
    [
      { label: 'VIN', value: vehicleInfo.vin },
      { label: 'Engine no', value: vehicleInfo.engineNo },
    ],
    [
      { label: 'Country of Operation', value: vehicleInfo.countryOfOperation },
      null,
    ],
  ];

  /** 情报行渲染（标签 + 值） */
  const renderInfoLine = (line: SpecInfoLine) => (
    <span className='veh-spec__info-line'>
      <span className='veh-spec__info-label'>{line.label}:</span>
      <span className='veh-spec__info-value'>{line.value}</span>
    </span>
  );

  return (
    <div className='veh-spec'>
      {/* 内容区：浅蓝色边框矩形（与 Generate document 画面风格统一） */}
      <div className='veh-spec__card'>
        {/* 画面标题：深蓝粗体 */}
        <h1 className='veh-spec__title'>VDA - Vehicle Specification:</h1>

        {/* 车辆基本信息区（两列） */}
        <div className='veh-spec__info'>
          {infoRows.map((infoRow, index) => (
            <div className='veh-spec__info-row' key={`info-row-${index}`}>
              {renderInfoLine(infoRow[0])}
              {infoRow[1] && renderInfoLine(infoRow[1])}
            </div>
          ))}
        </div>

        {/* 仕样代码一览（7 列栅格） */}
        <div className='veh-spec__grid'>
          {MOCK_SPEC_ROWS.map((specRow, rowIndex) => (
            <div className='veh-spec__grid-row' key={`spec-row-${rowIndex}`}>
              {specRow.map((cell, cellIndex) => (
                <span
                  className='veh-spec__grid-cell'
                  key={`spec-cell-${rowIndex}-${cellIndex}`}
                >
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* 返回按钮：返回 Modify Document 修正一览画面（浅灰色，与 Generate document 按钮统一） */}
        {onBack && (
          <button
            type='button'
            className='veh-spec__button'
            onClick={onBack}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default VehicleSpecification;
