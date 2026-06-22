package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD18 - HDoc User Doc Administration响应DTO
 */
@Data
public class UD18HDocUserDocAdministrationResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
