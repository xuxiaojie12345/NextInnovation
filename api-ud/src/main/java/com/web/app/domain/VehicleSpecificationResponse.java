package com.web.app.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * UD07车辆规格信息响应对象
 * 对应详细设计：DES-VehicleSpecification-001
 * 
 * 包含车辆基本信息、发动机/符号信息、S-Note信息
 */
 /**

  * VehicleSpecificationResponse

  */

public class VehicleSpecificationResponse {
    
    /** 车辆基本信息 */
    private ChassisInfo chassisInfo;
    
    /** 发动机信息 */
    private EngineInfo engineInfo;
    
    /** S-Note编号 */
    private String sNoteNo;

    public ChassisInfo getChassisInfo() {
        return chassisInfo;
    }

    public void setChassisInfo(ChassisInfo chassisInfo) {
        this.chassisInfo = chassisInfo;
    }

    public EngineInfo getEngineInfo() {
        return engineInfo;
    }

    public void setEngineInfo(EngineInfo engineInfo) {
        this.engineInfo = engineInfo;
    }

    @JsonProperty("sNoteNo")
    public String getSNoteNo() {
        return sNoteNo;
    }

    public void setSNoteNo(String sNoteNo) {
        this.sNoteNo = sNoteNo;
    }

    /**
     * 车辆基本信息
     */
    public static class ChassisInfo {
    /** chassisNo */

        private String chassisNo;
        /** model */

        private String model;
        /** buildWeek */

        private String buildWeek;
        /** productType */

        private String productType;
        /** vin */

        private String vin;
        /** countryOfOperation */

        private String countryOfOperation;
        /** familyId */

        private String familyId;
        /** variantId */

        private String variantId;
        /** sNoteNo */

        private String sNoteNo;

        public String getChassisNo() {
            return chassisNo;
        }

        public void setChassisNo(String chassisNo) {
            this.chassisNo = chassisNo;
        }

        public String getModel() {
            return model;
        }

        public void setModel(String model) {
            this.model = model;
        }

        public String getBuildWeek() {
            return buildWeek;
        }

        public void setBuildWeek(String buildWeek) {
            this.buildWeek = buildWeek;
        }

        public String getProductType() {
            return productType;
        }

        public void setProductType(String productType) {
            this.productType = productType;
        }

        public String getVin() {
            return vin;
        }

        public void setVin(String vin) {
            this.vin = vin;
        }

        public String getCountryOfOperation() {
            return countryOfOperation;
        }

        public void setCountryOfOperation(String countryOfOperation) {
            this.countryOfOperation = countryOfOperation;
        }

        public String getFamilyId() {
            return familyId;
        }

        public void setFamilyId(String familyId) {
            this.familyId = familyId;
        }

        public String getVariantId() {
            return variantId;
        }

        public void setVariantId(String variantId) {
            this.variantId = variantId;
        }

        @JsonProperty("sNoteNo")
        public String getSNoteNo() {
            return sNoteNo;
        }

        public void setSNoteNo(String sNoteNo) {
            this.sNoteNo = sNoteNo;
        }
    }

    /**
     * 发动机/符号信息
     */
    public static class EngineInfo {
    /** engineNo */

        private String engineNo;
        /** symbolStr */

        private String symbolStr;
        /** description */

        private String description;

        public String getEngineNo() {
            return engineNo;
        }

        public void setEngineNo(String engineNo) {
            this.engineNo = engineNo;
        }

        public String getSymbolStr() {
            return symbolStr;
        }

        public void setSymbolStr(String symbolStr) {
            this.symbolStr = symbolStr;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }


}
