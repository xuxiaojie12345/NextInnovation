package com.web.app.domain.Entity;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserInfo {
    private String userId;
    private String password;
    private String username;
    private String responsible;
    private String userposition;
    private String eMmail;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}