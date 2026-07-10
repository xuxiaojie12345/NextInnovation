package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class HdocRecDataKapSnote {
  private String snote;
  private String variantId;
  private String transTs;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
