package com.web.app.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class HdocUserDefinedRules {
    private String pc;
    private String num;
    private String market;
    private String variable;
    private String val;
    private String vs;
    private String vs2;
    private String comments;
    private String addDate;
    private String deleteDate;
    private LocalDateTime registerDatetime;
    private String registerUser;
    private String registerProcess;
    private LocalDateTime updateDatetime;
    private String updateUser;
    private String updateProcess;
}
