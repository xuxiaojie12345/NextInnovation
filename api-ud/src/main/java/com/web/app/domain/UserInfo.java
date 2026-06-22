package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;
@Data
public class UserInfo implements Serializable {
    private static final long serialVersionUID = 1L;

    private String userid;      // USERID
    private String password;    // PASSWORD
    private String username;    // USERNAME
    private String responsible; // RESPONSIBLE
    private String userposition;// USERPOSITION
    private String email;       // EMAIL
    private LocalDateTime registerDatetime; // REGISTER_DATETIME
    private String registerUser; // REGISTER_USER
    private String registerProcess; // REGISTER_PROCESS
    private LocalDateTime updateDatetime; // UPDATE_DATETIME
    private String updateUser;  // UPDATE_USER
    private String updateProcess; // UPDATE_PROCESS
}