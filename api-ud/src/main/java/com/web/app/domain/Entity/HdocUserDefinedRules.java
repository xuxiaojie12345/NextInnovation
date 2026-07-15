package com.web.app.domain.Entity;

import lombok.Data;

/**
 * HDOC User Defined Rules Entity
 * 用户定义规则实体类，对应 HDOC_USER_DEFINED_RULES 表
 */
@Data
public class HdocUserDefinedRules {
    private String pc;         
    private Integer num;   
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
    private String registerDatetime;
    private String registerUser;  
    private String registerProcess;
    private String updateDatetime; 
    private String updateUser;  
    private String updateProcess;  
}
