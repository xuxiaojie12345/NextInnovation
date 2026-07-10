package com.web.app.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocSendDataVinPlate {
  private String serie;
  private String chnr;
  private String pc;
  private LocalDate added;
  private LocalDate docReady;
  private LocalDate docSent;
  private String bu;
  private Integer status;
  private String xmlDoc;
  private String msg;
  private String type;
  private String isJsDivision;
  private String ordernumber;
  private String filenameOnDisk;
  private String adcaChangeFlg;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
