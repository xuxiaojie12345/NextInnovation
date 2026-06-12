package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocRecDataVdaGeneral {
    private String serie;
    private String chnr;
    private String transTs;
    private String vin;
    private String countryOfOperation;
    private String registrationNumber;
    private String deliveryDate;
    private String brandId;
    private String pc;
    private String productType;
    private String companyCode;
    private String marketingType;
    private String mainSpecWeek;
    private String bodySpecWeek;
    private String buildWeek;
    private String usingEndCustomerId;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
