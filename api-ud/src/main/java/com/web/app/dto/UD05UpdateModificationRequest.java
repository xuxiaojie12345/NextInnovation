package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * UD05_ModifyDocument - 更新修改请求对象
 */
@Data
public class UD05UpdateModificationRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    private String serie;              // 系列编号
    private String chassisNo;          // 底盘号
    private String updateUser;         // 更新用户
    private List<ModificationItem> modifications;  // 修改列表

    /**
     * 单个修改项
     */
    @Data
    public static class ModificationItem implements Serializable {
        private static final long serialVersionUID = 1L;
        private String variableName;   // 变量名
        private String newValue;       // 新值
    }
}
