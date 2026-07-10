package com.web.app.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocAdcaModification {
  private String serie;
  private String chno;
  private String doctype;
  private String lang;
  private String variable;
  private BigDecimal vers;
  private String newval;
  private BigDecimal sta;
  private String bu;
  private String releaseUser;
  private LocalDateTime releaseDateTime;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
