/**
 * OperatorSelect 组件
 * 通用的运算符下拉选择器，用于搜索条件中的运算符选择
 */
import React from 'react';

/** 普通字段运算符：= 或 != */
export type Operator = '=' | '!=';

/** 数值/日期字段运算符：支持 =、>、< 三种比较 */
export type CompareOperator = '=' | 'GT' | 'LT';

interface OperatorSelectProps {
  value: Operator;
  onChange: (value: Operator) => void;
  className?: string;
}

interface CompareOperatorSelectProps {
  value: CompareOperator;
  onChange: (value: CompareOperator) => void;
  className?: string;
}

/**
 * 普通运算符下拉框（= / !=）
 */
// OperatorSelect

const OperatorSelect: React.FC<OperatorSelectProps> = ({ value, onChange, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value as Operator)}
    className={className}
  >
    <option value="=">=</option>
    <option value="!=">!=</option>
  </select>
);

/**
 * 数值/日期字段专用运算符下拉框（= / > / <）
 */
// CompareOperatorSelect

export const CompareOperatorSelect: React.FC<CompareOperatorSelectProps> = ({ value, onChange, className }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value as CompareOperator)}
    className={className}
  >
    <option value="=">=</option>
    <option value="GT">&gt;</option>
    <option value="LT">&lt;</option>
  </select>
);

// OperatorSelect

export default OperatorSelect;
