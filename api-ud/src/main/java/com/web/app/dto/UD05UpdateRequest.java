package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * UD05 - 批量更新请求DTO
 */
@Data
public class UD05UpdateRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 底盘编号 */
    private String chassisNo;

    /** 市场 */
    private String market;

    /** 模板文件 */
    private String templateFile;

    /** 修改列表 */
    private List<ModificationItem> modifications;

    @Data
    public static class ModificationItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String variable;
        private String currentValue;
        private String modifiedValue;
    }
}
