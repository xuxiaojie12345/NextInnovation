package com.web.app.domain;

import java.util.List;

/**
 * UD07车辆规格信息响应对象
 * 对应详细设计：DES-VehicleSpecification-001
 * 
 * 包含车辆基本信息、发动机/符号信息、S-Note信息
 */
public class VehicleSpecificationResponse {
    
    /** 车辆基本信息 */
    private ChassisInfo chassisInfo;
    
    /** 发动机信息 */
    private EngineInfo engineInfo;
    
    /** S-Note列表 */
    private List<SNote> sNotes;

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

    public List<SNote> getSNotes() {
        return sNotes;
    }

    public void setSNotes(List<SNote> sNotes) {
        this.sNotes = sNotes;
    }

    /**
     * 车辆基本信息
     */
    public static class ChassisInfo {
        private String chassisNo;
        private String model;
        private String buildWeek;
        private String productType;
        private String vin;
        private String countryOfOperation;
        private String familyId;
        private String variantId;

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
    }

    /**
     * 发动机/符号信息
     */
    public static class EngineInfo {
        private String engineNo;
        private String symbolStr;
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

    /**
     * S-Note信息
     */
    public static class SNote {
        private String noteNo;
        private String description;

        public String getNoteNo() {
            return noteNo;
        }

        public void setNoteNo(String noteNo) {
            this.noteNo = noteNo;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }
}
