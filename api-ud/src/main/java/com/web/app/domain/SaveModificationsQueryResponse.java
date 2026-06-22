package com.web.app.domain;

/**
 * UD06SaveModificationsApi 查询响应DTO
 * 对应详细设计：DES-SaveModifications-001
 * 返回修改信息（Doctype、Version、Storing、FOUND UNRELEASED VERSION）
 */
public class SaveModificationsQueryResponse {

    /** 底盘系列号 */
    private String chassisSerie;

    /** 底盘编号 */
    private String chassisNumber;

    /** 文档类型，来自HDOC_ADCA_MODIFICATION表的DOCTYPE字段 */
    private String doctype;

    /** 版本号，来自HDOC_ADCA_MODIFICATION表的VERS字段 */
    private String version;

    /** 存储信息，包含VARIABLE和NEWVAL */
    private StoringInfo storing;

    /** 发现的未发布版本信息 */
    private String foundUnreleasedVersion;

    public String getChassisSerie() {
        return chassisSerie;
    }

    public void setChassisSerie(String chassisSerie) {
        this.chassisSerie = chassisSerie;
    }

    public String getChassisNumber() {
        return chassisNumber;
    }

    public void setChassisNumber(String chassisNumber) {
        this.chassisNumber = chassisNumber;
    }

    public String getDoctype() {
        return doctype;
    }

    public void setDoctype(String doctype) {
        this.doctype = doctype;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public StoringInfo getStoring() {
        return storing;
    }

    public void setStoring(StoringInfo storing) {
        this.storing = storing;
    }

    public String getFoundUnreleasedVersion() {
        return foundUnreleasedVersion;
    }

    public void setFoundUnreleasedVersion(String foundUnreleasedVersion) {
        this.foundUnreleasedVersion = foundUnreleasedVersion;
    }

    /**
     * 存储信息内部类
     */
    public static class StoringInfo {

        /** 变量名 */
        private String variable;

        /** 新值 */
        private String newval;

        public String getVariable() {
            return variable;
        }

        public void setVariable(String variable) {
            this.variable = variable;
        }

        public String getNewval() {
            return newval;
        }

        public void setNewval(String newval) {
            this.newval = newval;
        }
    }
}
