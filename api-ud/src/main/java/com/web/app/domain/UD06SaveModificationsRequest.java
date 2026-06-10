package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UD06 Save Modifications Request
 * 用于接收前端传递的Chassis series和Chassis no参数
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD06SaveModificationsRequest {
    
    /**
     * Chassis series (底盘系列号)
     */
    private String chassisSerie;
    
    /**
     * Chassis no (底盘号码)
     */
    private String chassisNo;
}
