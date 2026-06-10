package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * UD05 Modify Document Response Data
 * 封装修改文档的数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD05ModifyDocumentResponse {
    
    /**
     * Market (市场)
     */
    private String market;
    
    /**
     * Template (模板路径)
     */
    private String template;
    
    /**
     * Variables列表
     */
    private List<VariableItem> variables;
    
    /**
     * 变量项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VariableItem {
        /**
         * 变量名
         */
        private String variable;
        
        /**
         * 描述
         */
        private String description;
        
        /**
         * 当前值
         */
        private String currentValue;
        
        /**
         * 新值（从HDOC_ADCA_MODIFICATION.NEWVAL获取）
         */
        private String newval;
    }
}
