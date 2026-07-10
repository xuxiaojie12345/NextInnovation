package com.web.app.dto;

import lombok.Data;

@Data
public class HdocVariablesRequest {
  private String variable;
  private String type;
  private String description;
}
