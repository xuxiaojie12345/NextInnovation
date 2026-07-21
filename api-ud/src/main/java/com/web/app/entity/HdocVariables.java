package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocVariables {
    private String variable;
    private String type;
    private String description;
    private String userid;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
