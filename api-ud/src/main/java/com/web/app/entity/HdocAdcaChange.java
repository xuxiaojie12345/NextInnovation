package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocAdcaChange {
  private String serie;
  private String chnr;
  private String act;
  private String bu;
  private String reason;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
