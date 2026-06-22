package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD11 - HDoc变量搜索请求DTO
 */
@Data
public class UD11HdocvariablesRequest implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 变量名 */
    private String variable;

    /** 类型 */
    private String type;

    /** 描述 */
    private String description;
}
