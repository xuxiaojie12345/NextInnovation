package com.web.app.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocVariablesResponse {
  private String variable;
  private String type;
  private String description;
  private String registerUser;
  private LocalDateTime registerDatetime;
}
