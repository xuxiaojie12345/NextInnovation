package com.web.app.dto;

import lombok.Data;

@Data
public class LoginResponse {
  private int code;
  private String message;
  private LoginData data;

  @Data
  public static class LoginData {
    private String token;
    private String userid;
    private String username;
  }
}
