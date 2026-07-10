package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocRecDataKolaVariant {
  private String familyId;
  private String variantId;
  private String functionGroup;
  private String symbol;
  private String description;
  private String transTs;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
