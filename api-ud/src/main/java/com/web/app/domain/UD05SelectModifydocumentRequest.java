package com.web.app.domain;

import lombok.Data;

/**
 * UD05 Select Modifydocument Request
 * 用于接收前端传递的Chassis series和Chassis no参数
 */
@Data
public class UD05SelectModifydocumentRequest {
    
    /**
     * Chassis series (底盘系列号)
     */
    private String chassisSeries;
    
    /**
     * Chassis no (底盘号码)
     */
    private String chassisNo;
}
