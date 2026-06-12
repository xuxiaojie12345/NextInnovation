package com.web.app.entity;

import lombok.Data;
import java.io.Serializable;

/**
 * ADCA变更实体类
 * 对应表: HDOC_ADCA_CHANGE
 */
@Data
public class HdocAdcaChange implements Serializable {
    private static final long serialVersionUID = 1L;
    
    /**
     * Serie
     */
    private String serie;
    
    /**
     * Chassis Number
     */
    private String chnr;
    
    /**
     * 活动状态
     */
    private String act;
    
    /**
     * 业务单元
     */
    private String bu;
    
    /**
     * 原因
     */
    private String reason;
    
    /**
     * 注册时间
     */
    private String registerDatetime;
    
    /**
     * 注册用户
     */
    private String registerUser;
    
    /**
     * 注册流程
     */
    private String registerProcess;
    
    /**
     * 更新时间
     */
    private String updateDatetime;
    
    /**
     * 更新用户
     */
    private String updateUser;
    
    /**
     * 更新流程
     */
    private String updateProcess;
}
