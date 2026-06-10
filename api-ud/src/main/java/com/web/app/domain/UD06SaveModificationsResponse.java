package com.web.app.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * UD06 Save Modifications Response
 * 用于返回Modify情报查询结果
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UD06SaveModificationsResponse {
    
    /**
     * Modify情报列表（只包含UPDATE_DATETIME最新的一条记录）
     */
    private List<ModificationItem> modificationList;
    
    /**
     * Modify情报项
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModificationItem {
        
        /**
         * 文档类型
         */
        private String DOCTYPE;
        
        /**
         * 版本号
         */
        private String VERS;
        
        /**
         * 变量名
         */
        private String VARIABLE;
        
        /**
         * 新值
         */
        private String NEWVAL;
        
        /**
         * 更新时间
         */
        private String UPDATE_DATETIME;
    }
}
