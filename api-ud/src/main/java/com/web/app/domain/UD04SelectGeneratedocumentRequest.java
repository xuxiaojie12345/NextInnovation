package com.web.app.domain;

import lombok.Data;

/**
 * UD04 Select Generatedocument Request
 * 用于接收前端传递的Chassis series和Chassis no参数
 */
@Data
public class UD04SelectGeneratedocumentRequest {
    
    /**
     * Chassis series (底盘系列号)
     */
    private String chassisSeries;
    
    /**
     * Chassis no (底盘号码)
     */
    private String chassisNo;
}
