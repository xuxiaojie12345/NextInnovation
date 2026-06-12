package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocUserDefinedRules {
    private String pc;
    private Long num;
    private String market;
    private String vs;
    private String vs2;
    private String variable;
    private String val;
    private String userid;
    private String upDate;
    private String comments;
    private String addDate;
    private String deleteDate;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
