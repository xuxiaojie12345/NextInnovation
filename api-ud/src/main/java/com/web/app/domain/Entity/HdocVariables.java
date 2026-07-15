package com.web.app.domain.Entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * HDOC Variables Entity
 * HDOC变量实体类，对应 HDOC_VARIABLES 表
 */
@Data
public class HdocVariables {
    private String variable;        // Variable name
    private String type;            // Type (VDA / User Defined)
    private String description;     // Description
    private String registerDatetime;// Register datetime
    private String registerUser;    // Register user
    private String registerProcess; // Register process
    private String updateDatetime;  // Update datetime
    private String updateUser;      // Update user
    private String updateProcess;   // Update process

    // 前端传入字段（非数据库字段）
    @JsonProperty("createdByUser")
    private String createdByUser;   // 创建/更新用户（前端传入）
    private String date;            // 日期（前端传入，当前未使用）

    // 搜索用运算符字段（非数据库字段）
    private String variableOperator;        // Variable运算符 (= / !=)
    private String typeOperator;            // Type运算符 (= / !=)
    private String descriptionOperator;     // Description运算符 (= / !=)
    private String createdByUserOperator;   // Created by user运算符 (= / !=)
    private String dateOperator;            // Date运算符 (= / !=)
}
