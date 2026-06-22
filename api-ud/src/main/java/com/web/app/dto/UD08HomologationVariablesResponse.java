package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD08 - Homologation Variables响应DTO
 */
@Data
public class UD08HomologationVariablesResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
