package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UD04 Select Generatedocument Response Data
 * 封装查询返回的文档数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD04SelectGeneratedocumentResponse {
    
    /**
     * Chassis series (底盘系列号)
     */
    private String serie;
    
    /**
     * Chassis no (底盘号码)
     */
    private String chnr;
    
    /**
     * Order number (订单号)
     */
    private String ordernumber;
    
    /**
     * Build week (生产周)
     */
    private String build;
    
    /**
     * Spec week (规格周)
     */
    private String spec;
    
    /**
     * Customer adaptation / S-Note NO (客户适配/S-Note编号)
     */
    private String customerAdap;
    
    /**
     * Country of operation / Market (运营国家/市场)
     */
    private String countryOfOperation;
    
    /**
     * Load index (载荷指数)
     */
    private String loadIndex;
    
    /**
     * ADCA change status (ADCA变更状态 Y/N)
     */
    private String act;
    
    /**
     * Replacing parameters (替换参数)
     */
    private String variable;
    
    /**
     * New value (新值)
     */
    private String newval;
    
    /**
     * Using template (使用的模板)
     */
    private String template;
    
    /**
     * Generated document file path (生成的文档路径)
     */
    private String generatedFilePath;
    
    /**
     * Server time (服务器时间)
     */
    private String serverTime;
    
    /**
     * Program version (程序版本)
     */
    private String programVersion;
}
