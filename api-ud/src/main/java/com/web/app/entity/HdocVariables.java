package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocVariables {
  private String variable;
  private String type;
  private String description;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
