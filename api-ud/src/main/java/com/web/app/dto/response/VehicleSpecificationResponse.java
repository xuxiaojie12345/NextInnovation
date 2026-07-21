package com.web.app.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VehicleSpecificationResponse {
    private String chassisNo;
    private String model;
    private String builtWeek;
    private String productType;
    private String vin;
    private String engineNo;
    private String countryOfOperation;
    private String sNoteNo;
    private String sNoteDesc;
    private List<String> symbolList;
    private String symbolStr;
}
