package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD10 - HDoc变量操作响应DTO
 */
@Data
public class UD10HdocvariablesResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
