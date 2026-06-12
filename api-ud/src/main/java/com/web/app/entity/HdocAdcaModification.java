package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocAdcaModification {
    private String serie;
    private String chno;
    private String doctype;
    private String lang;
    private String variable;
    private Long vers;
    private String newval;
    private Long sta;
    private String bu;
    private String releaseUser;
    private Date releaseDateTime;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
