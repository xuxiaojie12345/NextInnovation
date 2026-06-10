package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * UD05 Select Modifydocument Response Data
 * 封装修改文档的数据
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD05SelectModifydocumentResponse {
    
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
        private String variable;
        private String description;
        private String currentValue;
        private String modifiedValue;
    }
}
