package com.web.app.domain;

import java.util.List;

/**
 * UD05ModifyDocumentApi 查询响应DTO
 * 对应详细设计：DES-ModifyDocument-001
 * 返回变量列表（Variable、Description、Current value、Modified value）
 */
public class ModifyDocumentQueryResponse {

    /** 底盘编号 */
    private String chassisNo;

    /** 市场信息 */
    private String market;

    /** 模板文件名 */
    private String templateFile;

    /** 变量列表 */
    private List<VariableInfo> variables;

    public String getChassisNo() {
        return chassisNo;
    }

    public void setChassisNo(String chassisNo) {
        this.chassisNo = chassisNo;
    }

    public String getMarket() {
        return market;
    }

    public void setMarket(String market) {
        this.market = market;
    }

    public String getTemplateFile() {
        return templateFile;
    }

    public void setTemplateFile(String templateFile) {
        this.templateFile = templateFile;
    }

    public List<VariableInfo> getVariables() {
        return variables;
    }

    public void setVariables(List<VariableInfo> variables) {
        this.variables = variables;
    }

    /**
     * 变量信息内部类
     */
    public static class VariableInfo {

        /** 变量名 */
        private String variable;

        /** 描述，来自HDOC_VARIABLES表的DESCRIPTION字段 */
        private String description;

        /** 当前值，从HDOC_ADCA_MODIFICATION表获取NEWVAL */
        private String currentValue;

        /** 修改后的值，对应HDOC_ADCA_MODIFICATION表的NEWVAL字段 */
        private String modifiedValue;

        public String getVariable() {
            return variable;
        }

        public void setVariable(String variable) {
            this.variable = variable;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCurrentValue() {
            return currentValue;
        }

        public void setCurrentValue(String currentValue) {
            this.currentValue = currentValue;
        }

        public String getModifiedValue() {
            return modifiedValue;
        }

        public void setModifiedValue(String modifiedValue) {
            this.modifiedValue = modifiedValue;
        }
    }
}
