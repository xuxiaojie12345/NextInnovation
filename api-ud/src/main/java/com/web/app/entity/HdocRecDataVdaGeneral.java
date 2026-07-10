package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
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
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
