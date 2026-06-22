package com.web.app.dto;

import lombok.Data;
import java.io.Serializable;

/**
 * UD17 - HDoc User Administration响应DTO
 */
@Data
public class UD17HDocUserAdministrationResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private Integer code;
    private String msg;
    private Object data;
}
