package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD16 - AD Change操作响应DTO
 */
@Data
public class UD16ADChangeResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
