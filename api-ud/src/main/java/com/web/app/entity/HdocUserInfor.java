package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocUserInfor {
    private String userid;
    private String password;
    private String username;
    private String responsible;
    private String userposition;
    private String email;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
