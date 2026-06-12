package com.web.app.dto;

import lombok.Data;

@Data
public class UD07VehicleSpecificationResponse {
    private int code;
    private String msg;
    private DataInfo data;

    @Data
    public static class DataInfo {
        private String model;
        private String builtWeek;
        private String productType;
        private String vin;
        private String engineNo;
        private String countryOfOperation;
        private String symbolStr;
        private String description;
        private String sNoteNo;
    }

    public static UD07VehicleSpecificationResponse success(DataInfo data) {
        UD07VehicleSpecificationResponse res = new UD07VehicleSpecificationResponse();
        res.setCode(200);
        res.setMsg("Success");
        res.setData(data);
        return res;
    }

    public static UD07VehicleSpecificationResponse error(String msg) {
        UD07VehicleSpecificationResponse res = new UD07VehicleSpecificationResponse();
        res.setCode(400);
        res.setMsg(msg);
        return res;
    }
}
