package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocVariables {
    private String variable;
    private String typeField;
    private String description;
    private String userid;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
