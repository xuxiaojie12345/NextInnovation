package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD09 - 删除用户定义规则响应DTO
 */
@Data
public class UD09DeleteHdocuserdefinedrulesResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
