package com.web.app.domain;

import lombok.Data;
import java.io.Serializable;

/**
 * 变量修改项目DTO
 * 用于UD05_ModifyDocumentAPI，表示单个变量的修改信息
 */
@Data
public class VariableModificationItem implements Serializable {
    private static final long serialVersionUID = 1L;

    private String variableName;   // 变量名
    private String description;    // 变量描述
    private String currentValue;   // 当前值
    private String modifiedValue;  // 修改值
}
