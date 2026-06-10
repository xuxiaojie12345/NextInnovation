package com.web.app.domain;

import lombok.Data;

import java.util.List;

/**
 * UD05 Modify Document Save Request
 * 用于接收前端传递的保存请求参数
 */
@Data
public class UD05ModifyDocumentSaveRequest {
    
    /**
     * Chassis series (底盘系列号)
     */
    private String chassisSeries;
    
    /**
     * Chassis no (底盘号码)
     */
    private String chassisNo;
    
    /**
     * 变量列表
     */
    private List<VariableItem> variables;
    
    /**
     * 更新用户
     */
    private String updateUser;
    
    /**
     * 变量项
     */
    @Data
    public static class VariableItem {
        /**
         * 变量名
         */
        private String variable;
        
        /**
         * 新值
         */
        private String newval;
    }
}
