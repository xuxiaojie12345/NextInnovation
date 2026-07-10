package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocFunctionAuth {
  private String userid;
  private String function;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
