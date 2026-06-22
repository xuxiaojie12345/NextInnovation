package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD10 - HDoc变量操作请求DTO
 * Add/Update/Delete共用
 */
@Data
public class UD10HdocvariablesRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 变量名 */
    private String variable;

    /** 类型 */
    private String type;

    /** 描述 */
    private String description;

    /** 创建用户 */
    private String createdByUser;
}
