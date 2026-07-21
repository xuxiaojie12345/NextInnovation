package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserInfo {
    private String userid;
    private String password;
    private String username;
    private String responsible;
    private String userposition;
    private String eMail;
    private String market;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
