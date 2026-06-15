package com.web.app.domain.Entity;

import lombok.Data;

/**
 * HDOC User Defined Rules Entity
 * 用户定义规则实体类，对应 HDOC_USER_DEFINED_RULES 表
 */
@Data
public class HdocUserDefinedRules {
    private String pc;              // Product class
    private Integer num;            // Number
    private String market;          // Market
    private String vs;              // Variant string.1
    private String vs2;             // Variant string.2
    private String variable;        // Variable
    private String val;             // Value
    private String userid;          // User ID
    private String upDate;          // Update date (YYYYMM)
    private String comments;        // Comments
    private String addDate;         // Add date (YYYYMM)
    private String deleteDate;      // Delete date (YYYYMM)
    private String registerDatetime;// Register datetime
    private String registerUser;    // Register user
    private String registerProcess; // Register process
    private String updateDatetime;  // Update datetime
    private String updateUser;      // Update user
    private String updateProcess;   // Update process
}
