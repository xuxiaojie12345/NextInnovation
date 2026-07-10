package com.web.app.entity;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserInfo {
  private String userid;
  private String password;
  private String username;
  private String responsible;
  private String userposition;
  private String email;
  private LocalDateTime registerDatetime;
  private String registerUser;
  private String registerProcess;
  private LocalDateTime updateDatetime;
  private String updateUser;
  private String updateProcess;
}
