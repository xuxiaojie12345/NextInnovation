package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * 用户定义规则实体类
 * 对应表: HDOC_USER_DEFINED_RULES
 */
@Data
public class HdocUserDefinedRules implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * 产品类别
     */
    private String pc;
    
    /**
     * 编号
     */
    private String num;
    
    /**
     * 市场
     */
    private String market;
    
    /**
     * 变量
     */
    private String variable;
    
    /**
     * 值
     */
    private String val;
    
    /**
     * 字符串1
     */
    private String vs;
    
    /**
     * 字符串2
     */
    private String vs2;
    
    /**
     * 注释
     */
    private String comments;
    
    /**
     * 添加日期
     */
    private String addDate;
    
    /**
     * 删除日期
     */
    private String deleteDate;
    
    /**
     * 注册用户
     */
    private String registerUser;
    
    /**
     * 注册时间
     */
    private String registerDatetime;
}
